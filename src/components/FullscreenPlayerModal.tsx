import React from 'react';
import { PlayerState, Track } from '../types';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Radio,
  ArrowRight
} from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { AudioVisualizer } from './AudioVisualizer';
import { useDynamicTheme } from '../hooks/useDynamicTheme';
import { TiltCard } from './TiltCard';
import { motion } from 'motion/react';

interface FullscreenPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerState: PlayerState;
  isFavorite: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleAutoplay?: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: (track: Track) => void;
  onSetPlaybackRate: (rate: number) => void;
  onPlaySuggestedTrack?: (track: Track) => void;
}

export const FullscreenPlayerModal: React.FC<FullscreenPlayerModalProps> = ({
  isOpen,
  onClose,
  playerState,
  isFavorite,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleAutoplay,
  onCycleRepeat,
  onToggleFavorite,
  onSetPlaybackRate,
  onPlaySuggestedTrack
}) => {
  if (!isOpen || !playerState?.currentTrack) return null;

  const {
    currentTrack = null,
    isPlaying = false,
    currentTime = 0,
    duration = 0,
    volume = 80,
    isMuted = false,
    shuffle = false,
    autoplay = true,
    repeatMode = 'off',
    playbackRate = 1,
    queue = [],
    suggestedTrack = null,
    status = 'unstarted'
  } = playerState || {};

  const dynamicTheme = useDynamicTheme(currentTrack);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const upcomingTrack = queue.length > 0 ? queue[0] : autoplay ? suggestedTrack : null;
  const isAutoSuggested = queue.length === 0 && autoplay && !!suggestedTrack;

  return (
    <motion.div
      id="fullscreen-player-modal"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-[#080808]/98 backdrop-blur-3xl text-white flex flex-col justify-between p-6 sm:p-10 md:p-12 overflow-y-auto relative"
    >
        {/* Dynamic Ambient Background Glow */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: dynamicTheme.hex }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: dynamicTheme.hex }}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: dynamicTheme.hex }}
            />
            <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
              ifu listener // STUDIO KINETIC // {status.toUpperCase()}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            id="btn-close-fullscreen"
            className="p-2.5 rounded-full bg-neutral-900/80 hover:bg-white hover:text-black text-neutral-300 transition-colors border border-neutral-800"
            title="Exit Studio Mode"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Center Layout: Visualizer Canvas + Bold Giant Typography */}
        <div className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full z-10">
          
          {/* Left Col: Giant 3D Interactive Artwork Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <TiltCard
              maxTilt={12}
              scale={1.03}
              glowColor={dynamicTheme.rgba(0.25)}
              className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 group"
            >
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100 opacity-90'
                }`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Bottom Vinyl/Track Info overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-xs text-white">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 truncate max-w-[180px]">
                  {currentTrack.album || 'ifu stream'}
                </span>
                <span style={{ color: dynamicTheme.hex }} className="font-bold">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </TiltCard>
          </div>

          {/* Right Col: Massive Typography & Interactive Equalizer Wave */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-neutral-500 block">
                CURRENT AUDIO STREAM
              </span>
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-none">
                {currentTrack.title}
              </h1>
              <p className="font-mono text-lg sm:text-xl text-neutral-300 font-semibold">
                {currentTrack.artist}
              </p>
            </div>

            {/* Embedded Audio Reactive Visualizer with Dynamic Accent */}
            <div className="h-44 w-full">
              <AudioVisualizer
                isPlaying={isPlaying}
                playbackRate={playbackRate}
                variant="wave"
                className="h-44 rounded-2xl border border-neutral-800/80 shadow-2xl"
              />
            </div>
          </div>

        </div>

        {/* Bottom Controls Bar */}
        <div className="max-w-4xl mx-auto w-full space-y-4 pt-4 border-t border-neutral-900 z-10">
          
          {/* Scrubber Range */}
          <div className="space-y-1.5">
            <div className="relative w-full h-2 bg-neutral-800 rounded-full overflow-hidden cursor-pointer group">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: dynamicTheme.hex
                }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between font-mono text-xs text-neutral-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            
            {/* Favorite & Speed */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggleFavorite(currentTrack)}
                className={`p-3 rounded-full border transition-colors ${
                  isFavorite
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </motion.button>

              <button
                onClick={() => {
                  const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
                  onSetPlaybackRate(nextRate);
                }}
                className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-xs flex items-center space-x-1 hover:text-white"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{playbackRate}x</span>
              </button>
            </div>

            {/* Central Playback buttons */}
            <div className="flex items-center space-x-6">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onToggleShuffle}
                style={{ color: shuffle ? dynamicTheme.hex : undefined }}
                className={`p-2 transition-colors ${
                  shuffle ? 'font-bold' : 'text-neutral-500 hover:text-white'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onPrev}
                className="p-3 text-neutral-300 hover:text-white transition-transform"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onTogglePlay}
                style={{
                  backgroundColor: dynamicTheme.hex,
                  boxShadow: `0 0 24px ${dynamicTheme.rgba(0.5)}`
                }}
                className="w-16 h-16 rounded-full text-black flex items-center justify-center shadow-2xl transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onNext}
                className="p-3 text-neutral-300 hover:text-white transition-transform"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onCycleRepeat}
                style={{ color: repeatMode !== 'off' ? dynamicTheme.hex : undefined }}
                className={`p-2 transition-colors ${
                  repeatMode !== 'off' ? 'font-bold' : 'text-neutral-500 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </motion.button>

              {/* Autoplay Toggle */}
              {onToggleAutoplay && (
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={onToggleAutoplay}
                  style={{ color: autoplay ? dynamicTheme.hex : undefined }}
                  className={`p-2 transition-colors flex items-center space-x-1 ${
                    autoplay ? 'font-bold' : 'text-neutral-500 hover:text-white'
                  }`}
                  title={`Autoplay Similar Tracks: ${autoplay ? 'ON' : 'OFF'}`}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              )}
            </div>

            {/* Volume */}
            <div className="flex items-center space-x-3">
              <button onClick={onToggleMute} className="text-neutral-400 hover:text-white">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <div className="relative w-24 flex items-center">
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${isMuted ? 0 : volume}%`,
                      backgroundColor: dynamicTheme.hex
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Up Next Preview Card in Fullscreen Studio */}
          {upcomingTrack && (
            <div className="pt-2">
              <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-neutral-950 border border-neutral-800">
                    <img
                      src={upcomingTrack.thumbnailUrl}
                      alt={upcomingTrack.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isAutoSuggested && (
                      <div className="absolute top-0 right-0 p-0.5 bg-[#E2FF66] rounded-bl">
                        <Sparkles className="w-2.5 h-2.5 text-black" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                        {isAutoSuggested ? 'Up Next (Autoplay)' : 'Next in Queue'}
                      </span>
                      {isAutoSuggested && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#E2FF66]/10 text-[#E2FF66] border border-[#E2FF66]/20">
                          SIMILAR VIBE
                        </span>
                      )}
                    </div>
                    <h4 className="font-sans font-bold text-xs text-white truncate">
                      {upcomingTrack.title}
                    </h4>
                    <p className="font-mono text-[11px] text-neutral-400 truncate">
                      {upcomingTrack.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      if (isAutoSuggested && onPlaySuggestedTrack) {
                        onPlaySuggestedTrack(upcomingTrack);
                      } else {
                        onNext();
                      }
                    }}
                    style={{
                      backgroundColor: dynamicTheme.rgba(0.15),
                      borderColor: dynamicTheme.rgba(0.4),
                      color: dynamicTheme.hex
                    }}
                    className="px-3 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center space-x-1.5 hover:bg-white hover:text-black transition-colors"
                  >
                    <span>PLAY NOW</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
  );
};
