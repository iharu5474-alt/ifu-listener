import { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Playlist, Track } from '../types';
import {
  subscribeUserPlaylists,
  subscribeUserFavorites,
  savePlaylistToFirestore,
  deletePlaylistFromFirestore,
  saveFavoriteToFirestore,
  removeFavoriteFromFirestore
} from '../services/firebase';

const FAVORITES_STORAGE_KEY = 'ifulistener_favorites_v1';
const PLAYLISTS_STORAGE_KEY = 'ifulistener_custom_playlists_v1';
const CUSTOM_API_KEY_STORAGE = 'ifulistener_user_youtube_key';

export function useMusicLibrary(currentUser: User | null = null) {
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

  const isInitialCloudSyncRef = useRef(false);

  // Firestore Real-time Subscriptions when logged in
  useEffect(() => {
    if (!currentUser) {
      isInitialCloudSyncRef.current = false;
      return;
    }

    // Subscribe to cloud playlists
    const unsubPlaylists = subscribeUserPlaylists(
      currentUser.uid,
      (cloudPlaylists) => {
        setCustomPlaylists((prevLocal) => {
          if (cloudPlaylists.length === 0 && prevLocal.length > 0 && !isInitialCloudSyncRef.current) {
            // First time login: push existing local playlists to cloud
            prevLocal.forEach((pl) => {
              savePlaylistToFirestore(currentUser.uid, pl).catch(() => {});
            });
            return prevLocal;
          }
          // Merge by unique id
          const map = new Map<string, Playlist>();
          cloudPlaylists.forEach((p) => map.set(p.id, p));
          prevLocal.forEach((p) => {
            if (!map.has(p.id)) {
              map.set(p.id, p);
              savePlaylistToFirestore(currentUser.uid, p).catch(() => {});
            }
          });
          return Array.from(map.values());
        });
      },
      (err) => console.warn('Firestore playlists sync issue:', err)
    );

    // Subscribe to cloud favorites
    const unsubFavorites = subscribeUserFavorites(
      currentUser.uid,
      (cloudFavorites) => {
        setFavorites((prevLocal) => {
          if (cloudFavorites.length === 0 && prevLocal.length > 0 && !isInitialCloudSyncRef.current) {
            // First time login: push local favorites to cloud
            prevLocal.forEach((fav) => {
              saveFavoriteToFirestore(currentUser.uid, fav).catch(() => {});
            });
            return prevLocal;
          }
          const map = new Map<string, Track>();
          cloudFavorites.forEach((f) => map.set(f.id, f));
          prevLocal.forEach((f) => {
            if (!map.has(f.id)) {
              map.set(f.id, f);
              saveFavoriteToFirestore(currentUser.uid, f).catch(() => {});
            }
          });
          return Array.from(map.values());
        });
        isInitialCloudSyncRef.current = true;
      },
      (err) => console.warn('Firestore favorites sync issue:', err)
    );

    return () => {
      unsubPlaylists();
      unsubFavorites();
    };
  }, [currentUser]);

  // Save to local storage as fallback & offline cache
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
        if (currentUser) {
          removeFavoriteFromFirestore(currentUser.uid, track.id).catch(() => {});
        }
        return prev.filter((t) => t.id !== track.id);
      } else {
        isNowLiked = true;
        const newTrack = { ...track, addedAt: Date.now() };
        if (currentUser) {
          saveFavoriteToFirestore(currentUser.uid, newTrack).catch(() => {});
        }
        return [newTrack, ...prev];
      }
    });
    const wasFavorite = favorites.some((t) => t.id === track.id);
    return !wasFavorite;
  }, [currentUser, favorites]);

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

    if (currentUser) {
      savePlaylistToFirestore(currentUser.uid, newPlaylist).catch(() => {});
    }

    return newPlaylist;
  }, [currentUser]);

  const deletePlaylist = useCallback((playlistId: string) => {
    setCustomPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    if (currentUser) {
      deletePlaylistFromFirestore(currentUser.uid, playlistId).catch(() => {});
    }
  }, [currentUser]);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const alreadyExists = pl.tracks.some((t) => t.id === track.id);
          if (alreadyExists) return pl;
          const updated = {
            ...pl,
            tracks: [...pl.tracks, { ...track, addedAt: Date.now() }],
            coverUrl: pl.tracks.length === 0 ? track.thumbnailUrl : pl.coverUrl
          };
          if (currentUser) {
            savePlaylistToFirestore(currentUser.uid, updated).catch(() => {});
          }
          return updated;
        }
        return pl;
      })
    );
  }, [currentUser]);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const updated = {
            ...pl,
            tracks: pl.tracks.filter((t) => t.id !== trackId)
          };
          if (currentUser) {
            savePlaylistToFirestore(currentUser.uid, updated).catch(() => {});
          }
          return updated;
        }
        return pl;
      })
    );
  }, [currentUser]);

  const importYouTubePlaylist = useCallback((playlist: Playlist) => {
    const newPl: Playlist = { ...playlist, isCustom: true, createdAt: Date.now() };
    setCustomPlaylists((prev) => {
      const filtered = prev.filter((p) => p.id !== playlist.id && p.youtubePlaylistId !== playlist.youtubePlaylistId);
      return [newPl, ...filtered];
    });
    if (currentUser) {
      savePlaylistToFirestore(currentUser.uid, newPl).catch(() => {});
    }
  }, [currentUser]);

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
