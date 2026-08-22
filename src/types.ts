export interface Track {
  id: string; // YouTube videoId
  title: string;
  artist: string;
  duration: number; // in seconds
  formattedDuration?: string;
  thumbnailUrl: string;
  album?: string;
  addedAt?: number;
  viewCount?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
  isCustom?: boolean;
  createdAt?: number;
  youtubePlaylistId?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerStatus = 'unstarted' | 'buffering' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  autoplay: boolean;
  repeatMode: RepeatMode;
  playbackRate: number;
  status: PlayerStatus;
  errorCode: number | null;
  errorMessage: string | null;
  isReady: boolean;
  queue: Track[];
  history: Track[];
  suggestedTrack: Track | null;
  activePlaylistId: string | null;
}

export interface ApiError {
  status: number;
  statusText?: string;
  code?: number;
  message: string;
  reason?: string;
  domain?: string;
  extendedHelp?: string;
  raw?: any;
}

export interface SearchResultData {
  tracks: Track[];
  searchedWithKey?: boolean;
  source?: string;
  directMatch?: boolean;
  apiError?: ApiError | null;
}

export type ActiveTab = 'home' | 'recommended' | 'library' | 'playlists' | 'favorites' | 'history' | 'search' | 'queue' | 'visualizer';

export interface TrackInteraction {
  trackId: string;
  title: string;
  artist: string;
  genreTags: string[];
  plays: number;
  listenDurationSeconds: number;
  totalDurationSeconds: number;
  completionRate: number; // 0 to 1
  skips: number;
  likes: number; // 1 if liked, 0 otherwise
  dislikes: number; // 1 if disliked / dismissed
  repeatPlays: number;
  lastPlayedAt: number;
  timeOfDayCounts: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
}

export interface UserInterestProfile {
  topArtists: { artist: string; score: number; playCount: number; skipCount: number }[];
  topGenres: { genre: string; score: number }[];
  topKeywords: { keyword: string; count: number }[];
  totalListens: number;
  totalCompletions: number;
  totalSkips: number;
  averageCompletionRate: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  updatedAt: number;
}

export interface RankedTrack extends Track {
  score: number;
  matchReason?: string;
  matchScorePercentage?: number;
  tags?: string[];
  disliked?: boolean;
}

