/* ─── Video URL helpers — single source of truth ──────────────────────────
   Admin accepts direct files (.mp4…), YouTube/Vimeo links AND Google Drive
   share links. The storefront must:
     1. recognise all of them as *video* (never render as broken images),
     2. play Drive/YouTube/Vimeo inside OUR OWN dialog via embed iframes —
        never redirect the shopper to drive.google.com dialogs.
   Drive files must be shared as "Anyone with the link can view".
──────────────────────────────────────────────────────────────────────────── */

const DRIVE_ID_PATTERNS: RegExp[] = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
  /drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]+)/i,
  /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  /[?&]id=([a-zA-Z0-9_-]{10,})(?:[&#]|$)/,
];

/** Extract the Google Drive file ID from any share URL shape. Null when absent. */
export function extractDriveId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  for (const re of DRIVE_ID_PATTERNS) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

/** True for any Google Drive / Docs file URL (share, open, preview, uc). */
export function isDriveUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  if (extractDriveId(url)) return true;
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}

const YT_ID_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?[^#]*\bv=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/i,
];

/** Extract the YouTube video ID from watch/shorts/share/embed URLs. */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  for (const re of YT_ID_PATTERNS) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return !!extractYouTubeId(url) || /youtube\.com|youtu\.be/i.test(url);
}

export function isVimeoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return /vimeo\.com/i.test(url);
}

/** Direct-stream files playable in a native <video> tag. */
export function isDirectVideoFile(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|ogg|mov)([?#]|$)/i.test(url);
}

/** Anything the storefront should treat as *video* (never as an image). */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return isDirectVideoFile(url) || isDriveUrl(url) || isYouTubeUrl(url) || isVimeoUrl(url);
}

/**
 * Embed src for OUR OWN dialog/player (iframe). Returns null for direct files
 * (those belong in a <video> tag, see isDirectVideoFile).
 * - Drive  → https://drive.google.com/file/d/ID/preview (in-page player)
 * - YouTube → youtube-nocookie embed
 * - Vimeo  → player embed (falls back to the share URL when no numeric ID)
 */
export function videoEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const driveId = extractDriveId(url);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`;
  if (isVimeoUrl(url)) {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m && m[1]) return `https://player.vimeo.com/video/${m[1]}`;
    return url;
  }
  return null;
}

/** True when the URL needs an iframe (Drive/YouTube/Vimeo), not a <video> tag. */
export function isEmbedVideoUrl(url: string | null | undefined): boolean {
  return videoEmbedUrl(url) !== null;
}

/** 3D model files (never images, never video). */
export function isModel3DUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return /\.(glb|gltf|usdz|obj|fbx)([?#]|$)/i.test(url);
}

/**
 * Safe for <img> stacks (gallery, cards, thumbnails). Excludes video of every
 * kind (direct files, Drive, YouTube, Vimeo) and 3D models, plus junk.
 */
export function isDisplayableImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const s = url.trim();
  if (s.length <= 2) return false;
  if (isVideoUrl(s) || isModel3DUrl(s)) return false;
  return true;
}
