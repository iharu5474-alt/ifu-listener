import React, { useEffect, useRef, useState } from 'react';
import { ApiError, Track } from '../types';
import { checkYouTubeApiStatus, fetchLiveSearchSuggestions, searchYouTubeTracks } from '../services/youtubeApi';
import { TrackRow } from '../components/TrackRow';
import { TiltCard } from '../components/TiltCard';
import {
  Search,
  Loader2,
  Play,
  Sparkles,
  X,
  Music,
  AlertTriangle,
  ExternalLink,
  Key,
  CheckCircle2,
  SlidersHorizontal,
  Save,
  Clock,
  ArrowRight,
  ListPlus,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';

interface SearchViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isFavorite: (trackId: string) => boolean;
  customApiKey?: string;
  onSaveCustomApiKey?: (key: string) => void;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
}

const QUICK_TAGS = [
  'Lofi Hip Hop Study Beats',
  'Synthwave 80s Retro',
  'Chopin Nocturne Piano',
  'Cyberpunk 2077 Night Club',
  'Deep Ambient Drone Sleep',
  'Chillhop Essential Beats',
  'Electronic Bass Chill'
];

export const SearchView: React.FC<SearchViewProps> = ({
  currentTrack,
  isPlaying,
  isFavorite,
  customApiKey = '',
  onSaveCustomApiKey,
  onPlayTrack,
  onToggleFavorite,
  onAddToQueue,
  onOpenAddToPlaylist
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastApiError, setLastApiError] = useState<ApiError | null>(null);
  const [resultSource, setResultSource] = useState<string | undefined>(undefined);

  // Live real-time suggestions state
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Settings & Diagnostic Drawer state
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [inputCustomKey, setInputCustomKey] = useState(customApiKey);
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [apiStatusInfo, setApiStatusInfo] = useState<{
    configured: boolean;
    enabled: boolean;
    source?: string;
    message: string;
    error?: ApiError;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Check API status
  const runApiStatusCheck = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await checkYouTubeApiStatus(customApiKey);
      setApiStatusInfo(status);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    runApiStatusCheck();
  }, [customApiKey]);

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
        console.warn('Suggestion fetch error', e);
      } finally {
        setIsSuggesting(false);
      }
    }, 280);

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

    setShowSuggestions(false);
    setIsLoading(true);
    setHasSearched(true);
    setLastApiError(null);

    try {
      const searchResult = await searchYouTubeTracks(trimmed, customApiKey);
      console.log('[ifu listener] Search execution finished. Result:', searchResult);

      setResults(searchResult.tracks || []);
      setResultSource(searchResult.source);
      if (searchResult.apiError) {
        setLastApiError(searchResult.apiError);
      }
    } catch (err: any) {
      console.error('[ifu listener] Search unhandled exception:', err);
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

  const handleSelectSuggestion = (track: Track) => {
    setShowSuggestions(false);
    onPlayTrack(track, suggestions);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveCustomApiKey) {
      onSaveCustomApiKey(inputCustomKey);
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 3000);
      runApiStatusCheck();
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      
      {/* Search Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 font-mono text-xs tracking-widest uppercase text-neutral-500">
            <span>ifu listener // GLOBAL AUDIO SEARCH</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            SEARCH YOUTUBE
          </h1>
          <p className="font-sans text-neutral-400 text-sm max-w-xl leading-relaxed">
            Query any song, artist, album, or paste a direct YouTube video URL/ID to stream with real-time matching.
          </p>
        </div>

        {/* API Diagnostic Toggle */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowConfigDrawer(!showConfigDrawer)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-xs border transition-colors ${
            apiStatusInfo?.enabled
              ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
              : 'bg-amber-950/30 border-amber-800/60 text-amber-300 hover:bg-amber-900/40'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>API DIAGNOSTICS</span>
          {apiStatusInfo && !apiStatusInfo.enabled && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </motion.button>
      </div>

      {/* API Key & Cloud Diagnostic Panel */}
      {showConfigDrawer && (
        <motion.div
          key="config-drawer-panel"
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-[#E2FF66]" />
                  <h3 className="font-display font-bold text-sm uppercase text-white">
                    YouTube Data API v3 Configuration & Diagnostics
                  </h3>
                </div>
                <button
                  onClick={() => setShowConfigDrawer(false)}
                  className="text-neutral-500 hover:text-white text-xs font-mono"
                >
                  CLOSE
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status overview */}
                <div className="space-y-3">
                  <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider block">
                    API CONNECTION STATUS
                  </span>

                  {isCheckingStatus ? (
                    <div className="flex items-center space-x-2 font-mono text-xs text-neutral-400">
                      <Loader2 className="w-4 h-4 animate-spin text-[#E2FF66]" />
                      <span>Verifying YouTube API v3 connection...</span>
                    </div>
                  ) : apiStatusInfo?.enabled ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
                      <div className="flex items-center space-x-2 font-mono text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>YouTube Data API v3 Active & Operational</span>
                      </div>
                      <p className="font-mono text-[11px] text-emerald-400/80">
                        Source: {apiStatusInfo.source === 'custom' ? 'User-provided Custom Key' : 'Server Environment Key'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 space-y-2">
                      <div className="flex items-center space-x-2 font-mono text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>YouTube Data API v3 Status: {apiStatusInfo?.error?.status ? `HTTP ${apiStatusInfo.error.status}` : 'Not Enabled'}</span>
                      </div>
                      <p className="font-mono text-[11px] text-amber-200/90 leading-relaxed">
                        {apiStatusInfo?.error?.message ||
                          'API key is unconfigured or the YouTube Data API v3 is not enabled on your Google Cloud Project.'}
                      </p>
                      {apiStatusInfo?.error?.reason && (
                        <div className="font-mono text-[10px] bg-black/40 px-2 py-1 rounded text-amber-300">
                          Reason: <span className="font-bold">{apiStatusInfo.error.reason}</span>
                        </div>
                      )}
                      <a
                        href="https://console.developers.google.com/apis/api/youtube.googleapis.com/overview"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 font-mono text-xs text-white underline hover:text-[#E2FF66] pt-1"
                      >
                        <span>Enable YouTube Data API v3 on Google Cloud</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Custom key input */}
                <form onSubmit={handleSaveKey} className="space-y-3">
                  <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider block">
                    CUSTOM YOUTUBE API KEY (OPTIONAL)
                  </span>
                  <p className="font-mono text-[11px] text-neutral-500">
                    You can supply your own YouTube Data API v3 key here. It is saved locally in your browser.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      value={inputCustomKey}
                      onChange={(e) => setInputCustomKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-white"
                    />
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="submit"
                      className="px-4 py-2.5 bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>SAVE</span>
                    </motion.button>
                  </div>
                  {keySavedToast && (
                    <span className="font-mono text-xs text-emerald-400 block">
                      ✓ Custom API key saved successfully.
                    </span>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        )}

      {/* Raw Error Banner if an API call returned an error */}
      {lastApiError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-amber-300">
                  YouTube Data API v3 Diagnostic Code: {lastApiError.status || 403} {lastApiError.statusText || ''}
                </h4>
                <p className="font-mono text-xs text-amber-200 mt-0.5">
                  {lastApiError.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastApiError(null)}
              className="text-amber-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 border-t border-amber-900/60 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <div className="text-amber-300/80">
              {resultSource === 'public_search_engine' ? (
                <span>✓ Seamlessly resolved results via Public Audio Index so you can still listen!</span>
              ) : (
                <span>Check that YouTube Data API v3 is enabled on your Google Cloud project.</span>
              )}
            </div>
            <a
              href={lastApiError.extendedHelp || 'https://console.developers.google.com/apis/api/youtube.googleapis.com/overview'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-white underline hover:text-[#E2FF66]"
            >
              <span>Google Cloud Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      )}

      {/* Main Search Bar Input with Live Suggestions Dropdown */}
      <div ref={searchContainerRef} className="relative w-full max-w-3xl z-30">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Search className="absolute left-5 w-5 h-5 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            id="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tracks, artists, genres or paste YouTube URL / ID..."
            className="w-full pl-14 pr-32 py-4 bg-neutral-950 border border-neutral-800 focus:border-[#E2FF66] rounded-2xl text-white font-sans text-base focus:outline-none transition-all placeholder:text-neutral-600 shadow-2xl focus:ring-1 focus:ring-[#E2FF66]/30"
            autoFocus
            autoComplete="off"
          />

          <div className="absolute right-3 flex items-center space-x-2">
            {isSuggesting && (
              <Loader2 className="w-4 h-4 text-neutral-400 animate-spin mr-1" />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="p-1 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#E2FF66] text-black font-mono text-xs font-bold transition-all disabled:opacity-40 shadow-md"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEARCH'}
            </motion.button>
          </div>
        </form>

        {/* Live Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            key="live-search-suggestions-dropdown"
            id="live-search-suggestions-menu"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#0E0E0E]/98 backdrop-blur-2xl border border-neutral-800 rounded-2xl p-2 shadow-2xl overflow-hidden z-50 divide-y divide-neutral-900/60"
          >
              <div className="px-3 py-2 flex items-center justify-between font-mono text-[10px] uppercase text-neutral-500 tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-[#E2FF66]" />
                  <span>LIVE MATCHES // CLICK TO PLAY DIRECTLY</span>
                </span>
                <span>ENTER TO SEARCH ALL</span>
              </div>

              <div className="py-1 space-y-1 max-h-[380px] overflow-y-auto">
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <div
                      key={`sug-${item.id}-${idx}`}
                      onClick={() => handleSelectSuggestion(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-neutral-800/90 border border-neutral-700/80 shadow-md'
                          : 'hover:bg-neutral-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-neutral-900 shrink-0">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-sans font-semibold text-xs sm:text-sm text-white group-hover:text-[#E2FF66] truncate transition-colors">
                            {item.title}
                          </h4>
                          <p className="font-mono text-[11px] text-neutral-400 truncate">
                            {item.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-mono text-[10px] text-neutral-500 hidden sm:inline">
                          {item.formattedDuration || '3:30'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToQueue(item);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Add to queue"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                          title="Like track"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFavorite(item.id) ? 'text-red-400 fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 px-3 pb-1 flex items-center justify-between font-mono text-[11px] text-neutral-400">
                <span>Press <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300">Enter</kbd> to execute full deep query</span>
                <button
                  type="button"
                  onClick={() => executeSearch(searchQuery)}
                  className="text-white hover:text-[#E2FF66] font-bold flex items-center space-x-1"
                >
                  <span>SEE ALL RESULTS</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
      </div>

      {/* Quick Search Preset Tags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-neutral-500 mr-2">PRESETS:</span>
        {QUICK_TAGS.map((tag) => (
          <motion.button
            key={tag}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTagClick(tag)}
            className="px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white font-mono text-xs border border-neutral-800 hover:border-neutral-600 transition-all shadow-sm"
          >
            {tag}
          </motion.button>
        ))}
      </div>

      {/* Full Results Section */}
      <div className="pt-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#E2FF66] animate-spin" />
            <p className="font-mono text-xs text-neutral-400">
              QUERYING AUDIO STREAMS & VERIFYING EMBED PERMISSIONS...
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <div className="flex items-center space-x-2 font-mono text-xs text-neutral-400">
                <span>FOUND {results.length} AUDIO TRACKS</span>
                {resultSource && (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px]">
                    {resultSource === 'official_youtube_api_v3' ? 'YOUTUBE DATA API v3' : 'PUBLIC AUDIO INDEX'}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onPlayTrack(results[0], results)}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs border border-neutral-700 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY ALL RESULTS</span>
              </motion.button>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
              }}
              className="space-y-2"
            >
              {results.map((track, idx) => (
                <motion.div
                  key={`${track.id}-${idx}`}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <TrackRow
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : hasSearched ? (
          <div className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl p-8 space-y-3">
            <Music className="w-10 h-10 text-neutral-600 mx-auto mb-1" />
            <h3 className="font-display font-bold text-lg text-white">NO AUDIO RESULTS FOUND</h3>
            <p className="font-mono text-xs text-neutral-400 max-w-md mx-auto">
              Try searching with another song title, artist, or paste any direct YouTube video URL or ID (e.g. https://youtube.com/watch?v=...).
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowConfigDrawer(true)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-xs border border-neutral-800"
              >
                CHECK API DIAGNOSTICS & STATUS
              </button>
            </div>
          </div>
        ) : (
          <TiltCard className="py-16 text-center border border-neutral-900 rounded-2xl p-8 bg-neutral-950/40">
            <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-white">READY TO SEARCH</h3>
            <p className="font-sans text-xs text-neutral-400 max-w-md mx-auto mt-1">
              Type your favorite music query above for instant live results or pick one of the preset tags to start exploring.
            </p>
          </TiltCard>
        )}
      </div>

    </div>
  );
};
