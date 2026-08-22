import React, { useState } from 'react';
import { Playlist, Track } from '../types';
import { fetchYouTubePlaylist } from '../services/youtubeApi';
import { X, Youtube, ListPlus, Loader2, Sparkles, Check } from 'lucide-react';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPlaylist: (playlist: Playlist) => void;
  onCreateCustomPlaylist: (title: string, description?: string) => void;
}

export const ImportPlaylistModal: React.FC<ImportPlaylistModalProps> = ({
  isOpen,
  onClose,
  onImportPlaylist,
  onCreateCustomPlaylist
}) => {
  const [activeMode, setActiveMode] = useState<'youtube' | 'custom'>('youtube');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImportYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeInput.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const playlist = await fetchYouTubePlaylist(youtubeInput.trim());
      if (playlist) {
        onImportPlaylist(playlist);
        setYoutubeInput('');
        onClose();
      } else {
        setErrorMsg('Invalid YouTube playlist URL or ID. Please check and retry.');
      }
    } catch {
      setErrorMsg('Failed to fetch playlist. Verify the playlist is public.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    onCreateCustomPlaylist(customTitle.trim(), customDesc.trim());
    setCustomTitle('');
    setCustomDesc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div
        id="import-playlist-modal"
        className="relative w-full max-w-lg bg-white/[0.14] backdrop-blur-3xl border border-white/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-white"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <div>
            <h3 className="font-display text-xl font-bold uppercase text-white tracking-tight">
              PLAYLIST ENGINE
            </h3>
            <p className="font-mono text-xs text-neutral-200 mt-0.5">
              IMPORT FROM YOUTUBE OR INITIALIZE CUSTOM COLLECTION
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full bg-white/10 hover:bg-white hover:text-black text-neutral-200 transition-colors border border-white/20 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher (White Glass) */}
        <div className="grid grid-cols-2 gap-2 mt-5 p-1.5 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
          <button
            onClick={() => setActiveMode('youtube')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'youtube'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-neutral-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-500" />
            <span>YOUTUBE PLAYLIST</span>
          </button>
          <button
            onClick={() => setActiveMode('custom')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'custom'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-neutral-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>CUSTOM PLAYLIST</span>
          </button>
        </div>

        {/* YouTube Import Mode */}
        {activeMode === 'youtube' && (
          <form onSubmit={handleImportYouTube} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="block font-mono text-xs text-neutral-200 font-semibold uppercase">
                YOUTUBE PLAYLIST URL OR ID
              </label>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PL..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all"
                required
              />
              <p className="font-mono text-[11px] text-neutral-300">
                Supports standard YouTube playlist links, mix URLs, and custom playlist IDs.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-500/30 font-mono text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-mono text-xs transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isLoading || !youtubeInput.trim()}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>FETCHING TRACKS...</span>
                  </span>
                ) : (
                  'IMPORT PLAYLIST'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Custom Playlist Mode */}
        {activeMode === 'custom' && (
          <form onSubmit={handleCreateCustom} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="block font-mono text-xs text-neutral-200 font-semibold uppercase">
                PLAYLIST TITLE
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Late Night Focus, Workout Vibes..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs text-neutral-200 font-semibold uppercase">
                DESCRIPTION (OPTIONAL)
              </label>
              <textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Add an optional mood or description..."
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-mono text-xs transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                CREATE PLAYLIST
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
