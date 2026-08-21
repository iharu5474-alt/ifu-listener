import React from 'react';
import { PlayerState, Track } from '../types';
import { X, Trash2, Play, Music, History, Sparkles, Plus } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onToggleAutoplay?: () => void;
  onAddToQueue?: (track: Track) => void;
  suggestedTracks?: Track[];
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  playerState,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onToggleAutoplay,
  onAddToQueue,
  suggestedTracks = []
}) => {
  if (!isOpen || !playerState) return null;

  const {
    currentTrack = null,
    queue = [],
    history = [],
    isPlaying = false,
    autoplay = true,
    suggestedTrack = null
  } = playerState;

  // Combine suggested track and suggested pool without duplicates
  const recommendations = React.useMemo(() => {
    const list: Track[] = [];
    if (suggestedTrack) list.push(suggestedTrack);
    suggestedTracks.forEach((t) => {
      if (!list.some((item) => item.id === t.id) && t.id !== currentTrack?.id) {
        list.push(t);
      }
    });
    return list.slice(0, 6);
  }, [suggestedTrack, suggestedTracks, currentTrack?.id]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      <div
        id="queue-drawer-panel"
        className="w-full max-w-md bg-[#0A0A0A] border-l border-neutral-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-neutral-900 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
              PLAYBACK QUEUE
            </h3>
            <p className="font-mono text-xs text-neutral-400 mt-0.5">
              {queue.length} TRACKS REMAINING IN QUEUE
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
                title="Clear Queue"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
              title="Close Queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Autoplay Toggle Bar */}
        {onToggleAutoplay && (
          <div className="px-5 py-3.5 bg-neutral-950/80 border-b border-neutral-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className={`w-4 h-4 ${autoplay ? 'text-[#E2FF66]' : 'text-neutral-500'}`} />
              <div>
                <div className="font-sans font-bold text-xs text-white">
                  Autoplay Similar Tracks
                </div>
                <div className="font-mono text-[10px] text-neutral-400">
                  {autoplay ? 'Auto-plays matching music when queue ends' : 'Playback stops when queue ends'}
                </div>
              </div>
            </div>

            <button
              onClick={onToggleAutoplay}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoplay ? 'bg-[#E2FF66]' : 'bg-neutral-800'
              }`}
              title={`Toggle Autoplay: ${autoplay ? 'ON' : 'OFF'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                  autoplay ? 'translate-x-5' : 'translate-x-0 bg-neutral-400'
                }`}
              />
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Currently Playing Card */}
          {currentTrack && (
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#E2FF66] mb-2 block font-semibold">
                NOW PLAYING
              </span>
              <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-neutral-900/90 border border-[#E2FF66]/30">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={currentTrack.thumbnailUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-end space-x-0.5 h-3">
                        <span className="w-0.5 bg-[#E2FF66] animate-pulse h-3" />
                        <span className="w-0.5 bg-[#E2FF66] animate-bounce h-2" />
                        <span className="w-0.5 bg-[#E2FF66] animate-pulse h-3" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="font-sans font-bold text-sm text-white truncate" title={currentTrack.title}>
                    {currentTrack.title}
                  </h4>
                  <p className="font-mono text-xs text-neutral-300 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>
                <div className="font-mono text-xs text-neutral-400 shrink-0">
                  {formatTime(currentTrack.duration)}
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Queue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                UP NEXT {queue.length > 0 && `(${queue.length})`}
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-neutral-900 rounded-xl px-4">
                <Music className="w-6 h-6 text-neutral-600 mx-auto mb-1.5" />
                <p className="font-mono text-xs text-neutral-400">Queue is currently empty</p>
                {autoplay && recommendations.length > 0 ? (
                  <p className="font-sans text-[11px] text-[#E2FF66] mt-1 font-medium">
                    ⚡ Autoplay is active — will seamlessly stream similar music below
                  </p>
                ) : (
                  <p className="font-sans text-[11px] text-neutral-600 mt-1">
                    Add tracks from Discover or enable Autoplay
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-900 border border-neutral-900 transition-all"
                  >
                    <div
                      onClick={() => onPlayTrack(track)}
                      className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="font-mono text-xs text-neutral-500 w-5 text-center shrink-0 font-medium">
                        {idx + 1}
                      </span>
                      <img
                        src={track.thumbnailUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 pr-2">
                        <h5 className="font-sans font-bold text-xs sm:text-sm text-white truncate group-hover:text-[#E2FF66]" title={track.title}>
                          {track.title}
                        </h5>
                        <p className="font-mono text-[11px] text-neutral-300 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => onRemoveFromQueue(idx)}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-mono text-xs text-neutral-400 pl-1">
                        {formatTime(track.duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Autoplay Similar Songs Suggestions */}
          {autoplay && recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E2FF66]" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[#E2FF66] font-semibold">
                    AUTOPLAY SUGGESTIONS
                  </span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500 uppercase">
                  SIMILAR VIBE
                </span>
              </div>

              <div className="space-y-2">
                {recommendations.map((track, idx) => (
                  <div
                    key={`suggested-${track.id}-${idx}`}
                    className="group flex items-center justify-between p-2 rounded-xl bg-neutral-950/40 hover:bg-neutral-900/80 border border-neutral-900/80 transition-all"
                  >
                    <div
                      onClick={() => onPlayTrack(track)}
                      className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={track.thumbnailUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {idx === 0 && queue.length === 0 && (
                          <div className="absolute top-0 right-0 p-0.5 bg-[#E2FF66] rounded-bl">
                            <Sparkles className="w-2 h-2 text-black" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <h5 className="font-sans font-bold text-xs sm:text-sm text-neutral-200 truncate group-hover:text-[#E2FF66]" title={track.title}>
                            {track.title}
                          </h5>
                          {idx === 0 && queue.length === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#E2FF66]/20 text-[#E2FF66] font-bold shrink-0">
                              NEXT
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-neutral-300 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {onAddToQueue && (
                        <button
                          onClick={() => onAddToQueue(track)}
                          className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onPlayTrack(track)}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-lg text-[#E2FF66] hover:bg-[#E2FF66]/10 transition-colors cursor-pointer"
                        title="Play now"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Playback History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center space-x-1.5 mb-2">
                <History className="w-3.5 h-3.5 text-neutral-500" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400">
                  RECENTLY PLAYED
                </span>
              </div>
              <div className="space-y-1.5">
                {history.slice(0, 5).map((track, idx) => (
                  <div
                    key={`hist-${track.id}-${idx}`}
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900/60 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h5 className="font-sans text-xs text-neutral-300 truncate hover:text-white">
                        {track.title}
                      </h5>
                      <p className="font-mono text-[10px] text-neutral-500 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-neutral-600 hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
