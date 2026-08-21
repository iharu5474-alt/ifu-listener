import { RankedTrack, Track, TrackInteraction, UserInterestProfile } from '../types';
import { searchYouTubeTracks } from './youtubeApi';
import { INITIAL_FEATURED_TRACKS } from '../data/curatedTracks';

const INTERACTIONS_KEY = 'ifulistener_interactions_v2';
const SEARCH_HISTORY_KEY = 'ifulistener_search_history_v2';
const DISLIKES_KEY = 'ifulistener_dislikes_v2';
const USER_PROFILE_KEY = 'ifulistener_user_profile_v2';
const REC_CACHE_KEY = 'ifulistener_recommendations_cache_v2';

const KNOWN_GENRES = [
  'lofi', 'chill', 'ambient', 'electronic', 'synthwave', 'retrowave',
  'jazz', 'hip hop', 'indie', 'rock', 'pop', 'acoustic', 'r&b',
  'classical', 'piano', 'instrumental', 'phonk', 'anime', 'j-pop',
  'k-pop', 'house', 'techno', 'trap', 'soul', 'funk', 'metal', 'bass'
];

/**
 * Extracts genre and style tags from track titles and artists.
 */
export function extractTrackTags(title: string, artist: string): string[] {
  const text = `${title} ${artist}`.toLowerCase();
  const matched = new Set<string>();

  for (const genre of KNOWN_GENRES) {
    if (text.includes(genre)) {
      matched.add(genre);
    }
  }

  if (text.includes('study') || text.includes('relax') || text.includes('sleep') || text.includes('beats')) {
    matched.add('chill');
    matched.add('lofi');
  }
  if (text.includes('cyberpunk') || text.includes('synth') || text.includes('retro') || text.includes('80s')) {
    matched.add('synthwave');
  }
  if (text.includes('soundtrack') || text.includes('ost') || text.includes('theme')) {
    matched.add('instrumental');
  }

  return Array.from(matched);
}

/**
 * Determines current time of day bucket.
 */
function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

/**
 * Retrieves all stored track interactions.
 */
