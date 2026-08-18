import React from 'react';
import { PlayerState, Track } from '../types';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { Play, Pause, SkipBack, SkipForward, Sparkles, Disc } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface VisualizerViewProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export const VisualizerView: React.FC<VisualizerViewProps> = ({
  playerState,
  onTogglePlay,
  onPrev,
  onNext
}) => {
  const {
    currentTrack = null,
    isPlaying = false,
    currentTime = 0,
    duration = 0,
    playbackRate = 1,
    status = 'unstarted'
  } = playerState || {};

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 font-mono text-xs text-[#E2FF66]">
            <span className="w-2 h-2 rounded-full bg-[#E2FF66] animate-pulse" />
            <span>KINETIC AUDIO WAVEFORM ENGINE</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white">
            AUDIO VISUALIZER
          </h1>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="relative w-full h-[450px] sm:h-[550px] rounded-3xl overflow-hidden border border-neutral-800 bg-[#0A0A0A] shadow-2xl">
        <AudioVisualizer
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          variant="wave"
          className="h-full rounded-none border-none"
        />

        {/* Floating track card overlay if track is active */}
        {currentTrack && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-md bg-black/80 backdrop-blur-xl border border-neutral-800 p-4 rounded-2xl flex items-center justify-between gap-4 z-20 shadow-2xl">
            <div className="flex items-center space-x-3.5 min-w-0">
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h4 className="font-sans font-bold text-sm text-white truncate">
                  {currentTrack.title}
                </h4>
                <p className="font-mono text-xs text-neutral-400 truncate">
                  {currentTrack.artist}
                </p>
                <span className="font-mono text-[10px] text-[#E2FF66]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Quick Play/Next Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={onPrev}
                className="p-2 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-full bg-white text-black hover:bg-[#E2FF66] flex items-center justify-center transition-transform hover:scale-105"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-2 rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
