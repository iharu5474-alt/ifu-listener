import React from 'react';
import { Track } from '../types';
import { TrackRow } from '../components/TrackRow';
import { formatTime } from '../utils/formatters';
import { Heart, Play, Shuffle, Music } from 'lucide-react';

interface FavoritesViewProps {
  favorites: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist
}) => {
  const totalDuration = favorites.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handleShufflePlay = () => {
    if (favorites.length === 0) return;
    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
    onPlayTrack(shuffled[0], shuffled);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-neutral-900">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-to-br from-red-500/20 to-neutral-900 border border-red-500/30 flex items-center justify-center shrink-0 shadow-2xl">
          <Heart className="w-16 h-16 text-red-400 fill-current" />
        </div>

        <div className="flex-1 space-y-3">
          <span className="font-mono text-xs text-neutral-400 tracking-widest uppercase block">
            MY PERSONAL COLLECTION
          </span>

          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
            LIKED TRACKS
          </h1>

          <div className="flex items-center space-x-3 font-mono text-xs text-neutral-400">
            <span>{favorites.length} TRACKS</span>
            <span>•</span>
            <span>{formatTime(totalDuration)} TOTAL LISTENING</span>
          </div>

          {favorites.length > 0 && (
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => onPlayTrack(favorites[0], favorites)}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY ALL</span>
              </button>

              <button
                onClick={handleShufflePlay}
                className="flex items-center space-x-2 px-5 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs border border-neutral-800 transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span>SHUFFLE</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="space-y-4">
        {favorites.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-neutral-900 rounded-2xl p-8">
            <Music className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-white">NO LIKED TRACKS YET</h3>
            <p className="font-sans text-xs text-neutral-400 max-w-sm mx-auto mt-1">
              Click the heart icon on any track row or card across Discover or Search to add it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                isPlaying={isPlaying}
                isCurrent={currentTrack?.id === track.id}
                isFavorite={true}
                onPlay={(t) => onPlayTrack(t, favorites)}
                onToggleFavorite={onToggleFavorite}
                onAddToQueue={onAddToQueue}
                onOpenAddToPlaylist={onOpenAddToPlaylist}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
