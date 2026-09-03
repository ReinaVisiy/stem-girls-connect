import React, { useEffect, useState } from 'react';
import { Share2, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getClientId } from '../lib/clientId';

interface Props {
  postId: number;
  title: string;
}

type Reaction = 'like' | 'dislike' | null;

const PostReactions: React.FC<Props> = ({ postId, title }) => {
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userReaction, setUserReaction] = useState<Reaction>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const clientId = getClientId();
    if (!clientId) return;

    fetch(`/api/reactions?postId=${postId}&clientId=${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        setLikes(data.likes ?? 0);
        setDislikes(data.dislikes ?? 0);
        setUserReaction(data.userReaction ?? null);
      })
      .catch(() => {
        // Reactions are a nice-to-have, not core content — fail quietly
        // and leave the widget at its zero-state rather than showing an
        // error banner on someone's blog post.
      })
      .finally(() => setLoading(false));
  }, [postId]);

  const react = async (target: Exclude<Reaction, null>) => {
    const clientId = getClientId();
    if (!clientId) return;

    // Toggle off if clicking the already-active reaction, otherwise switch to it.
    const next: Reaction = userReaction === target ? null : target;

    // Optimistic update so the button feels instant.
    setUserReaction(next);
    setLikes((n) => n + (target === 'like' ? (next ? 1 : -1) : userReaction === 'like' ? -1 : 0));
    setDislikes((n) => n + (target === 'dislike' ? (next ? 1 : -1) : userReaction === 'dislike' ? -1 : 0));

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, clientId, reaction: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setLikes(data.likes ?? 0);
        setDislikes(data.dislikes ?? 0);
        setUserReaction(data.userReaction ?? null);
      }
    } catch {
      // leave the optimistic state as-is; a page refresh will resync
    }
  };

  const share = async () => {
    const url = window.location.href;

    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    }).catch(() => {});

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the share sheet — not an error, just stop here
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; nothing more we can do without a UI library
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 py-8 border-y border-gray-100 dark:border-slate-700">
      <button
        onClick={() => react('like')}
        disabled={loading}
        aria-pressed={userReaction === 'like'}
        aria-label="Like this post"
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-sm transition-all ${
          userReaction === 'like'
            ? 'bg-brandGreen/10 text-brandGreen dark:bg-brandGreen/20'
            : 'bg-gray-50 dark:bg-slate-700 text-brandSlate hover:bg-gray-100 dark:hover:bg-slate-600'
        }`}
      >
        <ThumbsUp size={18} fill={userReaction === 'like' ? '#269464' : 'none'} strokeWidth={2} />
        <span>{likes}</span>
      </button>

      <button
        onClick={() => react('dislike')}
        disabled={loading}
        aria-pressed={userReaction === 'dislike'}
        aria-label="Dislike this post"
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-sm transition-all ${
          userReaction === 'dislike'
            ? 'bg-brandPink/10 text-brandPink dark:bg-brandPink/20'
            : 'bg-gray-50 dark:bg-slate-700 text-brandSlate hover:bg-gray-100 dark:hover:bg-slate-600'
        }`}
      >
        <ThumbsDown size={18} fill={userReaction === 'dislike' ? '#82246d' : 'none'} strokeWidth={2} />
        <span>{dislikes}</span>
      </button>

      <button
        onClick={share}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-sm bg-gray-50 dark:bg-slate-700 text-brandSlate hover:bg-gray-100 dark:hover:bg-slate-600 transition-all"
      >
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        <span>{copied ? 'Link Copied' : 'Share'}</span>
      </button>
    </div>
  );
};

export default PostReactions;
