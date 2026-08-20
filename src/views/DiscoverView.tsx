import React, { useState } from 'react';
import { Playlist, RankedTrack, Track, UserInterestProfile } from '../types';
import { TrackRow } from '../components/TrackRow';
import { AudioVisualizer } from '../components/AudioVisualizer';
import {
  Play,
  Sparkles,
  Search,
  Plus,
  ArrowUpRight,
  RotateCcw,
  ThumbsDown,
  Compass,
  Heart,
  Youtube,
  Radio,
  Music,
  Link as LinkIcon,
  Flame,
  ListPlus
} from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface DiscoverViewProps {
  playlists: Playlist[];
  favorites: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  recommendations?: RankedTrack[];
  userProfile?: UserInterestProfile | null;
  isLoadingRecommendations?: boolean;
  onRefreshRecommendations?: () => void;
  onDislikeTrack?: (trackId: string) => void;
  onPlayTrack: (track: Track, queue?: Track[], playlistId?: string) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenSearch: () => void;
  onOpenImportModal: () => void;
}

const DISCOVER_GENRES = [
  'Lofi Hip Hop',
  'Synthwave 80s',
  'Ambient Chill',
  'Classical Piano',
  'Cyberpunk Beats',
  'Nocturnal Jazz',
  'Indie Folk'
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  playlists,
  favorites,
  currentTrack,
  isPlaying,
  isFavorite,
  recommendations = [],
  userProfile = null,
  isLoadingRecommendations = false,
  onRefreshRecommendations,
  onDislikeTrack,
  onPlayTrack,
  onPlayPlaylist,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist,
  onSelectPlaylist,
  onOpenSearch,
  onOpenImportModal
}) => {
  const [quickInput, setQuickInput] = useState('');

  const hasAnyContent = playlists.length > 0 || favorites.length > 0 || recommendations.length > 0;

  return (
    <div
      id="discover-glass-container"
      className="relative overflow-hidden rounded-3xl bg-black/30 border border-white/10 shadow-2xl p-5 sm:p-8 lg:p-10 space-y-12 animate-in fade-in duration-300"
    >
      {/* Soft top highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* ifu listener Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 p-6 sm:p-10 lg:p-12 shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E2FF66]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-white/10 font-mono text-[11px] text-neutral-300 uppercase tracking-widest border border-white/10">
                ifu listener // MINIMAL AUDIO
              </span>
              <span className="flex items-center space-x-1.5 font-mono text-[11px] text-[#E2FF66]">
                <span className="w-2 h-2 rounded-full bg-[#E2FF66] animate-pulse" />
                <span>STREAM ENGINE READY</span>
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.95] drop-shadow-md">
              SOUNDS SHAPED BY CONTRAST
            </h1>

            <p className="font-sans text-neutral-200 text-sm sm:text-base max-w-xl leading-relaxed drop-shadow-sm">
              Stream any song or audio from YouTube in focused minimalism. Search tracks, paste video links, or import playlists to build your private sonic collection from scratch.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="btn-hero-explore-search"
                onClick={onOpenSearch}
                className="flex items-center space-x-3 px-7 py-3.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Search className="w-4 h-4" />
                <span>SEARCH YOUTUBE</span>
              </button>

              <button
                id="btn-hero-import-pl"
                onClick={onOpenImportModal}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-mono text-xs border border-white/20 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#E2FF66]" />
                <span>IMPORT PLAYLIST</span>
              </button>
            </div>

            {/* Quick Genre Suggestions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-neutral-300 mr-1 drop-shadow-sm">QUICK START:</span>
              {DISCOVER_GENRES.slice(0, 5).map((genre) => (
                <button
                  key={genre}
                  onClick={onOpenSearch}
                  className="px-3 py-1 rounded-full bg-black/50 hover:bg-black/80 text-neutral-200 hover:text-white font-mono text-xs border border-white/10 transition-colors"
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Right Hero Visualizer Canvas */}
          <div className="lg:col-span-4 h-64 w-full">
            <AudioVisualizer
              isPlaying={isPlaying}
              variant="bars"
              className="h-64 rounded-2xl border-white/10 bg-black/40"
            />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. RECOMMENDATION ENGINE SHELF ("Recommended for you") */}
      {/* ======================================================== */}
      {recommendations.length > 0 && (
        <section id="recommended-for-you-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center space-x-2 font-mono text-xs text-[#E2FF66]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="uppercase tracking-widest font-bold">CLIENT-SIDE ML PROFILE</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white mt-1 drop-shadow-sm">
                RECOMMENDED FOR YOU
              </h2>
              <p className="font-sans text-xs text-neutral-300 mt-0.5 drop-shadow-sm">
                {userProfile && userProfile.topArtists.length > 0
                  ? `Personalized from your listening affinity for ${userProfile.topArtists[0].artist}${
                      userProfile.topGenres[0] ? ` & ${userProfile.topGenres[0].genre.toUpperCase()}` : ''
                    }`
                  : 'Computed from your listening patterns, completion rates, and favorites'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {onRefreshRecommendations && (
                <button
                  id="btn-recompute-recs"
                  onClick={onRefreshRecommendations}
                  disabled={isLoadingRecommendations}
                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-neutral-200 hover:text-white font-mono text-xs border border-white/15 transition-all active:scale-95 disabled:opacity-50"
                  title="Recompute Recommendations"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingRecommendations ? 'animate-spin text-[#E2FF66]' : ''}`} />
                  <span>{isLoadingRecommendations ? 'CALCULATING...' : 'RECOMPUTE'}</span>
                </button>
              )}
              <button
                id="btn-play-all-recs"
                onClick={() => onPlayTrack(recommendations[0], recommendations.slice(1))}
                className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY ALL ({recommendations.length})</span>
              </button>
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 8).map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = isFavorite(track.id);

              return (
                <div
                  key={track.id}
                  className={`group relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between border shadow-md ${
                    isCurrent
                      ? 'bg-white/15 border-[#E2FF66]/70 shadow-[#E2FF66]/10'
                      : 'bg-black/40 hover:bg-black/60 border-white/10 hover:border-white/25'
                  }`}
                >
                  {/* Thumbnail & Action Overlay */}
                  <div>
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-white/10">
                      <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Match percentage badge */}
                      {track.matchScorePercentage && (
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 border border-white/10 font-mono text-[10px] text-[#E2FF66] font-bold flex items-center space-x-1 shadow-md">
                          <Flame className="w-3 h-3 text-[#E2FF66]" />
                          <span>{track.matchScorePercentage}% MATCH</span>
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          onClick={() => onPlayTrack(track, recommendations.filter((t) => t.id !== track.id))}
                          className="w-11 h-11 rounded-full bg-white hover:bg-[#E2FF66] text-black flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
                          title="Play Track"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </div>

                      {/* Dislike / Dismiss Button */}
                      {onDislikeTrack && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDislikeTrack(track.id);
                          }}
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/80 hover:bg-red-500/90 text-neutral-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-white/10"
                          title="Not interested / Dislike (trains recommendation engine)"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <h3 className="font-display font-bold text-sm text-white group-hover:text-[#E2FF66] transition-colors line-clamp-1 drop-shadow-sm">
                      {track.title}
                    </h3>
                    <p className="font-mono text-xs text-neutral-300 mt-1 truncate">
                      {track.artist}
                    </p>

                    {/* Intuitive Recommendation Reason */}
                    {track.matchReason && (
                      <p className="font-sans text-[11px] text-neutral-300 mt-2 line-clamp-1 italic">
                        {track.matchReason}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-neutral-400">
                    <span>{formatTime(track.duration)}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onToggleFavorite(track)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav ? 'text-[#E2FF66]' : 'text-neutral-400 hover:text-white'
                        }`}
                        title={isFav ? 'Liked' : 'Like Track'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => onAddToQueue(track)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                        title="Add to Queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenAddToPlaylist(track)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
                        title="Add to Playlist"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* User's Liked Tracks Shelf (if any exist) */}
      {favorites.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-neutral-300 block font-semibold drop-shadow-sm">
                YOUR LIBRARY
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1 drop-shadow-sm">
                RECENTLY LIKED TRACKS
              </h2>
            </div>
            <button
              onClick={() => onPlayTrack(favorites[0], favorites.slice(1))}
              className="flex items-center space-x-2 font-mono text-xs text-neutral-200 hover:text-white transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY ALL LIKED ({favorites.length})</span>
            </button>
          </div>

          <div className="space-y-2">
            {favorites.slice(0, 6).map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                isFavorite={true}
                onPlay={(t) => onPlayTrack(t, favorites)}
                onToggleFavorite={onToggleFavorite}
                onAddToQueue={onAddToQueue}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
              />
            ))}
          </div>
        </section>
      )}

      {/* User's Custom Playlists Shelf (if any exist) */}
      {playlists.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-neutral-300 block font-semibold drop-shadow-sm">
                YOUR PLAYLISTS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1 drop-shadow-sm">
                MY COLLECTIONS
              </h2>
            </div>
            <span className="font-mono text-xs text-neutral-300">
              {playlists.length} COLLECTIONS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="group relative bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-md"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 bg-neutral-900 border border-white/10">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayPlaylist(pl);
                      }}
                      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-base text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                    {pl.title}
                  </h3>
                  <p className="font-sans text-xs text-neutral-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {pl.description || `${pl.tracks.length} tracks in this collection`}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-neutral-400">
                    <span>{pl.tracks.length} TRACKS</span>
                    <span className="text-neutral-300 group-hover:text-white flex items-center space-x-1">
                      <span>OPEN</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Getting Started Guide */}
      {!hasAnyContent && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-mono text-xs tracking-widest uppercase text-neutral-300 font-semibold drop-shadow-sm">
              GETTING STARTED // 3 WAYS TO LISTEN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Search */}
            <div
              onClick={onOpenSearch}
              className="p-6 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 transition-all cursor-pointer space-y-4 group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-black/60 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors border border-white/10">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                  1. Search Any Song
                </h3>
                <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                  Search by artist, title, or genre. Results stream directly from YouTube audio in background fidelity.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-300 group-hover:text-white flex items-center space-x-1 pt-2">
                <span>OPEN SEARCH</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* Step 2: Direct Link */}
            <div
              onClick={onOpenSearch}
              className="p-6 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 transition-all cursor-pointer space-y-4 group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-black/60 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors border border-white/10">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                  2. Paste YouTube Link
                </h3>
                <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                  Paste any YouTube watch link (or 11-char video ID) directly into the search bar for instant playback with 0 API keys.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-300 group-hover:text-white flex items-center space-x-1 pt-2">
                <span>PASTE LINK</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* Step 3: Import Playlist */}
            <div
              onClick={onOpenImportModal}
              className="p-6 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/25 transition-all cursor-pointer space-y-4 group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-black/60 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors border border-white/10">
                <Youtube className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                  3. Import Playlist
                </h3>
                <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                  Import any public YouTube playlist or create your own custom track lists to organize your private library.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-300 group-hover:text-white flex items-center space-x-1 pt-2">
                <span>IMPORT NOW</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
