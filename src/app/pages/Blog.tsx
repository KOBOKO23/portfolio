import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Clock, Eye, Heart, MessageCircle, ArrowRight, Globe, X } from 'lucide-react';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Category { id: number; name: string; slug: string; icon: string; color: string; article_count: number; }
interface Article {
  id: number; title: string; slug: string; excerpt: string;
  thumbnail: string | null; category: Category | null;
  tags: string[]; author: string; language: string;
  read_time: number; views: number; like_count: number; comment_count: number;
  is_featured: boolean; published_date: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatNum(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

function categoryGradient(color: string) {
  return `linear-gradient(135deg, ${color}28 0%, ${color}08 60%, transparent 100%)`;
}

const ICON_MAP: Record<string, string> = {
  code: '{ }', cloud: '⛅', heart: '♡', music: '♪',
  users: '⊕', 'bar-chart': '▦', shirt: '◈',
};

function ArticleSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="aspect-[16/9] bg-black/5 rounded-2xl" />
      <div className="h-2.5 bg-black/5 rounded w-1/4" />
      <div className="h-5 bg-black/8 rounded w-3/4" />
      <div className="h-3.5 bg-black/5 rounded w-full" />
      <div className="h-3.5 bg-black/5 rounded w-4/5" />
    </div>
  );
}

