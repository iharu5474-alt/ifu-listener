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
  Heart,
  Gauge,
  Sparkles,
  ListMusic
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
  onOpenFullscreen: () => void;
  onPlaySuggestedTrack?: (track: Track) => void;
  onToggleQueue?: () => void;
  isQueueOpen?: boolean;
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
  onOpenFullscreen,
  onPlaySuggestedTrack,
  onToggleQueue,
  isQueueOpen = false
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
        <div className="max-w-xl mx-auto flex items-center justify-between font-mono text-xs text-white/80 bg-white/[0.08] backdrop-blur-2xl border border-white/20 py-2.5 px-5 rounded-full shadow-2xl pointer-events-auto">
          <div className="flex items-center space-x-3">
            <span className="w-2 h-2 rounded-full bg-[#E2FF66]/90 animate-pulse" />
            <span className="font-semibold text-white">ifu listener</span>
            <span className="text-white/60">// STANDBY — SEARCH TO STREAM</span>
          </div>
          <span className="hidden sm:inline text-[10px] text-white/60 uppercase tracking-wider">AUDIO ENGINE READY</span>
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
      {/* Compact Floating Dock Container (White Glass) */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          boxShadow: `0 16px 40px -8px ${dynamicTheme.rgba(0.25)}, 0 4px 20px rgba(0, 0, 0, 0.5)`,
          borderColor: isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'
        }}
        className="pointer-events-auto max-w-5xl mx-auto bg-black/75 backdrop-blur-2xl border rounded-2xl sm:rounded-full px-3 py-2 sm:px-5 sm:py-2.5 shadow-2xl transition-colors duration-300 relative overflow-hidden"
      >
        {/* Top ambient color bar / progress indicator on mobile */}
        <div className="absolute top-0 left-0 right-0 h-[3px] sm:h-[2px] bg-white/10 group/topscrub">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: dynamicTheme.hex,
              boxShadow: `0 0 8px ${dynamicTheme.rgba(0.8)}`
            }}
          />
          {/* Subtle seek overlay for mobile quick scrubbing */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="sm:hidden absolute -top-1 left-0 w-full h-4 opacity-0 cursor-pointer z-30"
            title="Scrub Track"
          />
        </div>

        {/* ========================================================================= */}
        {/* MOBILE LAYOUT (< sm screens: 320px - 639px) */}
        {/* Generous song name display with balanced, uncluttered mobile controls */}
        {/* ========================================================================= */}
        <div className="flex sm:hidden items-center justify-between gap-2.5 pt-0.5">
          
          {/* Left: Track Info & Artwork (Takes maximum available width for song name) */}
          <div 
            onClick={() => onOpenFullscreen()}
            className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer select-none group/mobtrack"
            title="Tap to open Studio Player & View Song Details"
          >
            <div
              style={{ boxShadow: `0 0 10px ${dynamicTheme.rgba(0.3)}` }}
              className="relative w-11 h-11 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/25 shadow-md"
            >
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {isPlaying && (
                <div className="absolute bottom-1 right-1 flex items-end space-x-0.5 bg-black/75 px-1 py-0.5 rounded backdrop-blur-xs">
                  <span className="w-0.5 h-2 rounded-full animate-bounce" style={{ backgroundColor: dynamicTheme.hex, animationDuration: '0.6s' }} />
                  <span className="w-0.5 h-3 rounded-full animate-bounce" style={{ backgroundColor: dynamicTheme.hex, animationDuration: '0.8s' }} />
                  <span className="w-0.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: dynamicTheme.hex, animationDuration: '0.5s' }} />
                </div>
              )}
            </div>

            {/* Song Name & Artist info container */}
            <div className="min-w-0 flex-1 pr-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: dynamicTheme.hex }} />
                <h4 className="font-sans font-bold text-xs sm:text-sm text-white truncate drop-shadow-sm group-hover/mobtrack:text-[#E2FF66] transition-colors leading-tight">
                  {currentTrack.title}
                </h4>
              </div>
              <div className="flex items-center space-x-1.5 pl-3 mt-0.5">
                <p className="font-mono text-[10px] sm:text-xs text-neutral-300 truncate font-medium">
                  {currentTrack.artist}
                </p>
                {currentTrack.formattedDuration && (
                  <span className="text-[9px] font-mono text-neutral-400 shrink-0">
                    • {currentTrack.formattedDuration}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Mobile Touch Icons (Prev, Play/Pause, Next, Queue/Details) */}
          <div className="flex items-center space-x-0.5 shrink-0">
            {/* Heart / Favorite */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(currentTrack);
              }}
              className={`min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-full transition-colors cursor-pointer ${
                isFavorite ? 'text-red-400' : 'text-neutral-400 hover:text-white'
              }`}
              title={isFavorite ? 'Remove Favorite' : 'Favorite Song'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Prev */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-full text-neutral-300 active:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </motion.button>

            {/* Main Play / Pause Button with Dynamic Glow */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              style={{
                backgroundColor: dynamicTheme.hex,
                color: '#000000',
                boxShadow: `0 0 14px ${dynamicTheme.rgba(0.6)}`
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer shrink-0 mx-1"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {status === 'buffering' ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </motion.button>

            {/* Next */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-full text-neutral-300 active:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </motion.button>

            {/* Queue / Expand Modal Trigger */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleQueue) {
                  onToggleQueue();
                } else {
                  onOpenFullscreen();
                }
              }}
              style={{
                color: isQueueOpen ? dynamicTheme.hex : undefined,
                borderColor: isQueueOpen ? dynamicTheme.rgba(0.6) : 'rgba(255, 255, 255, 0.2)'
              }}
              className={`min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-full border transition-all cursor-pointer ${
                isQueueOpen ? 'bg-white/20' : 'bg-white/10 text-neutral-200'
              }`}
              title="Queue & More"
            >
              <ListMusic className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP / TABLET LAYOUT (sm:flex screens: >= 640px) */}
        {/* Full 3-column audio workstation layout with detailed scrubbers & controls */}
        {/* ========================================================================= */}
        <div className="hidden sm:flex items-center justify-between gap-4 md:gap-6">
          
          {/* 1. Left: Compact Album Art & Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 max-w-[240px] md:max-w-[280px]">
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullscreen();
              }}
              style={{
                boxShadow: `0 0 12px ${dynamicTheme.rgba(0.3)}`
              }}
              className="relative w-11 h-11 rounded-xl overflow-hidden bg-black/50 shrink-0 cursor-pointer group border border-white/20 p-0 text-left"
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
                  className="font-sans font-bold text-xs sm:text-sm text-white truncate cursor-pointer hover:underline transition-colors drop-shadow-sm"
                >
                  {currentTrack.title}
                </h4>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-[11px] text-neutral-300 truncate">
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
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full transition-colors shrink-0 cursor-pointer ${
                isFavorite ? 'text-red-400' : 'text-neutral-400 hover:text-white'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
          </div>

          {/* 2. Center: Controls & Integrated Compact Scrubber */}
          <div className="flex flex-col items-center flex-1 max-w-md sm:max-w-lg">
            
            {/* Buttons Row */}
            <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
              
              {/* Shuffle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleShuffle}
                id="btn-player-shuffle"
                style={{ color: shuffle ? dynamicTheme.hex : undefined }}
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full transition-colors cursor-pointer ${
                  shuffle ? 'font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </motion.button>

              {/* Prev */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onPrev}
                id="btn-player-prev"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
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
                  boxShadow: `0 0 16px ${dynamicTheme.rgba(0.5)}`
                }}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold transition-all shadow-md active:scale-90 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {status === 'buffering' ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current transition-transform" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5 transition-transform" />
                )}
              </motion.button>

              {/* Next */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.88 }}
                onClick={onNext}
                id="btn-player-next"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </motion.button>

              {/* Repeat */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCycleRepeat}
                id="btn-player-repeat"
                style={{ color: repeatMode !== 'off' ? dynamicTheme.hex : undefined }}
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-full transition-colors cursor-pointer ${
                  repeatMode !== 'off' ? 'font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
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
                  className={`hidden sm:flex min-h-[38px] px-2.5 py-1 rounded-full border transition-all items-center space-x-1 cursor-pointer ${
                    autoplay
                      ? 'bg-white/20 font-semibold'
                      : 'text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10'
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

            {/* Seek Scrubber with time labels */}
            <div className="w-full flex items-center space-x-2">
              <span className="font-mono text-[10px] text-neutral-300 w-8 text-right shrink-0">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 group/slider flex items-center py-1">
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
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

              <span className="font-mono text-[10px] text-neutral-300 w-8 text-left shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Compact Up Next preview line */}
            {upcomingTrack && (
              <div className="hidden sm:flex items-center space-x-1.5 mt-0.5 font-mono text-[10px] text-neutral-300 max-w-full truncate">
                <span className="text-white/60 uppercase shrink-0 flex items-center space-x-1">
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
                  className="truncate text-white hover:underline transition-colors cursor-pointer"
                  title={`Click to play: ${upcomingTrack.title} • ${upcomingTrack.artist}`}
                >
                  {upcomingTrack.title} <span className="text-white/60 font-normal">• {upcomingTrack.artist}</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Right: Speed, Volume, & Fullscreen Modal */}
          <div className="flex items-center justify-end space-x-1.5 sm:space-x-2.5 shrink-0">
            
            {/* Queue / Up Next Indicator Button */}
            {onToggleQueue && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleQueue();
                }}
                id="btn-player-queue"
                style={{
                  color: isQueueOpen ? dynamicTheme.hex : undefined,
                  borderColor: isQueueOpen ? dynamicTheme.rgba(0.6) : 'rgba(255, 255, 255, 0.2)'
                }}
                className={`min-h-[44px] px-3 py-2 rounded-full border transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isQueueOpen ? 'bg-white/20 font-bold' : 'bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white'
                }`}
                title="Now Playing & Up Next Queue"
              >
                <ListMusic className="w-4 h-4" />
                <span className="font-mono text-[11px] font-semibold">
                  {queue.length > 0 ? queue.length : 'QUEUE'}
                </span>
              </motion.button>
            )}

            {/* Playback Rate Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="min-h-[44px] px-2.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] border border-white/20 transition-colors flex items-center space-x-1 cursor-pointer"
                title="Playback Speed"
              >
                <Gauge className="w-3.5 h-3.5 text-neutral-300" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-12 right-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl p-1 shadow-2xl z-50 flex flex-col space-y-0.5 min-w-[75px]">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onSetPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`min-h-[36px] px-3 py-1.5 text-left font-mono text-xs rounded-lg transition-colors cursor-pointer ${
                        playbackRate === rate ? 'bg-white text-black font-bold' : 'text-neutral-200 hover:bg-white/15'
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
                className="text-neutral-300 hover:text-white transition-colors p-1 cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="relative w-16 group/vol flex items-center">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
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

            {/* Fullscreen Visualizer Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullscreen();
              }}
              id="btn-player-expand"
              className="relative z-10 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer active:scale-90 shadow-sm"
              title="Studio Visualizer Mode (Full View)"
              aria-label="Open Fullscreen Studio Visualizer"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

