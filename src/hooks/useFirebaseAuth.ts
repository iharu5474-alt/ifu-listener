import { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, testFirestoreConnection } from '../services/firebase';

export interface FirebaseAuthState {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Initial connection test
    testFirestoreConnection().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      const loggedUser = await signInWithGoogle();
      return loggedUser;
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  }, []);

  return {
    user,
    loading,
    isOnline,
    signIn: handleSignIn,
    signOut: handleSignOut
  };
}
