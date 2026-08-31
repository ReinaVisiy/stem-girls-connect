import React from 'react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import PostCard, { Post } from '../components/PostCard';
import { useApiData } from '../hooks/useApiData';

const Blog: React.FC = () => {
  const { data: posts, loading } = useApiData<Post[]>('/api/posts');

  return (
    <div className="pb-24">
      <Seo
        title="Blog & News | STEM Girls Connect"
        description="Updates, stories, and news from STEM Girls Connect's programs."
        path="/blog"
      />
      <PageHeader
        title="Blog & News"
        subtitle="Updates and stories from our programs."
      />

      <section className="container mx-auto px-6 py-20">
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 bg-gray-100 dark:bg-slate-700 rounded-[40px] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (!posts || posts.length === 0) && (
          <p className="text-center text-brandSlate font-medium py-12">No updates published yet: check back soon.</p>
        )}

        {!loading && posts && posts.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {posts.map((post, i) => (
              <ScrollReveal key={post.id} delay={(i % 3) * 100}>
                <PostCard post={post} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Blog;
