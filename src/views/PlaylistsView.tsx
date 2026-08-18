import React from 'react';
import { Playlist, Track } from '../types';
import { TrackRow } from '../components/TrackRow';
import { formatTime } from '../utils/formatters';
import { Play, Shuffle, Plus, Trash2, ArrowLeft, FolderHeart, Youtube, Clock, Music } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  onSelectPlaylist: (playlist: Playlist | null) => void;
  onPlayPlaylist: (playlist: Playlist, shuffle?: boolean) => void;
  onPlayTrack: (track: Track, queue?: Track[], playlistId?: string) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onDeleteCustomPlaylist: (playlistId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onOpenImportModal: () => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  selectedPlaylist,
  currentTrack,
  isPlaying,
  isFavorite,
  onSelectPlaylist,
  onPlayPlaylist,
  onPlayTrack,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist,
  onDeleteCustomPlaylist,
  onRemoveTrackFromPlaylist,
  onOpenImportModal
}) => {
  // If a playlist is selected, show detailed view
  if (selectedPlaylist) {
    const totalDuration = selectedPlaylist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-300">
        {/* Back Button */}
        <button
          onClick={() => onSelectPlaylist(null)}
          className="flex items-center space-x-2 font-mono text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO ALL PLAYLISTS</span>
        </button>

        {/* Playlist Hero Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-neutral-900">
          <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 shadow-2xl">
            <img
              src={selectedPlaylist.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'}
              alt={selectedPlaylist.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center space-x-2 font-mono text-xs text-neutral-400">
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 uppercase">
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
              <p className="font-sans text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
                {selectedPlaylist.description}
              </p>
            )}

            <div className="flex items-center space-x-4 font-mono text-xs text-neutral-400 pt-1">
              <span>{selectedPlaylist.tracks.length} TRACKS</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(totalDuration)} TOTAL</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-3">
              <button
                disabled={selectedPlaylist.tracks.length === 0}
                onClick={() => onPlayPlaylist(selectedPlaylist, false)}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all disabled:opacity-40"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY ALL</span>
              </button>

              <button
                disabled={selectedPlaylist.tracks.length === 0}
                onClick={() => onPlayPlaylist(selectedPlaylist, true)}
                className="flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs border border-neutral-800 transition-colors disabled:opacity-40"
              >
                <Shuffle className="w-4 h-4" />
                <span>SHUFFLE</span>
              </button>

              <button
                onClick={() => {
                  onDeleteCustomPlaylist(selectedPlaylist.id);
                  onSelectPlaylist(null);
                }}
                className="p-3 rounded-full bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-800/60 transition-colors"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-4">
          <div className="font-mono text-xs tracking-widest uppercase text-neutral-400">
            PLAYLIST TRACKLIST
          </div>

          {selectedPlaylist.tracks.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-neutral-900 rounded-2xl">
              <Music className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="font-mono text-xs text-neutral-400">No tracks in this playlist yet</p>
              <p className="font-sans text-xs text-neutral-600 mt-1">
                Search for tracks and add them with the "+" icon
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedPlaylist.tracks.map((track, idx) => (
                <div key={`${track.id}-${idx}`} className="relative group/row">
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

                  {/* Remove Track from custom playlist */}
                  <button
                    onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                    className="absolute right-24 top-1/2 -translate-y-1/2 p-1.5 rounded text-neutral-500 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
                    title="Remove from this playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Otherwise, show all playlists overview
  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="font-mono text-xs tracking-widest uppercase text-neutral-500 block">
            ifu listener // AUDIO LIBRARY
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white">
            PLAYLIST SPACES
          </h1>
        </div>

        <button
          onClick={onOpenImportModal}
          className="flex items-center space-x-2 px-5 py-3 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE / IMPORT PLAYLIST</span>
        </button>
      </div>

      {/* User Playlists Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold uppercase text-white">
            MY PLAYLISTS
          </h2>
          <span className="font-mono text-xs text-neutral-500">
            {playlists.length} SAVED
          </span>
        </div>

        {playlists.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-neutral-900 text-center bg-neutral-950/40 space-y-3">
            <FolderHeart className="w-12 h-12 text-neutral-600 mx-auto mb-1" />
            <h4 className="font-display font-bold text-lg text-white">Your Playlist Library is Empty</h4>
            <p className="font-sans text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Create custom playlists or import public YouTube playlists to build your private listening library.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenImportModal}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs border border-neutral-800 hover:border-neutral-700 transition-colors"
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
                className="group p-5 rounded-2xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-700 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 bg-neutral-900">
                  <img
                    src={pl.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md font-mono text-[10px] text-white">
                    {pl.youtubePlaylistId ? 'YOUTUBE' : 'CUSTOM'}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-base text-white group-hover:text-[#E2FF66] transition-colors">
                    {pl.title}
                  </h3>
                  <p className="font-mono text-xs text-neutral-400 mt-1">
                    {pl.tracks.length} tracks
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
