import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
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

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/fashion" element={<FashionGallery />} />
          <Route path="/music" element={<Music />} />
          <Route path="/book" element={<Book />} />
          <Route path="/great-men-moves" element={<GreatMenMoves />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/weather-forecast" element={<WeatherForecast />} />
          <Route
            path="*"
            element={
              <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-center px-6">
                  <h1 className="text-6xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                    404
                  </h1>
                  <p className="text-xl text-black/60 mb-8">Page not found</p>
                  <a
                    href="/"
                    className="px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all inline-block"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}