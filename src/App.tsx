import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveTab, Playlist, Track } from './types';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { useMusicLibrary } from './hooks/useMusicLibrary';
import { useRecommendations } from './hooks/useRecommendations';
import { fetchRelatedYouTubeTracks } from './services/youtubeApi';
import { Navbar } from './components/Navbar';
import { PlayerBar } from './components/PlayerBar';
import { Preloader } from './components/Preloader';

export const APP_BACKGROUND_VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4';
import { Toast, ToastMessage } from './components/Toast';
import { ImportPlaylistModal } from './components/ImportPlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { FullscreenPlayerModal } from './components/FullscreenPlayerModal';
import { QueueDrawer } from './components/QueueDrawer';
import { RecentlyPlayedDrawer } from './components/RecentlyPlayedDrawer';
import { HomeView } from './views/HomeView';
import { RecommendedView } from './views/RecommendedView';
import { LibraryView } from './views/LibraryView';
import { VisualizerView } from './views/VisualizerView';

export default function App() {
  // Opening video splash intro plays on load with smooth fade
  const [showPreloader, setShowPreloader] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
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
  const [isRecentlyPlayedOpen, setIsRecentlyPlayedOpen] = useState(false);

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
      let nextIndex = 0;
      if (shuffle && queue.length > 1) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      const nextTrack = queue[nextIndex];
      const remainingQueue = queue.filter((_, i) => i !== nextIndex);
      setQueue(remainingQueue);
      playTrack(nextTrack);
      trackPlayStart(nextTrack);
      return;
    }

    // Autoplay fallback when queue ends
    if (autoplay) {
      if (suggestedTrack) {
        const nextTrack = suggestedTrack;
        setSuggestedTrack(null);
        playTrack(nextTrack);
        trackPlayStart(nextTrack);
        addToast('info', 'Autoplaying Similar Vibe', `${nextTrack.title} • ${nextTrack.artist}`);
        return;
      }

      if (suggestedPoolRef.current.length > 0) {
        const nextTrack = suggestedPoolRef.current.shift()!;
        playTrack(nextTrack);
        trackPlayStart(nextTrack);
        addToast('info', 'Autoplaying Similar Vibe', `${nextTrack.title} • ${nextTrack.artist}`);
        return;
      }

      // If we have recommendations available from taste profile, play top recommendation
      if (recommendations.length > 0) {
        const unplayed = recommendations.filter((r) => r.id !== currentTrack?.id);
        if (unplayed.length > 0) {
          const nextTrack = unplayed[0];
          playTrack(nextTrack);
          trackPlayStart(nextTrack);
          addToast('info', 'Autoplaying Recommendation', `${nextTrack.title} • ${nextTrack.artist}`);
          return;
        }
      }
    }

    // If repeat is 'all' and we have history, restart from earliest
    if (repeatMode === 'all' && history.length > 0) {
      const firstTrack = history[0];
      playTrack(firstTrack);
      trackPlayStart(firstTrack);
    }
  }, [
    playTrack,
    setQueue,
    setSuggestedTrack,
    trackPlayStart,
    trackSkip,
    recommendations,
    addToast
  ]);

  // Keep handleNextTrackRef synchronized
  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  // Player error handler
  const handlePlayerError = useCallback((code: number, msg: string) => {
    const { currentTrack } = stateRef.current;
    console.warn(`[ifu listener] Playback error code ${code}: ${msg}`);
    addToast('error', 'Playback Notice', msg || 'Skipping unavailable video...', code);

    // Auto skip after short delay
    setTimeout(() => {
      handleNextTrackRef.current();
    }, 1200);
  }, [addToast]);

  useEffect(() => {
    handlePlayerErrorRef.current = handlePlayerError;
  }, [handlePlayerError]);

  // Keep stateRef in sync with real-time player state
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
  }, [playerState]);

  // Periodic play progress logging for the recommendation engine
  useEffect(() => {
    if (playerState.isPlaying && playerState.currentTrack && playerState.currentTime > 0) {
      trackPlayProgress(playerState.currentTrack, playerState.currentTime, playerState.duration || 210);
    }
  }, [playerState.isPlaying, playerState.currentTime, playerState.duration, playerState.currentTrack, trackPlayProgress]);

  // Pre-fetch related tracks whenever a new track starts playing to fuel seamless Autoplay
  useEffect(() => {
    const current = playerState.currentTrack;
    if (!current) return;

    let isMounted = true;
    fetchRelatedYouTubeTracks(current, customApiKey).then((related) => {
      if (!isMounted) return;
      if (related && related.length > 0) {
        // First track becomes immediate candidate
        setSuggestedTrack(related[0]);
        // The remaining tracks fill the pool
        suggestedPoolRef.current = related.slice(1);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [playerState.currentTrack?.id, customApiKey, setSuggestedTrack]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        handlePrevTrack();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNextTrack, toggleMute]);

  const handlePrevTrack = () => {
    const { history, currentTime } = stateRef.current;
    if (currentTime > 4) {
      seekTo(0);
      return;
    }
    if (history.length > 1) {
      // Second-to-last item is previous track
      const prevTrack = history[history.length - 2];
      playTrack(prevTrack);
      trackPlayStart(prevTrack);
    } else {
      seekTo(0);
    }
  };

  const handlePlaySingleTrack = (track: Track, newQueue?: Track[], playlistId?: string) => {
    playTrack(track, newQueue, playlistId);
    trackPlayStart(track);
  };

  const handlePlayPlaylist = (playlist: Playlist, shuffle = false) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;
    let list = [...playlist.tracks];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    const firstTrack = list[0];
    const rest = list.slice(1);
    playTrack(firstTrack, rest, playlist.id);
    trackPlayStart(firstTrack);
    addToast('info', 'Now Playing Playlist', `${playlist.title} (${playlist.tracks.length} tracks)`);
  };

  const handleToggleFavorite = (track: Track) => {
    const liked = toggleFavorite(track);
    trackLike(track, liked);
    if (liked) {
      addToast('success', 'Added to Liked Tracks', `${track.title} • ${track.artist}`);
    } else {
      addToast('info', 'Removed from Liked Tracks', track.title);
    }
  };

  const handleAddToQueue = (track: Track) => {
    addToQueue(track);
    addToast('info', 'Added to Queue', `${track.title} • ${track.artist}`);
  };

  const handleOpenFullscreenModal = () => {
    setIsFullscreenPlayerOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#E2FF66] selection:text-black font-sans antialiased overflow-x-hidden">
      
      {/* 1. Opening Video Preloader with cinematic fade-out */}
      {showPreloader && (
        <Preloader onComplete={() => setShowPreloader(false)} />
      )}

      {/* 2. Hidden YouTube Player Engine Iframe Container */}
      <div id="youtube-player-host" className="hidden pointer-events-none" aria-hidden="true" />

      {/* 3. Deep Atmospheric Live Hero Background */}
      <div id="main-app-background-container" className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        {/* Ambient Hero Video Background Layer */}
        <video
          id="main-app-hero-background-video"
          src={APP_BACKGROUND_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-60 filter brightness-95 contrast-105"
        />

        {/* Ambient Dark Overlay to maintain high contrast for UI text & frosted white glass cards */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {/* Subtle Ambient Radial Glows */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{
            background: playerState.isPlaying
              ? 'radial-gradient(circle, rgba(226, 255, 102, 0.45) 0%, rgba(30, 80, 255, 0.25) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(50, 50, 50, 0.1) 70%, transparent 100%)'
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[160px] opacity-25 transition-all duration-1000"
          style={{
            background: playerState.isPlaying
              ? 'radial-gradient(circle, rgba(255, 80, 180, 0.35) 0%, rgba(120, 40, 255, 0.25) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(30, 30, 30, 0.05) 70%, transparent 100%)'
          }}
        />
        {/* Fine Architectural Grid Texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-35" />
      </div>

      {/* 4. Top Navigation Bar with Direct "Recently Played" trigger & White Glass */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        playerState={playerState}
        favoritesCount={favorites.length}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenRecentlyPlayed={() => setIsRecentlyPlayedOpen(true)}
      />

      {/* 5. Main Application Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-36">
        <div className="animate-in fade-in duration-300">
          {activeTab === 'home' && (
            <HomeView
              currentTrack={playerState.currentTrack}
              isPlaying={playerState.isPlaying}
              isFavorite={isFavorite}
              customApiKey={customApiKey}
              onPlayTrack={handlePlaySingleTrack}
              onToggleFavorite={handleToggleFavorite}
              onAddToQueue={handleAddToQueue}
              onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
            />
          )}

          {activeTab === 'recommended' && (
            <RecommendedView
              recommendations={recommendations}
              userProfile={userProfile}
              isLoading={isLoadingRecommendations}
              onRefreshRecommendations={() => refreshRecommendations(true)}
              onDislikeTrack={handleDislikeTrack}
              currentTrack={playerState.currentTrack}
              isPlaying={playerState.isPlaying}
              isFavorite={isFavorite}
              onPlayTrack={handlePlaySingleTrack}
              onToggleFavorite={handleToggleFavorite}
              onAddToQueue={handleAddToQueue}
              onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
            />
          )}

          {(activeTab === 'library' || activeTab === 'playlists' || activeTab === 'favorites') && (
            <LibraryView
              playlists={allPlaylists}
              favorites={favorites}
              currentTrack={playerState.currentTrack}
              isPlaying={playerState.isPlaying}
              isFavorite={isFavorite}
              onPlayTrack={handlePlaySingleTrack}
              onPlayPlaylist={handlePlayPlaylist}
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
              selectedPlaylist={selectedPlaylist}
              onSelectPlaylist={setSelectedPlaylist}
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

      {/* 6. Compact Floating White Glass Player Bar */}
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

      {/* 7. Slide-Out White Glass Queue Drawer */}
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

      {/* 8. Slide-Out White Glass Recently Played Drawer */}
      <RecentlyPlayedDrawer
        isOpen={isRecentlyPlayedOpen}
        onClose={() => setIsRecentlyPlayedOpen(false)}
        history={playerState.history}
        currentTrack={playerState.currentTrack}
        isPlaying={playerState.isPlaying}
        isFavorite={isFavorite}
        onPlayTrack={handlePlaySingleTrack}
        onToggleFavorite={handleToggleFavorite}
        onAddToQueue={handleAddToQueue}
        onOpenAddToPlaylist={(t) => setTrackToAddToPlaylist(t)}
      />

      {/* 9. Fullscreen Studio Visualizer Modal (White Glass) */}
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

      {/* 10. Import / Create Playlist Modal (White Glass) */}
      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportPlaylist={(pl) => {
          importYouTubePlaylist(pl);
          addToast('success', 'YouTube Playlist Imported', `${pl.title} (${pl.tracks.length} tracks)`);
          setSelectedPlaylist(pl);
          setActiveTab('library');
        }}
        onCreateCustomPlaylist={(title, desc) => {
          const newPl = createPlaylist(title, desc);
          addToast('success', 'Playlist Created', title);
          setSelectedPlaylist(newPl);
          setActiveTab('library');
        }}
      />

      {/* 11. Add Track to Playlist Modal (White Glass) */}
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

      {/* 12. Toast Notifications Stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
