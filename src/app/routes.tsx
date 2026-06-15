import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { FeedbackWidget } from './components/FeedbackWidget';

// Lazy-load every page so each route is a separate JS chunk
const Home           = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const About          = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Projects       = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })));
const ProjectDetail  = lazy(() => import('./pages/ProjectDetail'));
const Blog           = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })));
const BlogDetail     = lazy(() => import('./pages/BlogDetail'));
const FashionGallery = lazy(() => import('./pages/FashionGallery').then(m => ({ default: m.FashionGallery })));
const Music          = lazy(() => import('./pages/Music').then(m => ({ default: m.Music })));
const Book           = lazy(() => import('./pages/Book').then(m => ({ default: m.Book })));
const GreatMenMoves  = lazy(() => import('./pages/GreatMenMoves').then(m => ({ default: m.GreatMenMoves })));
const Contact        = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Newsletter     = lazy(() => import('./pages/Newsletter').then(m => ({ default: m.Newsletter })));
const WeatherForecast = lazy(() => import('./pages/WeatherForecast'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="main-content">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <FeedbackWidget />
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: '/about',
    element: (
      <Layout>
        <About />
      </Layout>
    ),
  },
  {
    path: '/projects',
    element: (
      <Layout>
        <Projects />
      </Layout>
    ),
  },
  {
    path: '/projects/:slug',
    element: (
      <Layout>
        <ProjectDetail />
      </Layout>
    ),
  },
  {
    path: '/blog',
    element: (
      <Layout>
        <Blog />
      </Layout>
    ),
  },
  {
    path: '/blog/:slug',
    element: (
      <Layout>
        <BlogDetail />
      </Layout>
    ),
  },
  {
    path: '/fashion',
    element: (
      <Layout>
        <FashionGallery />
      </Layout>
    ),
  },
  {
    path: '/music',
    element: (
      <Layout>
        <Music />
      </Layout>
    ),
  },
  {
    path: '/book',
    element: (
      <Layout>
        <Book />
      </Layout>
    ),
  },
  {
    path: '/great-men-moves',
    element: (
      <Layout>
        <GreatMenMoves />
      </Layout>
    ),
  },
  {
    path: '/contact',
    element: (
      <Layout>
        <Contact />
      </Layout>
    ),
  },
  {
    path: '/newsletter',
    element: (
      <Layout>
        <Newsletter />
      </Layout>
    ),
  },
  {
    path: '/weather-forecast',
    element: (
      <Layout>
        <WeatherForecast />
      </Layout>
    ),
  },
  {
    path: '*',
    element: (
      <Layout>
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-6xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>404</h1>
            <p className="text-xl text-black/60 mb-8">Page not found</p>
            <a href="/" className="px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all inline-block">
              Go Home
            </a>
          </div>
        </div>
      </Layout>
    ),
  },
]);