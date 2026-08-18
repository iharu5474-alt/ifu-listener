import React from 'react';
import { Track } from '../types';
import { Play, Pause, Heart, ListPlus } from 'lucide-react';
import { formatTime } from '../utils/formatters';
import { TiltCard } from './TiltCard';
import { motion } from 'motion/react';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  isCurrent: boolean;
  isFavorite: boolean;
  onPlay: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  isCurrent,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onAddToQueue
}) => {
  return (
    <TiltCard
      id={`track-card-${track.id}`}
      maxTilt={9}
      scale={1.03}
      glowColor="rgba(226, 255, 102, 0.15)"
      className={`group relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
        isCurrent
          ? 'bg-neutral-900/90 border-[#E2FF66]/60 shadow-lg shadow-[#E2FF66]/10'
          : 'bg-neutral-950/60 hover:bg-neutral-900/80 border-neutral-900 hover:border-neutral-800'
      }`}
    >
      {/* Thumbnail with overlay action */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 mb-3.5">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Dark overlay & Play action */}
        <div
          onClick={() => onPlay(track)}
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity cursor-pointer ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <motion.div
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </motion.div>
        </div>

        {/* Favorite badge in top right */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(track);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 opacity-100'
              : 'bg-black/60 text-white/70 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </motion.button>

        {/* Duration badge in bottom right */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md font-mono text-[10px] text-white">
          {track.formattedDuration || formatTime(track.duration)}
        </div>
      </div>

      {/* Info & Queue Trigger */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <h4
            onClick={() => onPlay(track)}
            className={`font-sans font-bold text-sm truncate cursor-pointer hover:underline ${
              isCurrent ? 'text-[#E2FF66]' : 'text-white'
            }`}
          >
            {track.title}
          </h4>
          <p className="font-mono text-xs text-neutral-400 truncate mt-0.5">
            {track.artist}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onAddToQueue(track)}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100"
          title="Add to queue"
        >
          <ListPlus className="w-4 h-4" />
        </motion.button>
      </div>
    </TiltCard>
  );
};
