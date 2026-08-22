import { useCallback, useEffect, useState } from 'react';
import { Playlist, Track } from '../types';

const FAVORITES_STORAGE_KEY = 'ifulistener_favorites_v1';
const PLAYLISTS_STORAGE_KEY = 'ifulistener_custom_playlists_v1';
const CUSTOM_API_KEY_STORAGE = 'ifulistener_user_youtube_key';

export function useMusicLibrary() {
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(CUSTOM_API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(customPlaylists));
    } catch (e) {
      console.warn('Failed to save playlists to localStorage', e);
    }
  }, [customPlaylists]);

  const saveCustomApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    setCustomApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(CUSTOM_API_KEY_STORAGE, trimmed);
      } else {
        localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
      }
    } catch (e) {
      console.warn('Failed to save custom api key to localStorage', e);
    }
  }, []);

  const isFavorite = useCallback(
    (trackId: string) => {
      return favorites.some((t) => t.id === trackId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback((track: Track): boolean => {
    let isNowLiked = false;
    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        isNowLiked = false;
        return prev.filter((t) => t.id !== track.id);
      } else {
        isNowLiked = true;
        return [{ ...track, addedAt: Date.now() }, ...prev];
      }
    });
    // Check if was already in favorites to determine outcome
    const wasFavorite = favorites.some((t) => t.id === track.id);
    return !wasFavorite;
  }, [favorites]);

  const createPlaylist = useCallback((title: string, description?: string, initialTracks?: Track[]): Playlist => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim() || 'Untitled Playlist',
      description: description?.trim() || 'User collection in ifu listener',
      coverUrl: initialTracks?.[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      tracks: initialTracks || [],
      isCustom: true,
      createdAt: Date.now()
    };

    setCustomPlaylists((prev) => [newPlaylist, ...prev]);
    return newPlaylist;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setCustomPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const alreadyExists = pl.tracks.some((t) => t.id === track.id);
          if (alreadyExists) return pl;
          return {
            ...pl,
            tracks: [...pl.tracks, { ...track, addedAt: Date.now() }],
            coverUrl: pl.tracks.length === 0 ? track.thumbnailUrl : pl.coverUrl
          };
        }
        return pl;
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            tracks: pl.tracks.filter((t) => t.id !== trackId)
          };
        }
        return pl;
      })
    );
  }, []);

  const importYouTubePlaylist = useCallback((playlist: Playlist) => {
    setCustomPlaylists((prev) => {
      const filtered = prev.filter((p) => p.id !== playlist.id && p.youtubePlaylistId !== playlist.youtubePlaylistId);
      return [{ ...playlist, isCustom: true, createdAt: Date.now() }, ...filtered];
    });
  }, []);

  // All playlists are only user's own playlists
  const allPlaylists: Playlist[] = customPlaylists;

  return {
    favorites,
    customPlaylists,
    allPlaylists,
    customApiKey,
    saveCustomApiKey,
    isFavorite,
    toggleFavorite,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    importYouTubePlaylist
  };
}
