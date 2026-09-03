import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Seo from '../components/Seo';

/**
 * Client-side catch-all for any path that isn't a defined route. This
 * covers in-app navigation (a stale link, a typo'd URL bar edit after
 * the page has already loaded). Fresh page loads to an unknown path
 * are also caught server-side by middleware.ts, which returns a real
 * HTTP 404 status before React ever mounts — this component handles
 * the client-side-only case where that isn't possible.
 */
const NotFound: React.FC = () => (
  <div className="container mx-auto px-6 py-24 text-center max-w-2xl">
    <Seo title="Page Not Found | STEM Girls Connect" description="The page you were looking for could not be found." path="/404" />
    <h1 className="text-3xl font-extrabold text-brandGreen uppercase mb-4">Page Not Found</h1>
    <p className="text-brandSlate font-medium mb-8">
      The page you were looking for doesn't exist, or may have moved.
    </p>
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-brandPink font-extrabold uppercase tracking-widest text-sm hover:underline"
    >
      <ArrowLeft size={16} /> Back to Home
    </Link>
  </div>
);

export default NotFound;
