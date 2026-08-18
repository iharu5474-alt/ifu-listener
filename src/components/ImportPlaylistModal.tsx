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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        id="import-playlist-modal"
        className="relative w-full max-w-lg bg-[#0A0A0A] border border-neutral-800 rounded-2xl p-6 shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div>
            <h3 className="font-display text-xl font-bold uppercase text-white">
              PLAYLIST ENGINE
            </h3>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              IMPORT FROM YOUTUBE OR INITIALIZE CUSTOM COLLECTION
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-neutral-950 rounded-xl border border-neutral-900">
          <button
            onClick={() => setActiveMode('youtube')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg font-mono text-xs font-semibold transition-colors ${
              activeMode === 'youtube'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>YOUTUBE PLAYLIST</span>
          </button>
          <button
            onClick={() => setActiveMode('custom')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg font-mono text-xs font-semibold transition-colors ${
              activeMode === 'custom'
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white'
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
              <label className="block font-mono text-xs text-neutral-400 mb-2 uppercase">
                YOUTUBE PLAYLIST URL OR ID
              </label>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PL..."
                className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-600"
                autoFocus
              />
              <p className="font-mono text-[11px] text-neutral-500 mt-2">
                Paste any public YouTube playlist URL or ID. Embeddable audio tracks will be parsed immediately.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 font-mono text-xs">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-mono text-xs text-neutral-400 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isLoading || !youtubeInput.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all disabled:opacity-50"
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
              <label className="block font-mono text-xs text-neutral-400 mb-2 uppercase">
                PLAYLIST TITLE
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Midnight Beats, Work Mode"
                className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-600"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-neutral-400 mb-2 uppercase">
                DESCRIPTION (OPTIONAL)
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Brief description of this music vibe"
                className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white font-sans text-sm focus:outline-none focus:border-white transition-colors placeholder:text-neutral-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl font-mono text-xs text-neutral-400 hover:text-white transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all disabled:opacity-50"
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
