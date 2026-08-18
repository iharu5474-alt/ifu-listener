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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div>
            <h3 className="font-display text-lg font-bold uppercase text-white">
              ADD TO PLAYLIST
            </h3>
            <p className="font-mono text-xs text-neutral-400 truncate max-w-xs mt-0.5">
              {track.title}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Playlists list */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {customPlaylists.length === 0 && !showCreate && (
            <div className="text-center py-6 text-neutral-500 font-mono text-xs">
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
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  hasTrack
                    ? 'bg-neutral-950/40 border-neutral-900 text-neutral-500 cursor-default'
                    : 'bg-neutral-900/60 hover:bg-neutral-800 border-neutral-800 text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-sans font-semibold text-sm truncate">{pl.title}</h4>
                    <p className="font-mono text-[11px] text-neutral-400">{pl.tracks.length} tracks</p>
                  </div>
                </div>

                {hasTrack ? (
                  <span className="flex items-center space-x-1 font-mono text-xs text-[#E2FF66]">
                    <Check className="w-3.5 h-3.5" />
                    <span>ADDED</span>
                  </span>
                ) : (
                  <Plus className="w-4 h-4 text-neutral-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Create new inline */}
        {showCreate ? (
          <form onSubmit={handleCreateAndAdd} className="mt-4 pt-3 border-t border-neutral-900">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name..."
              className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white mb-2"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 font-mono text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-white text-black font-mono text-xs font-bold hover:bg-[#E2FF66]"
              >
                Create & Add
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-neutral-800 hover:border-neutral-600 font-mono text-xs text-neutral-300 hover:text-white flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CREATE NEW PLAYLIST</span>
          </button>
        )}
      </div>
    </div>
  );
};
