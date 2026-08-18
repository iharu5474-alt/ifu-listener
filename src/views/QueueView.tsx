import React from 'react';
import { PlayerState, Track } from '../types';
import { TrackRow } from '../components/TrackRow';
import { Trash2, Music, History, Sparkles } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface QueueViewProps {
  playerState: PlayerState;
  isFavorite: (trackId: string) => boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onToggleAutoplay?: () => void;
  suggestedTracks?: Track[];
}

export const QueueView: React.FC<QueueViewProps> = ({
  playerState,
  isFavorite,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist,
  onToggleAutoplay,
  suggestedTracks = []
}) => {
  const {
    currentTrack = null,
    queue = [],
    history = [],
    isPlaying = false,
    autoplay = true,
    suggestedTrack = null
  } = playerState || {};

  // Combine suggested track and suggested pool without duplicates
  const recommendations = React.useMemo(() => {
    const list: Track[] = [];
    if (suggestedTrack) list.push(suggestedTrack);
    suggestedTracks.forEach((t) => {
      if (!list.some((item) => item.id === t.id) && t.id !== currentTrack?.id) {
        list.push(t);
      }
    });
    return list.slice(0, 10);
  }, [suggestedTrack, suggestedTracks, currentTrack?.id]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-neutral-900 gap-4">
        <div className="space-y-2">
          <span className="font-mono text-xs tracking-widest uppercase text-neutral-500 block">
            STREAM PLAYLIST QUEUE
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white">
            AUDIO QUEUE
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Autoplay Toggle in Queue Header */}
          {onToggleAutoplay && (
            <button
              onClick={onToggleAutoplay}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border transition-all ${
                autoplay
                  ? 'bg-[#E2FF66]/10 border-[#E2FF66]/40 text-[#E2FF66]'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={`Autoplay: ${autoplay ? 'ON (Continuous streaming)' : 'OFF'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-mono text-xs font-semibold">
                AUTOPLAY: {autoplay ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 font-mono text-xs border border-neutral-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>CLEAR QUEUE</span>
            </button>
          )}
        </div>
      </div>

      {/* Currently Playing Card */}
      {currentTrack && (
        <section className="space-y-3">
          <span className="font-mono text-xs tracking-widest uppercase text-[#E2FF66]">
            NOW STREAMING
          </span>
          <div className="p-6 rounded-2xl bg-neutral-950 border border-[#E2FF66]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0 w-full sm:w-auto">
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-sans font-bold text-base text-white truncate">
                  {currentTrack.title}
                </h3>
                <p className="font-mono text-xs text-neutral-400 truncate">
                  {currentTrack.artist}
                </p>
                <div className="font-mono text-[11px] text-[#E2FF66] mt-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E2FF66] animate-ping" />
                  <span className="uppercase">{playerState.status}</span>
                </div>
              </div>
            </div>
            <div className="font-mono text-xs text-neutral-400">
              {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
            </div>
          </div>
        </section>
      )}

      {/* Up Next List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs tracking-widest uppercase text-neutral-400">
            UP NEXT ({queue.length} TRACKS)
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-neutral-900 rounded-2xl p-8">
            <Music className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <h4 className="font-sans font-semibold text-sm text-white">Queue is empty</h4>
            {autoplay && recommendations.length > 0 ? (
              <p className="font-sans text-xs text-[#E2FF66] mt-1 font-medium">
                ⚡ Autoplay is ON — upcoming similar tracks are queued below automatically
              </p>
            ) : (
              <p className="font-sans text-xs text-neutral-500 mt-1">
                Add any track to your playback queue from Discover or Search.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {queue.map((track, idx) => (
              <div key={`${track.id}-${idx}`} className="relative group/row">
                <TrackRow
                  track={track}
                  index={idx}
                  isPlaying={isPlaying}
                  isCurrent={false}
                  isFavorite={isFavorite(track.id)}
                  onPlay={onPlayTrack}
                  onToggleFavorite={onToggleFavorite}
                  onAddToQueue={onAddToQueue}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
                <button
                  onClick={() => onRemoveFromQueue(idx)}
                  className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 rounded text-neutral-500 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  title="Remove from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Autoplay Similar Songs Section */}
      {autoplay && recommendations.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-mono text-xs text-[#E2FF66] uppercase tracking-widest font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>AUTOPLAY RECOMMENDATIONS (SIMILAR VIBE)</span>
            </div>
            <span className="font-mono text-[11px] text-neutral-500">
              {queue.length === 0 ? 'Top song plays next automatically' : 'Continuous stream suggestions'}
            </span>
          </div>

          <div className="space-y-2">
            {recommendations.map((track, idx) => (
              <TrackRow
                key={`suggested-view-${track.id}-${idx}`}
                track={track}
                index={idx}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                isFavorite={isFavorite(track.id)}
                onPlay={onPlayTrack}
                onToggleFavorite={onToggleFavorite}
                onAddToQueue={onAddToQueue}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
              />
            ))}
          </div>
        </section>
      )}

      {/* Session History */}
      {history.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-neutral-900">
          <div className="flex items-center space-x-2 font-mono text-xs text-neutral-400 uppercase tracking-widest">
            <History className="w-4 h-4" />
            <span>SESSION HISTORY</span>
          </div>

          <div className="space-y-2">
            {history.map((track, idx) => (
              <TrackRow
                key={`history-${track.id}-${idx}`}
                track={track}
                index={idx}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                isFavorite={isFavorite(track.id)}
                onPlay={onPlayTrack}
                onToggleFavorite={onToggleFavorite}
                onAddToQueue={onAddToQueue}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
