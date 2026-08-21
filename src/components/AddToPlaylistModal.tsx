import React, { useState } from 'react';
import { Playlist, Track } from '../types';
import { X, Plus, Check, Music } from 'lucide-react';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  track: Track | null;
  playlists: Playlist[];
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onCreateNewPlaylist: (title: string, track: Track) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  track,
  playlists,
  onClose,
  onAddToPlaylist,
  onCreateNewPlaylist
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen || !track) return null;

  const customPlaylists = playlists.filter((p) => p.isCustom);

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateNewPlaylist(newTitle.trim(), track);
    setNewTitle('');
    setShowCreate(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <div className="relative w-full max-w-md bg-black/75 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div>
            <h3 className="font-display text-lg font-bold uppercase text-white tracking-tight">
              ADD TO PLAYLIST
            </h3>
            <p className="font-mono text-xs text-neutral-300 truncate max-w-xs mt-0.5">
              {track.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full bg-white/10 hover:bg-white hover:text-black text-neutral-300 transition-colors border border-white/20 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Playlists list */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {customPlaylists.length === 0 && !showCreate && (
            <div className="text-center py-6 text-neutral-300 font-mono text-xs">
              No custom playlists created yet.
            </div>
          )}

          {customPlaylists.map((pl) => {
            const hasTrack = pl.tracks.some((t) => t.id === track.id);
            return (
              <button
                key={pl.id}
                onClick={() => {
                  if (!hasTrack) {
                    onAddToPlaylist(pl.id, track);
                    onClose();
                  }
                }}
                disabled={hasTrack}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                  hasTrack
                    ? 'bg-white/5 border-white/10 text-neutral-400 cursor-default'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-neutral-200" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-sans font-semibold text-sm truncate">{pl.title}</h4>
                    <p className="font-mono text-[11px] text-neutral-300">{pl.tracks.length} tracks</p>
                  </div>
                </div>

                {hasTrack ? (
                  <span className="flex items-center space-x-1 font-mono text-xs text-[#E2FF66] font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>ADDED</span>
                  </span>
                ) : (
                  <Plus className="w-4 h-4 text-neutral-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Create new inline */}
        {showCreate ? (
          <form onSubmit={handleCreateAndAdd} className="mt-4 pt-3 border-t border-white/15">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name..."
              className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white mb-2.5 placeholder:text-neutral-400"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 font-mono text-xs text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-[#E2FF66] shadow-md"
              >
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full mt-4 py-2.5 rounded-2xl border border-dashed border-white/30 hover:border-white font-mono text-xs text-neutral-200 hover:text-white flex items-center justify-center space-x-2 transition-colors bg-white/5 hover:bg-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CREATE NEW PLAYLIST</span>
          </button>
        )}
      </div>
    </div>
  );
};

