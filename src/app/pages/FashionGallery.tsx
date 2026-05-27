import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import Masonry from 'react-responsive-masonry';
import { SEO } from '../components/SEO';

interface GalleryImage {
  id: number;
  caption: string;
  aspect: string;
  accentColor: string;
}

const collections = [
  {
    title: 'Executive',
    subtitle: 'Tailored for Leadership',
    images: [
      { id: 1, caption: 'Classic Navy, Nairobi 2025', aspect: 'aspect-[3/4]', accentColor: '#1a3a6e' },
      { id: 2, caption: 'Tailored Precision', aspect: 'aspect-square', accentColor: '#2a2a2a' },
      { id: 3, caption: 'Details Define Excellence', aspect: 'aspect-[4/5]', accentColor: '#1a2a1a' },
    ],
  },
  {
    title: 'Contemporary',
    subtitle: 'Modern African Aesthetics',
    images: [
      { id: 4, caption: 'Urban Elegance', aspect: 'aspect-[3/4]', accentColor: '#3a1a0a' },
      { id: 5, caption: 'Contemporary Edge', aspect: 'aspect-square', accentColor: '#0a1a3a' },
      { id: 6, caption: 'Casual Sophistication', aspect: 'aspect-[4/5]', accentColor: '#2a1a3a' },
    ],
  },
  {
    title: 'Essential',
    subtitle: 'Timeless Wardrobe Staples',
    images: [
      { id: 7, caption: 'Black Turtleneck', aspect: 'aspect-[3/4]', accentColor: '#0a0a0a' },
      { id: 8, caption: 'Crisp White Shirt', aspect: 'aspect-square', accentColor: '#1a1a14' },
      { id: 9, caption: 'Minimal Knitwear', aspect: 'aspect-[4/5]', accentColor: '#2a1a0a' },
      { id: 10, caption: 'Denim Essentials', aspect: 'aspect-[3/4]', accentColor: '#0a1428' },
    ],
  },
  {
    title: 'Layers',
    subtitle: 'Outerwear & Structure',
    images: [
      { id: 11, caption: 'Winter Coats', aspect: 'aspect-[3/4]', accentColor: '#1a1010' },
      { id: 12, caption: 'Leather Jacket', aspect: 'aspect-square', accentColor: '#280a0a' },
      { id: 13, caption: 'Textured Blazers', aspect: 'aspect-[4/5]', accentColor: '#14100a' },
    ],
  },
  {
    title: 'Details',
    subtitle: 'Accessories & Finishing Touches',
    images: [
      { id: 14, caption: 'Timepiece & Details', aspect: 'aspect-[3/4]', accentColor: '#1a140a' },
      { id: 15, caption: 'Oxford Excellence', aspect: 'aspect-square', accentColor: '#0a0a14' },
    ],
  },
];

const allImages: GalleryImage[] = collections.flatMap((c) => c.images);

