import { ApiError, Playlist, SearchResultData, Track } from '../types';
import { cleanTrackTitle, extractYouTubePlaylistId, extractYouTubeVideoId, parseYouTubeDuration } from '../utils/formatters';

/**
 * Fetches real-time live search suggestions with debounced quick matching.
 */
export async function fetchLiveSearchSuggestions(
  query: string,
  customApiKey?: string
): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-youtube-api-key'] = customApiKey;
    }
    const endpoint = `/api/youtube/suggestions?q=${encodeURIComponent(trimmed)}${
      customApiKey ? `&key=${encodeURIComponent(customApiKey)}` : ''
    }`;
    const res = await fetch(endpoint, { headers });
    if (res.ok) {
      const data = await res.json();
      return data.suggestions || [];
    }
  } catch (err) {
    console.warn('[ifu listener] Live suggestions fetch error:', err);
  }
  return [];
}

/**
 * Searches for tracks on YouTube with full diagnostic error tracking.
 * Calls backend API with support for custom user-supplied API keys.
 */
export async function searchYouTubeTracks(
  query: string,
  customApiKey?: string
): Promise<SearchResultData> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: [], apiError: null };
  }

  console.log(`[ifu listener client] Initiating search for: "${trimmed}"`);

  // Direct video URL/ID detection
  const directVideoId = extractYouTubeVideoId(trimmed);
  if (directVideoId) {
    try {
      const single = await fetchSingleTrack(directVideoId, customApiKey);
      if (single) {
        return {
          tracks: [single],
          directMatch: true,
          searchedWithKey: false,
          apiError: null
        };
      }
    } catch (e) {
      console.warn('[ifu listener] Direct track lookup failed:', e);
    }
  }

  // Call the server API endpoint
  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-youtube-api-key'] = customApiKey;
    }

    const endpoint = `/api/youtube/search?q=${encodeURIComponent(trimmed)}${
      customApiKey ? `&key=${encodeURIComponent(customApiKey)}` : ''
    }`;

    const res = await fetch(endpoint, { headers });
    const data = await res.json();

    // Raw API Response Logging for clear visibility
    console.log('[ifu listener client] YouTube Search Raw Response:', data);

    if (data.apiError) {
      console.error('[ifu listener client] YouTube API returned diagnostic error:', data.apiError);
    }

    return {
      tracks: data.tracks || [],
      searchedWithKey: data.searchedWithKey,
      source: data.source,
      directMatch: data.directMatch,
      apiError: data.apiError || null
    };
  } catch (err: any) {
    console.error('[ifu listener client] Failed to connect to search API:', err);
    return {
      tracks: [],
      apiError: {
        status: 500,
        statusText: 'Network Error',
        message: err?.message || 'Failed to reach search service. Check network or server connection.',
        reason: 'network_failure'
      }
    };
  }
}

/**
 * Checks YouTube Data API v3 status and key configuration on the server.
 */
export async function checkYouTubeApiStatus(customApiKey?: string): Promise<{
  configured: boolean;
  enabled: boolean;
  source?: string;
  message: string;
  error?: ApiError;
  diagnostic?: string;
}> {
  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-youtube-api-key'] = customApiKey;
    }
    const res = await fetch('/api/youtube/status', { headers });
    const data = await res.json();
    console.log('[ifu listener] YouTube API Status Check:', data);
    return data;
  } catch (err: any) {
    return {
      configured: false,
      enabled: false,
      message: 'Cannot reach status endpoint: ' + (err?.message || err)
    };
  }
}

/**
 * Fetches single video metadata (oEmbed / YouTube API).
 */
export async function fetchSingleTrack(videoIdOrUrl: string, customApiKey?: string): Promise<Track | null> {
  const videoId = extractYouTubeVideoId(videoIdOrUrl) || videoIdOrUrl.trim();
  if (!videoId) return null;

  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-youtube-api-key'] = customApiKey;
    }
    const res = await fetch(`/api/youtube/video?id=${encodeURIComponent(videoId)}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.track) return data.track;
    }
  } catch (err) {
    console.warn('[ifu listener] Error fetching video track from server:', err);
  }

  // Client-side oEmbed fallback
  try {
    const oembedRes = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      const { title, artist } = cleanTrackTitle(oembed.title || `YouTube Audio [${videoId}]`);
      return {
        id: videoId,
        title,
        artist: oembed.author_name || artist,
        duration: 210,
        formattedDuration: '3:30',
        thumbnailUrl: oembed.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        album: oembed.author_name
      };
    }
  } catch {
    // fallback basic structure
  }

  return {
    id: videoId,
    title: `Audio Stream [${videoId.slice(0, 8)}]`,
    artist: 'YouTube Audio',
    duration: 210,
    formattedDuration: '3:30',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    album: 'YouTube Stream'
  };
}

/**
 * Imports a full YouTube playlist.
 */
export async function fetchYouTubePlaylist(
  input: string,
  customApiKey?: string
): Promise<Playlist | null> {
  const playlistId = extractYouTubePlaylistId(input);
  if (!playlistId) return null;

  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-youtube-api-key'] = customApiKey;
    }
    const res = await fetch(`/api/youtube/playlist?id=${encodeURIComponent(playlistId)}`, { headers });
    const data = await res.json();
    console.log('[ifu listener] YouTube Playlist Import Response:', data);

    if (res.ok && data.playlist) {
      return data.playlist;
    }
  } catch (err) {
    console.error('[ifu listener] Playlist import error:', err);
  }

  return null;
}

/**
 * Fetches auto-suggested / related tracks for continuous autoplay Up Next flow.
 */
export async function fetchRelatedYouTubeTracks(
  track: Track,
  customApiKey?: string
): Promise<Track[]> {
  if (!track || !track.id) return [];

  try {
    const headers: Record<string, string> = {};
    if (customApiKey) {
      headers['x-youtube-api-key'] = customApiKey;
    }

    const endpoint = `/api/youtube/related?id=${encodeURIComponent(track.id)}&artist=${encodeURIComponent(
      track.artist || ''
    )}&title=${encodeURIComponent(track.title || '')}${
      customApiKey ? `&key=${encodeURIComponent(customApiKey)}` : ''
    }`;

    const res = await fetch(endpoint, { headers });
    if (res.ok) {
      const data = await res.json();
      return (data.tracks || []).filter((t: Track) => t.id !== track.id);
    }
  } catch (err) {
    console.warn('[ifu listener] Error fetching related tracks for Up Next:', err);
  }

  return [];
}
