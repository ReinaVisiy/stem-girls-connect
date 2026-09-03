import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { formatDate, excerpt, Post, MediaItem } from '../components/PostCard';
import PhotoGallery from '../components/PhotoGallery';
import YouTubeEmbed, { extractYouTubeId } from '../components/YouTubeEmbed';
import MediaEmbed from '../components/MediaEmbed';
import PostReactions from '../components/PostReactions';
import { useApiData } from '../hooks/useApiData';

// Matches {{media:0}}, {{media:a1b2c3d4}}, {{ media : xyz }}, etc. on
// their own — admins place this on its own line in the write-up to
// position that media item there. Resolves against each item's stable
// `id` first (survives reordering/deletion of other items); falls back
// to treating the token as a raw array index for older posts whose
// media items predate the id field.
const MEDIA_PLACEHOLDER = /\{\{\s*media\s*:\s*([\w-]+)\s*\}\}/g;

function resolveMediaToken(token: string, media: MediaItem[]): number | null {
  const byId = media.findIndex((m) => m.id === token);
  if (byId !== -1) return byId;
  const asIndex = parseInt(token, 10);
  return !isNaN(asIndex) && media[asIndex] ? asIndex : null;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, loading, error } = useApiData<Post>(`/api/posts?slug=${encodeURIComponent(slug ?? '')}`);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="h-8 w-2/3 bg-gray-100 dark:bg-slate-700 rounded-full animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-[40px] animate-pulse" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-6 py-24 text-center max-w-2xl">
        <h1 className="text-2xl font-extrabold text-brandGreen uppercase mb-4">Post Not Found</h1>
        <p className="text-brandSlate font-medium mb-8">This update may have been moved or unpublished.</p>
        <Link to="/blog" className="inline-flex items-center gap-2 text-brandPink font-extrabold uppercase tracking-widest text-sm hover:underline">
          <ArrowLeft size={16} /> Back to Blog
        </Link>
      </div>
    );
  }

  const media = post.media ?? [];

  // Gallery order: cover photo first (if any), then every image-type
  // media item in array order — regardless of where each one ends up
  // displayed in the body, clicking any of them lets you page through
  // all of them. Precompute media-array-index -> gallery-index so both
  // the inline and "leftover" renderers can open the right one.
  const galleryImages = [
    ...(post.image_url ? [{ src: post.image_url, alt: post.title }] : []),
    ...media.filter((item) => item.type === 'image').map((item) => ({ src: item.url, alt: item.caption ?? post.title })),
  ];
  const galleryIndexForMedia = new Map<number, number>();
  {
    let gi = post.image_url ? 1 : 0;
    media.forEach((item, i) => {
      if (item.type === 'image') {
        galleryIndexForMedia.set(i, gi);
        gi += 1;
      }
    });
  }

  const renderMediaItem = (item: MediaItem, index: number, open: (i: number) => void) => {
    if (item.type === 'video') {
      return <video src={item.url} controls className="w-full rounded-none" />;
    }
    if (item.type === 'youtube') {
      const videoId = extractYouTubeId(item.url);
      return videoId ? <YouTubeEmbed videoId={videoId} title={item.caption ?? post.title} /> : null;
    }
    if (item.type === 'embed') {
      return <MediaEmbed url={item.url} title={item.caption ?? post.title} />;
    }
    const galleryIdx = galleryIndexForMedia.get(index);
    return (
      <img
        src={item.url}
        alt={item.caption ?? post.title}
        onClick={() => galleryIdx !== undefined && open(galleryIdx)}
        className="w-full cursor-zoom-in"
      />
    );
  };

  return (
    <div className="pb-24">
      <Seo
        title={`${post.title} | STEM Girls Connect`}
        description={excerpt(post.body, 155)}
        path={`/blog/${post.slug}`}
      />
      <PageHeader title={post.title} subtitle={formatDate(post.published_at)} />

      <article className="container mx-auto px-6 py-16 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-2 text-brandPink font-extrabold uppercase tracking-widest text-xs hover:underline mb-10">
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        <PhotoGallery images={galleryImages}>
          {(open) => {
            const referenced = new Set<number>();

            // Split the body on {{media:N}} placeholders. String.split with
            // a capturing group keeps the captured text in the output, so
            // this alternates [text, index, text, index, ..., text].
            const parts = post.body.split(MEDIA_PLACEHOLDER);

            const bodyBlocks = parts.map((part, i) => {
              if (i % 2 === 1) {
                const index = resolveMediaToken(part, media);
                if (index === null) return null;
                const item = media[index];
                referenced.add(index);
                return (
                  <ScrollReveal key={`media-${i}`} className="my-10">
                    {renderMediaItem(item, index, open)}
                    {item.caption && (
                      <p className="text-brandSlate text-xs font-bold uppercase tracking-widest text-center mt-3">{item.caption}</p>
                    )}
                  </ScrollReveal>
                );
              }
              const text = part.trim();
              if (!text) return null;
              return (
                <ScrollReveal
                  key={`text-${i}`}
                  className="prose prose-lg dark:prose-invert max-w-none text-brandSlate font-medium leading-relaxed prose-headings:text-brandGreen prose-headings:font-extrabold prose-headings:text-lg prose-headings:leading-relaxed prose-a:text-brandPink"
                >
                  <ReactMarkdown>{text}</ReactMarkdown>
                </ScrollReveal>
              );
            });

            // Anything not referenced inline still shows at the bottom, same
            // as before — this is just the fallback for media the admin
            // hasn't placed anywhere specific yet.
            const leftover = media.filter((_, i) => !referenced.has(i));

            return (
              <>
                {post.image_url && (
                  <ScrollReveal className="mb-10">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      onClick={() => open(0)}
                      className="w-full cursor-zoom-in"
                    />
                  </ScrollReveal>
                )}

                {bodyBlocks}

                {leftover.length > 0 && (
                  <div className="mt-12 space-y-8">
                    {media.map((item, i) => {
                      if (referenced.has(i)) return null;
                      return (
                        <ScrollReveal key={i} delay={i * 100}>
                          {renderMediaItem(item, i, open)}
                          {item.caption && (
                            <p className="text-brandSlate text-xs font-bold uppercase tracking-widest text-center mt-3">{item.caption}</p>
                          )}
                        </ScrollReveal>
                      );
                    })}
                  </div>
                )}
              </>
            );
          }}
        </PhotoGallery>

        <div className="mt-16">
          <PostReactions postId={post.id} title={post.title} />
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