function PlaceholderTile({
  image,
  onClick,
}: {
  image: GalleryImage;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`group cursor-pointer relative overflow-hidden ${image.aspect}`}
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${image.accentColor} 0%, #0a0a0a 100%)`,
      }}
    >
      {/* Radial highlight */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 40% 35%, ${image.accentColor}80 0%, transparent 70%)`,
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#d4a574 1px, transparent 1px), linear-gradient(90deg, #d4a574 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Camera icon placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
        <Camera className="w-8 h-8 text-white" />
        <span className="text-white text-xs uppercase tracking-[0.3em]">Photo</span>
      </div>
      {/* Hover caption overlay */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
        <p className="text-white text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
          {image.caption}
        </p>
      </div>
      {/* Gold corner accent */}
      <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-12 h-[1px]"
          style={{ background: 'linear-gradient(90deg, #d4a574, transparent)' }}
        />
        <div
          className="absolute top-0 left-0 h-12 w-[1px]"
          style={{ background: 'linear-gradient(180deg, #d4a574, transparent)' }}
        />
      </div>
    </motion.div>
  );
}

export function FashionGallery() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedImage = selectedId !== null ? allImages.find((img) => img.id === selectedId) : null;

  const handlePrev = () => {
    if (selectedId === null) return;
    const idx = allImages.findIndex((img) => img.id === selectedId);
    setSelectedId(allImages[(idx === 0 ? allImages.length : idx) - 1].id);
  };

  const handleNext = () => {
    if (selectedId === null) return;
    const idx = allImages.findIndex((img) => img.id === selectedId);
    setSelectedId(allImages[(idx + 1) % allImages.length].id);
  };

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
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-5xl"
          >
            <div className="w-20 h-[2px] bg-[#d4a574] mb-10" />
            <h1
              className="text-[clamp(4rem,10vw,9rem)] leading-[0.9] tracking-tighter mb-10"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Style.<br />
              Discipline.<br />
              Excellence.
            </h1>
            <p className="text-[clamp(1.25rem,2.5vw,2rem)] text-white/70 leading-relaxed max-w-3xl">
              A visual exploration of men's fashion through the lens of intentionality,
              cultural pride, and refined aesthetics.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
          >
            <div>
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
              <h2
                className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Fashion as Language
              </h2>
            </div>
            <div className="space-y-6 text-xl text-black/70 leading-relaxed">
              <p>
                Style is communication without words. It's the first impression,
                the lasting memory, the silent testimony of discipline and self-respect.
              </p>
              <p>
                I believe in clothing that serves purpose — pieces that transition from
                the boardroom to the studio, from professional engagements to creative
                pursuits, always maintaining elegance and intentionality.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Collections */}
      {collections.map((collection, collectionIndex) => (
        <section
          key={collection.title}
          className={collectionIndex % 2 === 0 ? 'bg-white' : 'bg-[#f5f5f0]'}
        >
          <div className="py-20 px-6 lg:px-12">
            <div className="max-w-[1800px] mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-16"
              >
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <h2
                  className="text-[clamp(3rem,6vw,5rem)] leading-[1] mb-3"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {collection.title}
                </h2>
                <p className="text-xl text-black/60 uppercase tracking-[0.3em]">
                  {collection.subtitle}
                </p>
              </motion.div>

              <Masonry columnsCount={3} gutter="24px">
                {collection.images.map((image) => (
                  <PlaceholderTile
                    key={image.id}
                    image={image}
                    onClick={() => setSelectedId(image.id)}
                  />
                ))}
              </Masonry>
            </div>
          </div>

          {collectionIndex === 1 && (
            <div className="py-32 px-6 lg:px-12 bg-black text-white">
              <div className="max-w-[1400px] mx-auto text-center">
                <motion.blockquote
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.3]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  "Dress for the life you want,<br />
                  not the life you have."
                </motion.blockquote>
                <p className="text-white/60 mt-8 text-lg tracking-[0.2em] uppercase">Philosophy</p>
              </div>
            </div>
          )}

          {collectionIndex === 3 && (
            <div className="py-32 px-6 lg:px-12">
              <div className="max-w-[1200px] mx-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-12"
                >
                  {['Classic', 'Refined', 'African'].map((word, i) => (
                    <div key={word} className="text-center">
                      <h3 className="text-6xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                        {word}
                      </h3>
                      <p className="text-black/60 leading-relaxed">
                        {
                          [
                            'Timeless pieces that transcend trends and seasons',
                            'Attention to detail, quality over quantity',
                            'Celebrating heritage with contemporary confidence',
                          ][i]
                        }
                      </p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}
        </section>
      ))}

      {/* Core Principles */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-[2px] bg-[#d4a574] mb-10 mx-auto" />
            <h2
              className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1] text-center mb-20"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Core Principles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { number: '01', title: 'Fit First', description: 'Perfect tailoring is non-negotiable. Every garment should complement your physique.' },
                { number: '02', title: 'Quality Materials', description: 'Invest in natural fabrics and superior craftsmanship that ages gracefully.' },
                { number: '03', title: 'Versatility', description: 'Build a wardrobe of pieces that work together across multiple contexts.' },
                { number: '04', title: 'Cultural Pride', description: 'Incorporate African aesthetics with confidence and authenticity.' },
              ].map((p) => (
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
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setSelectedId(null)}
          >
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <X size={40} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-8 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={48} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-8 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight size={48} />
            </button>

            <motion.div
              key={selectedId}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large placeholder in lightbox */}
              <div
                className="w-[60vw] h-[60vh] flex flex-col items-center justify-center gap-6"
                style={{
                  background: `linear-gradient(145deg, ${selectedImage.accentColor} 0%, #0a0a0a 100%)`,
                }}
              >
                <Camera className="w-16 h-16 text-white/30" />
                <p className="text-white/30 text-sm uppercase tracking-[0.3em]">
                  Photo coming soon
                </p>
              </div>
              <div className="mt-8 text-center">
                <p className="text-white text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                  {selectedImage.caption}
                </p>
              </div>
            </motion.div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {allImages.findIndex((img) => img.id === selectedId) + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