export function getStoredInteractions(): Record<string, TrackInteraction> {
  try {
    const raw = localStorage.getItem(INTERACTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves interactions to localStorage.
 */
function saveInteractions(data: Record<string, TrackInteraction>) {
  try {
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[ifu listener] Failed to save interaction data', e);
  }
}

/**
 * Retrieves set of disliked track IDs.
 */
export function getDislikedTrackIds(): string[] {
  try {
    const raw = localStorage.getItem(DISLIKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Records an explicit dislike / remove from recommendations.
 */
export function recordDislike(trackId: string) {
  try {
    const current = getDislikedTrackIds();
    if (!current.includes(trackId)) {
      const updated = [...current, trackId];
      localStorage.setItem(DISLIKES_KEY, JSON.stringify(updated));
    }
    // Update track interaction if exists
    const interactions = getStoredInteractions();
    if (interactions[trackId]) {
      interactions[trackId].dislikes = (interactions[trackId].dislikes || 0) + 1;
      saveInteractions(interactions);
    }
    // Clear recommendation cache to trigger fresh computation
    localStorage.removeItem(REC_CACHE_KEY);
  } catch (e) {
    console.warn('[ifu listener] Failed to record dislike', e);
  }
}

/**
 * Records when a track starts playing.
 */
export function recordPlayStart(track: Track) {
  if (!track || !track.id) return;
  const interactions = getStoredInteractions();
  const id = track.id;
  const timeOfDay = getCurrentTimeOfDay();

  const current: TrackInteraction = interactions[id] || {
    trackId: id,
    title: track.title,
    artist: track.artist,
    genreTags: extractTrackTags(track.title, track.artist),
    plays: 0,
    listenDurationSeconds: 0,
    totalDurationSeconds: track.duration || 210,
    completionRate: 0,
    skips: 0,
    likes: 0,
    dislikes: 0,
    repeatPlays: 0,
    lastPlayedAt: Date.now(),
    timeOfDayCounts: { morning: 0, afternoon: 0, evening: 0, night: 0 }
  };

  // Check for repeat play (within last 30 minutes)
  if (current.lastPlayedAt && Date.now() - current.lastPlayedAt < 30 * 60 * 1000) {
    current.repeatPlays += 1;
  }

  current.plays += 1;
  current.lastPlayedAt = Date.now();
  current.timeOfDayCounts[timeOfDay] = (current.timeOfDayCounts[timeOfDay] || 0) + 1;

  interactions[id] = current;
  saveInteractions(interactions);
}

/**
 * Records periodic listen progress and updates completion rate.
 */
export function recordPlayProgress(track: Track, currentSeconds: number, duration: number) {
  if (!track || !track.id || currentSeconds <= 0) return;
  const interactions = getStoredInteractions();
  const current = interactions[track.id];
  if (!current) return;

  current.listenDurationSeconds = Math.max(current.listenDurationSeconds, Math.round(currentSeconds));
  if (duration > 0) {
    current.totalDurationSeconds = duration;
    current.completionRate = Math.min(1, current.listenDurationSeconds / duration);
  }

  interactions[track.id] = current;
  saveInteractions(interactions);
}

/**
 * Records when a track is skipped early (< 30s or < 25% duration).
 */
export function recordSkip(track: Track, playedSeconds: number, duration: number) {
  if (!track || !track.id) return;
  const interactions = getStoredInteractions();
  const current = interactions[track.id];
  if (!current) return;

  const threshold = duration > 0 ? Math.min(30, duration * 0.25) : 30;
  if (playedSeconds < threshold) {
    current.skips = (current.skips || 0) + 1;
  }

  interactions[track.id] = current;
  saveInteractions(interactions);
}

/**
 * Records when a track finishes playing completely.
 */
export function recordCompletion(track: Track) {
  if (!track || !track.id) return;
  const interactions = getStoredInteractions();
  const current = interactions[track.id];
  if (!current) return;

  current.completionRate = 1;
  current.listenDurationSeconds = current.totalDurationSeconds || track.duration || 210;
  current.repeatPlays += 1;
  interactions[track.id] = current;
  saveInteractions(interactions);
}

/**
 * Records like/favorite toggle.
 */
export function recordLike(track: Track, isLiked: boolean) {
  if (!track || !track.id) return;
  const interactions = getStoredInteractions();
  const current = interactions[track.id] || {
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    genreTags: extractTrackTags(track.title, track.artist),
    plays: 1,
    listenDurationSeconds: track.duration || 210,
    totalDurationSeconds: track.duration || 210,
    completionRate: 1,
    skips: 0,
    likes: 0,
    dislikes: 0,
    repeatPlays: 0,
    lastPlayedAt: Date.now(),
    timeOfDayCounts: { morning: 0, afternoon: 0, evening: 0, night: 0 }
  };

  current.likes = isLiked ? 1 : 0;
  interactions[track.id] = current;
  saveInteractions(interactions);
}

/**
 * Records user searches.
 */
export function recordSearch(query: string) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return;
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const list: { query: string; timestamp: number }[] = raw ? JSON.parse(raw) : [];
    const updated = [{ query: trimmed, timestamp: Date.now() }, ...list.filter((s) => s.query !== trimmed)].slice(0, 30);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[ifu listener] Failed to record search history', e);
  }
}

/**
 * Records artist or playlist click.
 */
export function recordInteractionClick(type: 'artist' | 'playlist', name: string) {
  recordSearch(name);
}

/**
 * Builds user interest profile by scoring artists, genres, and engagement metrics.
 */
export function buildUserProfile(): UserInterestProfile {
  const interactions = getStoredInteractions();
  const interactionList = Object.values(interactions);

  const artistMap: Record<string, { score: number; playCount: number; skipCount: number }> = {};
  const genreMap: Record<string, number> = {};
  const timeOfDayTotals = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  let totalListens = 0;
  let totalCompletions = 0;
  let totalSkips = 0;
  let totalCompletionSum = 0;

  for (const item of interactionList) {
    totalListens += item.plays;
    totalSkips += item.skips || 0;
    if (item.completionRate >= 0.75) totalCompletions += 1;
    totalCompletionSum += item.completionRate;

    // Time of day accumulation
    timeOfDayTotals.morning += item.timeOfDayCounts?.morning || 0;
    timeOfDayTotals.afternoon += item.timeOfDayCounts?.afternoon || 0;
    timeOfDayTotals.evening += item.timeOfDayCounts?.evening || 0;
    timeOfDayTotals.night += item.timeOfDayCounts?.night || 0;

    // Artist scoring calculation
    const artistKey = (item.artist || 'Unknown').trim();
    if (!artistMap[artistKey]) {
      artistMap[artistKey] = { score: 0, playCount: 0, skipCount: 0 };
    }
    artistMap[artistKey].playCount += item.plays;
    artistMap[artistKey].skipCount += item.skips || 0;

    let itemScore =
      item.plays * 3 +
      (item.completionRate >= 0.75 ? 5 : 0) +
      item.likes * 8 +
      item.repeatPlays * 4 -
      item.skips * 6 -
      item.dislikes * 25;

    artistMap[artistKey].score += Math.max(0, itemScore);

    // Genre scoring
    for (const tag of item.genreTags) {
      genreMap[tag] = (genreMap[tag] || 0) + Math.max(1, itemScore);
    }
  }

  // Sorted Top Artists
  const topArtists = Object.entries(artistMap)
    .map(([artist, data]) => ({ artist, ...data }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Sorted Top Genres
  const topGenres = Object.entries(genreMap)
    .map(([genre, score]) => ({ genre, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // Top Keywords from searches
  let topKeywords: { keyword: string; count: number }[] = [];
  try {
    const rawSearches = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (rawSearches) {
      const searches: { query: string }[] = JSON.parse(rawSearches);
      const freq: Record<string, number> = {};
      searches.forEach((s) => {
        freq[s.query] = (freq[s.query] || 0) + 1;
      });
      topKeywords = Object.entries(freq)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
  } catch {
    // ignore
  }

  // Determine dominant time of day
  let preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'evening';
  let maxTime = -1;
  (Object.keys(timeOfDayTotals) as (keyof typeof timeOfDayTotals)[]).forEach((timeKey) => {
    if (timeOfDayTotals[timeKey] > maxTime) {
      maxTime = timeOfDayTotals[timeKey];
      preferredTimeOfDay = timeKey;
    }
  });

  const profile: UserInterestProfile = {
    topArtists,
    topGenres,
    topKeywords,
    totalListens,
    totalCompletions,
    totalSkips,
    averageCompletionRate: interactionList.length > 0 ? totalCompletionSum / interactionList.length : 0.8,
    preferredTimeOfDay,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }

  return profile;
}

/**
 * Evaluates candidate track using the exact requested ranking formula:
 * score = user_interest + content_similarity + recent_activity + artist_affinity + completion_rate - skip_probability
 */
export function rankCandidateTrack(
  candidate: Track,
  profile: UserInterestProfile,
  interactions: Record<string, TrackInteraction>,
  favoriteTracks: Track[]
): { score: number; reason: string; percentage: number; tags: string[] } {
  const candidateTags = extractTrackTags(candidate.title, candidate.artist);
  const artistLower = candidate.artist.toLowerCase();
  const titleLower = candidate.title.toLowerCase();

  // 1. Artist Affinity (0 - 35 points)
  let artistAffinity = 0;
  const matchedArtist = profile.topArtists.find(
    (a) => a.artist.toLowerCase() === artistLower || artistLower.includes(a.artist.toLowerCase())
  );
  if (matchedArtist) {
    artistAffinity = Math.min(35, 10 + matchedArtist.score * 2);
  }

  // 2. User Interest (0 - 30 points based on genre tag alignment)
  let userInterest = 0;
  for (const tag of candidateTags) {
    const genreMatch = profile.topGenres.find((g) => g.genre === tag);
    if (genreMatch) {
      userInterest += Math.min(15, 6 + genreMatch.score * 0.8);
    }
  }
  userInterest = Math.min(30, userInterest);

  // 3. Content Similarity (0 - 20 points based on favorite track overlap)
  let contentSimilarity = 0;
  for (const fav of favoriteTracks.slice(0, 10)) {
    if (fav.artist.toLowerCase() === artistLower) {
      contentSimilarity += 12;
      break;
    }
    const favTags = extractTrackTags(fav.title, fav.artist);
    const shared = candidateTags.filter((t) => favTags.includes(t));
    if (shared.length > 0) {
      contentSimilarity += shared.length * 4;
    }
  }
  contentSimilarity = Math.min(20, contentSimilarity);

  // 4. Recent Activity / Freshness (0 - 15 points)
  let recentActivity = 10;
  const recentKeywordMatch = profile.topKeywords.find(
    (k) => titleLower.includes(k.keyword) || artistLower.includes(k.keyword)
  );
  if (recentKeywordMatch) {
    recentActivity += 5;
  }

  // 5. Completion Rate (0 - 20 points)
  let completionRateScore = Math.round(profile.averageCompletionRate * 20);

  // 6. Skip Probability Penalty (-30 to 0)
  let skipProbability = 0;
  if (matchedArtist && matchedArtist.playCount + matchedArtist.skipCount > 0) {
    const skipRate = matchedArtist.skipCount / (matchedArtist.playCount + matchedArtist.skipCount);
    skipProbability = Math.round(skipRate * 25);
  }

  // Total Score Formula
  const rawScore = userInterest + contentSimilarity + recentActivity + artistAffinity + completionRateScore - skipProbability;
  const finalScore = Math.max(10, Math.min(100, rawScore));

  // Determine intuitive match reason
  let reason = 'Tailored to your current listening vibe';
  if (matchedArtist && matchedArtist.score > 10) {
    reason = `Because you listen to ${matchedArtist.artist}`;
  } else if (candidateTags.length > 0 && userInterest > 15) {
    reason = `Based on your love for ${candidateTags.slice(0, 2).map((t) => t.toUpperCase()).join(' & ')}`;
  } else if (contentSimilarity > 10) {
    reason = 'Similar to your favorite saved tracks';
  } else if (recentKeywordMatch) {
    reason = `Matches recent searches for "${recentKeywordMatch.keyword}"`;
  }

  const percentage = Math.min(99, Math.max(78, Math.round(75 + (finalScore / 100) * 24)));

  return {
    score: finalScore,
    reason,
    percentage,
    tags: candidateTags.length > 0 ? candidateTags : ['RECOMMENDED']
  };
}

/**
 * Computes personalized recommendations from user profile, YouTube search, and curated candidate pools.
 */
export async function computePersonalizedRecommendations(
  favorites: Track[],
  customApiKey?: string,
  forceFresh = false
): Promise<RankedTrack[]> {
  const profile = buildUserProfile();
  const interactions = getStoredInteractions();
  const dislikedIds = new Set(getDislikedTrackIds());

  console.log('[ifu recommendation engine] Reading local user profile for recommendations:', {
    totalListens: profile.totalListens,
    topArtists: profile.topArtists,
    topGenres: profile.topGenres,
    topKeywords: profile.topKeywords,
    averageCompletionRate: profile.averageCompletionRate,
    totalSkips: profile.totalSkips,
    totalCompletions: profile.totalCompletions
  });

  // Check cache only if not forcing fresh and profile has not changed recently
  if (!forceFresh) {
    try {
      const cached = localStorage.getItem(REC_CACHE_KEY);
      if (cached) {
        const parsed: { timestamp: number; tracks: RankedTrack[] } = JSON.parse(cached);
        // Cache valid for 8 minutes
        if (Date.now() - parsed.timestamp < 8 * 60 * 1000 && parsed.tracks && parsed.tracks.length > 0) {
          console.log('[ifu recommendation engine] Serving from recent cache:', parsed.tracks.length, 'tracks');
          return parsed.tracks;
        }
      }
    } catch {
      // ignore
    }
  }

  const candidatePool: Map<string, Track> = new Map();
  const seenTitleKeys: Set<string> = new Set();

  const addCandidate = (track: Track) => {
    if (!track || !track.id || dislikedIds.has(track.id)) return;
    const normalizedKey = `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${track.artist.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    if (seenTitleKeys.has(normalizedKey)) return;
    seenTitleKeys.add(normalizedKey);
    candidatePool.set(track.id, track);
  };

  // 1. Seed with Curated Tracks
  for (const track of INITIAL_FEATURED_TRACKS) {
    addCandidate(track);
  }

  // 2. Add any favorite tracks as similarity anchors
  for (const fav of favorites.slice(0, 5)) {
    addCandidate(fav);
  }

  // 3. Fetch fresh candidate tracks dynamically from YouTube Data API
  const searchQueries: string[] = [];

  if (profile.topArtists.length > 0) {
    searchQueries.push(`${profile.topArtists[0].artist} official audio`);
    if (profile.topArtists.length > 1) {
      searchQueries.push(`${profile.topArtists[1].artist} music`);
    }
  }

  if (profile.topGenres.length > 0) {
    searchQueries.push(`${profile.topGenres[0].genre} chill music 2026`);
  }

  if (profile.topKeywords.length > 0) {
    searchQueries.push(`${profile.topKeywords[0].keyword} audio`);
  }

  // If few/no queries, provide diverse aesthetic queries
  if (searchQueries.length < 2) {
    searchQueries.push('chillhop lofi beats aesthetic', 'synthwave electronic nocturnal');
  }

  // Run candidate queries
  console.log('[ifu recommendation engine] Sourcing candidates with queries:', searchQueries);

  await Promise.all(
    searchQueries.slice(0, 3).map(async (query) => {
      try {
        console.log(`[ifu recommendation engine] Firing YouTube candidate search query: "${query}"`);
        const res = await searchYouTubeTracks(query, customApiKey);
        console.log(`[ifu recommendation engine] Raw YouTube Candidate API Response for "${query}":`, res);
        
        if (res.tracks && res.tracks.length > 0) {
          for (const t of res.tracks.slice(0, 10)) {
            addCandidate(t);
          }
        }
      } catch (err) {
        console.warn('[ifu listener] Candidate generation query error:', err);
      }
    })
  );

  // 4. Rank each candidate track with the multi-factor scoring formula
  const rankedList: RankedTrack[] = [];
  candidatePool.forEach((candidate) => {
    if (dislikedIds.has(candidate.id)) return;

    const { score, reason, percentage, tags } = rankCandidateTrack(
      candidate,
      profile,
      interactions,
      favorites
    );

    rankedList.push({
      ...candidate,
      score,
      matchReason: reason,
      matchScorePercentage: percentage,
      tags
    });
  });

  // 5. Sort by score descending and take top 16 distinct recommendations
  rankedList.sort((a, b) => b.score - a.score);
  const finalResults = rankedList.slice(0, 16);

  console.log('[ifu recommendation engine] Successfully computed and ranked recommendations:', finalResults.map(r => ({
    title: r.title,
    artist: r.artist,
    score: r.score,
    matchScorePercentage: r.matchScorePercentage,
    reason: r.matchReason
  })));

  // Cache computed results
  try {
    localStorage.setItem(
      REC_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        tracks: finalResults
      })
    );
  } catch {
    // ignore
  }

  return finalResults;
}
