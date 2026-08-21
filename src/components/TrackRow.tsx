import React from 'react';
import { Track } from '../types';
import { Play, Pause, Heart, Plus, ListPlus } from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { motion } from 'motion/react';

interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  isCurrent: boolean;
  isFavorite: boolean;
  onPlay: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isPlaying,
  isCurrent,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist
}) => {
  return (
    <motion.div
      id={`track-row-${track.id}`}
      whileHover={{ scale: 1.008, x: 2 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 border ${
        isCurrent
          ? 'bg-white/15 border-[#E2FF66]/60 shadow-md'
          : 'bg-black/30 hover:bg-black/50 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Left: Index / Play status & Thumbnail & Info */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1 pr-2 sm:pr-4">
        
        {/* Index or Live Equalizer Animation */}
        <div className="w-5 sm:w-6 flex items-center justify-center shrink-0">
          {isCurrent && isPlaying ? (
            <div className="flex items-end space-x-0.5 h-3.5">
              <span className="w-1 bg-[#E2FF66] animate-pulse h-3.5 rounded-full" />
              <span className="w-1 bg-[#E2FF66] animate-bounce h-2 rounded-full" />
              <span className="w-1 bg-[#E2FF66] animate-pulse h-2.5 rounded-full" />
            </div>
          ) : (
            <span
              className={`font-mono text-[11px] sm:text-xs ${
                isCurrent ? 'text-[#E2FF66] font-bold' : 'text-neutral-500 group-hover:text-neutral-300'
              }`}
            >
              {(index + 1).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Thumbnail with overlay play trigger */}
        <div
          onClick={() => onPlay(track)}
          className="relative w-11 h-11 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-neutral-900 shrink-0 cursor-pointer group/thumb border border-neutral-800 shadow-sm"
        >
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover/thumb:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-current" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
            )}
          </div>
        </div>

        {/* Track Title & Artist - Expanded display space for mobile */}
        <div className="min-w-0 flex-1 pr-1">
          <h4
            onClick={() => onPlay(track)}
            className={`font-sans font-bold text-xs sm:text-base leading-snug line-clamp-2 sm:truncate cursor-pointer hover:underline transition-colors ${
              isCurrent ? 'text-[#E2FF66]' : 'text-white group-hover:text-[#E2FF66]'
            }`}
            title={track.title}
          >
            {track.title}
          </h4>
          <div className="flex items-center space-x-1.5 sm:space-x-2 mt-0.5 sm:mt-1">
            <p className="font-mono text-[11px] sm:text-xs text-neutral-300 sm:text-neutral-400 truncate max-w-[130px] sm:max-w-md font-medium">
              {track.artist}
            </p>
            {track.album && (
              <>
                <span className="text-neutral-600 text-[10px] sm:text-xs hidden sm:inline">•</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-neutral-400 truncate hidden sm:inline">
                  {track.album}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions (Like, Add to playlist, Queue, Duration) */}
      <div className="flex items-center space-x-0.5 sm:space-x-1.5 shrink-0">
        {/* Favorite Heart Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggleFavorite(track)}
          id={`btn-fav-${track.id}`}
          className={`min-w-[34px] min-h-[34px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
            isFavorite
              ? 'text-red-400 hover:text-red-300'
              : 'text-neutral-400 hover:text-white'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Add to Playlist button (hidden on mobile to preserve full song title width, accessible in sm+) */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onOpenAddToPlaylist(track)}
          id={`btn-add-pl-${track.id}`}
          className="hidden sm:flex min-w-[40px] min-h-[40px] items-center justify-center p-2 rounded-full text-neutral-400 hover:text-white transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
          title="Add to custom playlist"
        >
          <Plus className="w-4 h-4" />
        </motion.button>

        {/* Add to Queue button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onAddToQueue(track)}
          id={`btn-add-queue-${track.id}`}
          className="min-w-[34px] min-h-[34px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-white transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
          title="Add to queue"
        >
          <ListPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </motion.button>

        {/* Duration */}
        <div className="font-mono text-[10px] sm:text-xs text-neutral-400 w-8 sm:w-11 text-right pl-0.5 sm:pl-1">
          {track.formattedDuration || formatTime(track.duration)}
        </div>
      </div>
    </motion.div>
  );
};