function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const color = article.category?.color || '#d4a574';
  const iconChar = ICON_MAP[article.category?.icon || ''] || '◈';
  const navigate = useNavigate();
  const href = `/blog/${article.slug}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45 }}
      onClick={() => navigate(href)}
      className={`group cursor-pointer flex flex-col ${featured ? 'md:flex-row gap-8 lg:gap-12 items-start' : ''}`}
    >
      {/* Thumbnail */}
      <div className={`block overflow-hidden rounded-2xl flex-shrink-0 ${featured ? 'md:w-1/2' : 'w-full'}`}>
        <div
          className={`relative overflow-hidden ${featured ? 'aspect-[4/3]' : 'aspect-[16/9]'}`}
          style={{ background: article.thumbnail ? '#000' : categoryGradient(color) }}
        >
          {article.thumbnail ? (
            <img
              src={article.thumbnail} alt={article.title}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center select-none">
              <span className="text-7xl opacity-15 font-light" style={{ color }}>{iconChar}</span>
            </div>
          )}

          {article.is_featured && (
            <div className="absolute top-3 left-3 px-2.5 py-0.5 bg-[#d4a574] text-white text-[10px] uppercase tracking-widest rounded-full font-semibold">
              Featured
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-full shadow-lg">
              Read <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${featured ? 'py-2' : 'mt-4'}`}>
        {article.category && (
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color }}>
            {article.category.name}
          </span>
        )}

        {/* Semantic link on the title for accessibility / SEO */}
        <Link
          to={href}
          onClick={e => e.stopPropagation()}
          className={`font-serif text-black leading-snug mb-3 group-hover:text-[#d4a574] transition-colors duration-300 ${
            featured ? 'text-[clamp(1.6rem,3vw,2.4rem)]' : 'text-[1.2rem]'
          }`}
        >
          {article.title}
        </Link>

        <p className={`text-black/55 leading-relaxed mb-5 ${featured ? 'text-[15px]' : 'text-[13px] line-clamp-3'}`}>
          {article.excerpt}
        </p>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {article.tags.slice(0, 3).map(t => (
              <span key={t} className="px-2.5 py-0.5 bg-black/[0.04] text-black/45 text-[11px] rounded-full font-medium">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-black/35 mt-auto pt-4 border-t border-black/6">
          <span className="text-black/55 font-semibold">{article.author}</span>
          <span>{formatDate(article.published_date)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.read_time}m</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNum(article.views)}</span>
          <span className="flex items-center gap-1 text-red-400"><Heart className="w-3 h-3" />{formatNum(article.like_count)}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{article.comment_count}</span>
          {article.language !== 'en' && (
            <span className="flex items-center gap-1 text-[#d4a574]"><Globe className="w-3 h-3" />{article.language.toUpperCase()}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    void fetch(`${API}/blog/categories/`)
      .then(r => r.json())
      .then(res => { if (res.success) setCategories(res.data || []); });
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  useEffect(() => { setPage(1); }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    const params = new URLSearchParams({ page: String(page), page_size: '9', ordering: '-published_date' });
    if (selectedCategory) params.set('category__slug', selectedCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);

    fetch(`${API}/blog/articles/?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          const d = res.data;
          const results: Article[] = d.results ?? d;
          setArticles(prev => page === 1 ? results : [...prev, ...results]);
          setTotalCount(d.count ?? results.length);
          setHasMore(!!d.next);
        }
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [selectedCategory, debouncedSearch, page]);

  const isFiltered = !!(selectedCategory || debouncedSearch);
  const featuredArticle = !isFiltered && page === 1 ? articles.find(a => a.is_featured) : null;
  const gridArticles = featuredArticle ? articles.filter(a => a.id !== featuredArticle.id) : articles;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Blog"
        description="Insights on meteorology, backend development, data science, faith, and mentorship. In-depth articles from Nairobi, Kenya."
        url="/blog"
      />
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-black py-36 lg:py-52 px-6 lg:px-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(212,165,116,0.12), transparent)' }} />
        {/* Decorative lines */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/5" />
        <div className="absolute left-[20%] top-0 bottom-0 w-px bg-white/3" />

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center relative">
          <div className="w-10 h-[2px] bg-[#d4a574] mx-auto mb-8" />
          <h1 className="font-serif leading-[0.92] text-white mb-6"
            style={{ fontSize: 'clamp(3.5rem,9vw,8rem)' }}>
            Ideas &<br /><em className="not-italic text-[#d4a574]">Insights</em>
          </h1>
          <p className="text-white/50 text-[clamp(1rem,2vw,1.2rem)] max-w-lg mx-auto leading-relaxed">
            Dispatches from the intersection of meteorology, software, faith, and African identity.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-white/25 text-xs uppercase tracking-widest">
            <span>{totalCount || '—'} Articles</span>
            <span className="w-px h-3 bg-white/20" />
            <span>{categories.length} Topics</span>
          </div>
        </motion.div>
      </section>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div className="sticky top-[79px] z-30 bg-white/98 backdrop-blur-md border-b border-black/6">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setSelectedCategory('')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                !selectedCategory ? 'bg-black text-white' : 'text-black/50 hover:text-black hover:bg-black/5'
              }`}>
              All
            </button>
            {categories.map(c => (
              <button key={c.slug} onClick={() => setSelectedCategory(c.slug === selectedCategory ? '' : c.slug)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                  selectedCategory === c.slug ? 'text-white shadow-sm' : 'text-black/50 hover:text-black hover:bg-black/5'
                }`}
                style={selectedCategory === c.slug ? { background: c.color } : {}}>
                {c.name}
                <span className="opacity-50">({c.article_count})</span>
              </button>
            ))}
          </div>

          <div className="relative flex-shrink-0 w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
            <input type="text" placeholder="Search…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-black/[0.04] text-sm rounded-xl border border-transparent focus:outline-none focus:border-black/12 focus:bg-white transition-all placeholder:text-black/25"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-black/30 hover:text-black transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        {/* Result label */}
        {isFiltered && !loading && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-black/35 mb-10 uppercase tracking-widest">
            {totalCount} result{totalCount !== 1 ? 's' : ''}
            {debouncedSearch && <> · "<span className="text-black/55">{debouncedSearch}</span>"</>}
          </motion.p>
        )}

        {/* Fetch error */}
        {fetchError && !loading && (
          <div className="text-center py-36">
            <span className="text-6xl text-black/10 font-serif block mb-5">◈</span>
            <p className="text-black/50 text-lg mb-2">Could not load articles</p>
            <p className="text-black/30 text-sm mb-6">Check your connection and try again.</p>
            <button onClick={() => { setFetchError(false); setPage(1); }}
              className="text-[#d4a574] text-sm hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Skeleton / articles */}
        {!fetchError && (loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-36">
            <span className="text-6xl text-black/10 font-serif block mb-5">◈</span>
            <p className="text-black/35 text-lg">No articles found</p>
            {isFiltered && (
              <button onClick={() => { setSelectedCategory(''); setSearchQuery(''); }}
                className="mt-5 text-[#d4a574] text-sm hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Featured */}
            {featuredArticle && (
              <section className="mb-16 pb-16 border-b border-black/6">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#d4a574] mb-7">Editor's Pick</p>
                <ArticleCard article={featuredArticle} featured />
              </section>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              <AnimatePresence mode="popLayout">
                {gridArticles.map(a => <ArticleCard key={a.id} article={a} />)}
              </AnimatePresence>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-20">
                <button onClick={() => setPage(p => p + 1)} disabled={loading}
                  className="group px-12 py-4 border border-black text-black text-sm uppercase tracking-widest font-medium hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-40 flex items-center gap-3 mx-auto">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Loading</>
                  ) : (
                    <>Load More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}
