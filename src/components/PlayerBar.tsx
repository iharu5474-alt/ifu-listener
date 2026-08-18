import React, { useState } from 'react';
import { PlayerState, Track } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Maximize2,
  ListMusic,
  Heart,
  Gauge,
  Sparkles,
  Radio
} from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { useDynamicTheme } from '../hooks/useDynamicTheme';
import { motion } from 'motion/react';

interface PlayerBarProps {
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
  onSetPlaybackRate: (rate: number) => void;
  onToggleFavorite: (track: Track) => void;
  onToggleQueueDrawer: () => void;
  onOpenFullscreen: () => void;
  onPlaySuggestedTrack?: (track: Track) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
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
  onSetPlaybackRate,
  onToggleFavorite,
  onToggleQueueDrawer,
  onOpenFullscreen,
  onPlaySuggestedTrack
}) => {
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

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const playbackRates = [0.75, 1.0, 1.25, 1.5, 2.0];

  const dynamicTheme = useDynamicTheme(currentTrack);
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const upcomingTrack = queue.length > 0 ? queue[0] : autoplay ? suggestedTrack : null;
  const isAutoSuggested = queue.length === 0 && autoplay && !!suggestedTrack;

  if (!currentTrack) {
    return (
      <div className="fixed bottom-5 sm:bottom-7 md:bottom-9 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none">
        <div className="max-w-xl mx-auto flex items-center justify-between font-mono text-xs text-neutral-400 bg-[#0C0C0C]/90 backdrop-blur-xl border border-neutral-800/80 py-2.5 px-5 rounded-full shadow-2xl pointer-events-auto">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-[#E2FF66]/80 animate-pulse" />
            <span className="font-semibold text-neutral-300">ifu listener</span>
            <span className="text-neutral-500">// STANDBY — SEARCH TO STREAM</span>
          </div>
          <span className="hidden sm:inline text-[10px] text-neutral-500 uppercase tracking-wider">AUDIO ENGINE READY</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="player-bottom-bar"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-5 sm:bottom-7 md:bottom-9 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none"
    >
      {/* Compact Floating Dock Container */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          boxShadow: `0 12px 35px -5px ${dynamicTheme.rgba(0.2)}, 0 4px 15px rgba(0, 0, 0, 0.8)`,
          borderColor: isHovered ? dynamicTheme.rgba(0.4) : 'rgba(38, 38, 38, 0.8)'
        }}
        className="pointer-events-auto max-w-5xl mx-auto bg-[#0C0C0C]/95 backdrop-blur-2xl border rounded-2xl sm:rounded-full px-4 py-2.5 shadow-2xl transition-colors duration-300 relative overflow-hidden"
      >
        {/* Top ambient color bar indicator */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-500"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${dynamicTheme.hex} 50%, transparent 100%)`,
            opacity: isPlaying ? 0.8 : 0.2
          }}
        />

        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* 1. Left: Compact Album Art & Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 max-w-[240px] sm:max-w-[280px]">
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullscreen();
              }}
              style={{
                boxShadow: `0 0 12px ${dynamicTheme.rgba(0.25)}`
              }}
              className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-900 shrink-0 cursor-pointer group border border-neutral-800 p-0 text-left"
              title="Expand Studio Visualizer"
            >
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              </div>
            </motion.button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h4
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFullscreen();
                  }}
                  className="font-sans font-bold text-xs sm:text-sm text-white truncate cursor-pointer hover:underline transition-colors"
                >
                  {currentTrack.title}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-[11px] text-neutral-400 truncate">
                  {currentTrack.artist}
                </p>
                {isPlaying && (
                  <div className="flex items-center space-x-0.5 shrink-0">
                    <span
                      className="w-1 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: dynamicTheme.hex, animationDuration: '0.6s' }}
                    />
                    <span
                      className="w-1 h-3 rounded-full animate-bounce"
                      style={{ backgroundColor: dynamicTheme.hex, animationDuration: '0.8s' }}
                    />
                    <span
                      className="w-1 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: dynamicTheme.hex, animationDuration: '0.5s' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggleFavorite(currentTrack)}
              id="btn-player-fav"
              className={`p-1.5 rounded-full transition-colors shrink-0 ${
                isFavorite ? 'text-red-400' : 'text-neutral-500 hover:text-white'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* 2. Center: Controls & Integrated Compact Scrubber */}
          <div className="flex flex-col items-center flex-1 max-w-md sm:max-w-lg">
            
            {/* Buttons Row */}
            <div className="flex items-center space-x-3 sm:space-x-4 mb-1">
              
              {/* Shuffle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleShuffle}
                id="btn-player-shuffle"
                style={{ color: shuffle ? dynamicTheme.hex : undefined }}
                className={`p-1 transition-colors ${
                  shuffle ? 'font-bold' : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </motion.button>

              {/* Prev */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onPrev}
                id="btn-player-prev"
                className="p-1 text-neutral-300 hover:text-white transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </motion.button>

              {/* Play / Pause with Dynamic Glow */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onTogglePlay}
                id="btn-player-play-pause"
                style={{
                  backgroundColor: dynamicTheme.hex,
                  color: '#000000',
                  boxShadow: `0 0 16px ${dynamicTheme.rgba(0.45)}`
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all shadow-md active:scale-90"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {status === 'buffering' ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-current transition-transform" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5 transition-transform" />
                )}
              </motion.button>

              {/* Next */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onNext}
                id="btn-player-next"
                className="p-1 text-neutral-300 hover:text-white transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </motion.button>

              {/* Repeat */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCycleRepeat}
                id="btn-player-repeat"
                style={{ color: repeatMode !== 'off' ? dynamicTheme.hex : undefined }}
                className={`p-1 transition-colors ${
                  repeatMode !== 'off' ? 'font-bold' : 'text-neutral-500 hover:text-neutral-300'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
              </motion.button>

              {/* Autoplay Similar Songs Toggle */}
              {onToggleAutoplay && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleAutoplay}
                  id="btn-player-autoplay"
                  style={{
                    color: autoplay ? dynamicTheme.hex : undefined,
                    borderColor: autoplay ? dynamicTheme.rgba(0.5) : 'transparent'
                  }}
                  className={`p-1 sm:px-1.5 sm:py-0.5 rounded-full border transition-colors flex items-center space-x-1 ${
                    autoplay
                      ? 'bg-white/5 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title={`Autoplay Similar Songs: ${autoplay ? 'ON (Continuous)' : 'OFF'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline font-mono text-[9px] uppercase tracking-wider">
                    {autoplay ? 'AUTO ON' : 'AUTO OFF'}
                  </span>
                </motion.button>
              )}
            </div>

            {/* Seek Scrubber with time labels & Up Next preview banner */}
            <div className="w-full flex items-center space-x-2">
              <span className="font-mono text-[10px] text-neutral-500 w-8 text-right shrink-0">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 group/slider flex items-center py-1">
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: dynamicTheme.hex
                    }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              <span className="font-mono text-[10px] text-neutral-500 w-8 text-left shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Compact Up Next preview line */}
            {upcomingTrack && (
              <div className="hidden sm:flex items-center space-x-1.5 mt-0.5 font-mono text-[10px] text-neutral-400 max-w-full truncate">
                <span className="text-neutral-500 uppercase shrink-0 flex items-center space-x-1">
                  {isAutoSuggested && <Sparkles className="w-2.5 h-2.5 text-[#E2FF66]" />}
                  <span>{isAutoSuggested ? 'Up Next (Auto):' : 'Up Next:'}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAutoSuggested && onPlaySuggestedTrack) {
                      onPlaySuggestedTrack(upcomingTrack);
                    } else {
                      onNext();
                    }
                  }}
                  className="truncate text-neutral-300 hover:text-white hover:underline transition-colors cursor-pointer"
                  title={`Click to play: ${upcomingTrack.title} • ${upcomingTrack.artist}`}
                >
                  {upcomingTrack.title} <span className="text-neutral-500 font-normal">• {upcomingTrack.artist}</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Right: Speed, Volume, Queue & Fullscreen Modal */}
          <div className="flex items-center justify-end space-x-1.5 sm:space-x-2.5 shrink-0">
            
            {/* Playback Rate Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 font-mono text-[11px] border border-neutral-800 transition-colors flex items-center space-x-1"
                title="Playback Speed"
              >
                <Gauge className="w-3 h-3 text-neutral-400" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-2xl z-50 flex flex-col space-y-0.5 min-w-[70px]">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onSetPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2.5 py-1 text-left font-mono text-[11px] rounded-lg transition-colors ${
                        playbackRate === rate ? 'bg-white text-black font-bold' : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume Control */}
            <div className="hidden md:flex items-center space-x-1.5">
              <button
                onClick={onToggleMute}
                id="btn-player-mute"
                className="text-neutral-400 hover:text-white transition-colors p-1"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="relative w-16 group/vol flex items-center">
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
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

            {/* Queue Toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onToggleQueueDrawer}
              id="btn-player-queue"
              className="p-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
              title="Queue"
            >
              <ListMusic className="w-4 h-4" />
            </motion.button>

            {/* Fullscreen Visualizer Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              whileTap={{ scale: 0.85, opacity: 0.7 }}
              onClick={(e) => {
                e.stopPropagation();
                try {
                  console.log('ifu listener: Fullscreen icon clicked');
                  onOpenFullscreen();
                } catch (err) {
                  console.error('ifu listener: Error opening fullscreen studio mode:', err);
                }
              }}
              id="btn-player-expand"
              className="relative z-10 p-2 sm:p-2.5 rounded-full bg-neutral-900/95 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all cursor-pointer active:scale-90 shadow-sm"
              title="Studio Visualizer Mode (Full View)"
              aria-label="Open Fullscreen Studio Visualizer"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </motion.button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
