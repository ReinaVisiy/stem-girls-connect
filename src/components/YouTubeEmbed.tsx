import React from 'react';

/**
 * Accepts a full YouTube URL in any common format (watch, youtu.be,
 * embed, shorts) or a bare 11-char video ID, and returns just the ID.
 * Returns null if nothing recognizable was found, so callers can
 * skip rendering rather than embed a broken player.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();

  // Bare video ID (YouTube IDs are 11 chars: letters, digits, - and _)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1).split('/')[0] || null;
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const match = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
      if (match) return match[2];
    }
  } catch {
    // not a valid URL — fall through to null
  }

  return null;
}

const YouTubeEmbed: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => (
  <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title={title}
      className="absolute inset-0 w-full h-full"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  </div>
);

export default YouTubeEmbed;
