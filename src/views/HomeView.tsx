import React, { useEffect, useRef, useState } from 'react';
import { ApiError, Track } from '../types';
import { fetchLiveSearchSuggestions, searchYouTubeTracks } from '../services/youtubeApi';
import { recordSearch } from '../services/recommendationEngine';
import { TrackRow } from '../components/TrackRow';
import { Search, Loader2, X, Music, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  customApiKey?: string;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentTrack,
  isPlaying,
  isFavorite,
  customApiKey = '',
  onPlayTrack,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string | null>(null);
  const [lastApiError, setLastApiError] = useState<ApiError | null>(null);

  // Live real-time suggestions state
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle live suggestions debounced as user types
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSuggesting(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const liveItems = await fetchLiveSearchSuggestions(trimmed, customApiKey);
        setSuggestions(liveItems);
        setShowSuggestions(liveItems.length > 0);
        setHighlightedIndex(-1);
      } catch (e) {
        console.warn('[ifu listener] Live suggestions error:', e);
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, customApiKey]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    recordSearch(trimmed);
    setShowSuggestions(false);
    setIsLoading(true);
    setActiveSearchQuery(trimmed);
    setLastApiError(null);

    try {
      const searchResult = await searchYouTubeTracks(trimmed, customApiKey);
      setResults(searchResult.tracks || []);
      if (searchResult.apiError && (!searchResult.tracks || searchResult.tracks.length === 0)) {
        setLastApiError(searchResult.apiError);
      } else {
        setLastApiError(null);
      }
    } catch (err: any) {
      console.error('[ifu listener] Home search error:', err);
      setResults([]);
      setLastApiError({
        status: 500,
        message: err?.message || 'Error communicating with search provider',
        reason: 'client_exception'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      const selected = suggestions[highlightedIndex];
      onPlayTrack(selected, suggestions);
      setShowSuggestions(false);
    } else {
      executeSearch(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery(null);
    setResults([]);
    setShowSuggestions(false);
    setLastApiError(null);
  };

  const isIdle = !activeSearchQuery;

  return (
    <div
      id="home-view-container"
      className={`relative w-full transition-all duration-500 ${
        isIdle
          ? 'min-h-[62vh] sm:min-h-[68vh] flex flex-col items-center justify-center'
          : 'space-y-8 pt-4 pb-20'
      }`}
    >
      {/* Centered Minimalist Hero & Search Bar (Clean First Screen) */}
      <div className={`w-full max-w-2xl mx-auto text-center ${isIdle ? 'space-y-7' : 'space-y-4'}`}>
        
        {/* Minimal Brand Greeting (Only on idle screen) */}
        {isIdle && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <h1 className="font-display text-4xl sm:text-6xl font-black uppercase text-white tracking-tight drop-shadow-lg">
              ifu listener
            </h1>
            <p className="font-sans text-xs sm:text-sm text-neutral-200 max-w-md mx-auto leading-relaxed">
              Search any song, artist, album, or paste a YouTube link to stream instantly.
            </p>
          </motion.div>
        )}

        {/* Floating White Glass Search Form */}
        <div ref={searchContainerRef} className="relative w-full">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center shadow-2xl rounded-2xl sm:rounded-full bg-white/[0.14] backdrop-blur-2xl border border-white/30 focus-within:border-white/70 focus-within:bg-white/[0.22] transition-all duration-300 p-1.5 sm:p-2"
          >
            <div className="pl-3.5 pr-2 text-white/75 pointer-events-none">
              {isLoading || isSuggesting ? (
                <Loader2 className="w-5 h-5 text-[#E2FF66] animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-white/80" />
              )}
            </div>

            <input
              id="home-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search music, artist, genre, or paste YouTube link..."
              className="w-full bg-transparent py-2.5 sm:py-3 text-white placeholder-white/60 text-sm sm:text-base focus:outline-none font-sans"
              autoComplete="off"
              spellCheck="false"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer mr-1"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              id="btn-home-search-submit"
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl sm:rounded-full bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white shrink-0"
            >
              <span>{isLoading ? 'SEARCHING...' : 'SEARCH'}</span>
            </button>
          </form>

          {/* Real-time Suggestions Dropdown (White Glass) */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white/[0.14] backdrop-blur-2xl border border-white/25 rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-80 overflow-y-auto text-white"
              >
                <div className="p-2 divide-y divide-white/15">
                  {suggestions.map((item, idx) => (
                    <button
                      key={`sug-${item.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        onPlayTrack(item, suggestions);
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                        highlightedIndex === idx ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                    >
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover bg-black/50 shrink-0 border border-white/15"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-sans font-bold text-xs sm:text-sm text-white truncate">
                          {item.title}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-200 truncate">
                          {item.artist}
                        </div>
                      </div>
                      {item.formattedDuration && (
                        <span className="font-mono text-[10px] text-neutral-300 shrink-0">
                          {item.formattedDuration}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ======================================================== */}
      {/* ACTIVE SEARCH RESULTS (If user performed a search)       */}
      {/* ======================================================== */}
      {activeSearchQuery && (
        <section id="home-search-results-section" className="w-full max-w-4xl mx-auto space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div>
              <span className="font-mono text-xs text-[#E2FF66] uppercase tracking-widest font-bold">
                SEARCH RESULTS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white mt-0.5">
                "{activeSearchQuery}"
              </h2>
              <p className="font-mono text-xs text-neutral-300 mt-0.5">
                {results.length} TRACKS FOUND
              </p>
            </div>
            <button
              onClick={handleClearSearch}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>CLEAR SEARCH / RETURN HOME</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#E2FF66] animate-spin mx-auto mb-3" />
              <p className="font-mono text-xs text-neutral-300 uppercase tracking-wider">
                Searching YouTube archives...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/15 rounded-3xl p-8 bg-white/[0.02]">
              <Music className="w-10 h-10 text-neutral-500 mx-auto mb-2" />
              <p className="font-mono text-sm text-neutral-300">
                No matching tracks found for "{activeSearchQuery}".
              </p>
              <button
                onClick={handleClearSearch}
                className="mt-4 px-5 py-2.5 rounded-full bg-white text-black font-mono text-xs font-bold hover:bg-[#E2FF66] transition-colors cursor-pointer"
              >
                RETURN TO HOMEPAGE
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((track, idx) => (
                <TrackRow
                  key={`${track.id}-${idx}`}
                  track={track}
                  index={idx}
                  isPlaying={isPlaying}
                  isCurrent={currentTrack?.id === track.id}
                  isFavorite={isFavorite(track.id)}
                  onPlay={(t) => onPlayTrack(t, results)}
                  onToggleFavorite={onToggleFavorite}
                  onAddToQueue={onAddToQueue}
                  onOpenAddToPlaylist={onOpenAddToPlaylist}
                />
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
};
