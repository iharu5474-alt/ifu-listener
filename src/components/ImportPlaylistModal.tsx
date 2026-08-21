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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <div
        id="import-playlist-modal"
        className="relative w-full max-w-lg bg-black/75 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-white"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/15">
          <div>
            <h3 className="font-display text-xl font-bold uppercase text-white tracking-tight">
              PLAYLIST ENGINE
            </h3>
            <p className="font-mono text-xs text-neutral-300 mt-0.5">
              IMPORT FROM YOUTUBE OR INITIALIZE CUSTOM COLLECTION
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

        {/* Mode Switcher (White Glass) */}
        <div className="grid grid-cols-2 gap-2 mt-5 p-1.5 bg-white/5 rounded-2xl border border-white/15">
          <button
            onClick={() => setActiveMode('youtube')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all ${
              activeMode === 'youtube'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>YOUTUBE PLAYLIST</span>
          </button>
          <button
            onClick={() => setActiveMode('custom')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all ${
              activeMode === 'custom'
                ? 'bg-white text-black font-bold shadow-md'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>NEW PLAYLIST</span>
          </button>
        </div>

        {/* Mode 1: YouTube Importer */}
        {activeMode === 'youtube' && (
          <form onSubmit={handleImportYouTube} className="mt-5 space-y-4">
            <div>
              <label className="block font-mono text-xs text-neutral-300 mb-2 uppercase font-semibold">
                YOUTUBE PLAYLIST URL OR ID
              </label>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PL..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-400"
                autoFocus
              />
              <p className="font-mono text-[11px] text-neutral-300 mt-2">
                Paste any public YouTube playlist URL or ID. Embeddable audio tracks will be parsed immediately.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-xs">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-mono text-xs text-neutral-300 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isLoading || !youtubeInput.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>IMPORTING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>IMPORT PLAYLIST</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Custom Playlist Creator */}
        {activeMode === 'custom' && (
          <form onSubmit={handleCreateCustom} className="mt-5 space-y-4">
            <div>
              <label className="block font-mono text-xs text-neutral-300 mb-2 uppercase font-semibold">
                PLAYLIST TITLE
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Midnight Beats, Work Mode"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-neutral-300 mb-2 uppercase font-semibold">
                DESCRIPTION (OPTIONAL)
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Brief description of this music vibe"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-mono text-xs text-neutral-300 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>CREATE PLAYLIST</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

