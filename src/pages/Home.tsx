import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import HomeSlideshow from '../components/HomeSlideshow';
import Partners from '../components/Partners';
import PostCard, { Post } from '../components/PostCard';
import PhotoGallery from '../components/PhotoGallery';
import CountUp from '../components/CountUp';
import { useApiData } from '../hooks/useApiData';
import { useSiteImage } from '../hooks/useSiteImage';

interface Stat {
  id: number;
  stat_key: string;
  value: string;
  label: string;
  sub_stat: string | null;
  display_order: number;
}

const Home: React.FC = () => {
  const { data: latestPosts, loading: postsLoading } = useApiData<Post[]>('/api/posts?limit=1');
  const { data: stats, loading: statsLoading } = useApiData<Stat[]>('/api/stats');
  const latestPost = latestPosts?.[0];
  const supportPhoto = useSiteImage('home_support', '/STEMgirl.jpg', 'STEM Girls Connect Member');

  return (
    <div className="overflow-hidden">
      <Seo
        title="STEM Girls Connect | Nurturing Women in STEM"
        description="STEM Girls Connect is a nonprofit training and mentoring girls and young women in science, technology, engineering, and mathematics through workshops, mentorship, and advocacy."
        path="/"
      />
      <PageHeader 
        title="Find Your Place in STEM"
      />

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brandGreen mb-8 uppercase tracking-tighter">
              Learn. Connect. Grow.
            </h2>
            <p className="text-brandSlate text-xl mb-12 text-justify leading-relaxed font-semibold max-w-4xl mx-auto">
              Build practical skills, connect with mentors, discover scholarships and opportunities, and grow alongside a community of girls and young women building their futures in STEM.
            </p>

            <HomeSlideshow />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-2xl mx-auto">
              <Link 
                to="/activities" 
                className="w-full sm:w-auto bg-brandPink text-white px-10 py-5 rounded-2xl font-extrabold shadow-xl shadow-brandPink/30 hover:scale-[1.02] transition-all text-center uppercase tracking-widest text-sm"
              >
                Explore Our Programs
              </Link>
              <Link 
                to="/join" 
                className="w-full sm:w-auto border-2 border-brandPink text-brandPink px-10 py-5 rounded-2xl font-extrabold hover:bg-brandPink hover:text-white transition-all text-center uppercase tracking-widest text-sm"
              >
                Join STEM Girls Connect
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {!statsLoading && stats && stats.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <ScrollReveal className="text-center mb-16">
              <h2 className="text-2xl font-extrabold text-brandGreen uppercase tracking-widest">Our Impact So Far</h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center mb-12">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.id} delay={i * 100}>
                  <p className="text-5xl font-extrabold text-brandPink mb-2 tabular-nums">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="text-brandSlate font-bold uppercase tracking-widest text-xs">{stat.label}</p>
                </ScrollReveal>
              ))}
            </div>
            <div className="text-center">
              <Link to="/impact" className="inline-flex items-center gap-2 text-brandPink font-extrabold uppercase tracking-widest text-sm hover:underline">
                See the full picture <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {!postsLoading && latestPost && (
        <section className="py-20 bg-[#486e7c]/5 border-y border-gray-100">
          <div className="container mx-auto px-6">
            <ScrollReveal className="text-center mb-12">
              <h2 className="text-2xl font-extrabold text-brandGreen uppercase tracking-widest">What's New</h2>
            </ScrollReveal>
            <div className="max-w-md mx-auto mb-10">
              <PostCard post={latestPost} />
            </div>
            <div className="text-center">
              <Link to="/blog" className="inline-flex items-center gap-2 text-brandPink font-extrabold uppercase tracking-widest text-sm hover:underline">
                View all updates <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-14 bg-white border-t border-gray-100">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-brandGreen uppercase tracking-widest mb-2">Our Partners</h2>
            <p className="text-brandSlate text-sm font-medium">Organizations we work alongside to expand our reach.</p>
          </ScrollReveal>
          <Partners />
        </div>
      </section>

      <section className="py-24 bg-brandSlate text-white relative">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <h2 className="text-4xl font-extrabold mb-8 uppercase tracking-tighter italic">Support Our Mission</h2>
            <p className="text-white/80 text-lg text-justify leading-relaxed font-medium mb-10">
              Your donation funds STEM training workshops, mentor pairings, and outreach to schools. Every gift helps a girl get access to scholarships, skills, and role models she might not otherwise reach.
            </p>
            <Link to="/donate" className="inline-flex items-center space-x-3 bg-brandPink text-white px-12 py-5 rounded-2xl font-extrabold uppercase tracking-widest shadow-2xl shadow-black/20 hover:scale-105 transition-all text-sm">
              <Heart size={18} fill="currentColor" />
              <span>Donate Now</span>
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            {/* Exception to the site-wide "no cropped images" rule: this
                image intentionally keeps its rounded/cropped treatment. */}
            <PhotoGallery images={[{ src: supportPhoto.src, alt: supportPhoto.alt }]}>
              {(open) => (
                <div className="rounded-[50px] overflow-hidden shadow-2xl border-4 border-brandPink/30 aspect-[16/9]">
                  <img 
                    src={supportPhoto.src} 
                    alt={supportPhoto.alt} 
                    onClick={() => open(0)}
                    className="w-full h-full object-cover cursor-zoom-in"
                  />
                </div>
              )}
            </PhotoGallery>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
