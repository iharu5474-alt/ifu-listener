import { ApiError, Playlist, SearchResultData, Track } from '../types';
import { cleanTrackTitle, extractYouTubePlaylistId, extractYouTubeVideoId, parseYouTubeDuration, formatTime } from '../utils/formatters';

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
    
    // If backend endpoint is 404 (static hosting such as GitHub Pages)
    if (res.status === 404) {
      console.warn('[ifu listener] Backend API returned 404. Running client-side search (GitHub Pages static mode).');
      return await clientSideDirectSearch(trimmed, customApiKey);
    }

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
    console.warn('[ifu listener client] Search API fetch error, attempting client-side fallback:', err);
    try {
      return await clientSideDirectSearch(trimmed, customApiKey);
    } catch {
      return {
        tracks: [],
        apiError: {
          status: 500,
          statusText: 'Network Error',
          message: err?.message || 'Failed to reach search service.',
          reason: 'network_failure'
        }
      };
    }
  }
}

/**
 * Client-side direct search for GitHub Pages and static deployments
 */
async function clientSideDirectSearch(query: string, customApiKey?: string): Promise<SearchResultData> {
  const key = customApiKey || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_YOUTUBE_API_KEY : '');
  
  if (key) {
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=25&q=${encodeURIComponent(
          query
        )}&key=${encodeURIComponent(key)}`
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const videoIds = (searchData.items || []).map((item: any) => item.id?.videoId).filter(Boolean);
        
        let durationsMap: Record<string, { duration: number; formattedDuration: string }> = {};
        if (videoIds.length > 0) {
          const detailRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(
              videoIds.join(',')
            )}&key=${encodeURIComponent(key)}`
          );
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            (detailData.items || []).forEach((item: any) => {
              const seconds = parseYouTubeDuration(item.contentDetails?.duration);
              durationsMap[item.id] = {
                duration: seconds,
                formattedDuration: formatTime(seconds)
              };
            });
          }
        }

        const tracks: Track[] = (searchData.items || []).map((item: any) => {
          const vid = item.id?.videoId;
          const { title, artist } = cleanTrackTitle(item.snippet?.title || '');
          const durInfo = durationsMap[vid] || { duration: 210, formattedDuration: '3:30' };
          return {
            id: vid,
            title,
            artist: item.snippet?.channelTitle || artist,
            duration: durInfo.duration,
            formattedDuration: durInfo.formattedDuration,
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
            album: item.snippet?.channelTitle
          };
        });

        return {
          tracks,
          searchedWithKey: true,
          source: 'youtube_v3_direct_client',
          apiError: null
        };
      } else {
        const errJson = await searchRes.json().catch(() => ({}));
        return {
          tracks: [],
          searchedWithKey: true,
          apiError: {
            status: searchRes.status,
            statusText: searchRes.statusText,
            message: errJson?.error?.message || 'YouTube API Key returned an error',
            reason: errJson?.error?.errors?.[0]?.reason || 'api_error'
          }
        };
      }
    } catch (e: any) {
      console.warn('[ifu listener] Direct YouTube API client search failed:', e);
    }
  }

  // Fallback to Invidious public instances for keyless static GitHub Pages search
  const instances = [
    'https://inv.tux.pizza/api/v1/search',
    'https://invidious.jing.rocks/api/v1/search',
    'https://yt.artemislena.eu/api/v1/search'
  ];

  for (const inst of instances) {
    try {
      const res = await fetch(`${inst}?q=${encodeURIComponent(query)}&type=video`);
      if (res.ok) {
        const items = await res.json();
        const tracks: Track[] = items
          .filter((item: any) => item.videoId && !item.liveNow)
          .slice(0, 20)
          .map((item: any) => {
            const { title, artist } = cleanTrackTitle(item.title || '');
            const lengthSec = item.lengthSeconds || 210;
            const mins = Math.floor(lengthSec / 60);
            const secs = lengthSec % 60;
            return {
              id: item.videoId,
              title,
              artist: item.author || artist,
              duration: lengthSec,
              formattedDuration: `${mins}:${secs < 10 ? '0' : ''}${secs}`,
              thumbnailUrl:
                item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url ||
                `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
              album: item.author
            };
          });

        if (tracks.length > 0) {
          return {
            tracks,
            searchedWithKey: false,
            source: 'invidious_public_static',
            apiError: null
          };
        }
      }
    } catch {
      // try next instance
    }
  }

  return {
    tracks: [],
    apiError: {
      status: 403,
      statusText: 'API Key Required',
      message: 'Add your YouTube Data API v3 key in Search Settings to enable unlimited search on GitHub Pages.',
      reason: 'key_required'
    }
  };
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
    if (res.ok) {
      const data = await res.json();
      console.log('[ifu listener] YouTube Playlist Import Response:', data);
      if (data.playlist) {
        return data.playlist;
      }
    }
  } catch (err) {
    console.warn('[ifu listener] Server playlist import error, attempting client fallback:', err);
  }

  // Client-side direct YouTube Data API v3 fallback for Playlist
  const key = customApiKey || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_YOUTUBE_API_KEY : '');
  if (key) {
    try {
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(
          playlistId
        )}&key=${encodeURIComponent(key)}`
      );
      if (plRes.ok) {
        const plData = await plRes.json();
        const plSnippet = plData.items?.[0]?.snippet;
        const title = plSnippet?.title || `Imported YouTube Playlist [${playlistId}]`;
        const description = plSnippet?.description || 'Imported via YouTube API';
        const coverUrl =
          plSnippet?.thumbnails?.high?.url ||
          plSnippet?.thumbnails?.medium?.url ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

        const itemsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${encodeURIComponent(
            playlistId
          )}&key=${encodeURIComponent(key)}`
        );
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          const tracks: Track[] = (itemsData.items || [])
            .map((item: any) => {
              const vid = item.snippet?.resourceId?.videoId;
              if (!vid || item.snippet?.title === 'Private video' || item.snippet?.title === 'Deleted video') {
                return null;
              }
              const { title: trackTitle, artist } = cleanTrackTitle(item.snippet?.title || '');
              return {
                id: vid,
                title: trackTitle,
                artist: item.snippet?.videoOwnerChannelTitle || artist,
                duration: 210,
                formattedDuration: '3:30',
                thumbnailUrl:
                  item.snippet?.thumbnails?.high?.url ||
                  item.snippet?.thumbnails?.medium?.url ||
                  `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                album: title
              };
            })
            .filter(Boolean);

          return {
            id: `yt-${playlistId}`,
            title,
            description,
            coverUrl,
            tracks,
            isCustom: true
          };
        }
      }
    } catch (e) {
      console.warn('[ifu listener] Client-side playlist import error:', e);
    }
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
    console.warn('[ifu listener] Error fetching related tracks from server, attempting client search:', err);
  }

  // Client-side related fallback (search by artist or genre)
  try {
    const query = `${track.artist} similar music`;
    const searchRes = await clientSideDirectSearch(query, customApiKey);
    return (searchRes.tracks || []).filter((t) => t.id !== track.id);
  } catch {
    return [];
  }
}
