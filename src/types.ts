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

export type ActiveTab = 'discover' | 'search' | 'playlists' | 'favorites' | 'queue' | 'visualizer';
