export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function parseYouTubeDuration(isoDuration: string): number {
  if (!isoDuration) return 180;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 180;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function extractYouTubePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  // Check if it's already a playlist ID (e.g. PLxxx or RDxxx or OLAK5xxx)
  if (/^[A-Za-z0-9_-]{12,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;
  } catch {
    // If not a standard URL, try regex
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  return null;
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1).split('?')[0];
    }
    const vParam = url.searchParams.get('v');
    if (vParam) return vParam;
  } catch {
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) return match[1];
  }
  return null;
}

export function cleanTrackTitle(rawTitle: string): { title: string; artist: string } {
  let cleaned = rawTitle
    .replace(/\s*\(?(?:official\s*(?:video|audio|music\s*video|lyric\s*video|visualizer|hd|4k)?)\)?/gi, '')
    .replace(/\s*\[?(?:official\s*(?:video|audio|music\s*video|lyric\s*video|visualizer|hd|4k)?)\]?/gi, '')
    .replace(/\s*\(?(?:lyrics?|remastered|hq|audio)\)?/gi, '')
    .trim();

  // Split on " - " or " – " if present
  const delimiters = [' - ', ' – ', ' — ', ' | ', ' // '];
  for (const delim of delimiters) {
    if (cleaned.includes(delim)) {
      const parts = cleaned.split(delim);
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(' - ').trim()
        };
      }
    }
  }

  return {
    title: cleaned,
    artist: 'Various Artists'
  };
}
