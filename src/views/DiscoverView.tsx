import React, { useState } from 'react';
import { Playlist, RankedTrack, Track, UserInterestProfile } from '../types';
import { TrackRow } from '../components/TrackRow';
import {
  Play,
  Sparkles,
  Search,
  Plus,
  ArrowUpRight,
  RotateCcw,
  ThumbsDown,
  Heart,
  Youtube,
  Link as LinkIcon,
  Flame,
  ListPlus,
  X,
  Loader2
} from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { searchYouTubeTracks } from '../services/youtubeApi';

interface DiscoverViewProps {
  playlists: Playlist[];
  favorites: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  recommendations?: RankedTrack[];
  userProfile?: UserInterestProfile | null;
  isLoadingRecommendations?: boolean;
  customApiKey?: string;
  onRefreshRecommendations?: () => void;
  onDislikeTrack?: (trackId: string) => void;
  onPlayTrack: (track: Track, queue?: Track[], playlistId?: string) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenImportModal: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  playlists,
  favorites,
  currentTrack,
  isPlaying,
  isFavorite,
  recommendations = [],
  userProfile = null,
  isLoadingRecommendations = false,
  customApiKey,
  onRefreshRecommendations,
  onDislikeTrack,
  onPlayTrack,
  onPlayPlaylist,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist,
  onSelectPlaylist,
  onOpenImportModal
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(null);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;

