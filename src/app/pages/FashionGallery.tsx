import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Masonry from 'react-responsive-masonry';

export function FashionGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const collections = [
    {
      title: 'Executive',
      subtitle: 'Tailored for Leadership',
      images: [
        {
          id: 1,
          url: 'https://images.unsplash.com/photo-1550051414-003c9007794c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFuJTIwZm9ybWFsJTIwc3VpdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjI3NTkzMnww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Classic Navy, Nairobi 2025',
        },
        {
          id: 2,
          url: 'https://images.unsplash.com/photo-1686628092239-2ba401406bc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCbGFjayUyMG1hbiUyMHRhaWxvcmVkJTIwYmxhemVyfGVufDF8fHx8MTc3MjI3NTkzM3ww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Tailored Precision',
        },
        {
          id: 3,
          url: 'https://images.unsplash.com/photo-1762232977391-ff39c5b0ad42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBtZW5zd2VhciUyMHRpZSUyMGRldGFpbHxlbnwxfHx8fDE3NzIyNzU5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Details Define Excellence',
        },
      ],
    },
    {
      title: 'Contemporary',
      subtitle: 'Modern African Aesthetics',
      images: [
        {
          id: 4,
          url: 'https://images.unsplash.com/photo-1763823132558-cbff67da4beb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwZmFzaGlvbiUyMG1lbnN3ZWFyJTIwY29udGVtcG9yYXJ5fGVufDF8fHx8MTc3MjI3NTkzNHww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Urban Elegance',
        },
        {
          id: 5,
          url: 'https://images.unsplash.com/photo-1642400997428-a575ce05ce0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCbGFjayUyMG1hbiUyMHN0cmVldHdlYXIlMjBmYXNoaW9ufGVufDF8fHx8MTc3MjI3NTkzOHww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Contemporary Edge',
        },
        {
          id: 6,
          url: 'https://images.unsplash.com/photo-1766818437762-c9a490bc8fe0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zd2VhciUyMGNhc3VhbCUyMGVsZWdhbnQlMjBzdHlsZXxlbnwxfHx8fDE3NzIyNzU5MzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Casual Sophistication',
        },
      ],
    },
    {
      title: 'Essential',
      subtitle: 'Timeless Wardrobe Staples',
      images: [
        {
          id: 7,
          url: 'https://images.unsplash.com/photo-1749711258583-c14f91949ab6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBibGFjayUyMHR1cnRsZW5lY2slMjBtaW5pbWFsfGVufDF8fHx8MTc3MjI3NTkzNHww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Black Turtleneck',
        },
        {
          id: 8,
          url: 'https://images.unsplash.com/photo-1758734906212-b6a5cad0b8f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwbWFuJTIwd2hpdGUlMjBzaGlydCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjI3NTkzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Crisp White Shirt',
        },
        {
          id: 9,
          url: 'https://images.unsplash.com/photo-1750390200293-92d5a788d3a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBrbml0d2VhciUyMHN3ZWF0ZXIlMjBtaW5pbWFsfGVufDF8fHx8MTc3MjI3NTkzOHww&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Minimal Knitwear',
        },
        {
          id: 10,
          url: 'https://images.unsplash.com/flagged/photo-1572262107174-2c8052b632ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBkZW5pbSUyMGphY2tldCUyMGNhc3VhbHxlbnwxfHx8fDE3NzIyNzU5MzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Denim Essentials',
        },
      ],
    },
    {
      title: 'Layers',
      subtitle: 'Outerwear & Structure',
      images: [
        {
          id: 11,
          url: 'https://images.unsplash.com/photo-1769863845275-574908e962ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjb2F0JTIwd2ludGVyJTIwc3R5bGV8ZW58MXx8fHwxNzcyMjc1OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Winter Coats',
        },
        {
          id: 12,
          url: 'https://images.unsplash.com/photo-1559038267-f24e6f9698b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBsZWF0aGVyJTIwamFja2V0JTIwdXJiYW58ZW58MXx8fHwxNzcyMjc1OTM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Leather Jacket',
        },
        {
          id: 13,
          url: 'https://images.unsplash.com/photo-1608224108237-1e95ed988f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zd2VhciUyMGJsYXplciUyMHRleHR1cmUlMjBkZXRhaWx8ZW58MXx8fHwxNzcyMjc1OTM5fDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Textured Blazers',
        },
      ],
    },
    {
      title: 'Details',
      subtitle: 'Accessories & Finishing Touches',
      images: [
        {
          id: 14,
          url: 'https://images.unsplash.com/photo-1767796704645-3b95c77b4102?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zd2VhciUyMGFjY2Vzc29yaWVzJTIwd2F0Y2h8ZW58MXx8fHwxNzcyMjc1OTM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Timepiece & Details',
        },
        {
          id: 15,
          url: 'https://images.unsplash.com/photo-1653868250450-b83e6263d427?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zd2VhciUyMG94Zm9yZCUyMHNob2VzJTIwbGVhdGhlcnxlbnwxfHx8fDE3NzIyNzU5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
          caption: 'Oxford Excellence',
        },
      ],
    },
  ];

  const allImages = collections.flatMap(c => c.images);
  const selectedImageData = selectedImage !== null ? allImages.find(img => img.id === selectedImage) : null;

  const handlePrevImage = () => {
    if (selectedImage === null) return;
    const currentIndex = allImages.findIndex(img => img.id === selectedImage);
    const prevIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1;
    setSelectedImage(allImages[prevIndex].id);
  };

  const handleNextImage = () => {
    if (selectedImage === null) return;
    const currentIndex = allImages.findIndex(img => img.id === selectedImage);
    const nextIndex = currentIndex === allImages.length - 1 ? 0 : currentIndex + 1;
    setSelectedImage(allImages[nextIndex].id);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
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

      {/* Philosophy Statement */}
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
                I believe in clothing that serves purpose—pieces that transition from 
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
          {/* Collection Title */}
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

              {/* Masonry Grid */}
              <Masonry columnsCount={3} gutter="24px">
                {collection.images.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedImage(image.id)}
                  >
                    <ImageWithFallback
                      src={image.url}
                      alt={image.caption}
                      className="w-full h-auto block group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <p className="text-white text-lg" style={{ fontFamily: 'var(--font-serif)' }}>
                        {image.caption}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </Masonry>
            </div>
          </div>

          {/* Typography Break (after certain collections) */}
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
                <p className="text-white/60 mt-8 text-lg tracking-[0.2em] uppercase">
                  Philosophy
                </p>
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
                  <div className="text-center">
                    <h3 
                      className="text-6xl mb-4"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      Classic
                    </h3>
                    <p className="text-black/60 leading-relaxed">
                      Timeless pieces that transcend trends and seasons
                    </p>
                  </div>
                  <div className="text-center">
                    <h3 
                      className="text-6xl mb-4"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      Refined
                    </h3>
                    <p className="text-black/60 leading-relaxed">
                      Attention to detail, quality over quantity
                    </p>
                  </div>
                  <div className="text-center">
                    <h3 
                      className="text-6xl mb-4"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      African
                    </h3>
                    <p className="text-black/60 leading-relaxed">
                      Celebrating heritage with contemporary confidence
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </section>
      ))}

      {/* Styling Principles */}
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
                {
                  number: '01',
                  title: 'Fit First',
                  description: 'Perfect tailoring is non-negotiable. Every garment should complement your physique.',
                },
                {
                  number: '02',
                  title: 'Quality Materials',
                  description: 'Invest in natural fabrics and superior craftsmanship that ages gracefully.',
                },
                {
                  number: '03',
                  title: 'Versatility',
                  description: 'Build a wardrobe of pieces that work together across multiple contexts.',
                },
                {
                  number: '04',
                  title: 'Cultural Pride',
                  description: 'Incorporate African aesthetics with confidence and authenticity.',
                },
              ].map((principle) => (
                <div key={principle.number} className="border-l-2 border-[#d4a574] pl-6">
                  <div className="text-[#d4a574] text-sm mb-3 tracking-[0.3em]">{principle.number}</div>
                  <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                    {principle.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Full-Screen Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && selectedImageData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-8 right-8 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <X size={40} />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-8 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={48} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-8 text-white/80 hover:text-white transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight size={48} />
            </button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithFallback
                src={selectedImageData.url}
                alt={selectedImageData.caption}
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
              />
              <div className="mt-8 text-center">
                <p 
                  className="text-white text-2xl"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {selectedImageData.caption}
                </p>
              </div>
            </motion.div>

            {/* Image Counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {allImages.findIndex(img => img.id === selectedImage) + 1} / {allImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
