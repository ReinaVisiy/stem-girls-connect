import React from 'react';
import { ExternalLink, PlayCircle } from 'lucide-react';
import { extractYouTubeId } from './YouTubeEmbed';

export type EmbedKind = 'youtube' | 'vimeo' | 'drive' | 'videofile' | 'audio' | 'link';

export interface DetectedEmbed {
  kind: EmbedKind;
  /** Provider ID for iframe-based embeds (youtube/vimeo/drive); unused otherwise. */
  id?: string;
  url: string;
}

const VIDEO_FILE_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const AUDIO_FILE_EXT = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i;

/**
 * Figures out how to play a pasted media link. Recognized providers get
 * a real inline player; a direct video/audio file gets a native player;
 * anything else safely falls back to a "listen/watch" link card instead
 * of trying (and failing) to iframe an arbitrary third-party site.
 */
export function detectEmbed(input: string): DetectedEmbed {
  const url = input.trim();

  const youtubeId = extractYouTubeId(url);
  if (youtubeId) return { kind: 'youtube', id: youtubeId, url };

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('vimeo.com')) {
      const match = parsed.pathname.match(/(\d+)/);
      if (match) return { kind: 'vimeo', id: match[1], url };
    }

    if (parsed.hostname.includes('drive.google.com')) {
      const match = parsed.pathname.match(/\/d\/([\w-]+)/) || [null, parsed.searchParams.get('id')];
      if (match && match[1]) return { kind: 'drive', id: match[1], url };
    }
  } catch {
    // Not a valid absolute URL — falls through to the link card below.
  }

  if (VIDEO_FILE_EXT.test(url)) return { kind: 'videofile', url };
  if (AUDIO_FILE_EXT.test(url)) return { kind: 'audio', url };

  return { kind: 'link', url };
}

const IFRAME_SRC: Record<'youtube' | 'vimeo' | 'drive', (id: string) => string> = {
  youtube: (id) => `https://www.youtube.com/embed/${id}`,
  vimeo: (id) => `https://player.vimeo.com/video/${id}`,
  drive: (id) => `https://drive.google.com/file/d/${id}/preview`,
};

const MediaEmbed: React.FC<{ url: string; title: string }> = ({ url, title }) => {
  const detected = detectEmbed(url);

  if (detected.kind === 'youtube' || detected.kind === 'vimeo' || detected.kind === 'drive') {
    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
        <iframe
          src={IFRAME_SRC[detected.kind](detected.id!)}
          title={title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (detected.kind === 'videofile') {
    return <video src={detected.url} controls className="w-full" />;
  }

  if (detected.kind === 'audio') {
    return (
      <div className="bg-[#486e7c]/5 dark:bg-white/5 rounded-2xl p-6">
        <audio src={detected.url} controls className="w-full" />
      </div>
    );
  }

  // Unrecognized link: most third-party sites block iframing anyway
  // (X-Frame-Options), so a styled outbound link is more reliable than
  // a broken embed.
  return (
    <a
      href={detected.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 bg-[#486e7c]/5 dark:bg-white/5 rounded-2xl p-6 hover:bg-[#486e7c]/10 dark:hover:bg-white/10 transition-colors"
    >
      <PlayCircle size={32} className="text-brandPink shrink-0" />
      <div className="flex-grow min-w-0">
        <p className="font-extrabold text-brandGreen truncate">{title}</p>
        <p className="text-brandSlate text-xs font-medium truncate">{detected.url}</p>
      </div>
      <ExternalLink size={18} className="text-brandSlate shrink-0" />
    </a>
  );
};

export default MediaEmbed;
