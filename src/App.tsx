import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveTab, Playlist, Track } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useMusicLibrary } from './hooks/useMusicLibrary';
import { useRecommendations } from './hooks/useRecommendations';
import { fetchRelatedYouTubeTracks } from './services/youtubeApi';
import { Navbar } from './components/Navbar';
import { PlayerBar } from './components/PlayerBar';
import { Preloader } from './components/Preloader';
import { Toast, ToastMessage } from './components/Toast';
import { ImportPlaylistModal } from './components/ImportPlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { FullscreenPlayerModal } from './components/FullscreenPlayerModal';
import { QueueDrawer } from './components/QueueDrawer';
import { DiscoverView } from './views/DiscoverView';
import { SearchView } from './views/SearchView';
import { PlaylistsView } from './views/PlaylistsView';
import { FavoritesView } from './views/FavoritesView';
import { VisualizerView } from './views/VisualizerView';

export default function App() {
  // Opening video splash intro plays on load with smooth fade
  const [showPreloader, setShowPreloader] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Custom API key stored locally
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('ifulistener_custom_yt_key') || '';
      }
    } catch {
      return '';
    }
    return '';
  });

  const handleSaveCustomApiKey = (key: string) => {
    setCustomApiKey(key);
    try {
      localStorage.setItem('ifulistener_custom_yt_key', key);
    } catch {
      // ignore
    }
    addToast('success', 'API Key Saved', 'Custom YouTube Data API v3 key saved locally.');
  };

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Toast stack
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'info' | 'success' | 'error', title: string, message?: string, code?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, message, code }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Music library hook
  const {
    favorites,
    allPlaylists,
    isFavorite,
    toggleFavorite,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    importYouTubePlaylist
  } = useMusicLibrary();

  // Recommendation Engine hook
  const {
    recommendations,
    userProfile,
    isLoading: isLoadingRecommendations,
    refreshRecommendations,
    handleDislikeTrack,
    trackPlayStart,
    trackPlayProgress,
    trackSkip,
    trackLike
  } = useRecommendations(favorites, customApiKey);

  // Refs to decouple circular dependencies
  const handleNextTrackRef = useRef<() => void>(() => {});
  const handlePlayerErrorRef = useRef<(code: number, msg: string) => void>(() => {});

  // YouTube Player hook
  const {
    playerState,
    playTrack,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleAutoplay,
    setAutoplay,
    setSuggestedTrack,
    cycleRepeatMode,
    setPlaybackRate,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setQueue
  } = useYouTubePlayer({
    onTrackEnd: () => handleNextTrackRef.current(),
    onError: (code, msg) => handlePlayerErrorRef.current(code, msg)
  });

  // Ref to hold pool of auto-suggested tracks
  const suggestedPoolRef = useRef<Track[]>([]);

  // Ref to hold current state for handlers
  const stateRef = useRef<{
    queue: Track[];
    currentTrack: Track | null;
    currentTime: number;
    duration: number;
    repeatMode: 'off' | 'all' | 'one';
    shuffle: boolean;
    autoplay: boolean;
    suggestedTrack: Track | null;
    history: Track[];
  }>({
    queue: [],
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    repeatMode: 'off',
    shuffle: false,
    autoplay: true,
    suggestedTrack: null,
    history: []
  });

  // Track next handler with Autoplay logic
  const handleNextTrack = useCallback(async () => {
    const { queue, currentTrack, currentTime, duration, repeatMode, shuffle, autoplay, suggestedTrack, history } = stateRef.current;

    // Record skip if track was advanced before completion
    if (currentTrack && currentTime > 0 && currentTime < (duration * 0.75 || 120)) {
      trackSkip(currentTrack, currentTime, duration || 210);
    }

    if (repeatMode === 'one' && currentTrack) {
      playTrack(currentTrack);
      trackPlayStart(currentTrack);
      return;
    }

    if (queue.length > 0) {
      let nextTrack: Track;
      let nextQueue: Track[];

      if (shuffle && queue.length > 1) {
        const randomIndex = Math.floor(Math.random() * queue.length);
        nextTrack = queue[randomIndex];
        nextQueue = queue.filter((_, idx) => idx !== randomIndex);
      } else {
        nextTrack = queue[0];
        nextQueue = queue.slice(1);
      }

      playTrack(nextTrack, nextQueue);
      trackPlayStart(nextTrack);
      return;
    }

    // Queue is empty -> Check Autoplay
    if (autoplay) {
      let candidate: Track | null = suggestedTrack || suggestedPoolRef.current[0] || null;

      // If pool is empty, try dynamic fetch
      if (!candidate && currentTrack) {
        try {
          const fresh = await fetchRelatedYouTubeTracks(currentTrack, customApiKey);
          const historyIds = new Set([currentTrack.id, ...history.map((h) => h.id)]);
          const filtered = fresh.filter((t) => !historyIds.has(t.id));
          if (filtered.length > 0) {
            candidate = filtered[0];
            suggestedPoolRef.current = filtered.slice(1);
            setSuggestedTrack(filtered[1] || null);
          }
        } catch (e) {
          console.warn('[ifu listener] Autoplay dynamic fetch error:', e);
        }
      }

      if (candidate) {
        // Remove picked candidate from pool
        if (suggestedPoolRef.current.length > 0 && suggestedPoolRef.current[0].id === candidate.id) {
          suggestedPoolRef.current = suggestedPoolRef.current.slice(1);
        }
        setSuggestedTrack(suggestedPoolRef.current[0] || null);

        playTrack(candidate);
        trackPlayStart(candidate);
        addToast('info', 'Autoplay: Up Next', `${candidate.title} • ${candidate.artist}`);
        return;
      }
    }

    // Queue is empty and Autoplay is off / exhausted
    addToast('info', 'End of Queue', 'Queue finished. Toggle Autoplay for continuous playback.');
  }, [customApiKey, addToast, playTrack, trackPlayStart, trackSkip, setSuggestedTrack]);

  // Track error handler (with auto-skip for autoplay recommendations)
  const handlePlayerError = useCallback((errorCode: number, errorMessage: string) => {
    console.error(`[ifu listener] Playback error: code ${errorCode} - ${errorMessage}`);
    
    // If Autoplay is enabled and queue is empty, auto-skip immediately to next suggestion smoothly
    if (stateRef.current.autoplay && stateRef.current.queue.length === 0 && suggestedPoolRef.current.length > 0) {
      console.log(`[ifu listener] Auto-skipping unplayable track (Code ${errorCode}) to next recommendation...`);
      setTimeout(() => {
        handleNextTrack();
      }, 600);
      return;
    }

    addToast('error', `Playback Error (Code ${errorCode})`, `${errorMessage} — Skipping to next track.`, errorCode);
    setTimeout(() => {
      handleNextTrack();
    }, 1800);
  }, [handleNextTrack, addToast]);

  // Keep callback refs updated
  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
    handlePlayerErrorRef.current = handlePlayerError;
  }, [handleNextTrack, handlePlayerError]);

  // Track listen progress for recommendation engine
  useEffect(() => {
    if (playerState.currentTrack && playerState.isPlaying && playerState.currentTime > 0) {
      trackPlayProgress(playerState.currentTrack, playerState.currentTime, playerState.duration);
    }
  }, [playerState.currentTrack, playerState.isPlaying, playerState.currentTime, playerState.duration, trackPlayProgress]);

  // Keep stateRef synced
  useEffect(() => {
    stateRef.current = {
      queue: playerState.queue,
      currentTrack: playerState.currentTrack,
      currentTime: playerState.currentTime,
      duration: playerState.duration,
      repeatMode: playerState.repeatMode,
      shuffle: playerState.shuffle,
      autoplay: playerState.autoplay,
      suggestedTrack: playerState.suggestedTrack,
      history: playerState.history
    };
  }, [
    playerState.queue,
    playerState.currentTrack,
    playerState.currentTime,
    playerState.duration,
    playerState.repeatMode,
    playerState.shuffle,
    playerState.autoplay,
    playerState.suggestedTrack,
    playerState.history
  ]);

  // Automatically fetch related songs for "Up Next" whenever current track changes
  useEffect(() => {
    if (!playerState.currentTrack) {
      setSuggestedTrack(null);
      suggestedPoolRef.current = [];
      return;
    }

    let isMounted = true;
    const loadSuggestions = async () => {
      try {
        const results = await fetchRelatedYouTubeTracks(playerState.currentTrack!, customApiKey);
        if (!isMounted) return;

        const historyIds = new Set([
          playerState.currentTrack!.id,
          ...playerState.history.map((h) => h.id)
        ]);
        const filtered = results.filter((t) => !historyIds.has(t.id));

        if (filtered.length > 0) {
          suggestedPoolRef.current = filtered;
          setSuggestedTrack(filtered[0]);
        }
      } catch (err) {
        console.warn('[ifu listener] Error loading related suggestions:', err);
      }
    };

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, [playerState.currentTrack?.id, customApiKey]);

  // Play single track with queue
  const handlePlaySingleTrack = useCallback(
    (track: Track, contextQueue?: Track[]) => {
      trackPlayStart(track);
      if (contextQueue && contextQueue.length > 0) {
        const trackIndex = contextQueue.findIndex((t) => t.id === track.id);
        const newQueue =
          trackIndex >= 0
            ? [...contextQueue.slice(trackIndex + 1), ...contextQueue.slice(0, trackIndex)]
            : contextQueue.filter((t) => t.id !== track.id);
        playTrack(track, newQueue);
      } else {
        playTrack(track);
      }
      addToast('info', 'Now Playing', `${track.title} • ${track.artist}`);
    },
    [playTrack, addToast, trackPlayStart]
  );

  // Play entire playlist
  const handlePlayPlaylist = useCallback(
    (playlist: Playlist, startIndexOrShuffle: number | boolean = 0) => {
      if (playlist.tracks.length === 0) {
        addToast('info', 'Empty Playlist', 'Add tracks to this playlist first.');
        return;
      }
      if (typeof startIndexOrShuffle === 'boolean' && startIndexOrShuffle) {
        const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
        trackPlayStart(shuffled[0]);
        playTrack(shuffled[0], shuffled.slice(1), playlist.id);
        addToast('success', 'Shuffled Playlist', `${playlist.title} (${playlist.tracks.length} tracks)`);
        return;
      }
      const startIndex = typeof startIndexOrShuffle === 'number' ? startIndexOrShuffle : 0;
      const firstTrack = playlist.tracks[startIndex] || playlist.tracks[0];
      const remainingTracks = [
        ...playlist.tracks.slice(startIndex + 1),
        ...playlist.tracks.slice(0, startIndex)
      ];
      trackPlayStart(firstTrack);
      playTrack(firstTrack, remainingTracks, playlist.id);
      addToast('success', 'Playing Playlist', `${playlist.title} (${playlist.tracks.length} tracks)`);
    },
    [playTrack, addToast, trackPlayStart]
  );

  // Previous track handler
  const handlePrevTrack = useCallback(() => {
    if (playerState.currentTime > 4) {
      seekTo(0);
    } else if (playerState.history.length > 0) {
      const prevTrack = playerState.history[0];
      trackPlayStart(prevTrack);
      playTrack(prevTrack);
    } else {
      seekTo(0);
    }
  }, [playerState.currentTime, playerState.history, playTrack, seekTo, trackPlayStart]);

  // Toggle favorite with feedback toast & recommendation engine tracking
  const handleToggleFavorite = useCallback(
    (track: Track) => {
      const isFav = isFavorite(track.id);
      toggleFavorite(track);
      trackLike(track, !isFav);
      if (isFav) {
        addToast('info', 'Removed from Liked Songs', track.title);
      } else {
        addToast('success', 'Added to Liked Songs', track.title);
      }
    },
    [isFavorite, toggleFavorite, trackLike, addToast]
  );

  // Add to queue with toast
  const handleAddToQueue = useCallback(
    (track: Track) => {
      addToQueue(track);
      addToast('success', 'Added to Queue', track.title);
    },
    [addToQueue, addToast]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        if (e.shiftKey) {
          handleNextTrack();
        } else {
          seekTo(Math.min(playerState.duration, playerState.currentTime + 5));
        }
      } else if (e.code === 'ArrowLeft') {
        if (e.shiftKey) {
          handlePrevTrack();
        } else {
          seekTo(Math.max(0, playerState.currentTime - 5));
        }
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyF') {
        setIsFullscreenPlayerOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNextTrack, handlePrevTrack, seekTo, toggleMute, playerState.duration, playerState.currentTime]);

  const handlePreloaderDone = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('ifulistener_intro_played_v3', 'true');
      }
    } catch {
      // ignore
    }
    setShowPreloader(false);
  };

  const handleOpenFullscreenModal = () => {
    try {
      console.log('ifu listener: Requesting Fullscreen Studio Visualizer');
      if (!playerState.currentTrack) {
        console.warn('ifu listener: Fullscreen modal requested while no track is loaded');
        addToast('info', 'No Active Track', 'Play a track first to launch the Fullscreen Studio Visualizer');
        return;
      }
      setIsFullscreenPlayerOpen(true);
    } catch (err) {
      console.error('ifu listener: Exception while opening fullscreen modal:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col noise-overlay selection:bg-[#E2FF66] selection:text-black relative">
      
      {/* Hidden YouTube IFrame Player */}
      <div id="youtube-player-host" className="yt-hidden-player" />

      {/* Fullscreen Looping Video Background Behind Hero Content & Nav */}
      <div
        id="hero-video-background-layer"
        className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-black"
        style={{ backgroundColor: '#000000' }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-80"
          style={{
            filter: 'brightness(1.15) contrast(1.1) saturate(1.15)',
            WebkitFilter: 'brightness(1.15) contrast(1.1) saturate(1.15)'
          }}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/85" />
      </div>

      {/* Intro Preloader Animation (Plays once per visit) */}
      {showPreloader && <Preloader onComplete={handlePreloaderDone} />}

      {/* Main Navbar */}
      <div className="relative z-10">
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'playlists') setSelectedPlaylist(null);
          }}
          playerState={playerState}
          favoritesCount={favorites.length}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          recommendations={recommendations}
          onPlayTrack={handlePlaySingleTrack}
        />
      </div>

      {/* Main Content Area with Smooth Route Transitions */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-40">
        <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'discover' && (
              <DiscoverView
                playlists={allPlaylists}
                favorites={favorites}
                currentTrack={playerState.currentTrack}
                isPlaying={playerState.isPlaying}
                isFavorite={isFavorite}
                recommendations={recommendations}
                userProfile={userProfile}
                isLoadingRecommendations={isLoadingRecommendations}
                customApiKey={customApiKey}
                onRefreshRecommendations={() => refreshRecommendations(true)}
                onDislikeTrack={handleDislikeTrack}
                onPlayTrack={handlePlaySingleTrack}
                onPlayPlaylist={handlePlayPlaylist}
                onToggleFavorite={handleToggleFavorite}
                onAddToQueue={handleAddToQueue}
                onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                onSelectPlaylist={(pl) => {
                  setSelectedPlaylist(pl);
                  setActiveTab('playlists');
                }}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            )}

            {activeTab === 'playlists' && (
              <PlaylistsView
                playlists={allPlaylists}
                selectedPlaylist={selectedPlaylist}
                currentTrack={playerState.currentTrack}
                isPlaying={playerState.isPlaying}
                isFavorite={isFavorite}
                onSelectPlaylist={setSelectedPlaylist}
                onPlayPlaylist={handlePlayPlaylist}
                onPlayTrack={handlePlaySingleTrack}
                onToggleFavorite={handleToggleFavorite}
                onAddToQueue={handleAddToQueue}
                onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
                onDeleteCustomPlaylist={(id) => {
                  deletePlaylist(id);
                  addToast('info', 'Playlist Deleted');
                }}
                onRemoveTrackFromPlaylist={(plId, trackId) => {
                  removeTrackFromPlaylist(plId, trackId);
                  addToast('info', 'Track removed from playlist');
                }}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            )}

            {activeTab === 'favorites' && (
              <FavoritesView
                favorites={favorites}
                currentTrack={playerState.currentTrack}
                isPlaying={playerState.isPlaying}
                onPlayTrack={handlePlaySingleTrack}
                onToggleFavorite={handleToggleFavorite}
                onAddToQueue={handleAddToQueue}
                onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
              />
            )}

            {activeTab === 'visualizer' && (
              <VisualizerView
                playerState={playerState}
                onTogglePlay={togglePlay}
                onPrev={handlePrevTrack}
                onNext={handleNextTrack}
              />
            )}
        </div>
      </main>

      {/* Compact Floating Player Bar */}
      <PlayerBar
        playerState={playerState}
        isFavorite={playerState.currentTrack ? isFavorite(playerState.currentTrack.id) : false}
        onTogglePlay={togglePlay}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleAutoplay={toggleAutoplay}
        onCycleRepeat={cycleRepeatMode}
        onSetPlaybackRate={setPlaybackRate}
        onToggleFavorite={handleToggleFavorite}
        onOpenFullscreen={handleOpenFullscreenModal}
        onPlaySuggestedTrack={(t) => handlePlaySingleTrack(t)}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
        isQueueOpen={isQueueOpen}
      />

      {/* Fresh Queue / Now Playing Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        playerState={playerState}
        onPlayTrack={handlePlaySingleTrack}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
        onToggleAutoplay={toggleAutoplay}
        onAddToQueue={handleAddToQueue}
        suggestedTracks={recommendations}
      />

      {/* Fullscreen Player Modal */}
      <FullscreenPlayerModal
        isOpen={isFullscreenPlayerOpen}
        onClose={() => setIsFullscreenPlayerOpen(false)}
        playerState={playerState}
        isFavorite={playerState.currentTrack ? isFavorite(playerState.currentTrack.id) : false}
        onTogglePlay={togglePlay}
        onPrev={handlePrevTrack}
        onNext={handleNextTrack}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleAutoplay={toggleAutoplay}
        onCycleRepeat={cycleRepeatMode}
        onToggleFavorite={handleToggleFavorite}
        onSetPlaybackRate={setPlaybackRate}
        onPlaySuggestedTrack={(t) => handlePlaySingleTrack(t)}
      />

      {/* Import / Create Playlist Modal */}
      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportPlaylist={(pl) => {
          importYouTubePlaylist(pl);
          addToast('success', 'YouTube Playlist Imported', `${pl.title} (${pl.tracks.length} tracks)`);
          setSelectedPlaylist(pl);
          setActiveTab('playlists');
        }}
        onCreateCustomPlaylist={(title, desc) => {
          const newPl = createPlaylist(title, desc);
          addToast('success', 'Playlist Created', title);
          setSelectedPlaylist(newPl);
          setActiveTab('playlists');
        }}
      />

      {/* Add Track to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={trackToAddToPlaylist !== null}
        track={trackToAddToPlaylist}
        playlists={allPlaylists}
        onClose={() => setTrackToAddToPlaylist(null)}
        onAddToPlaylist={(plId, track) => {
          addTrackToPlaylist(plId, track);
          addToast('success', 'Added to playlist');
        }}
        onCreateNewPlaylist={(title, track) => {
          const newPl = createPlaylist(title, 'Custom playlist', [track]);
          addToast('success', 'Created & Added', title);
        }}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
