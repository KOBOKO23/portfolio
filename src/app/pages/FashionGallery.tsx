import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, MapPin, Camera, User } from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Resp<T> { success: boolean; data?: T }

interface FashionCategory {
  id: number;
  name: string;
  slug: string;
  image_count: number;
}

interface FashionImage {
  id: number;
  title: string;
  image: string;
  category: FashionCategory | null;
  description: string;
  location: string;
  photographer: string;
  date_taken: string | null;
}

function ImageTile({ img, onClick }: { img: FashionImage; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      onClick={onClick}
      className="group cursor-pointer relative overflow-hidden bg-black"
    >
      {!loaded && (
        <div className="absolute inset-0 bg-[#111] animate-pulse" style={{ minHeight: 240 }} />
      )}
      <img
        src={img.image}
        alt={img.title}
        onLoad={() => setLoaded(true)}
        className={`w-full object-cover transition-all duration-700 group-hover:scale-[1.04] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Gold corner accent */}
      <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none">
        <div className="absolute top-0 left-0 w-12 h-[1px]" style={{ background: 'linear-gradient(90deg, #d4a574, transparent)' }} />
        <div className="absolute top-0 left-0 h-12 w-[1px]" style={{ background: 'linear-gradient(180deg, #d4a574, transparent)' }} />
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all duration-400 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100">
        <p className="text-white text-lg leading-snug" style={{ fontFamily: 'var(--font-serif)' }}>{img.title}</p>
        {img.location && (
          <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
            <MapPin size={10} /> {img.location}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonTile() {
  return <div className="bg-[#111] animate-pulse rounded-sm" style={{ height: 280 }} />;
}

export function FashionGallery() {
  const [categories, setCategories] = useState<FashionCategory[]>([]);
  const [images, setImages] = useState<FashionImage[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/fashion/categories/`).then(r => r.json() as Promise<Resp<FashionCategory[]>>),
      fetch(`${API}/fashion/images/?page_size=100`).then(r => r.json() as Promise<Resp<FashionImage[] | { results?: FashionImage[] }>>),
    ]).then(([catData, imgData]) => {
      if (catData.success && catData.data) setCategories(catData.data);
      if (imgData.success && imgData.data) {
        const items = Array.isArray(imgData.data) ? imgData.data : (imgData.data).results ?? [];
        setImages(items);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? images
    : images.filter(img => img.category?.slug === activeCategory);

  const selectedImage = images.find(img => img.id === selectedId) ?? null;
  const selectedIdx = filtered.findIndex(img => img.id === selectedId);

  const handlePrev = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = selectedIdx <= 0 ? filtered.length - 1 : selectedIdx - 1;
    setSelectedId(filtered[idx]?.id ?? null);
  }, [filtered, selectedIdx]);

  const handleNext = useCallback(() => {
    if (filtered.length === 0) return;
    const idx = (selectedIdx + 1) % filtered.length;
    setSelectedId(filtered[idx]?.id ?? null);
  }, [filtered, selectedIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, handlePrev, handleNext]);

  // Group images by category for the collection view
  const collections = categories
    .map(cat => ({ cat, imgs: images.filter(img => img.category?.id === cat.id) }))
    .filter(c => c.imgs.length > 0);

  const noImages = !loading && images.length === 0;

  return (
    <div className="min-h-screen">
      <SEO
        title="Fashion Gallery"
        description="A curated visual gallery exploring contemporary African fashion aesthetics, style, and creative expression."
        url="/fashion"
      />

      {/* Hero */}
      <section className="py-32 lg:py-48 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1800px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="max-w-5xl">
            <div className="w-20 h-[2px] bg-[#d4a574] mb-10" />
            <h1 className="text-[clamp(4rem,10vw,9rem)] leading-[0.9] tracking-tighter mb-10" style={{ fontFamily: 'var(--font-serif)' }}>
              Style.<br />Discipline.<br />Excellence.
            </h1>
            <p className="text-[clamp(1.25rem,2.5vw,2rem)] text-white/70 leading-relaxed max-w-3xl">
              A visual exploration of men's fashion through the lens of intentionality, cultural pride, and refined aesthetics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
              <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
                Fashion as Language
              </h2>
            </div>
            <div className="space-y-6 text-xl text-black/70 leading-relaxed">
              <p>Style is communication without words. It's the first impression, the lasting memory, the silent testimony of discipline and self-respect.</p>
              <p>I believe in clothing that serves purpose — pieces that transition from the boardroom to the studio, from professional engagements to creative pursuits, always maintaining elegance and intentionality.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter + Gallery */}
      <section className="py-20 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1800px] mx-auto">

          {/* Filter tabs */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-5 py-2 text-xs uppercase tracking-widest font-semibold transition-all border ${
                  activeCategory === 'all' ? 'bg-black text-white border-black' : 'border-black/20 text-black/50 hover:border-black hover:text-black'
                }`}
              >
                All ({images.length})
              </button>
              {categories.filter(c => c.image_count > 0).map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-5 py-2 text-xs uppercase tracking-widest font-semibold transition-all border ${
                    activeCategory === cat.slug ? 'bg-black text-white border-black' : 'border-black/20 text-black/50 hover:border-black hover:text-black'
                  }`}
                >
                  {cat.name} ({cat.image_count})
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3 }}>
            <Masonry gutter="16px">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonTile key={i} />)}
            </Masonry>
            </ResponsiveMasonry>
          ) : noImages ? (
            <div className="text-center py-32">
              <Camera className="w-12 h-12 mx-auto mb-4 text-black/20" />
              <p className="text-black/40 text-lg">No images uploaded yet.</p>
              <p className="text-black/30 text-sm mt-2">Add fashion images through the admin dashboard.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-32 text-black/40">
              <p>No images in this category yet.</p>
            </div>
          ) : (
            <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3 }}>
            <Masonry gutter="16px">
              {filtered.map(img => (
                <ImageTile key={img.id} img={img} onClick={() => setSelectedId(img.id)} />
              ))}
            </Masonry>
            </ResponsiveMasonry>
          )}
        </div>
      </section>

      {/* Collections view — grouped by category */}
      {!loading && collections.length > 0 && (
        <>
          {collections.map((col, idx) => (
            <section key={col.cat.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f0]'}>
              <div className="py-20 px-6 lg:px-12">
                <div className="max-w-[1800px] mx-auto">
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14">
                    <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                    <h2 className="text-[clamp(3rem,6vw,5rem)] leading-[1]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {col.cat.name}
                    </h2>
                  </motion.div>
                  <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 640: 2, 1024: 3 }}>
            <Masonry gutter="16px">
                    {col.imgs.map(img => (
                      <ImageTile key={img.id} img={img} onClick={() => setSelectedId(img.id)} />
                    ))}
                  </Masonry>
            </ResponsiveMasonry>
                </div>
              </div>

              {idx === 1 && (
                <div className="py-32 px-6 lg:px-12 bg-black text-white">
                  <div className="max-w-[1400px] mx-auto text-center">
                    <motion.blockquote initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                      className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.3]" style={{ fontFamily: 'var(--font-serif)' }}>
                      "Dress for the life you want,<br />not the life you have."
                    </motion.blockquote>
                    <p className="text-white/60 mt-8 text-lg tracking-[0.2em] uppercase">Philosophy</p>
                  </div>
                </div>
              )}
            </section>
          ))}
        </>
      )}

      {/* Core Principles */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="w-16 h-[2px] bg-[#d4a574] mb-10 mx-auto" />
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] text-center mb-20" style={{ fontFamily: 'var(--font-serif)' }}>
              Core Principles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { number: '01', title: 'Fit First', description: 'Perfect tailoring is non-negotiable. Every garment should complement your physique.' },
                { number: '02', title: 'Quality Materials', description: 'Invest in natural fabrics and superior craftsmanship that ages gracefully.' },
                { number: '03', title: 'Versatility', description: 'Build a wardrobe of pieces that work together across multiple contexts.' },
                { number: '04', title: 'Cultural Pride', description: 'Incorporate African aesthetics with confidence and authenticity.' },
              ].map(p => (
                <div key={p.number} className="border-l-2 border-[#d4a574] pl-6">
                  <div className="text-[#d4a574] text-sm mb-3 tracking-[0.3em]">{p.number}</div>
                  <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{p.title}</h3>
                  <p className="text-white/70 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedId !== null && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedId(null)}
          >
            <button onClick={() => setSelectedId(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10" aria-label="Close">
              <X size={36} />
            </button>
            <button onClick={e => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10" aria-label="Previous">
              <ChevronLeft size={44} />
            </button>
            <button onClick={e => { e.stopPropagation(); handleNext(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10" aria-label="Next">
              <ChevronRight size={44} />
            </button>

            <motion.div
              key={selectedId}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center max-w-4xl w-full px-16"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="max-h-[72vh] max-w-full object-contain shadow-2xl"
              />
              <div className="mt-6 text-center space-y-2">
                <p className="text-white text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>{selectedImage.title}</p>
                {selectedImage.description && <p className="text-white/55 text-sm max-w-lg">{selectedImage.description}</p>}
                <div className="flex items-center justify-center gap-5 text-white/40 text-xs mt-3">
                  {selectedImage.location && <span className="flex items-center gap-1"><MapPin size={11} />{selectedImage.location}</span>}
                  {selectedImage.photographer && <span className="flex items-center gap-1"><User size={11} />{selectedImage.photographer}</span>}
                  {selectedImage.category && <span className="uppercase tracking-widest">{selectedImage.category.name}</span>}
                </div>
              </div>
            </motion.div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest">
              {selectedIdx + 1} / {filtered.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
