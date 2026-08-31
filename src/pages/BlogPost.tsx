import React from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { formatDate, excerpt, Post } from '../components/PostCard';
import PhotoGallery from '../components/PhotoGallery';
import { useApiData } from '../hooks/useApiData';

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

  const galleryImages = [
    ...(post.image_url ? [{ src: post.image_url, alt: post.title }] : []),
    ...(post.media ?? [])
      .filter((item) => item.type === 'image')
      .map((item) => ({ src: item.url, alt: item.caption ?? post.title })),
  ];

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
            let imageIndex = post.image_url ? 0 : -1;
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

                <ScrollReveal className="prose prose-lg dark:prose-invert max-w-none text-brandSlate font-medium leading-relaxed prose-headings:text-brandGreen prose-headings:font-extrabold prose-a:text-brandPink">
                  <ReactMarkdown>{post.body}</ReactMarkdown>
                </ScrollReveal>

                {post.media && post.media.length > 0 && (
                  <div className="mt-12 space-y-8">
                    {post.media.map((item, i) => {
                      if (item.type === 'image') imageIndex += 1;
                      const thisImageIndex = imageIndex;
                      return (
                        <ScrollReveal key={i} delay={i * 100}>
                          {item.type === 'video' ? (
                            <video src={item.url} controls className="w-full rounded-none" />
                          ) : (
                            <img
                              src={item.url}
                              alt={item.caption ?? post.title}
                              onClick={() => open(thisImageIndex)}
                              className="w-full cursor-zoom-in"
                            />
                          )}
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
      </article>
    </div>
  );
};

export default BlogPost;
