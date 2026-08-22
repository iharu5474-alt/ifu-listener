import React, { useState } from 'react';
import { Playlist, Track } from '../types';
import { TrackRow } from '../components/TrackRow';
import { formatTime } from '../utils/formatters';
import {
  Heart,
  FolderHeart,
  Play,
  Shuffle,
  Plus,
  Trash2,
  ArrowLeft,
  Youtube,
  Music
} from 'lucide-react';

type LibrarySubTab = 'favorites' | 'playlists';

interface LibraryViewProps {
  playlists: Playlist[];
  favorites: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  onPlayTrack: (track: Track, queue?: Track[], playlistId?: string) => void;
  onPlayPlaylist: (playlist: Playlist, shuffle?: boolean) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onDeleteCustomPlaylist: (playlistId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onOpenImportModal: () => void;
  selectedPlaylist: Playlist | null;
  onSelectPlaylist: (playlist: Playlist | null) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
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
  onDeleteCustomPlaylist,
  onRemoveTrackFromPlaylist,
  onOpenImportModal,
  selectedPlaylist,
  onSelectPlaylist
}) => {
  const [activeSubTab, setActiveSubTab] = useState<LibrarySubTab>('favorites');

  const subTabs = [
    { id: 'favorites' as LibrarySubTab, label: 'FAVORITES', count: favorites.length, icon: Heart },
    { id: 'playlists' as LibrarySubTab, label: 'PLAYLISTS', count: playlists.length, icon: FolderHeart }
  ];

  // If a playlist is selected, show its tracklist detail view
  if (selectedPlaylist) {
    const totalDuration = selectedPlaylist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-300">
        {/* Back Button */}
        <button
          onClick={() => onSelectPlaylist(null)}
          className="flex items-center space-x-2 font-mono text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO LIBRARY PLAYLISTS</span>
        </button>

        {/* Playlist Hero Details - White Glass */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-2xl text-white">
          <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-black/40 shrink-0 shadow-2xl border border-white/20">
            <img
              src={selectedPlaylist.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'}
              alt={selectedPlaylist.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2 font-mono text-xs text-neutral-300">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 uppercase">
                {selectedPlaylist.youtubePlaylistId ? 'YOUTUBE IMPORT' : 'CUSTOM PLAYLIST'}
              </span>
              {selectedPlaylist.youtubePlaylistId && (
                <span className="flex items-center space-x-1 text-red-400 font-mono text-xs">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>SYNCED</span>
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              {selectedPlaylist.title}
            </h1>

            {selectedPlaylist.description && (
              <p className="font-sans text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-xl">
                {selectedPlaylist.description}
              </p>
            )}

            <div className="flex items-center space-x-3 font-mono text-xs text-neutral-300 pt-1">
              <span>{selectedPlaylist.tracks.length} TRACKS</span>
              <span>•</span>
              <span>{formatTime(totalDuration)} TOTAL DURATION</span>
            </div>

            {/* Playlist Playback Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                disabled={selectedPlaylist.tracks.length === 0}
                onClick={() => onPlayPlaylist(selectedPlaylist, false)}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY ALL</span>
              </button>

              <button
                disabled={selectedPlaylist.tracks.length === 0}
                onClick={() => onPlayPlaylist(selectedPlaylist, true)}
                className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>SHUFFLE</span>
              </button>

              {selectedPlaylist.isCustom && (
                <button
                  onClick={() => {
                    onDeleteCustomPlaylist(selectedPlaylist.id);
                    onSelectPlaylist(null);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-3 rounded-full bg-white/10 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 font-mono text-xs border border-white/20 transition-colors cursor-pointer"
                  title="Delete Custom Playlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DELETE</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-300 font-bold px-2">
            TRACKS IN PLAYLIST ({selectedPlaylist.tracks.length})
          </h3>

          {selectedPlaylist.tracks.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/20 rounded-3xl p-8 bg-white/[0.04] backdrop-blur-2xl text-white">
              <Music className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <h4 className="font-display font-bold text-base text-white">PLAYLIST IS EMPTY</h4>
              <p className="font-sans text-xs text-neutral-300 max-w-sm mx-auto mt-1">
                Add tracks from Search to populate this playlist.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedPlaylist.tracks.map((track, idx) => (
                <div key={`pl-track-${track.id}-${idx}`} className="group relative">
                  <TrackRow
                    track={track}
                    index={idx}
                    isPlaying={isPlaying}
                    isCurrent={currentTrack?.id === track.id}
                    isFavorite={isFavorite(track.id)}
                    onPlay={(t) => onPlayTrack(t, selectedPlaylist.tracks, selectedPlaylist.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToQueue={onAddToQueue}
                    onOpenAddToPlaylist={onOpenAddToPlaylist}
                  />

                  {/* Remove Track Button for Custom Playlists */}
                  {selectedPlaylist.isCustom && (
                    <button
                      onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate total liked duration
  const totalFavoritesDuration = favorites.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handleShuffleFavorites = () => {
    if (favorites.length > 0) {
      const shuffled = [...favorites].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* Top Header & Sub-Tabs Navigation (White Glass) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/20 pb-6">
        <div>
          <div className="flex items-center space-x-2 font-mono text-xs text-[#E2FF66]">
            <span className="w-2 h-2 rounded-full bg-[#E2FF66] animate-pulse" />
            <span>COLLECTION ARCHIVE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight mt-1">
            AUDIO LIBRARY
          </h1>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center space-x-1.5 p-1.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 self-start sm:self-auto shadow-sm">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`lib-tab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-mono text-xs tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-neutral-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-300'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/10 text-black font-bold' : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. FAVORITES (LIKED TRACKS) TAB                          */}
      {/* ======================================================== */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-xl text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-red-400 fill-current" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-white uppercase">
                  LIKED TRACKS
                </h3>
                <p className="font-mono text-xs text-neutral-300 mt-0.5">
                  {favorites.length} TRACKS • {formatTime(totalFavoritesDuration)} TOTAL
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => onPlayTrack(favorites[0], favorites)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY ALL</span>
                </button>
                <button
                  onClick={handleShuffleFavorites}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>SHUFFLE</span>
                </button>
              </div>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/20 rounded-3xl p-8 bg-white/[0.04] backdrop-blur-2xl text-white">
              <Heart className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <h3 className="font-display font-bold text-lg text-white">NO LIKED TRACKS YET</h3>
              <p className="font-sans text-xs text-neutral-300 max-w-sm mx-auto mt-1">
                Click the heart icon on any song across Search or Recommendations to save it to your Liked collection.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((track, idx) => (
                <TrackRow
                  key={`fav-${track.id}-${idx}`}
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
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CUSTOM & IMPORTED PLAYLISTS TAB                       */}
      {/* ======================================================== */}
      {activeSubTab === 'playlists' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase text-white">
              MY PLAYLISTS ({playlists.length})
            </h3>
            <button
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white text-black font-mono text-xs font-bold hover:bg-[#E2FF66] transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW PLAYLIST</span>
            </button>
          </div>

          {playlists.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-white/20 text-center bg-white/[0.04] backdrop-blur-2xl space-y-3 text-white">
              <FolderHeart className="w-12 h-12 text-neutral-400 mx-auto mb-1" />
              <h4 className="font-display font-bold text-lg text-white">Your Playlist Library is Empty</h4>
              <p className="font-sans text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                Create custom playlists or import public YouTube playlists to organize your collection.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenImportModal}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-colors cursor-pointer"
                >
                  + CREATE OR IMPORT PLAYLIST
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl)}
                  className="group p-5 rounded-2xl bg-white/[0.08] backdrop-blur-2xl hover:bg-white/[0.14] border border-white/20 hover:border-white/40 cursor-pointer transition-all flex flex-col justify-between shadow-xl hover:scale-[1.02] text-white"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 bg-black/40 border border-white/15">
                    <img
                      src={pl.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md font-mono text-[10px] text-white border border-white/20 font-semibold">
                      {pl.youtubePlaylistId ? 'YOUTUBE' : 'CUSTOM'}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-[#E2FF66] transition-colors truncate">
                      {pl.title}
                    </h3>
                    <p className="font-mono text-xs text-neutral-300 mt-1">
                      {pl.tracks.length} tracks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