    setIsSearching(true);
    setActiveSearchQuery(query);
    try {
      console.log(`[ifu listener] Executing search on Discover page for "${query}"...`);
      const res = await searchYouTubeTracks(query, customApiKey);
      setSearchResults(res.tracks || []);
    } catch (err) {
      console.error('[ifu listener] Search error on Discover page:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearchQuery(null);
    setSearchResults([]);
  };

  const hasAnyContent = playlists.length > 0 || favorites.length > 0 || recommendations.length > 0;

  return (
    <div
      id="discover-glass-container"
      className="relative overflow-hidden rounded-3xl bg-white/[0.04] border border-white/15 p-5 sm:p-8 lg:p-10 space-y-10 animate-in fade-in duration-300"
    >
      {/* Top Subtle Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Single Clean Top Search Bar (Zero clutter, no quick discover chips) */}
      <section className="relative overflow-hidden rounded-2xl bg-white/[0.08] border border-white/20 p-4 sm:p-6 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
            <input
              id="discover-clean-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search songs, artists, genres, or paste YouTube link..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white focus:bg-black/60 transition-all font-sans shadow-inner"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching}
            id="discover-search-btn"
            className="px-6 py-3 rounded-xl bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isSearching ? 'SEARCHING...' : 'SEARCH'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenImportModal}
            id="discover-import-btn"
            className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#E2FF66]" />
            <span className="hidden md:inline">IMPORT PLAYLIST</span>
            <span className="md:hidden">IMPORT</span>
          </button>
        </form>
      </section>

      {/* ======================================================== */}
      {/* ACTIVE SEARCH RESULTS (If user performed a search)       */}
      {/* ======================================================== */}
      {activeSearchQuery && (
        <section id="discover-search-results-shelf" className="space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <span className="font-mono text-xs text-[#E2FF66] uppercase tracking-widest font-bold">
                SEARCH RESULTS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white mt-0.5">
                "{activeSearchQuery}"
              </h2>
              <p className="font-mono text-xs text-neutral-300 mt-0.5">
                {searchResults.length} TRACKS FOUND
              </p>
            </div>
            <button
              onClick={handleClearSearch}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>CLEAR SEARCH / BACK TO DISCOVER</span>
            </button>
          </div>

          {isSearching ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-[#E2FF66] animate-spin mx-auto mb-3" />
              <p className="font-mono text-xs text-neutral-300 uppercase tracking-wider">
                Searching audio archives...
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-white/15 rounded-2xl p-6">
              <p className="font-mono text-sm text-neutral-300">
                No matching tracks found for "{activeSearchQuery}".
              </p>
              <button
                onClick={handleClearSearch}
                className="mt-4 px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold hover:bg-[#E2FF66] transition-colors"
              >
                RETURN TO DISCOVER
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((track, idx) => (
                <TrackRow
                  key={`${track.id}-${idx}`}
                  track={track}
                  index={idx}
                  isPlaying={isPlaying}
                  isCurrent={currentTrack?.id === track.id}
                  isFavorite={isFavorite(track.id)}
                  onPlay={(t) => onPlayTrack(t, searchResults)}
                  onToggleFavorite={onToggleFavorite}
                  onAddToQueue={onAddToQueue}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* 1. RECOMMENDATION ENGINE SHELF ("Recommended for you") */}
      {/* ======================================================== */}
      {recommendations.length > 0 && !activeSearchQuery && (
        <section id="recommended-for-you-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <div className="flex items-center space-x-2 font-mono text-xs text-[#E2FF66]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="uppercase tracking-widest font-bold">TASTE PROFILE</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white mt-1 drop-shadow-md">
                RECOMMENDED FOR YOU
              </h2>
              <p className="font-sans text-xs text-neutral-200 mt-0.5 drop-shadow-sm">
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
                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all active:scale-95 disabled:opacity-50"
                  title="Recompute Recommendations"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingRecommendations ? 'animate-spin text-[#E2FF66]' : ''}`} />
                  <span>{isLoadingRecommendations ? 'CALCULATING...' : 'REFRESH'}</span>
                </button>
              )}
              <button
                id="btn-play-all-recs"
                onClick={() => onPlayTrack(recommendations[0], recommendations.slice(1))}
                className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY ALL ({recommendations.length})</span>
              </button>
            </div>
          </div>

          {/* Recommendations Grid (White Glass with no blur for clear video visibility) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 8).map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = isFavorite(track.id);

              return (
                <div
                  key={track.id}
                  className={`group relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between border shadow-md ${
                    isCurrent
                      ? 'bg-white/20 border-[#E2FF66]/70 shadow-[#E2FF66]/20'
                      : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 hover:border-white/30'
                  }`}
                >
                  {/* Thumbnail & Action Overlay */}
                  <div>
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-black/40 border border-white/15">
                      <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Match percentage badge */}
                      {track.matchScorePercentage && (
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 border border-white/20 font-mono text-[10px] text-[#E2FF66] font-bold flex items-center space-x-1 shadow-md">
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
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/80 hover:bg-red-500/90 text-neutral-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-white/20"
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
                    <p className="font-mono text-xs text-neutral-200 mt-1 truncate drop-shadow-sm">
                      {track.artist}
                    </p>

                    {/* Intuitive Recommendation Reason */}
                    {track.matchReason && (
                      <p className="font-sans text-[11px] text-neutral-300 mt-2 line-clamp-1 italic drop-shadow-sm">
                        {track.matchReason}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between font-mono text-[11px] text-neutral-300">
                    <span>{formatTime(track.duration)}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onToggleFavorite(track)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav ? 'text-[#E2FF66]' : 'text-neutral-300 hover:text-white'
                        }`}
                        title={isFav ? 'Liked' : 'Like Track'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => onOpenAddToPlaylist(track)}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-white transition-colors"
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
          <div className="flex items-end justify-between border-b border-white/15 pb-4">
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
          <div className="flex items-end justify-between border-b border-white/15 pb-4">
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
                className="group relative bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/30 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-md"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 bg-black/40 border border-white/15">
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
                  <p className="font-sans text-xs text-neutral-200 mt-1.5 line-clamp-2 leading-relaxed drop-shadow-sm">
                    {pl.description || `${pl.tracks.length} tracks in this collection`}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between font-mono text-[11px] text-neutral-300">
                    <span>{pl.tracks.length} TRACKS</span>
                    <span className="text-neutral-200 group-hover:text-white flex items-center space-x-1">
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

      {/* Getting Started Guide if no items */}
      {!hasAnyContent && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <span className="font-mono text-xs tracking-widest uppercase text-neutral-300 font-semibold drop-shadow-sm">
              GETTING STARTED // 3 WAYS TO LISTEN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Search */}
            <div
              onClick={() => document.getElementById('discover-clean-search-input')?.focus()}
              className="p-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/30 transition-all cursor-pointer space-y-4 group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors border border-white/20">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                  1. Search Any Song
                </h3>
                <p className="font-sans text-xs text-neutral-200 leading-relaxed drop-shadow-sm">
                  Search by artist, title, or genre. Results stream directly from YouTube audio in background fidelity.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-300 group-hover:text-white flex items-center space-x-1 pt-2">
                <span>FOCUS SEARCH</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* Step 2: Direct Link */}
            <div
              onClick={() => document.getElementById('discover-clean-search-input')?.focus()}
              className="p-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/30 transition-all cursor-pointer space-y-4 group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors border border-white/20">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                  2. Paste YouTube Link
                </h3>
                <p className="font-sans text-xs text-neutral-200 leading-relaxed drop-shadow-sm">
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
              className="p-6 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/30 transition-all cursor-pointer space-y-4 group shadow-md"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors border border-white/20">
                <Youtube className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors drop-shadow-sm">
                  3. Import Playlist
                </h3>
                <p className="font-sans text-xs text-neutral-200 leading-relaxed drop-shadow-sm">
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

