import React from 'react';
import { RankedTrack, Track, UserInterestProfile } from '../types';
import { TrackRow } from '../components/TrackRow';
import {
  Sparkles,
  Play,
  Shuffle,
  RotateCcw,
  ThumbsDown,
  Radio,
  Heart
} from 'lucide-react';

interface RecommendedViewProps {
  recommendations: RankedTrack[];
  userProfile?: UserInterestProfile | null;
  isLoading?: boolean;
  onRefreshRecommendations?: () => void;
  onDislikeTrack?: (trackId: string) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
}

export const RecommendedView: React.FC<RecommendedViewProps> = ({
  recommendations = [],
  userProfile = null,
  isLoading = false,
  onRefreshRecommendations,
  onDislikeTrack,
  currentTrack,
  isPlaying,
  isFavorite,
  onPlayTrack,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist
}) => {
  const handlePlayAll = () => {
    if (recommendations.length > 0) {
      onPlayTrack(recommendations[0], recommendations);
    }
  };

  const handleShuffle = () => {
    if (recommendations.length > 0) {
      const shuffled = [...recommendations].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-300">
      
      {/* Header Banner - White Frosted Glass */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/[0.08] backdrop-blur-2xl border border-white/20 shadow-2xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center space-x-2 font-mono text-xs text-[#E2FF66]">
              <Sparkles className="w-4 h-4 text-[#E2FF66] animate-pulse" />
              <span className="uppercase tracking-widest font-bold">ALGORITHMIC TASTE ENGINE</span>
            </div>
            
            <h1 className="font-display text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              RECOMMENDED FOR YOU
            </h1>

            <p className="font-sans text-xs sm:text-sm text-neutral-200 leading-relaxed">
              {userProfile && userProfile.topArtists && userProfile.topArtists.length > 0
                ? `Dynamic curation calibrated from your listening history, repeat counts, and affinity for ${userProfile.topArtists[0].artist}${
                    userProfile.topGenres && userProfile.topGenres[0] ? ` & ${userProfile.topGenres[0].genre.toUpperCase()}` : ''
                  }.`
                : 'Streaming recommendations tailored to your unique acoustic vibe, favorites, and live playback sessions.'}
            </p>

            {/* Affinity badges */}
            {userProfile && userProfile.topGenres && userProfile.topGenres.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="font-mono text-[10px] text-neutral-300 uppercase mr-1">TOP AFFINITIES:</span>
                {userProfile.topGenres.slice(0, 4).map((g) => (
                  <span
                    key={g.genre}
                    className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 font-mono text-[10px] text-[#E2FF66] uppercase font-semibold"
                  >
                    {g.genre} ({Math.round(g.score * 100)}%)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onRefreshRecommendations && (
              <button
                onClick={onRefreshRecommendations}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                title="Recalculate Recommendations"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#E2FF66]' : ''}`} />
                <span>{isLoading ? 'RECOMPUTING...' : 'REFRESH'}</span>
              </button>
            )}

            {recommendations.length > 0 && (
              <>
                <button
                  onClick={handlePlayAll}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY ALL</span>
                </button>
                <button
                  onClick={handleShuffle}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-colors cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>SHUFFLE</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Track Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-[#E2FF66]" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-300 font-bold">
              CURATED SELECTIONS ({recommendations.length})
            </h2>
          </div>
          <span className="font-mono text-[10px] text-neutral-400">
            AUTO-UPDATED ON PLAYBACK
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-20 text-center rounded-3xl p-8 bg-white/[0.04] backdrop-blur-2xl border border-dashed border-white/20">
            <Sparkles className="w-10 h-10 text-neutral-400 mx-auto mb-2 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-white">BUILDING YOUR RECOMMENDATIONS</h3>
            <p className="font-sans text-xs text-neutral-300 max-w-md mx-auto mt-1">
              Start listening to tracks and liking your favorites. The recommendation algorithm will continuously generate tailor-made playlists.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4.5">
            {recommendations.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const fav = isFavorite(track.id);

              return (
                <div
                  key={`rec-${track.id}-${idx}`}
                  id={`rec-card-${track.id}`}
                  className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between backdrop-blur-2xl ${
                    isCurrent
                      ? 'bg-white/[0.22] border-[#E2FF66]/70 shadow-lg shadow-[#E2FF66]/15 ring-1 ring-[#E2FF66]/40'
                      : 'bg-white/[0.08] hover:bg-white/[0.15] border-white/20 hover:border-white/40 shadow-xl'
                  }`}
                >
                  {/* Medium-sized Artwork container with overlay action */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/50 mb-2.5 border border-white/10 shadow-md">
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Dark overlay & Play action */}
                    <div
                      onClick={() => onPlayTrack(track, recommendations)}
                      className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity cursor-pointer ${
                        isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-white hover:bg-[#E2FF66] text-black flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end space-x-0.5">
                            <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                            <span className="w-1 h-5 bg-black rounded-full animate-bounce" style={{ animationDuration: '0.8s' }} />
                            <span className="w-1 h-2 bg-black rounded-full animate-bounce" style={{ animationDuration: '0.5s' }} />
                          </div>
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Match Score badge in top left if available */}
                    {track.matchScorePercentage && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md font-mono text-[9px] font-bold text-[#E2FF66] border border-white/10">
                        {track.matchScorePercentage}%
                      </div>
                    )}

                    {/* Favorite button in top right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                        fav
                          ? 'bg-red-500/30 text-red-400 border border-red-500/40 opacity-100'
                          : 'bg-black/60 text-white/70 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
                      }`}
                      title={fav ? 'Favorited' : 'Add to Favorites'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
                    </button>

                    {/* Duration badge in bottom right */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md font-mono text-[9px] text-neutral-200">
                      {track.formattedDuration}
                    </div>
                  </div>

                  {/* Info: Title & Artist */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onPlayTrack(track, recommendations)}
                        className={`font-sans font-semibold text-xs sm:text-sm line-clamp-2 cursor-pointer hover:underline leading-snug transition-colors drop-shadow-sm ${
                          isCurrent ? 'text-[#E2FF66]' : 'text-white'
                        }`}
                        title={track.title}
                      >
                        {track.title}
                      </h4>
                      <p className="font-mono text-[10px] sm:text-[11px] text-neutral-300 truncate mt-1">
                        {track.artist}
                      </p>
                    </div>

                    {/* Action footer: Add to Queue & Dislike */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(track);
                        }}
                        className="p-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors font-mono text-[10px] flex items-center space-x-1 cursor-pointer"
                        title="Add to queue"
                      >
                        <span>+ Queue</span>
                      </button>

                      {onDislikeTrack && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDislikeTrack(track.id);
                          }}
                          className="p-1 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Don't recommend this song again"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
