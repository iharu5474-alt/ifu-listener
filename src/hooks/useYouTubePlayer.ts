import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayerState, PlayerStatus, RepeatMode, Track } from '../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerProps {
  onTrackEnd?: () => void;
  onErrorNotification?: (code: number, message: string) => void;
  onError?: (code: number, message: string) => void;
}

const ERROR_MESSAGES: Record<number, string> = {
  2: 'Invalid video parameters',
  5: 'HTML5 player playback error',
  100: 'Track not found or removed',
  101: 'Playback restricted by track owner',
  150: 'Embedded audio not permitted on this track',
  152: 'Restricted by YouTube policy'
};

export function useYouTubePlayer({ onTrackEnd, onErrorNotification, onError }: UseYouTubePlayerProps = {}) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 80,
    isMuted: false,
    shuffle: false,
    autoplay: typeof window !== 'undefined' ? localStorage.getItem('ifu_autoplay') !== 'false' : true,
    repeatMode: 'off',
    playbackRate: 1,
    status: 'unstarted',
    errorCode: null,
    errorMessage: null,
    isReady: false,
    queue: [],
    history: [],
    suggestedTrack: null,
    activePlaylistId: null
  });

  const playerRef = useRef<any>(null);
  const isApiReadyRef = useRef<boolean>(false);
  const isPlayerReadyRef = useRef<boolean>(false);
  const pendingTrackRef = useRef<Track | null>(null);
  const loadTimeoutRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  // Clear load timeout
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  // 1. Initialize YouTube IFrame API
  useEffect(() => {
    const initYT = () => {
      if (window.YT && window.YT.Player) {
        isApiReadyRef.current = true;
        mountPlayer();
      } else {
        window.onYouTubeIframeAPIReady = () => {
          isApiReadyRef.current = true;
          mountPlayer();
        };

        // Fallback injection if not already in document
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          document.body.appendChild(tag);
        }
      }
    };

    const mountPlayer = () => {
      const hostElement = document.getElementById('youtube-player-host');
      if (!hostElement || playerRef.current) return;

      try {
        const playerVars: Record<string, any> = {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        };

        if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
          playerVars.origin = window.location.origin;
        }

        playerRef.current = new window.YT.Player('youtube-player-host', {
          height: '200',
          width: '200',
          playerVars,
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError
          }
        });
      } catch (e) {
        console.error('Error mounting YouTube player instance:', e);
      }
    };

    initYT();

    return () => {
      clearLoadTimeout();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [clearLoadTimeout]);

  // Handle Player Ready
  const onPlayerReady = useCallback((event: any) => {
    isPlayerReadyRef.current = true;
    setPlayerState((prev) => ({ ...prev, isReady: true }));

    try {
      event.target.setVolume(playerState.volume);
    } catch {
      // ignore
    }

    // Play pending track if one was requested before player ready
    if (pendingTrackRef.current) {
      const track = pendingTrackRef.current;
      pendingTrackRef.current = null;
      loadAndPlayVideo(track.id);
    }
  }, [playerState.volume]);

  // Handle State Changes
  const onPlayerStateChange = useCallback((event: any) => {
    clearLoadTimeout();
    const stateCode = event.data;
    let newStatus: PlayerStatus = 'unstarted';

    if (window.YT && window.YT.PlayerState) {
      switch (stateCode) {
        case window.YT.PlayerState.UNSTARTED:
          newStatus = 'unstarted';
          break;
        case window.YT.PlayerState.BUFFERING:
          newStatus = 'buffering';
          break;
        case window.YT.PlayerState.PLAYING:
          newStatus = 'playing';
          break;
        case window.YT.PlayerState.PAUSED:
          newStatus = 'paused';
          break;
        case window.YT.PlayerState.ENDED:
          newStatus = 'ended';
          break;
        case window.YT.PlayerState.CUED:
          newStatus = 'unstarted';
          break;
        default:
          break;
      }
    }

    setPlayerState((prev) => ({
      ...prev,
      status: newStatus,
      isPlaying: newStatus === 'playing',
      duration: playerRef.current?.getDuration ? playerRef.current.getDuration() || prev.duration : prev.duration
    }));

    if (newStatus === 'ended') {
      if (onTrackEnd) {
        onTrackEnd();
      }
    }
  }, [clearLoadTimeout, onTrackEnd]);

  // Handle Errors
  const onPlayerError = useCallback((event: any) => {
    clearLoadTimeout();
    const code = event.data as number;
    const errorMsg = ERROR_MESSAGES[code] || `Playback error occurred (Code ${code})`;
    console.warn(`YouTube Player Error [${code}]:`, errorMsg);

    setPlayerState((prev) => ({
      ...prev,
      isPlaying: false,
      status: 'error',
      errorCode: code,
      errorMessage: errorMsg
    }));

    if (onError) {
      onError(code, errorMsg);
    } else if (onErrorNotification) {
      onErrorNotification(code, errorMsg);
    }
  }, [clearLoadTimeout, onErrorNotification, onError]);

  // Internal helper to load and play video safely without premature timeout errors
  const loadAndPlayVideo = useCallback((videoId: string) => {
    if (!playerRef.current || !isPlayerReadyRef.current) return;

    clearLoadTimeout();

    try {
      playerRef.current.loadVideoById({
        videoId: videoId,
        suggestedQuality: 'small'
      });
      setPlayerState((prev) => ({
        ...prev,
        status: 'buffering',
        errorCode: null,
        errorMessage: null
      }));
    } catch (e) {
      console.error('Error invoking loadVideoById:', e);
    }
  }, [clearLoadTimeout]);

  // Periodic position sync - optimized for long-term continuous streaming
  useEffect(() => {
    if (!playerState.isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (playerRef.current && isPlayerReadyRef.current) {
        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration();
          setPlayerState((prev) => ({
            ...prev,
            currentTime,
            duration: duration && duration > 0 ? duration : prev.duration
          }));
        } catch {
          // ignore
        }
      }
    }, 300);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playerState.isPlaying]);

  // Controls API
  const playTrack = useCallback((track: Track, newQueue?: Track[], playlistId?: string) => {
    setPlayerState((prev) => {
      const updatedHistory = prev.currentTrack ? [prev.currentTrack, ...prev.history.slice(0, 20)] : prev.history;
      return {
        ...prev,
        currentTrack: track,
        duration: track.duration || 0,
        currentTime: 0,
        queue: newQueue !== undefined ? newQueue : prev.queue,
        activePlaylistId: playlistId !== undefined ? playlistId : prev.activePlaylistId,
        history: updatedHistory
      };
    });

    if (isPlayerReadyRef.current && playerRef.current) {
      loadAndPlayVideo(track.id);
    } else {
      pendingTrackRef.current = track;
    }
  }, [loadAndPlayVideo]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !isPlayerReadyRef.current) return;

    if (playerState.isPlaying) {
      try {
        playerRef.current.pauseVideo();
        setPlayerState((prev) => ({ ...prev, isPlaying: false, status: 'paused' }));
      } catch (e) {
        console.error('Pause error:', e);
      }
    } else {
      if (playerState.currentTrack) {
        try {
          playerRef.current.playVideo();
          setPlayerState((prev) => ({ ...prev, isPlaying: true, status: 'playing' }));
        } catch (e) {
          console.error('Play error:', e);
        }
      }
    }
  }, [playerState.isPlaying, playerState.currentTrack]);

  const pause = useCallback(() => {
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.pauseVideo();
        setPlayerState((prev) => ({ ...prev, isPlaying: false, status: 'paused' }));
      } catch {
        // ignore
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.playVideo();
        setPlayerState((prev) => ({ ...prev, isPlaying: true, status: 'playing' }));
      } catch {
        // ignore
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.seekTo(seconds, true);
        setPlayerState((prev) => ({ ...prev, currentTime: seconds }));
      } catch {
        // ignore
      }
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume));
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.setVolume(clamped);
        if (clamped > 0 && playerRef.current.isMuted && playerRef.current.isMuted()) {
          playerRef.current.unMute();
        }
      } catch {
        // ignore
      }
    }
    setPlayerState((prev) => ({
      ...prev,
      volume: clamped,
      isMuted: clamped === 0 ? true : prev.isMuted && clamped > 0 ? false : prev.isMuted
    }));
  }, []);

  const toggleMute = useCallback(() => {
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        if (playerState.isMuted) {
          playerRef.current.unMute();
          playerRef.current.setVolume(playerState.volume || 80);
          setPlayerState((prev) => ({ ...prev, isMuted: false }));
        } else {
          playerRef.current.mute();
          setPlayerState((prev) => ({ ...prev, isMuted: true }));
        }
      } catch {
        // ignore
      }
    }
  }, [playerState.isMuted, playerState.volume]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (playerRef.current && isPlayerReadyRef.current) {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch {
        // ignore
      }
    }
    setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, shuffle: !prev.shuffle }));
  }, []);

  const toggleAutoplay = useCallback(() => {
    setPlayerState((prev) => {
      const nextAutoplay = !prev.autoplay;
      try {
        localStorage.setItem('ifu_autoplay', String(nextAutoplay));
      } catch {}
      return { ...prev, autoplay: nextAutoplay };
    });
  }, []);

  const setAutoplay = useCallback((enabled: boolean) => {
    try {
      localStorage.setItem('ifu_autoplay', String(enabled));
    } catch {}
    setPlayerState((prev) => ({ ...prev, autoplay: enabled }));
  }, []);

  const setSuggestedTrack = useCallback((track: Track | null) => {
    setPlayerState((prev) => ({ ...prev, suggestedTrack: track }));
  }, []);

  const cycleRepeatMode = useCallback(() => {
    setPlayerState((prev) => {
      const nextMode: RepeatMode =
        prev.repeatMode === 'off' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'off';
      return { ...prev, repeatMode: nextMode };
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setPlayerState((prev) => ({
      ...prev,
      queue: [...prev.queue, track]
    }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setPlayerState((prev) => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index)
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, queue: [] }));
  }, []);

  const setQueue = useCallback((queue: Track[]) => {
    setPlayerState((prev) => ({ ...prev, queue }));
  }, []);

  return {
    playerState,
    playTrack,
    togglePlay,
    pause,
    resume,
    seekTo,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    toggleAutoplay,
    setAutoplay,
    setSuggestedTrack,
    cycleRepeatMode,
    addToQueue,
    removeFromQueue,
    clearQueue,
    setQueue
  };
}
