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
  ArrowRight
} from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { AudioVisualizer } from './AudioVisualizer';
import { useDynamicTheme } from '../hooks/useDynamicTheme';
import { TiltCard } from './TiltCard';
import { motion, AnimatePresence } from 'motion/react';

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
    <div
      id="fullscreen-player-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-2xl overflow-y-auto"
      onClick={onClose}
    >
      {/* Large Responsive Window (White Glass) */}
      <motion.div
        id="fullscreen-player-modal"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col justify-between p-5 sm:p-8 md:p-10 rounded-3xl bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-2xl text-white overflow-y-auto my-auto"
      >
        {/* Dynamic Ambient Background Glow */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-25 transition-all duration-700"
          style={{ backgroundColor: dynamicTheme.hex }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-25 transition-all duration-700"
          style={{ backgroundColor: dynamicTheme.hex }}
        />

        {/* Top Header with High-Contrast Clear Close Button */}
        <div className="flex items-center justify-between z-10 pb-4 border-b border-white/15">
          <div className="flex items-center space-x-3">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: dynamicTheme.hex }}
            />
            <span className="font-mono text-xs tracking-[0.25em] text-neutral-200 uppercase font-semibold">
              ifu listener // STUDIO VISUALIZER // {status.toUpperCase()}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            id="btn-close-fullscreen"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full bg-white/10 hover:bg-white hover:text-black text-white transition-all border border-white/20 shadow-lg cursor-pointer"
            title="Close Window (X)"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Center Layout: Visualizer Canvas + Bold Giant Typography */}
        <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center w-full z-10">
          
          {/* Left Col: Giant 3D Interactive Artwork Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <TiltCard
              maxTilt={12}
              scale={1.03}
              glowColor={dynamicTheme.rgba(0.35)}
              className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-88 md:h-88 rounded-3xl overflow-hidden shadow-2xl border border-white/20 group"
            >
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100 opacity-95'
                }`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Bottom Vinyl/Track Info overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-xs text-white">
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 truncate max-w-[180px]">
                  {currentTrack.album || 'ifu stream'}
                </span>
                <span style={{ color: dynamicTheme.hex }} className="font-bold">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </TiltCard>
          </div>

          {/* Right Col: Massive Typography & Interactive Equalizer Wave */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            <div className="space-y-2">
              <span className="font-mono text-xs tracking-[0.3em] uppercase text-neutral-300 block font-semibold">
                NOW PLAYING
              </span>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                {currentTrack.title}
              </h1>
              <p className="font-mono text-base sm:text-xl text-neutral-200 font-semibold">
                {currentTrack.artist}
              </p>
            </div>

            {/* Embedded Audio Reactive Visualizer with Dynamic Accent */}
            <div className="h-40 sm:h-44 w-full">
              <AudioVisualizer
                isPlaying={isPlaying}
                playbackRate={playbackRate}
                variant="wave"
                className="h-40 sm:h-44 rounded-2xl border border-white/20 shadow-2xl bg-white/[0.04]"
              />
            </div>
          </div>

        </div>

        {/* Bottom Controls Bar */}
        <div className="w-full space-y-4 pt-4 border-t border-white/15 z-10">
          
          {/* Scrubber Range */}
          <div className="space-y-1.5">
            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer group">
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
            <div className="flex justify-between font-mono text-xs text-neutral-300">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls Row: Mobile Optimized & Desktop Aligned */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            
            {/* Left Aux Controls: Favorite & Speed */}
            <div className="flex items-center justify-between w-full sm:w-auto space-x-3 order-2 sm:order-1">
              <div className="flex items-center space-x-2.5">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleFavorite(currentTrack)}
                  className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full border transition-colors cursor-pointer ${
                    isFavorite
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-white/10 border-white/20 text-neutral-300 hover:text-white'
                  }`}
                  title={isFavorite ? 'Remove Favorite' : 'Favorite Track'}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>

                <button
                  onClick={() => {
                    const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
                    onSetPlaybackRate(nextRate);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-neutral-200 font-mono text-xs flex items-center space-x-1.5 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  title="Cycle Playback Speed"
                >
                  <Gauge className="w-4 h-4 text-neutral-300" />
                  <span className="font-bold">{playbackRate}x</span>
                </button>
              </div>

              {/* Mobile Autoplay & Volume quick control on the right side of aux row */}
              <div className="flex sm:hidden items-center space-x-2">
                {onToggleAutoplay && (
                  <button
                    onClick={onToggleAutoplay}
                    style={{ color: autoplay ? dynamicTheme.hex : undefined }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center space-x-1 font-mono text-xs cursor-pointer ${
                      autoplay ? 'bg-white/20 font-bold border-white/30' : 'bg-white/10 text-neutral-400 border-white/15'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{autoplay ? 'AUTO' : 'OFF'}</span>
                  </button>
                )}
                <button
                  onClick={onToggleMute}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-neutral-300 active:text-white cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Central Playback buttons: Centered with generous touch targets */}
            <div className="flex items-center justify-center space-x-3 sm:space-x-5 order-1 sm:order-2 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onToggleShuffle}
                style={{ color: shuffle ? dynamicTheme.hex : undefined }}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full transition-colors cursor-pointer ${
                  shuffle ? 'font-bold bg-white/10' : 'text-neutral-300 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onPrev}
                className="min-w-[48px] min-h-[48px] flex items-center justify-center p-2.5 rounded-full text-neutral-200 hover:text-white transition-all active:scale-90 cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-6 h-6 fill-current" />
              </motion.button>

              {/* Main Glowing Play/Pause */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onTogglePlay}
                style={{
                  backgroundColor: dynamicTheme.hex,
                  boxShadow: `0 0 28px ${dynamicTheme.rgba(0.55)}`
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] min-h-[56px] rounded-full text-black flex items-center justify-center shadow-2xl transition-all font-bold active:scale-95 cursor-pointer mx-1"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onNext}
                className="min-w-[48px] min-h-[48px] flex items-center justify-center p-2.5 rounded-full text-neutral-200 hover:text-white transition-all active:scale-90 cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-6 h-6 fill-current" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onCycleRepeat}
                style={{ color: repeatMode !== 'off' ? dynamicTheme.hex : undefined }}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full transition-colors cursor-pointer ${
                  repeatMode !== 'off' ? 'font-bold bg-white/10' : 'text-neutral-300 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
              </motion.button>
            </div>

            {/* Desktop Right Aux: Volume Slider & Desktop Autoplay */}
            <div className="hidden sm:flex items-center space-x-3 order-3">
              {onToggleAutoplay && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleAutoplay}
                  style={{ color: autoplay ? dynamicTheme.hex : undefined }}
                  className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center space-x-1.5 font-mono text-xs transition-all cursor-pointer ${
                    autoplay ? 'bg-white/20 font-bold border-white/30' : 'bg-white/10 text-neutral-300 border-white/15 hover:bg-white/15'
                  }`}
                  title={`Autoplay Similar Tracks: ${autoplay ? 'ON' : 'OFF'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{autoplay ? 'AUTOPLAY' : 'AUTOPLAY OFF'}</span>
                </motion.button>
              )}

              <div className="flex items-center space-x-2.5 bg-white/10 px-3 py-2 rounded-xl border border-white/15">
                <button 
                  onClick={onToggleMute} 
                  className="text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="relative w-20 flex items-center">
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
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
                    title={`Volume: ${isMuted ? 0 : volume}%`}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Up Next Preview Card in Fullscreen Studio */}
          {upcomingTrack && (
            <div className="pt-2">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/20">
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
                      <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-300 font-semibold">
                        {isAutoSuggested ? 'Up Next (Autoplay)' : 'Next Track'}
                      </span>
                      {isAutoSuggested && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#E2FF66]/20 text-[#E2FF66] border border-[#E2FF66]/30 font-bold">
                          SIMILAR VIBE
                        </span>
                      )}
                    </div>
                    <h4 className="font-sans font-bold text-xs text-white truncate">
                      {upcomingTrack.title}
                    </h4>
                    <p className="font-mono text-[11px] text-neutral-300 truncate">
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
                      backgroundColor: dynamicTheme.rgba(0.2),
                      borderColor: dynamicTheme.rgba(0.4),
                      color: dynamicTheme.hex
                    }}
                    className="px-3 py-1.5 rounded-xl border font-mono text-xs font-semibold flex items-center space-x-1.5 hover:bg-white hover:text-black transition-colors shadow-sm"
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
    </div>
  );
};

