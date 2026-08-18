/**
 * Utility for extracting vibrant dominant accent colors from image thumbnails.
 * Runs on an offscreen HTML Canvas and calculates luminance, saturation, and vibrancy.
 */

export interface ExtractedColor {
  hex: string;
  rgb: string;
  rgba: (alpha: number) => string;
  glow: string;
  isLight: boolean;
}

const DEFAULT_ACCENT: ExtractedColor = {
  hex: '#E2FF66',
  rgb: '226, 255, 102',
  rgba: (alpha: number) => `rgba(226, 255, 102, ${alpha})`,
  glow: 'rgba(226, 255, 102, 0.35)',
  isLight: true
};

const colorCache = new Map<string, ExtractedColor>();

export async function extractDominantColor(imageUrl?: string): Promise<ExtractedColor> {
  if (!imageUrl) return DEFAULT_ACCENT;

  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.referrerPolicy = 'no-referrer';

    // Timeout safety fallback
    const timer = setTimeout(() => {
      resolve(DEFAULT_ACCENT);
    }, 2000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_ACCENT);
          return;
        }

        const width = (canvas.width = 40);
        const height = (canvas.height = 40);

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let bestColor = { r: 226, g: 255, b: 102, score: -1 };

        // Analyze pixels to find the most saturated and visually pleasing accent color
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Skip transparent pixels

          // Calculate HSL
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / (2 * 255);
          const delta = max - min;

          // Skip overly dark or overly white pixels
          if (l < 0.15 || l > 0.92) continue;

          let s = 0;
          if (delta !== 0) {
            s = l > 0.5 ? delta / (2 * 255 - delta) : delta / (max + min);
          }

          // Boost colors with high saturation and balanced luminance
          const score = s * 1.5 + (1 - Math.abs(l - 0.55));

          if (score > bestColor.score) {
            bestColor = { r, g, b, score };
          }
        }

        // If no high-saturation color found, boost the colors slightly for vibrancy
        let { r, g, b } = bestColor;
        
        // Ensure contrast against dark canvas
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 70) {
          r = Math.min(255, Math.floor(r * 1.6 + 50));
          g = Math.min(255, Math.floor(g * 1.6 + 50));
          b = Math.min(255, Math.floor(b * 1.6 + 50));
        }

        const toHex = (c: number) => c.toString(16).padStart(2, '0');
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        const rgb = `${r}, ${g}, ${b}`;

        const result: ExtractedColor = {
          hex,
          rgb,
          rgba: (alpha: number) => `rgba(${rgb}, ${alpha})`,
          glow: `rgba(${rgb}, 0.35)`,
          isLight: brightness > 128
        };

        colorCache.set(imageUrl, result);
        resolve(result);
      } catch (err) {
        console.warn('[ifu listener] Color extraction canvas error:', err);
        resolve(DEFAULT_ACCENT);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(DEFAULT_ACCENT);
    };

    img.src = imageUrl;
  });
}
