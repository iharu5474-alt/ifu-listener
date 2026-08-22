import React from 'react';
import { Track } from '../types';
import { X, History, Play, Shuffle, Trash2, Plus, ListPlus, Heart } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface RecentlyPlayedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onClearHistory?: () => void;
  onToggleFavorite?: (track: Track) => void;
  isFavorite?: (trackId: string) => boolean;
  onAddToQueue?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
}

export const RecentlyPlayedDrawer: React.FC<RecentlyPlayedDrawerProps> = ({
  isOpen,
  onClose,
  history = [],
  currentTrack,
  isPlaying,
  onPlayTrack,
  onClearHistory,
  onToggleFavorite,
  isFavorite,
  onAddToQueue,
  onOpenAddToPlaylist
}) => {
  if (!isOpen) return null;

  const handlePlayAll = () => {
    if (history.length > 0) {
      onPlayTrack(history[0], history);
    }
  };

  const handleShuffle = () => {
    if (history.length > 0) {
      const shuffled = [...history].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-md flex justify-end">
      <div
        id="recently-played-drawer-panel"
        className="w-full max-w-md bg-white/[0.14] backdrop-blur-3xl border-l border-white/25 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-white"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <History className="w-5 h-5 text-[#E2FF66]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
                RECENTLY PLAYED
              </h3>
              <p className="font-mono text-xs text-neutral-300 mt-0.5">
                {history.length} TRACKS LOGGED IN SESSION
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 0 && onClearHistory && (
              <button
                onClick={onClearHistory}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-neutral-300 hover:text-red-400 hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls if History Has Tracks */}
        {history.length > 0 && (
          <div className="px-5 py-3.5 bg-white/10 border-b border-white/15 flex items-center justify-between gap-2">
            <button
              onClick={handlePlayAll}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY ALL HISTORY</span>
            </button>
            <button
              onClick={handleShuffle}
              className="flex items-center justify-center space-x-1.5 py-2 px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>SHUFFLE</span>
            </button>
          </div>
        )}

        {/* Scrollable Track List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <History className="w-10 h-10 text-neutral-400 mb-3 opacity-60" />
              <div className="font-display font-bold text-base text-white">
                NO RECENT HISTORY
              </div>
              <p className="font-sans text-xs text-neutral-300 mt-1 max-w-xs">
                Tracks you stream will be automatically logged here for fast replay and continuous listening.
              </p>
            </div>
          ) : (
            history.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isFav = isFavorite ? isFavorite(track.id) : false;

              return (
                <div
                  key={`history-item-${track.id}-${idx}`}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-white/20 border-[#E2FF66]/50 shadow-md'
                      : 'bg-white/[0.08] hover:bg-white/[0.16] border-white/15'
                  }`}
                >
                  <div
                    onClick={() => onPlayTrack(track, history)}
                    className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-white/20">
                      <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#E2FF66] animate-pulse" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pr-1">
                      <h5 className="font-sans font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#E2FF66] transition-colors">
                        {track.title}
                      </h5>
                      <p className="font-mono text-[11px] text-neutral-200 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    {onToggleFavorite && (
                      <button
                        onClick={() => onToggleFavorite(track)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${
                          isFav ? 'text-red-400' : 'text-neutral-400 hover:text-white'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    {onAddToQueue && (
                      <button
                        onClick={() => onAddToQueue(track)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Add to queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onOpenAddToPlaylist && (
                      <button
                        onClick={() => onOpenAddToPlaylist(track)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Add to playlist"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="font-mono text-[10px] text-neutral-300 pl-1">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      onClick={() => onPlayTrack(track, history)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded-full bg-white text-black hover:bg-[#E2FF66] opacity-90 group-hover:opacity-100 transition-transform active:scale-90 cursor-pointer shadow-sm"
                      title="Play"
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
