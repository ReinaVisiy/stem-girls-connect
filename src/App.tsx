
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Activities from './pages/Activities';
import JoinUs from './pages/JoinUs';
import Contact from './pages/Contact';
import Donate from './pages/Donate';
import Impact from './pages/Impact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

// Code-split: admin panel (and its supabase-js browser client) is only
// downloaded by visitors who actually navigate to /admin/*.
const AdminAuthProvider = lazy(() => import('./admin/AdminAuthProvider').then((m) => ({ default: m.AdminAuthProvider })));
const AdminLogin = lazy(() => import('./admin/AdminLogin'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminBureau = lazy(() => import('./admin/AdminBureau'));
const AdminPartners = lazy(() => import('./admin/AdminPartners'));
const AdminPhotos = lazy(() => import('./admin/AdminPhotos'));
const AdminContent = lazy(() => import('./admin/AdminContent'));
const AdminReports = lazy(() => import('./admin/AdminReports'));
const AdminPosts = lazy(() => import('./admin/AdminPosts'));
const AdminStats = lazy(() => import('./admin/AdminStats'));
const AdminSubscribers = lazy(() => import('./admin/AdminSubscribers'));

const PublicLayout: React.FC = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow pt-20">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const AdminFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-brandSlate font-bold">Loading...</p>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/join" element={<JoinUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/donate" element={<Donate />} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<AdminFallback />}>
            <AdminAuthProvider>
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="bureau" element={<AdminBureau />} />
                  <Route path="partners" element={<AdminPartners />} />
                  <Route path="photos" element={<AdminPhotos />} />
                  <Route path="content" element={<AdminContent />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route path="stats" element={<AdminStats />} />
                  <Route path="subscribers" element={<AdminSubscribers />} />
                </Route>
              </Routes>
            </AdminAuthProvider>
          </Suspense>
        }
      />
    </Routes>
  );
};

export default App;

