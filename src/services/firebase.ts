import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { Playlist, Track, UserInterestProfile } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyBa2KWojEhhCv9MXxhvamENJ9BFl0_Uo8g",
  authDomain: "ifu-listener.firebaseapp.com",
  projectId: "ifu-listener",
  storageBucket: "ifu-listener.firebasestorage.app",
  messagingSenderId: "191396965357",
  appId: "1:191396965357:web:4ce1520e726e84deb6d5e4",
  measurementId: "G-JF27GRB6XY"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Operation Types for error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore: client is currently offline.");
    }
    return false;
  }
}

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// -------------------------------------------------------------
// FIRESTORE CLOUD SYNC SERVICES
// -------------------------------------------------------------

// User Playlists Sync
export function subscribeUserPlaylists(
  userId: string,
  onUpdate: (playlists: Playlist[]) => void,
  onError?: (err: any) => void
) {
  const playlistsRef = collection(db, 'users', userId, 'playlists');
  const q = query(playlistsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const playlists: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        playlists.push({
          id: docSnap.id,
          title: data.title || 'Untitled',
          description: data.description || '',
          coverUrl: data.coverUrl || '',
          tracks: data.tracks || [],
          isCustom: true,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
          youtubePlaylistId: data.youtubePlaylistId
        });
      });
      onUpdate(playlists);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/playlists`);
      if (onError) onError(error);
    }
  );
}

export async function savePlaylistToFirestore(userId: string, playlist: Playlist): Promise<void> {
  const path = `users/${userId}/playlists/${playlist.id}`;
  try {
    const playlistRef = doc(db, 'users', userId, 'playlists', playlist.id);
    await setDoc(playlistRef, {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description || '',
      coverUrl: playlist.coverUrl || '',
      tracks: playlist.tracks || [],
      isCustom: true,
      createdAt: playlist.createdAt || Date.now(),
      youtubePlaylistId: playlist.youtubePlaylistId || null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deletePlaylistFromFirestore(userId: string, playlistId: string): Promise<void> {
  const path = `users/${userId}/playlists/${playlistId}`;
  try {
    const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
    await deleteDoc(playlistRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// User Favorites Sync
export function subscribeUserFavorites(
  userId: string,
  onUpdate: (favorites: Track[]) => void,
  onError?: (err: any) => void
) {
  const favoritesRef = collection(db, 'users', userId, 'favorites');
  const q = query(favoritesRef, orderBy('addedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const favorites: Track[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        favorites.push({
          id: docSnap.id,
          title: data.title || '',
          artist: data.artist || '',
          duration: data.duration || 0,
          formattedDuration: data.formattedDuration || '',
          thumbnailUrl: data.thumbnailUrl || '',
          album: data.album || '',
          addedAt: data.addedAt || Date.now()
        });
      });
      onUpdate(favorites);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/favorites`);
      if (onError) onError(error);
    }
  );
}

export async function saveFavoriteToFirestore(userId: string, track: Track): Promise<void> {
  const path = `users/${userId}/favorites/${track.id}`;
  try {
    const favoriteRef = doc(db, 'users', userId, 'favorites', track.id);
    await setDoc(favoriteRef, {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      formattedDuration: track.formattedDuration || '',
      thumbnailUrl: track.thumbnailUrl,
      album: track.album || '',
      addedAt: track.addedAt || Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function removeFavoriteFromFirestore(userId: string, trackId: string): Promise<void> {
  const path = `users/${userId}/favorites/${trackId}`;
  try {
    const favoriteRef = doc(db, 'users', userId, 'favorites', trackId);
    await deleteDoc(favoriteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// User History / Recently Played Sync
export async function saveHistoryTrackToFirestore(userId: string, track: Track): Promise<void> {
  const path = `users/${userId}/history/${track.id}`;
  try {
    const historyRef = doc(db, 'users', userId, 'history', track.id);
    await setDoc(historyRef, {
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      formattedDuration: track.formattedDuration || '',
      thumbnailUrl: track.thumbnailUrl,
      playedAt: Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// User Taste Profile Sync
export async function saveTasteProfileToFirestore(userId: string, profile: UserInterestProfile): Promise<void> {
  const path = `users/${userId}/tasteProfile/data`;
  try {
    const profileRef = doc(db, 'users', userId, 'tasteProfile', 'data');
    await setDoc(profileRef, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
