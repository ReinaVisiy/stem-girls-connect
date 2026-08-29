import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface Post {
  id: number;
  title: string;
  slug: string;
  body: string;
  image_url: string | null;
  published: boolean;
  published_at: string;
  created_at: string;
  media: { type: 'image' | 'video'; url: string; caption?: string }[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function excerpt(body: string, maxLen = 160) {
  const plain = body.replace(/[#*_>`\-]/g, '').trim();
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + '…' : plain;
}

const PostCard: React.FC<{ post: Post }> = ({ post }) => (
  <Link
    to={`/blog/${post.slug}`}
    className="block bg-white rounded-[40px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all overflow-hidden group"
  >
    {post.image_url && (
      <div className="w-full overflow-hidden">
        <img
          src={post.image_url}
          alt={post.title}
          className="w-full group-hover:scale-105 transition-transform duration-700"
        />
      </div>
    )}
    <div className="p-8">
      <p className="text-brandPink text-xs font-extrabold uppercase tracking-widest mb-3">{formatDate(post.published_at)}</p>
      <h3 className="text-xl font-extrabold text-brandGreen mb-3 uppercase tracking-tight leading-tight">{post.title}</h3>
      <p className="text-brandSlate text-sm font-medium leading-relaxed mb-6">{excerpt(post.body)}</p>
      <span className="inline-flex items-center gap-2 text-brandPink font-extrabold text-sm uppercase tracking-widest">
        Read more <ArrowRight size={16} />
      </span>
    </div>
  </Link>
);

export default PostCard;
export { formatDate, excerpt };
