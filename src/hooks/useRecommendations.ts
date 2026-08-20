import { useCallback, useEffect, useState } from 'react';
import { RankedTrack, Track, UserInterestProfile } from '../types';
import {
  buildUserProfile,
  computePersonalizedRecommendations,
  getDislikedTrackIds,
  recordDislike,
  recordLike,
  recordPlayProgress,
  recordPlayStart,
  recordSkip
} from '../services/recommendationEngine';

export function useRecommendations(favorites: Track[], customApiKey?: string) {
  const [recommendations, setRecommendations] = useState<RankedTrack[]>([]);
  const [userProfile, setUserProfile] = useState<UserInterestProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRecomputedAt, setLastRecomputedAt] = useState<number>(Date.now());

  const refreshRecommendations = useCallback(async (forceFresh = true) => {
    setIsLoading(true);
    try {
      const recs = await computePersonalizedRecommendations(favorites, customApiKey, forceFresh);
      setRecommendations(recs);
      setUserProfile(buildUserProfile());
      setLastRecomputedAt(Date.now());
    } catch (e) {
      console.warn('[ifu listener] Recommendation engine computation error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [favorites, customApiKey]);

  // Initial load
  useEffect(() => {
    refreshRecommendations(false);
  }, [refreshRecommendations]);

  // Handler for user disliking / dismissing a recommended song
  const handleDislikeTrack = useCallback(
    (trackId: string) => {
      recordDislike(trackId);
      setRecommendations((prev) => prev.filter((t) => t.id !== trackId));
      setUserProfile(buildUserProfile());
    },
    []
  );

  return {
    recommendations,
    userProfile,
    isLoading,
    lastRecomputedAt,
    refreshRecommendations,
    handleDislikeTrack,
    trackPlayStart: recordPlayStart,
    trackPlayProgress: recordPlayProgress,
    trackSkip: recordSkip,
    trackLike: recordLike
  };
}
