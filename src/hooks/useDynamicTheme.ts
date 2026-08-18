import { useEffect, useState } from 'react';
import { Track } from '../types';
import { extractDominantColor, ExtractedColor } from '../utils/colorExtractor';

const DEFAULT_THEME: ExtractedColor = {
  hex: '#E2FF66',
  rgb: '226, 255, 102',
  rgba: (alpha: number) => `rgba(226, 255, 102, ${alpha})`,
  glow: 'rgba(226, 255, 102, 0.35)',
  isLight: true
};

export function useDynamicTheme(currentTrack: Track | null): ExtractedColor {
  const [theme, setTheme] = useState<ExtractedColor>(DEFAULT_THEME);

  useEffect(() => {
    let isMounted = true;

    if (!currentTrack?.thumbnailUrl) {
      setTheme(DEFAULT_THEME);
      return;
    }

    extractDominantColor(currentTrack.thumbnailUrl).then((color) => {
      if (isMounted) {
        setTheme(color);

        // Also inject CSS variable on root for easy CSS utilization
        document.documentElement.style.setProperty('--player-accent-hex', color.hex);
        document.documentElement.style.setProperty('--player-accent-rgb', color.rgb);
        document.documentElement.style.setProperty('--player-glow', color.glow);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.thumbnailUrl]);

  return theme;
}
