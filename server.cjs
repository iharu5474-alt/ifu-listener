var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
function cleanTrackTitle(rawTitle) {
  let cleaned = rawTitle.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s*[\(\[\{]?(Official\s*(Music\s*)?Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Live|HQ|Official)[\)\]\}]?\s*/gi, " ").trim();
  if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ");
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(" - ").trim()
    };
  }
  if (cleaned.includes(" \u2014 ")) {
    const parts = cleaned.split(" \u2014 ");
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(" \u2014 ").trim()
    };
  }
  if (cleaned.includes(" | ")) {
    const parts = cleaned.split(" | ");
    return {
      artist: parts[1].trim(),
      title: parts[0].trim()
    };
  }
  return {
    artist: "YouTube Artist",
    title: cleaned
  };
}
function parseYouTubeDuration(durationStr) {
  if (!durationStr) return 210;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 210;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
function extractYouTubeVideoId(input) {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}
function extractYouTubePlaylistId(input) {
  const trimmed = input.trim();
  if (/^(?:PL|UU|LL|RD|FL)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  const regex = /[?&]list=([^#&?]+)/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}
async function fallbackPublicYouTubeSearch(query) {
  const searchResults = [];
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (response.ok) {
      const html = await response.text();
      const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/window\["ytInitialData"\] = ({.*?});/s);
      if (ytInitialDataMatch && ytInitialDataMatch[1]) {
        const data = JSON.parse(ytInitialDataMatch[1]);
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        if (Array.isArray(contents)) {
          for (const section of contents) {
            const items = section?.itemSectionRenderer?.contents;
            if (Array.isArray(items)) {
              for (const item of items) {
                const video = item?.videoRenderer;
                if (video && video.videoId) {
                  const videoId = video.videoId;
                  const rawTitle = video.title?.runs?.[0]?.text || "Unknown Track";
                  const artist = video.ownerText?.runs?.[0]?.text || "YouTube Creator";
                  const durationText = video.lengthText?.simpleText || "3:30";
                  let duration = 210;
                  if (durationText && durationText.includes(":")) {
                    const parts = durationText.split(":").map(Number);
                    if (parts.length === 2) duration = parts[0] * 60 + parts[1];
                    else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                  }
                  const { title: cleanedTitle, artist: parsedArtist } = cleanTrackTitle(rawTitle);
                  searchResults.push({
                    id: videoId,
                    title: cleanedTitle,
                    artist: artist || parsedArtist,
                    duration,
                    formattedDuration: durationText,
                    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    album: artist
                  });
                  if (searchResults.length >= 20) break;
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[ifu listener] Fallback search scraper error:", err);
  }
  if (searchResults.length === 0) {
    const mirrors = [
      `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
      `https://invidious.private.coffee/api/v1/search?q=${encodeURIComponent(query)}&type=video`
    ];
    for (const mirror of mirrors) {
      try {
        const mirrorRes = await fetch(mirror, { signal: AbortSignal.timeout(3500) });
        if (mirrorRes.ok) {
          const mirrorData = await mirrorRes.json();
          if (Array.isArray(mirrorData)) {
            for (const item of mirrorData) {
              if (item.videoId) {
                const { title, artist } = cleanTrackTitle(item.title || "");
                searchResults.push({
                  id: item.videoId,
                  title,
                  artist: item.author || artist,
                  duration: item.lengthSeconds || 210,
                  formattedDuration: `${Math.floor((item.lengthSeconds || 210) / 60)}:${((item.lengthSeconds || 210) % 60).toString().padStart(2, "0")}`,
                  thumbnailUrl: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                  album: item.author
                });
                if (searchResults.length >= 15) break;
              }
            }
          }
        }
        if (searchResults.length > 0) break;
      } catch {
      }
    }
  }
  return searchResults;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log(`[ifu listener API] ${req.method} ${req.path}`);
    }
    next();
  });
  app.get("/api/youtube/status", async (req, res) => {
    const customKey = req.headers["x-youtube-api-key"] || req.query.key;
    const resolvedKey = customKey || process.env.YOUTUBE_API_KEY;
    if (!resolvedKey) {
      return res.json({
        configured: false,
        enabled: false,
        source: "none",
        message: "No YouTube Data API v3 key is currently configured.",
        diagnostic: "Set YOUTUBE_API_KEY in environment or input custom key in ifu listener search settings."
      });
    }
    try {
      const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=music&key=${resolvedKey}`;
      const apiRes = await fetch(testUrl);
      const data = await apiRes.json();
      if (apiRes.ok) {
        return res.json({
          configured: true,
          enabled: true,
          source: customKey ? "custom" : "server_env",
          message: "YouTube Data API v3 is active and operational!"
        });
      } else {
        console.warn("[ifu listener server] YouTube API Key Test Notice:", data?.error?.message || apiRes.statusText);
        const errObj = data.error || {};
        return res.json({
          configured: true,
          enabled: false,
          source: customKey ? "custom" : "server_env",
          error: {
            status: apiRes.status,
            statusText: apiRes.statusText,
            code: errObj.code || apiRes.status,
            message: errObj.message || "YouTube Data API call was rejected.",
            reason: errObj.errors?.[0]?.reason || "unknown",
            domain: errObj.errors?.[0]?.domain || "unknown",
            extendedHelp: errObj.errors?.[0]?.extendedHelp || "https://console.developers.google.com/apis/api/youtube.googleapis.com/overview",
            raw: data
          }
        });
      }
    } catch (err) {
      return res.status(500).json({
        configured: true,
        enabled: false,
        message: "Network error connecting to Google YouTube API: " + (err?.message || err)
      });
    }
  });
  app.get("/api/youtube/video", async (req, res) => {
    const input = req.query.id || req.query.url || "";
    const videoId = extractYouTubeVideoId(input) || input.trim();
    if (!videoId) {
      return res.status(400).json({ error: "Valid video ID or URL is required" });
    }
    const customKey = req.headers["x-youtube-api-key"] || req.query.key;
    const resolvedKey = customKey || process.env.YOUTUBE_API_KEY;
    if (resolvedKey) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${resolvedKey}`;
        const ytRes = await fetch(url);
        if (ytRes.ok) {
          const data = await ytRes.json();
          const item = data.items?.[0];
          if (item) {
            const { title, artist } = cleanTrackTitle(item.snippet.title);
            const duration = item.contentDetails ? parseYouTubeDuration(item.contentDetails.duration) : 210;
            return res.json({
              track: {
                id: item.id,
                title,
                artist: item.snippet.channelTitle || artist,
                duration,
                formattedDuration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`,
                thumbnailUrl: item.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                album: item.snippet.channelTitle
              }
            });
          }
        }
      } catch (err) {
        console.warn("[ifu listener] Single video API error:", err);
      }
    }
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        const { title, artist } = cleanTrackTitle(oembedData.title || `YouTube Video [${videoId}]`);
        return res.json({
          track: {
            id: videoId,
            title,
            artist: oembedData.author_name || artist,
            duration: 210,
            formattedDuration: "3:30",
            thumbnailUrl: oembedData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            album: oembedData.author_name || "YouTube Stream"
          }
        });
      }
    } catch (err) {
      console.warn("[ifu listener] oembed fallback error:", err);
    }
    return res.json({
      track: {
        id: videoId,
        title: `Audio Stream [${videoId}]`,
        artist: "YouTube Audio",
        duration: 210,
        formattedDuration: "3:30",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        album: "Direct Stream"
      }
    });
  });
  app.get("/api/youtube/suggestions", async (req, res) => {
    const query = (req.query.q || "").trim();
    if (!query || query.length < 2) {
      return res.json({ suggestions: [], query });
    }
    const directVideoId = extractYouTubeVideoId(query);
    if (directVideoId) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directVideoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          const { title, artist } = cleanTrackTitle(oembedData.title || "YouTube Track");
          return res.json({
            suggestions: [
              {
                id: directVideoId,
                title,
                artist: oembedData.author_name || artist,
                duration: 210,
                formattedDuration: "3:30",
                thumbnailUrl: oembedData.thumbnail_url || `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
                album: oembedData.author_name
              }
            ],
            query
          });
        }
      } catch {
      }
    }
    const customKey = req.headers["x-youtube-api-key"] || req.query.key;
    const resolvedKey = customKey || process.env.YOUTUBE_API_KEY;
    if (resolvedKey) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(query)}&key=${resolvedKey}`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const tracks = (searchData.items || []).map((item) => {
            const { title, artist } = cleanTrackTitle(item.snippet.title);
            return {
              id: item.id.videoId,
              title,
              artist: item.snippet.channelTitle || artist,
              duration: 210,
              formattedDuration: "3:30",
              thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
              album: item.snippet.channelTitle
            };
          });
          if (tracks.length > 0) {
            return res.json({ suggestions: tracks, query });
          }
        }
      } catch (err) {
        console.warn("[ifu listener] suggestions API key error:", err);
      }
    }
    try {
      const fallbackTracks = await fallbackPublicYouTubeSearch(query);
      return res.json({
        suggestions: fallbackTracks.slice(0, 6),
        query
      });
    } catch (err) {
      return res.json({ suggestions: [], query });
    }
  });
  app.get("/api/youtube/search", async (req, res) => {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res.json({ tracks: [], diagnostic: { message: "Empty query" } });
    }
    console.log(`[ifu listener] Searching YouTube for query: "${query}"`);
    const directVideoId = extractYouTubeVideoId(query);
    if (directVideoId) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${directVideoId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          const { title, artist } = cleanTrackTitle(oembedData.title || "YouTube Track");
          return res.json({
            tracks: [
              {
                id: directVideoId,
                title,
                artist: oembedData.author_name || artist,
                duration: 210,
                formattedDuration: "3:30",
                thumbnailUrl: oembedData.thumbnail_url || `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
                album: oembedData.author_name
              }
            ],
            directMatch: true,
            searchedWithKey: false
          });
        }
      } catch {
      }
    }
    const customKey = req.headers["x-youtube-api-key"] || req.query.key;
    const resolvedKey = customKey || process.env.YOUTUBE_API_KEY;
    let rawApiError = null;
    let validTracksFromApi = [];
    if (resolvedKey) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=${encodeURIComponent(query)}&key=${resolvedKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        console.log(`[ifu listener server] YouTube Search Response HTTP ${searchRes.status}:`, JSON.stringify(searchData, null, 2));
        if (!searchRes.ok) {
          console.warn(`[ifu listener server] YouTube API Key Notice (HTTP ${searchRes.status}):`, searchData?.error?.message || searchRes.statusText);
          const errObj = searchData.error || {};
          rawApiError = {
            status: searchRes.status,
            statusText: searchRes.statusText,
            code: errObj.code || searchRes.status,
            message: errObj.message || `YouTube API returned status ${searchRes.status}`,
            reason: errObj.errors?.[0]?.reason || "unknown",
            domain: errObj.errors?.[0]?.domain || "unknown",
            extendedHelp: errObj.errors?.[0]?.extendedHelp || "https://console.developers.google.com/apis/api/youtube.googleapis.com/overview",
            raw: searchData
          };
        } else {
          const videoIds = (searchData.items || []).map((item) => item.id?.videoId).filter(Boolean).join(",");
          if (videoIds) {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoIds}&key=${resolvedKey}`;
            const videosRes = await fetch(videosUrl);
            if (videosRes.ok) {
              const videosData = await videosRes.json();
              validTracksFromApi = (videosData.items || []).filter((item) => item.status ? item.status.embeddable !== false : true).map((item) => {
                const { title, artist } = cleanTrackTitle(item.snippet.title);
                const duration = item.contentDetails ? parseYouTubeDuration(item.contentDetails.duration) : 210;
                return {
                  id: item.id,
                  title,
                  artist: item.snippet.channelTitle || artist,
                  duration,
                  formattedDuration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`,
                  thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                  album: item.snippet.channelTitle
                };
              });
            }
          }
        }
      } catch (err) {
        console.error("[ifu listener server] YouTube API fetch exception:", err);
        rawApiError = {
          status: 500,
          statusText: "Internal Fetch Error",
          message: err?.message || "Error communicating with YouTube API server",
          raw: err
        };
      }
    } else {
      rawApiError = {
        status: 404,
        statusText: "No Key Configured",
        message: "No YouTube Data API v3 key is currently configured on the server environment."
      };
    }
    if (validTracksFromApi.length > 0) {
      return res.json({
        tracks: validTracksFromApi,
        searchedWithKey: true,
        source: "official_youtube_api_v3"
      });
    }
    console.log(`[ifu listener] Attempting public fallback search for query: "${query}"...`);
    const fallbackTracks = await fallbackPublicYouTubeSearch(query);
    return res.json({
      tracks: fallbackTracks,
      searchedWithKey: Boolean(resolvedKey),
      source: fallbackTracks.length > 0 ? "public_search_engine" : "none",
      apiError: fallbackTracks.length > 0 ? null : rawApiError,
      diagnostic: rawApiError ? {
        message: rawApiError.message,
        reason: rawApiError.reason,
        status: rawApiError.status
      } : void 0
    });
  });
  app.get("/api/youtube/related", async (req, res) => {
    const videoId = (req.query.id || "").trim();
    const artist = (req.query.artist || "").trim();
    const title = (req.query.title || "").trim();
    if (!videoId && !artist && !title) {
      return res.json({ tracks: [] });
    }
    console.log(`[ifu listener] Finding related/Up Next tracks for: "${title}" by "${artist}" [${videoId}]`);
    const customKey = req.headers["x-youtube-api-key"] || req.query.key;
    const resolvedKey = customKey || process.env.YOUTUBE_API_KEY;
    let relatedTracks = [];
    if (resolvedKey) {
      try {
        const query = artist && artist !== "YouTube Artist" && artist !== "YouTube Creator" ? `${artist} music` : `${title} official audio`;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=15&q=${encodeURIComponent(query)}&key=${resolvedKey}`;
        const searchRes = await fetch(searchUrl);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const candidateIds = (searchData.items || []).map((item) => item.id?.videoId).filter((id) => id && id !== videoId).join(",");
          if (candidateIds) {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${candidateIds}&key=${resolvedKey}`;
            const videosRes = await fetch(videosUrl);
            if (videosRes.ok) {
              const videosData = await videosRes.json();
              relatedTracks = (videosData.items || []).filter((item) => item.status ? item.status.embeddable !== false : true).filter((item) => item.id !== videoId).map((item) => {
                const { title: cleanedTitle, artist: parsedArtist } = cleanTrackTitle(item.snippet.title);
                const duration = item.contentDetails ? parseYouTubeDuration(item.contentDetails.duration) : 210;
                return {
                  id: item.id,
                  title: cleanedTitle,
                  artist: item.snippet.channelTitle || parsedArtist,
                  duration,
                  formattedDuration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`,
                  thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                  album: item.snippet.channelTitle
                };
              });
            }
          }
        }
      } catch (err) {
        console.warn("[ifu listener] Related tracks API key error:", err);
      }
    }
    if (relatedTracks.length < 3) {
      try {
        const query = artist && artist !== "YouTube Artist" && artist !== "YouTube Creator" ? `${artist} music` : `${title} songs`;
        const fallbackResults = await fallbackPublicYouTubeSearch(query);
        const filteredFallback = fallbackResults.filter((t) => t.id !== videoId);
        const existingIds = new Set(relatedTracks.map((t) => t.id));
        for (const track of filteredFallback) {
          if (!existingIds.has(track.id)) {
            relatedTracks.push(track);
            existingIds.add(track.id);
          }
        }
      } catch (err) {
        console.warn("[ifu listener] Fallback related tracks search error:", err);
      }
    }
    return res.json({
      tracks: relatedTracks.slice(0, 10),
      sourceId: videoId
    });
  });
  app.get("/api/youtube/playlist", async (req, res) => {
    const input = req.query.id || req.query.url || "";
    const playlistId = extractYouTubePlaylistId(input) || input.trim();
    if (!playlistId) {
      return res.status(400).json({ error: "Valid YouTube Playlist ID or URL is required" });
    }
    const customKey = req.headers["x-youtube-api-key"] || req.query.key;
    const resolvedKey = customKey || process.env.YOUTUBE_API_KEY;
    if (resolvedKey) {
      try {
        const metaUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${resolvedKey}`;
        const metaRes = await fetch(metaUrl);
        const metaData = await metaRes.json();
        if (!metaRes.ok) {
          console.error("[ifu listener] YouTube Playlist Meta API Error:", metaData);
          return res.status(metaRes.status).json({
            error: metaData.error || { message: "Failed to fetch playlist metadata" },
            status: metaRes.status
          });
        }
        const playlistSnippet = metaData.items?.[0]?.snippet;
        const playlistTitle = playlistSnippet?.title || "YouTube Playlist";
        const playlistDesc = playlistSnippet?.description || "";
        const coverUrl = playlistSnippet?.thumbnails?.high?.url || playlistSnippet?.thumbnails?.medium?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80";
        const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${resolvedKey}`;
        const itemsRes = await fetch(itemsUrl);
        const itemsData = await itemsRes.json();
        if (itemsRes.ok && itemsData.items) {
          const videoIds = itemsData.items.map((item) => item.contentDetails?.videoId).filter(Boolean).join(",");
          let tracks = [];
          if (videoIds) {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoIds}&key=${resolvedKey}`;
            const videosRes = await fetch(videosUrl);
            if (videosRes.ok) {
              const videosData = await videosRes.json();
              tracks = (videosData.items || []).filter((item) => item.status ? item.status.embeddable !== false : true).map((item) => {
                const { title, artist } = cleanTrackTitle(item.snippet.title);
                const duration = item.contentDetails ? parseYouTubeDuration(item.contentDetails.duration) : 210;
                return {
                  id: item.id,
                  title,
                  artist: item.snippet.channelTitle || artist,
                  duration,
                  formattedDuration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`,
                  thumbnailUrl: item.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                  album: playlistTitle
                };
              });
            }
          }
          return res.json({
            playlist: {
              id: `yt-pl-${playlistId}`,
              title: playlistTitle,
              description: playlistDesc,
              coverUrl,
              tracks,
              isCustom: true,
              youtubePlaylistId: playlistId,
              createdAt: Date.now()
            }
          });
        }
      } catch (err) {
        console.error("[ifu listener] Playlist fetch error:", err);
        return res.status(500).json({ error: err?.message || "Error fetching playlist" });
      }
    }
    return res.status(403).json({
      error: {
        message: "A valid YouTube Data API v3 key is required to import full YouTube playlists.",
        reason: "accessNotConfigured"
      }
    });
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "ifu listener", timestamp: Date.now() });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ifu listener] Server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
