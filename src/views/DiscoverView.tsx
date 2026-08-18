import React, { useState } from 'react';
import { Playlist, Track } from '../types';
import { TrackRow } from '../components/TrackRow';
import { AudioVisualizer } from '../components/AudioVisualizer';
import {
  Play,
  Sparkles,
  Search,
  Plus,
  ArrowUpRight,
  FolderHeart,
  Heart,
  Youtube,
  Radio,
  Music,
  Link as LinkIcon
} from 'lucide-react';

interface DiscoverViewProps {
  playlists: Playlist[];
  favorites: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
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

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onOpenSearch();
    }
  };

  const hasAnyContent = playlists.length > 0 || favorites.length > 0;

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-300">
      
      {/* ifu listener Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 border border-neutral-900 p-8 sm:p-12 lg:p-14">
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

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.95]">
              SOUNDS SHAPED BY CONTRAST
            </h1>

            <p className="font-sans text-neutral-400 text-sm sm:text-base max-w-xl leading-relaxed">
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
                className="flex items-center space-x-2 px-6 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs border border-neutral-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-[#E2FF66]" />
                <span>IMPORT PLAYLIST</span>
              </button>
            </div>

            {/* Quick Genre Suggestions */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-neutral-500 mr-1">QUICK START:</span>
              {DISCOVER_GENRES.slice(0, 5).map((genre) => (
                <button
                  key={genre}
                  onClick={onOpenSearch}
                  className="px-3 py-1 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white font-mono text-xs border border-neutral-800 transition-colors"
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
              className="h-64 rounded-2xl border-neutral-800"
            />
          </div>
        </div>
      </section>

      {/* User's Liked Tracks Shelf (if any exist) */}
      {favorites.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-neutral-500 block">
                YOUR LIBRARY
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1">
                RECENTLY LIKED TRACKS
              </h2>
            </div>
            <button
              onClick={() => onPlayTrack(favorites[0], favorites)}
              className="flex items-center space-x-2 font-mono text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY ALL LIKED ({favorites.length})</span>
            </button>
          </div>

          <div className="space-y-2">
            {favorites.slice(0, 5).map((track, idx) => (
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
          <div className="flex items-end justify-between">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-neutral-500 block">
                YOUR PLAYLISTS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1">
                MY COLLECTIONS
              </h2>
            </div>
            <span className="font-mono text-xs text-neutral-500">
              {playlists.length} COLLECTIONS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="group relative bg-neutral-950/70 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-700 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 bg-neutral-900">
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
                  <h3 className="font-display font-bold text-base text-white group-hover:text-[#E2FF66] transition-colors">
                    {pl.title}
                  </h3>
                  <p className="font-sans text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {pl.description || `${pl.tracks.length} tracks in this collection`}
                  </p>
                  <div className="mt-4 pt-3 border-t border-neutral-900/80 flex items-center justify-between font-mono text-[11px] text-neutral-500">
                    <span>{pl.tracks.length} TRACKS</span>
                    <span className="text-neutral-400 group-hover:text-white flex items-center space-x-1">
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

      {/* When the user starts with an empty library: 3 clean Step Cards */}
      {!hasAnyContent && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <span className="font-mono text-xs tracking-widest uppercase text-neutral-500">
              GETTING STARTED // 3 WAYS TO LISTEN
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Search */}
            <div
              onClick={onOpenSearch}
              className="p-6 rounded-2xl bg-neutral-950/60 hover:bg-neutral-900/80 border border-neutral-900 hover:border-neutral-700 transition-all cursor-pointer space-y-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors">
                  1. Search Any Song
                </h3>
                <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                  Search by artist, title, or genre. Results stream directly from YouTube audio in background fidelity.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-500 group-hover:text-white flex items-center space-x-1 pt-2">
                <span>OPEN SEARCH</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* Step 2: Direct Link */}
            <div
              onClick={onOpenSearch}
              className="p-6 rounded-2xl bg-neutral-950/60 hover:bg-neutral-900/80 border border-neutral-900 hover:border-neutral-700 transition-all cursor-pointer space-y-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors">
                  2. Paste YouTube Link
                </h3>
                <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                  Paste any YouTube watch link (or 11-char video ID) directly into the search bar for instant playback with 0 API keys.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-500 group-hover:text-white flex items-center space-x-1 pt-2">
                <span>PASTE LINK</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            {/* Step 3: Import Playlist */}
            <div
              onClick={onOpenImportModal}
              className="p-6 rounded-2xl bg-neutral-950/60 hover:bg-neutral-900/80 border border-neutral-900 hover:border-neutral-700 transition-all cursor-pointer space-y-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white group-hover:bg-[#E2FF66] group-hover:text-black flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5 text-red-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-lg text-white group-hover:text-[#E2FF66] transition-colors">
                  3. Import Playlist
                </h3>
                <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                  Import any public YouTube playlist or create your own custom track lists to organize your private library.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-500 group-hover:text-white flex items-center space-x-1 pt-2">
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
