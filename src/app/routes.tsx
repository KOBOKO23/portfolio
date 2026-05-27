import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { Blog } from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import { FashionGallery } from './pages/FashionGallery';
import { Music } from './pages/Music';
import { Book } from './pages/Book';
import { GreatMenMoves } from './pages/GreatMenMoves';
import { Contact } from './pages/Contact';
import { Newsletter } from './pages/Newsletter';
import WeatherForecast from './pages/WeatherForecast';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { FeedbackWidget } from './components/FeedbackWidget';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main>{children}</main>
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