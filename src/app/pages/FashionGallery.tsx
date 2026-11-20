import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  Maximize2,
  Link2,
  Check,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const SERIF = { fontFamily: 'var(--font-serif)' } as const;
const GOLD = '#d4a574';

interface Resp<T> {
  success: boolean;
  data?: T;
}

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
  /** 600 px copy for the grid; spreads and the viewer use the full image. */
  thumbnail?: string | null;
  category: FashionCategory | null;
  description: string;
  location: string;
  photographer: string;
  date_taken: string | null;
  featured?: boolean;
}

// Looks are dated in the reader's own locale.
function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

function titleCase(s: string) {
  // Admin entries are often typed in capitals ("SUITS", "NAIROBI"); present them
  // in an editorial case without touching mixed-case input.
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\p{L}/gu, c => c.toUpperCase()) : s;
}

function Credits({ img, dark = false }: { img: FashionImage; dark?: boolean }) {
  const rows = [
    ['Photography', img.photographer],
    ['Location', img.location && titleCase(img.location)],
    ['Date', formatDate(img.date_taken)],
    ['Collection', img.category?.name],
  ].filter((r): r is [string, string] => Boolean(r[1]));
  if (!rows.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt
            className={`text-[10px] uppercase tracking-[0.25em] mb-1.5 ${dark ? 'text-white/40' : 'text-black/40'}`}
          >
            {k}
          </dt>
          <dd className={`text-sm ${dark ? 'text-white/85' : 'text-black/80'}`}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function FadeImage({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`${className} transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

/** A featured look laid out as a magazine spread: image one side, story the other. */
function Spread({ img, index, onOpen }: { img: FashionImage; index: number; onOpen: () => void }) {
  const flip = index % 2 === 1;
  return (
    <article className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
      <motion.button
        type="button"
        onClick={onOpen}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className={`group relative lg:col-span-7 overflow-hidden bg-[#e9e6df] cursor-zoom-in ${
          flip ? 'lg:order-2' : ''
        }`}
        aria-label={`View ${img.title} full screen`}
      >
        <FadeImage
          src={img.image}
          alt={img.title}
          className="w-full max-h-[88vh] object-cover group-hover:scale-[1.025] !duration-[1400ms] ease-out"
        />
        <span className="absolute bottom-5 right-5 flex items-center gap-2 bg-white/90 text-black text-[10px] uppercase tracking-[0.25em] px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={12} /> View
        </span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, delay: 0.15 }}
        className={`lg:col-span-5 ${flip ? 'lg:order-1 lg:pr-4' : 'lg:pl-4'}`}
      >
        <p className="flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] text-black/45 mb-8">
          <span style={{ color: GOLD }}>Look {pad(index + 1)}</span>
          <span className="h-px w-12 bg-black/20" />
          {img.category?.name}
        </p>
        <h3
          className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight mb-8"
          style={SERIF}
        >
          {titleCase(img.title)}
        </h3>
        {img.description && (
          <p
            dir="auto"
            className="text-lg md:text-xl leading-[1.75] text-black/70 mb-12 whitespace-pre-line max-w-xl"
          >
            {img.description}
          </p>
        )}
        <div className="border-t border-black/10 pt-8">
          <Credits img={img} />
        </div>
      </motion.div>
    </article>
  );
}

function ArchiveTile({ img, onClick }: { img: FashionImage; onClick: () => void }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="group"
    >
      <button
        type="button"
        onClick={onClick}
        className="block w-full overflow-hidden bg-[#e9e6df] cursor-zoom-in"
        aria-label={`View ${img.title}`}
      >
        <FadeImage
          src={img.thumbnail ?? img.image}
          alt={img.title}
          className="w-full object-cover group-hover:scale-[1.04] !duration-[1200ms] ease-out"
        />
      </button>
      <figcaption className="pt-4 pb-2">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-lg leading-snug" style={SERIF}>
            {titleCase(img.title)}
          </p>
          {img.location && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 flex-shrink-0 flex items-center gap-1">
              <MapPin size={10} /> {titleCase(img.location)}
            </p>
          )}
        </div>
        {img.description && (
          <p dir="auto" className="mt-2 text-sm text-black/55 leading-relaxed line-clamp-2">
            {img.description}
          </p>
        )}
      </figcaption>
    </motion.figure>
  );
}

function SkeletonTile({ h }: { h: number }) {
  return <div className="bg-black/[0.06] animate-pulse" style={{ height: h }} />;
}

export function FashionGallery() {
  const [categories, setCategories] = useState<FashionCategory[]>([]);
  const [images, setImages] = useState<FashionImage[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const touchX = useRef<number | null>(null);

  // ?look=<id> opens a look directly, so individual looks can be shared.
  const lookParam = searchParams.get('look');
  const selectedId = lookParam ? Number(lookParam) : null;
  const setSelectedId = useCallback(
    (id: number | null) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (id === null) next.delete('look');
          else next.set('look', String(id));
          return next;
        },
        { replace: true, preventScrollReset: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    Promise.all([
      fetch(`${API}/fashion/categories/`).then(r => r.json() as Promise<Resp<FashionCategory[]>>),
      fetch(`${API}/fashion/images/?page_size=100`).then(
        r => r.json() as Promise<Resp<FashionImage[] | { results?: FashionImage[] }>>
      ),
    ])
      .then(([catData, imgData]) => {
        if (catData.success && catData.data) setCategories(catData.data);
        if (imgData.success && imgData.data) {
          const items = Array.isArray(imgData.data) ? imgData.data : (imgData.data.results ?? []);
          setImages(items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Featured looks lead the page; without any, the first three (by admin order) do.
  const spreads = useMemo(() => {
    const featured = images.filter(i => i.featured);
    return (featured.length ? featured : images).slice(0, 4);
  }, [images]);
  const cover = spreads[0] ?? null;
  const showArchive = images.length > spreads.length;

  const filtered =
    activeCategory === 'all' ? images : images.filter(img => img.category?.slug === activeCategory);

  // The viewer steps through the archive's current filter, or all looks.
  const sequence = filtered.some(i => i.id === selectedId) ? filtered : images;
  const selectedIdx = sequence.findIndex(img => img.id === selectedId);
  const selectedImage = selectedIdx >= 0 ? sequence[selectedIdx] : null;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!sequence.length) return;
      const idx = (selectedIdx + dir + sequence.length) % sequence.length;
      setSelectedId(sequence[idx]?.id ?? null);
    },
    [sequence, selectedIdx, setSelectedId]
  );

  useEffect(() => {
    if (!selectedImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Preload neighbours so stepping through looks is instant.
    [-1, 1].forEach(d => {
      const n = sequence[(selectedIdx + d + sequence.length) % sequence.length];
      if (n) new Image().src = n.image;
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedImage, selectedIdx, sequence, step, setSelectedId]);

  const copyLook = async () => {
    if (!selectedImage) return;
    const url = `${window.location.origin}/fashion?look=${selectedImage.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: selectedImage.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* dismissed */
    }
  };

  const noImages = !loading && images.length === 0;

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <SEO
        title="Fashion"
        description="Lookbook and editorial work by Koboko — men's style through the lens of intention, African heritage and refined craft. Open to collaborations with fashion houses and brands worldwide."
        url="/fashion"
        image={cover?.image}
      />

      {/* Cover */}
      <section className="relative min-h-[100svh] bg-black text-white overflow-hidden flex">
        {cover && (
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 lg:left-[38%]"
          >
            <img
              src={cover.image}
              alt={cover.title}
              className="w-full h-full object-cover object-[50%_30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 lg:bg-gradient-to-r lg:from-black lg:via-black/20 lg:to-transparent" />
          </motion.div>
        )}

        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-end lg:justify-center pb-24 pt-36">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3 }}
            className="max-w-3xl"
          >
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/60 mb-8 flex items-center gap-4">
              <span className="h-px w-12" style={{ background: GOLD }} />
              Koboko — Lookbook
            </p>
            <h1
              className="text-[clamp(3.5rem,10vw,9.5rem)] leading-[0.88] tracking-tighter mb-10"
              style={SERIF}
            >
              Style.
              <br />
              Discipline.
              <br />
              <em className="not-italic" style={{ color: GOLD }}>
                Excellence.
              </em>
            </h1>
            <p className="text-lg md:text-2xl text-white/70 leading-relaxed max-w-xl">
              Men's fashion through the lens of intention, cultural pride and refined craft — from
              Nairobi to the world.
            </p>
          </motion.div>
        </div>

        {cover && (
          <button
            type="button"
            onClick={() => setSelectedId(cover.id)}
            className="hidden md:block absolute bottom-28 right-6 lg:right-12 z-10 text-right text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-white transition-colors"
          >
            On the cover — {titleCase(cover.title)}
            {cover.photographer && <span className="block mt-1">Photo: {cover.photographer}</span>}
          </button>
        )}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/40"
        >
          <ArrowDown size={18} />
        </motion.div>
      </section>

      {/* Philosophy */}
      <section className="py-28 lg:py-40 px-4 sm:px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5"
          >
            <p className="text-[11px] uppercase tracking-[0.35em] mb-6" style={{ color: GOLD }}>
              Philosophy
            </p>
            <h2
              className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.02] tracking-tight"
              style={SERIF}
            >
              Fashion as language.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-6 lg:col-start-7 space-y-6 text-lg md:text-xl text-black/65 leading-[1.8]"
          >
            <p>
              Style is communication without words — the first impression, the lasting memory, the
              quiet testimony of discipline and self-respect.
            </p>
            <p>
              I wear pieces that serve a purpose: from the boardroom to the studio, from the stage
              to the street, always with elegance and intent — and always carrying where I come
              from.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured looks */}
      <section className="py-24 lg:py-36 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-end justify-between gap-6 mb-16 lg:mb-24 border-b border-black/10 pb-8">
            <h2
              className="text-[clamp(2.5rem,6vw,5.5rem)] leading-none tracking-tight"
              style={SERIF}
            >
              The Looks
            </h2>
            {!loading && images.length > 0 && (
              <p className="text-[11px] uppercase tracking-[0.3em] text-black/40 pb-2">
                {pad(images.length)} {images.length === 1 ? 'look' : 'looks'}
              </p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-7">
                <SkeletonTile h={640} />
              </div>
              <div className="lg:col-span-5 space-y-6 pt-20">
                <SkeletonTile h={20} />
                <SkeletonTile h={80} />
                <SkeletonTile h={160} />
              </div>
            </div>
          ) : noImages ? (
            <div className="text-center py-32">
              <Camera className="w-12 h-12 mx-auto mb-4 text-black/20" />
              <p className="text-black/40 text-lg">The first looks are on their way.</p>
            </div>
          ) : (
            <div className="space-y-28 lg:space-y-44">
              {spreads.map((img, i) => (
                <Spread key={img.id} img={img} index={i} onOpen={() => setSelectedId(img.id)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quote */}
      <section className="py-32 lg:py-44 px-4 sm:px-6 lg:px-12 bg-black text-white">
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-5xl mx-auto text-center"
        >
          <p className="text-[clamp(2rem,4.5vw,4rem)] leading-[1.2] tracking-tight" style={SERIF}>
            “Dress for the life you want,
            <br className="hidden md:block" /> not the life you have.”
          </p>
          <footer className="mt-10 text-[11px] uppercase tracking-[0.4em] text-white/45">
            Koboko
          </footer>
        </motion.blockquote>
      </section>

      {/* Archive */}
      {showArchive && (
        <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-12">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
              <h2
                className="text-[clamp(2.5rem,5vw,4.5rem)] leading-none tracking-tight"
                style={SERIF}
              >
                Archive
              </h2>
              {categories.filter(c => c.image_count > 0).length > 1 && (
                <div className="flex flex-wrap gap-x-8 gap-y-3" role="tablist">
                  {[{ slug: 'all', name: 'All', image_count: images.length }, ...categories]
                    .filter(c => c.image_count > 0)
                    .map(cat => (
                      <button
                        key={cat.slug}
                        role="tab"
                        aria-selected={activeCategory === cat.slug}
                        onClick={() => setActiveCategory(cat.slug)}
                        className={`relative text-[11px] uppercase tracking-[0.3em] pb-2 transition-colors ${
                          activeCategory === cat.slug
                            ? 'text-black'
                            : 'text-black/40 hover:text-black'
                        }`}
                      >
                        {cat.name}
                        <sup className="ml-1 text-[9px]">{cat.image_count}</sup>
                        {activeCategory === cat.slug && (
                          <motion.span
                            layoutId="archive-tab"
                            className="absolute left-0 right-0 -bottom-px h-px bg-black"
                          />
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <ResponsiveMasonry columnsCountBreakPoints={{ 0: 1, 640: 2, 1100: 3, 1500: 4 }}>
              <Masonry gutter="28px">
                {filtered.map(img => (
                  <ArchiveTile key={img.id} img={img} onClick={() => setSelectedId(img.id)} />
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </div>
        </section>
      )}

      {/* Principles */}
      <section className="py-28 lg:py-36 px-4 sm:px-6 lg:px-12 bg-white border-t border-black/5">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[11px] uppercase tracking-[0.35em] mb-14" style={{ color: GOLD }}>
            Principles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/10">
            {[
              [
                'Fit first',
                'Tailoring is non-negotiable. Every garment should honour the frame it is cut for.',
              ],
              [
                'Quality materials',
                'Natural fabrics and honest craftsmanship that age with grace.',
              ],
              [
                'Versatility',
                'A wardrobe of pieces that speak to each other across every room I walk into.',
              ],
              [
                'Cultural pride',
                'African aesthetics worn with confidence and authenticity — never as costume.',
              ],
            ].map(([title, text], i) => (
              <div key={title} className="bg-white p-8 lg:p-10">
                <p className="text-sm tracking-[0.3em] mb-10" style={{ color: GOLD }}>
                  {pad(i + 1)}
                </p>
                <h3 className="text-2xl mb-4" style={SERIF}>
                  {title}
                </h3>
                <p className="text-black/60 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaborations */}
      <section className="relative py-28 lg:py-40 px-4 sm:px-6 lg:px-12 bg-black text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(60% 80% at 85% 20%, ${GOLD}33 0%, transparent 60%)`,
          }}
        />
        <div className="relative max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <p className="text-[11px] uppercase tracking-[0.4em] text-white/50 mb-8">
              Collaborations
            </p>
            <h2
              className="text-[clamp(2.75rem,6.5vw,6rem)] leading-[0.95] tracking-tight"
              style={SERIF}
            >
              For houses, brands
              <br />
              &amp; editorial.
            </h2>
            <p className="mt-8 text-lg md:text-xl text-white/65 leading-relaxed max-w-2xl">
              Available worldwide for campaigns, lookbooks, brand partnerships, runway and editorial
              features. A meteorologist, technologist and artist who wears his work — bringing an
              audience that values substance as much as style.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center gap-3 px-8 py-5 text-sm uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
              style={{ background: GOLD }}
            >
              Start a collaboration
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-3 px-8 py-5 text-sm uppercase tracking-[0.2em] border border-white/25 hover:border-white transition-colors"
            >
              About Koboko
            </Link>
          </div>
        </div>
      </section>

      {/* Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-[#0b0b0b] text-white flex flex-col lg:flex-row"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.title}
          >
            {/* Image stage */}
            <div
              className="relative flex-1 min-h-0 flex items-center justify-center p-4 pt-16 lg:p-12"
              role="presentation"
              // Clicking the backdrop (not the photo) closes; Escape does too.
              onClick={e => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
              onTouchStart={e => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={e => {
                if (touchX.current === null) return;
                const dx = e.changedTouches[0].clientX - touchX.current;
                if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
                touchX.current = null;
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage.id}
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="max-h-full max-w-full object-contain select-none"
                  draggable={false}
                />
              </AnimatePresence>
              {sequence.length > 1 && (
                <>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      step(-1);
                    }}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/50 transition-colors"
                    aria-label="Previous look"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      step(1);
                    }}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/50 transition-colors"
                    aria-label="Next look"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Details */}
            <aside className="lg:w-[420px] flex-shrink-0 max-h-[42vh] lg:max-h-none overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/10 p-6 lg:p-10 flex flex-col">
              <div className="flex items-center justify-between mb-8 lg:mb-14">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
                  {pad(selectedIdx + 1)} / {pad(sequence.length)}
                </p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-10 h-10 -mr-2 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
              {selectedImage.category && (
                <p className="text-[11px] uppercase tracking-[0.3em] mb-4" style={{ color: GOLD }}>
                  {selectedImage.category.name}
                </p>
              )}
              <h2 className="text-4xl lg:text-5xl leading-[1] tracking-tight mb-6" style={SERIF}>
                {titleCase(selectedImage.title)}
              </h2>
              {selectedImage.description && (
                <p dir="auto" className="text-white/70 leading-[1.8] whitespace-pre-line mb-10">
                  {selectedImage.description}
                </p>
              )}
              <div className="border-t border-white/10 pt-8 mb-10">
                <Credits img={selectedImage} dark />
              </div>
              <div className="mt-auto flex items-center gap-3">
                <button
                  onClick={() => void copyLook()}
                  className="inline-flex items-center gap-2 px-4 py-3 border border-white/20 hover:border-white text-xs uppercase tracking-[0.2em] transition-colors"
                >
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                  {copied ? 'Link copied' : 'Share look'}
                </button>
                {sequence.length > 1 && (
                  <div className="flex md:hidden gap-2 ml-auto">
                    <button
                      onClick={() => step(-1)}
                      className="w-11 h-11 flex items-center justify-center border border-white/20"
                      aria-label="Previous look"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => step(1)}
                      className="w-11 h-11 flex items-center justify-center border border-white/20"
                      aria-label="Next look"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
