import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import { NewsletterForm } from '../components/NewsletterForm';
import { FALLBACK_DETAIL_ARTICLES } from '../data/blogFallback';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
  Check,
  ChevronUp,
  Tag,
  Send,
  Globe,
  Images,
  WifiOff,
  Share2,
  Mail,
  BadgeCheck,
  List,
  CornerDownRight,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const REACTIONS = [
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Clap' },
  { key: 'mind_blown', emoji: '🤯', label: 'Mind Blown' },
  { key: 'insightful', emoji: '💡', label: 'Insightful' },
];

// Languages an article can be written in (BlogArticle.LANGUAGE_CHOICES), named
// in their own language so readers anywhere recognise them.
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  sw: 'Kiswahili',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
  zh: '中文',
};
const RTL_LANGUAGES = new Set(['ar']);

interface ArticleResp {
  success: boolean;
  data?: Article;
}
interface CommentsResp {
  success: boolean;
  data?: { results?: Comment[] } | Comment[];
}
interface ListResp {
  success: boolean;
  data?: { results?: RelatedArticle[] } | RelatedArticle[];
}
interface LikeResp {
  success: boolean;
  data?: { liked: boolean; count: number };
}
interface ReactResp {
  success: boolean;
  data?: { reaction: string | null; summary: Record<string, number> };
}

function getFingerprint(): string {
  try {
    let fp = localStorage.getItem('_fp');
    if (!fp) {
      fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('_fp', fp);
    }
    return fp;
  } catch {
    return '';
  }
}

// Dates and numbers follow the reader's own locale (navigator.language), so a
// visitor in Paris, Nairobi or São Paulo each sees the format they expect.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
function formatNumber(n: number): string {
  return compact.format(n);
}

function unwrapList<T>(d: { results?: T[] } | T[] | undefined): T[] {
  if (!d) return [];
  return Array.isArray(d) ? d : (d.results ?? []);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Older browsers / non-secure contexts: fall back to a hidden textarea.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

interface GalleryImage {
  id: number;
  image: string;
  alt_text: string;
  caption: string;
  order: number;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  thumbnail_alt: string;
  share_image?: string | null;
  category: { name: string; slug: string; color: string } | null;
  tags: string[];
  author: string;
  author_bio: string;
  language: string;
  read_time: number;
  views: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  published_date: string;
  content: string;
  content_html: string;
  allow_comments: boolean;
  reaction_summary: Record<string, number>;
  share_counts: Record<string, number>;
  user_liked: boolean;
  user_reaction: string | null;
  updated_at: string;
  gallery: GalleryImage[];
}

interface RelatedArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string | null;
  thumbnail_alt: string;
  category: { name: string; slug: string; color: string } | null;
  read_time: number;
  published_date: string;
}

interface Comment {
  id: number;
  author_name: string;
  content: string;
  is_author?: boolean;
  likes: number;
  created_at: string;
  replies?: Comment[];
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface CommentValues {
  name: string;
  email: string;
  content: string;
}

type SubmitResult = { ok: true } | { ok: false; error: string };

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeHeading, setActiveHeading] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const proseRef = useRef<HTMLDivElement>(null);
  const fp = useMemo(getFingerprint, []);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const loadComments = useCallback(async () => {
    if (!slug) return;
    try {
      const res = (await (
        await fetch(`${API}/blog/articles/${slug}/comments/`)
      ).json()) as CommentsResp;
      if (res.success) setComments(unwrapList(res.data));
    } catch {
      /* comments are optional */
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setIsFallback(false);
    setReplyingTo(null);

    fetch(`${API}/blog/articles/${slug}/`, { headers: { 'X-Fingerprint': fp } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ArticleResp>;
      })
      .then(res => {
        if (res.success && res.data) {
          const a = res.data;
          setArticle(a);
          setLiked(Boolean(a.user_liked));
          setLikeCount(Number(a.like_count) || 0);
          setUserReaction(a.user_reaction ?? null);
          setReactions(a.reaction_summary ?? {});
          setShareCounts(a.share_counts ?? {});
        } else {
          setError('Article not found.');
        }
      })
      .catch(err => {
        console.error('[BlogDetail] fetch failed:', err);
        // The live API is unreachable — if this is an article we have a
        // snapshot of, show that instead of a dead page for anyone
        // following a shared link while the backend is down.
        const fallback = FALLBACK_DETAIL_ARTICLES[slug];
        if (fallback) {
          setArticle(fallback);
          setLikeCount(fallback.like_count);
          setReactions(fallback.reaction_summary);
          setShareCounts(fallback.share_counts ?? {});
          setIsFallback(true);
        } else {
          setError('Failed to load article. Please try again.');
        }
      })
      .finally(() => setLoading(false));

    void loadComments();
  }, [slug, fp, loadComments]);

  // "Keep reading": same-category articles first, then the latest others.
  useEffect(() => {
    if (!article || isFallback) return;
    fetch(`${API}/blog/articles/?page_size=12`)
      .then(r => r.json() as Promise<ListResp>)
      .then(res => {
        const others = unwrapList(res.data).filter(a => a.slug !== article.slug);
        const sameCat = others.filter(a => a.category?.slug === article.category?.slug);
        const rest = others.filter(a => a.category?.slug !== article.category?.slug);
        setRelated([...sameCat, ...rest].slice(0, 3));
      })
      .catch(() => setRelated([]));
  }, [article, isFallback]);

  // Build the table of contents from the rendered headings, give images lazy
  // loading, and track which section is on screen.
  useEffect(() => {
    const root = proseRef.current;
    if (!root || !article) return;
    root.querySelectorAll('img').forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });
    const headings = Array.from(root.querySelectorAll<HTMLHeadingElement>('h2, h3'));
    const used = new Set<string>();
    const items = headings.map((h, i) => {
      let id =
        h.id ||
        (h.textContent ?? '')
          .toLowerCase()
          .trim()
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-|-$/g, '') ||
        `section-${i}`;
      while (used.has(id)) id = `${id}-${i}`;
      used.add(id);
      h.id = id;
      h.style.scrollMarginTop = '96px';
      return { id, text: h.textContent ?? '', level: h.tagName === 'H2' ? 2 : 3 };
    });
    setToc(items);

    if (!items.length || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length) setActiveHeading(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px' }
    );
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [article]);

  // Deep links from reply emails (#comment-123) once comments have loaded.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#comment-') || !comments.length) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#d4a574]/60');
      setTimeout(() => el.classList.remove('ring-2', 'ring-[#d4a574]/60'), 2500);
    }
  }, [comments]);

  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, (scrolled / total) * 100));
      setShowScrollTop(window.scrollY > 600);
      setShowMobileBar(rect.top < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleLike = useCallback(async () => {
    if (!slug) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount(c => c + (prev ? -1 : 1));
    try {
      const res = await fetch(`${API}/blog/articles/${slug}/like/`, {
        method: 'POST',
        headers: { 'X-Fingerprint': fp, 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as LikeResp;
      if (data.success && data.data) {
        setLiked(data.data.liked);
        setLikeCount(data.data.count);
      }
    } catch {
      setLiked(prev);
      setLikeCount(c => c + (prev ? 1 : -1));
    }
  }, [slug, liked, fp]);

  const toggleReaction = useCallback(
    async (type: string) => {
      if (!slug) return;
      try {
        const res = await fetch(`${API}/blog/articles/${slug}/react/`, {
          method: 'POST',
          headers: { 'X-Fingerprint': fp, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction: type }),
        });
        const data = (await res.json()) as ReactResp;
        if (data.success && data.data) {
          setUserReaction(data.data.reaction);
          setReactions(data.data.summary);
        }
      } catch {
        /* optimistic update failed silently */
      }
    },
    [slug, fp]
  );

  const share = useCallback(
    async (platform: string) => {
      if (!article) return;
      // Share the clean article URL (no #fragment or tracking params), which is
      // also what the link-preview service renders.
      const url = `${window.location.origin}/blog/${article.slug}`;
      const title = article.title;
      const text = `${title} — ${article.excerpt}`;
      const shareUrls: Record<string, string> = {
        twitter: `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      };

      if (platform === 'native') {
        try {
          await navigator.share({ title, text: article.excerpt, url });
        } catch {
          return; // dismissed — don't count it
        }
      } else if (platform === 'copy_link') {
        await copyText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else if (platform === 'email') {
        window.location.href = shareUrls.email;
      } else if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=640,height=560');
      }
      setShareSheetOpen(false);
      setShareCounts(c => ({ ...c, [platform]: (c[platform] ?? 0) + 1 }));
      if (!isFallback) {
        fetch(`${API}/blog/articles/${article.slug}/share/${platform}/`, {
          method: 'POST',
          headers: { 'X-Fingerprint': fp },
        }).catch(() => {});
      }
    },
    [article, fp, isFallback]
  );

  const openShare = useCallback(() => {
    if (canNativeShare) void share('native');
    else setShareSheetOpen(true);
  }, [canNativeShare, share]);

  const postComment = useCallback(
    async (
      values: CommentValues & { website?: string },
      parent: number | null
    ): Promise<SubmitResult> => {
      if (!slug) return { ok: false, error: 'Missing article.' };
      try {
        const res = await fetch(`${API}/blog/articles/${slug}/comments/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Fingerprint': fp },
          body: JSON.stringify({
            author_name: values.name,
            author_email: values.email,
            content: values.content,
            ...(parent ? { parent } : {}),
            website: values.website ?? '',
          }),
        });
        const data = (await res.json()) as {
          success: boolean;
          error?: { message?: string; details?: Record<string, string[]> };
        };
        if (data.success) {
          void loadComments();
          return { ok: true };
        }
        const details = data.error?.details;
        return {
          ok: false,
          error: details
            ? Object.values(details).flat().join(' ')
            : (data.error?.message ?? 'Could not post comment.'),
        };
      } catch {
        return { ok: false, error: 'Something went wrong. Please try again.' };
      }
    },
    [slug, fp, loadComments]
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-black/40 tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );

  if (error || !article)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-2xl font-serif mb-4">{error ?? 'Article not found'}</p>
          <button
            onClick={() => navigate('/blog')}
            className="text-[#d4a574] flex items-center gap-2 mx-auto hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </button>
        </div>
      </div>
    );

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);
  const totalShares = Object.values(shareCounts).reduce((a, b) => a + b, 0);
  const isRtl = RTL_LANGUAGES.has(article.language);
  const commentTotal = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
  const updatedLater =
    new Date(article.updated_at).getTime() - new Date(article.published_date).getTime() >
    1000 * 60 * 60 * 24 * 2;

  // Any uploaded image whose snippet wasn't manually pasted into the article
  // body still needs to be visible — shown here instead of silently dropped.
  const unplacedGallery = (article.gallery ?? [])
    .filter(img => !article.content_html.includes(img.image))
    .sort((a, b) => a.order - b.order);

  const scrollToComments = () =>
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.share_image ?? article.thumbnail ?? undefined}
        url={`/blog/${article.slug}`}
        type="article"
        lang={article.language}
        article={{
          publishedTime: article.published_date,
          modifiedTime: article.updated_at,
          author: article.author,
          tags: article.tags,
          section: article.category?.name,
        }}
      />
      {/* Reading Progress */}
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[100] bg-black/5">
        <motion.div
          className="h-full bg-[#d4a574]"
          style={{ width: `${readProgress}%` }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        />
      </div>

      {/* Offline banner — shown when this page is a cached snapshot because
          the live API was unreachable */}
      {isFallback && (
        <div className="bg-[#d4a574]/15 border-b border-[#d4a574]/30 text-black/70 text-sm px-6 py-3 flex items-center justify-center gap-2 text-center">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          You're viewing a saved copy of this article — comments, likes, and live stats are
          temporarily unavailable.
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-end bg-black overflow-hidden">
        {article.thumbnail ? (
          <>
            <motion.img
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
              src={article.thumbnail}
              alt={article.thumbnail_alt || article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${article.category?.color ?? '#d4a574'}22 0%, #000 60%)`,
            }}
          />
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-14 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl"
            lang={article.language}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <Link
              to="/blog"
              dir="ltr"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All Articles
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              {article.category && (
                <span
                  className="inline-block px-3 py-1 text-xs uppercase tracking-widest rounded-full"
                  style={{
                    background: article.category.color + '33',
                    color: article.category.color,
                    border: `1px solid ${article.category.color}55`,
                  }}
                >
                  {article.category.name}
                </span>
              )}
              {article.is_featured && (
                <span className="px-3 py-1 text-xs uppercase tracking-widest rounded-full bg-white/10 text-white/80 border border-white/15">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-[clamp(2.1rem,5.5vw,4.5rem)] leading-[1.05] tracking-tight text-white font-serif mb-6 text-balance">
              {article.title}
            </h1>

            <p className="text-white/75 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-white/55 text-sm">
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#d4a574] flex items-center justify-center text-black font-serif text-lg">
                  {article.author[0]}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-white font-medium">{article.author}</span>
                  <span className="text-white/45 text-xs">
                    <time dateTime={article.published_date}>
                      {formatDate(article.published_date)}
                    </time>
                    {updatedLater && <> · Updated {formatDate(article.updated_at)}</>}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {article.read_time} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(article.views)} views
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {LANGUAGE_NAMES[article.language] ?? article.language.toUpperCase()}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content + Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-12 lg:gap-16">
        {/* Main Content */}
        <div ref={contentRef} className="min-w-0 max-w-[720px] w-full mx-auto lg:mx-0">
          {/* Mobile table of contents */}
          {toc.length >= 2 && (
            <details className="lg:hidden mb-10 rounded-2xl border border-black/8 bg-[#fafaf7] group">
              <summary className="flex items-center gap-2 px-5 py-4 cursor-pointer text-sm font-semibold uppercase tracking-widest text-black/50 list-none">
                <List className="w-4 h-4" /> In this article
                <span className="ml-auto text-black/30 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <TableOfContents items={toc} active={activeHeading} className="px-5 pb-5" />
            </details>
          )}

          {/* Prose */}
          <div
            ref={proseRef}
            lang={article.language}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="prose prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-black prose-headings:tracking-tight
              prose-h2:text-[1.75rem] prose-h2:mt-14 prose-h2:mb-5
              prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-3
              prose-p:text-[18px] prose-p:leading-[1.85] prose-p:text-black/80
              [&>p:first-of-type]:text-[21px] [&>p:first-of-type]:leading-[1.7] [&>p:first-of-type]:text-black/90
              prose-strong:text-black prose-strong:font-semibold
              prose-a:text-[#a8743f] prose-a:underline prose-a:decoration-[#d4a574]/40 prose-a:underline-offset-4 hover:prose-a:decoration-[#d4a574]
              prose-blockquote:border-l-4 prose-blockquote:border-[#d4a574] prose-blockquote:bg-[#fbf7f1] prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:font-serif prose-blockquote:text-xl prose-blockquote:not-italic prose-blockquote:text-black/75
              prose-code:bg-black/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[#0a0a0a] prose-pre:text-white prose-pre:rounded-xl prose-pre:p-6
              prose-ol:text-black/80 prose-ul:text-black/80 prose-li:marker:text-[#d4a574]
              prose-hr:border-black/10 prose-hr:my-14
              prose-table:text-base [&_table]:block [&_table]:overflow-x-auto
              [&_img]:rounded-xl [&_img]:my-8 [&_img]:shadow-md
              [&_img.img-right]:float-right [&_img.img-right]:ml-8 [&_img.img-right]:mb-4 [&_img.img-right]:max-w-[45%]
              [&_img.img-left]:float-left [&_img.img-left]:mr-8 [&_img.img-left]:mb-4 [&_img.img-left]:max-w-[45%]
              [&_img.img-center]:mx-auto [&_img.img-center]:block [&_img.img-center]:max-w-[80%]
              max-sm:[&_img.img-right]:float-none max-sm:[&_img.img-right]:max-w-full max-sm:[&_img.img-right]:ml-0
              max-sm:[&_img.img-left]:float-none max-sm:[&_img.img-left]:max-w-full max-sm:[&_img.img-left]:mr-0
              [&_figure]:my-8 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-black/45 [&_figcaption]:mt-2
              [&_.clearfix]:clear-both"
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />

          {/* Gallery — images uploaded for this article that weren't manually
              placed at a specific point in the text above. */}
          {unplacedGallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-12 pt-8 border-t border-black/8"
            >
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-black/40 mb-6">
                <Images className="w-4 h-4" /> Gallery
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {unplacedGallery.map((img, i) => (
                  <motion.figure
                    key={img.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5 }}
                    className="group overflow-hidden rounded-xl bg-black/5"
                  >
                    <div className="overflow-hidden">
                      <img
                        src={img.image}
                        alt={img.alt_text || article.title}
                        loading="lazy"
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    {img.caption && (
                      <figcaption className="px-4 py-3 text-sm text-black/50">
                        {img.caption}
                      </figcaption>
                    )}
                  </motion.figure>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-black/8">
              {article.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/blog?q=${encodeURIComponent(tag)}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f0] text-black/60 text-sm rounded-full hover:bg-[#d4a574]/15 hover:text-black transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* End-of-article share prompt */}
          <div className="mt-12 p-6 md:p-8 rounded-2xl border border-black/8 bg-gradient-to-br from-[#fbf7f1] to-white">
            <p className="font-serif text-2xl text-black mb-1">Found this valuable?</p>
            <p className="text-black/55 text-sm mb-5">
              Pass it on to someone who'd appreciate it.
              {totalShares > 0 && <> Shared {formatNumber(totalShares)} times so far.</>}
            </p>
            <ShareButtons
              onShare={share}
              copied={copied}
              canNativeShare={canNativeShare}
              layout="grid"
            />
          </div>

          {/* Author */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 p-6 md:p-8 bg-[#0a0a0a] text-white rounded-2xl flex flex-col sm:flex-row gap-5 items-start"
          >
            <div className="w-16 h-16 rounded-full bg-[#d4a574] flex items-center justify-center text-black text-2xl font-serif flex-shrink-0">
              {article.author[0]}
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Written by</p>
              <p className="font-serif text-xl mb-2 flex items-center gap-2">
                {article.author}
                <BadgeCheck className="w-5 h-5 text-[#d4a574]" aria-label="Author" />
              </p>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                {article.author_bio ||
                  'Meteorologist, developer and writer based in Nairobi — exploring weather, technology, faith and the craft of building things that last.'}
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-1.5 text-sm text-[#d4a574] hover:gap-2.5 transition-all"
              >
                More about the author <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Reactions */}
          {!isFallback && (
            <div className="mt-10 p-6 bg-[#fafafa] rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <p className="text-sm font-semibold uppercase tracking-widest text-black/40">
                  How did this land?
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleLike}
                  aria-pressed={liked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm ${
                    liked
                      ? 'border-red-400 bg-red-50 text-red-500'
                      : 'border-black/10 bg-white text-black/60 hover:border-red-300 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} />
                  <span className="font-medium">{formatNumber(likeCount)}</span>
                  <span>{liked ? 'Liked' : 'Like'}</span>
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-3">
                {REACTIONS.map(r => (
                  <motion.button
                    key={r.key}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleReaction(r.key)}
                    aria-pressed={userReaction === r.key}
                    title={r.label}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                      userReaction === r.key
                        ? 'border-[#d4a574] bg-[#d4a574]/10 text-black'
                        : 'border-black/8 bg-white text-black/60 hover:border-black/20'
                    }`}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span className="font-medium">{reactions[r.key] || 0}</span>
                  </motion.button>
                ))}
              </div>
              {totalReactions > 0 && (
                <p className="text-xs text-black/40 mt-3">
                  {formatNumber(totalReactions)} reactions
                </p>
              )}
            </div>
          )}

          {/* Newsletter CTA */}
          {!isFallback && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 p-8 md:p-10 bg-black text-white rounded-2xl"
            >
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Stay in the loop
              </p>
              <h3 className="font-serif text-2xl md:text-3xl mb-3">
                Enjoyed this? Get more like it.
              </h3>
              <p className="text-white/60 text-sm mb-6 max-w-lg leading-relaxed">
                Insights on technology, meteorology, faith, leadership, and creativity — delivered
                with intention, wherever you are in the world.
              </p>
              <NewsletterForm
                idPrefix="blog-newsletter"
                inputClassName="flex-1 px-5 py-3.5 bg-white/10 border border-white/15 text-white placeholder:text-white/35 focus:outline-none focus:border-[#d4a574]/60 rounded-xl text-sm"
                buttonClassName="px-6 py-3.5 bg-[#d4a574] text-black hover:bg-white transition-all rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-60"
                successClassName="bg-white/10 rounded-2xl p-6"
                helperText="No spam. Unsubscribe anytime."
              />
            </motion.div>
          )}

          {/* Comments */}
          {article.allow_comments && !isFallback && (
            <div id="comments" className="mt-16 scroll-mt-24">
              <h3 className="font-serif text-2xl mb-2 flex items-center gap-3">
                Conversation
                <span className="text-base text-black/30 font-sans font-normal">
                  ({commentTotal})
                </span>
              </h3>
              <p className="text-sm text-black/45 mb-8">
                Comments are read and approved by {article.author} before they appear.
              </p>

              <CommentForm
                title="Join the conversation"
                submitLabel="Post comment"
                onSubmit={values => postComment(values, null)}
              />

              <div className="mt-10 space-y-8">
                {comments.length === 0 ? (
                  <div className="text-center py-14 text-black/30">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Be the first to share your thoughts.</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <CommentCard
                      key={c.id}
                      comment={c}
                      replying={replyingTo === c.id}
                      onReply={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      onSubmitReply={values => postComment(values, c.id)}
                      onCancelReply={() => setReplyingTo(null)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            {toc.length >= 2 && (
              <div className="p-5 border border-black/8 rounded-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-black/40 mb-3 flex items-center gap-2">
                  <List className="w-3.5 h-3.5" /> In this article
                </p>
                <TableOfContents items={toc} active={activeHeading} />
              </div>
            )}

            {!isFallback && (
              <div className="p-4 border border-black/8 rounded-2xl flex items-center justify-around">
                <button
                  onClick={toggleLike}
                  aria-pressed={liked}
                  className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                    liked ? 'text-red-500' : 'text-black/45 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${liked ? 'fill-red-400' : ''}`} />
                  <span className="text-sm font-semibold">{formatNumber(likeCount)}</span>
                </button>
                {article.allow_comments && (
                  <button
                    onClick={scrollToComments}
                    className="flex flex-col items-center gap-1 px-3 py-1 text-black/45 hover:text-black transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm font-semibold">{commentTotal}</span>
                  </button>
                )}
                <div className="flex flex-col items-center gap-1 px-3 py-1 text-black/45">
                  <Share2 className="w-6 h-6" />
                  <span className="text-sm font-semibold">{formatNumber(totalShares)}</span>
                </div>
              </div>
            )}

            <div className="p-5 border border-black/8 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-black/40 mb-4">
                Share
              </p>
              <ShareButtons onShare={share} copied={copied} canNativeShare={false} layout="icons" />
            </div>
          </div>
        </aside>
      </section>

      {/* Keep reading */}
      {related.length > 0 && (
        <section className="bg-[#fafaf7] border-t border-black/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-20">
            <div className="flex items-end justify-between gap-4 mb-10">
              <h2 className="font-serif text-3xl md:text-4xl">Keep reading</h2>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors"
              >
                All articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={`/blog/${r.slug}`}
                    onClick={() => window.scrollTo({ top: 0 })}
                    className="group block bg-white rounded-2xl overflow-hidden border border-black/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    <div className="aspect-[16/10] bg-black/5 overflow-hidden">
                      {r.thumbnail && (
                        <img
                          src={r.thumbnail}
                          alt={r.thumbnail_alt || r.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                    </div>
                    <div className="p-6">
                      {r.category && (
                        <p
                          className="text-xs uppercase tracking-widest mb-2"
                          style={{ color: r.category.color }}
                        >
                          {r.category.name}
                        </p>
                      )}
                      <h3 className="font-serif text-xl leading-snug mb-3 group-hover:text-[#a8743f] transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-xs text-black/40">
                        {formatDate(r.published_date)} · {r.read_time} min read
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile action bar */}
      <AnimatePresence>
        {showMobileBar && !isFallback && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="lg:hidden fixed bottom-6 left-4 right-[88px] z-50 flex items-center justify-around bg-black/90 backdrop-blur text-white rounded-full shadow-2xl py-2 px-2"
          >
            <button
              onClick={toggleLike}
              aria-pressed={liked}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-400 text-red-400' : ''}`} />
              {formatNumber(likeCount)}
            </button>
            {article.allow_comments && (
              <button
                onClick={scrollToComments}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <MessageCircle className="w-5 h-5" />
                {commentTotal}
              </button>
            )}
            <button onClick={openShare} className="flex items-center gap-2 px-3 py-2 text-sm">
              <Share2 className="w-5 h-5" /> Share
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share sheet (mobile browsers without a native share sheet) */}
      <AnimatePresence>
        {shareSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/50 flex items-end"
            onClick={() => setShareSheetOpen(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="w-full bg-white rounded-t-3xl p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              <p className="font-serif text-xl mb-4">Share this article</p>
              <ShareButtons onShare={share} copied={copied} canNativeShare={false} layout="grid" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top (desktop) */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="hidden lg:flex fixed bottom-8 right-8 z-50 w-12 h-12 bg-black text-white rounded-full items-center justify-center shadow-xl hover:bg-[#d4a574] transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function TableOfContents({
  items,
  active,
  className = '',
}: {
  items: TocItem[];
  active: string | null;
  className?: string;
}) {
  return (
    <nav aria-label="Table of contents" className={className}>
      <ol className="space-y-1 border-l border-black/10">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={e => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                history.replaceState(null, '', `#${item.id}`);
              }}
              className={`block -ml-px border-l-2 py-1 text-sm leading-snug transition-colors ${
                item.level === 3 ? 'pl-6' : 'pl-3'
              } ${
                active === item.id
                  ? 'border-[#d4a574] text-black font-medium'
                  : 'border-transparent text-black/50 hover:text-black'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const SHARE_TARGETS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { key: 'twitter', label: 'X', icon: Twitter },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'telegram', label: 'Telegram', icon: Send },
  { key: 'email', label: 'Email', icon: Mail },
] as const;

function ShareButtons({
  onShare,
  copied,
  canNativeShare,
  layout,
}: {
  onShare: (p: string) => void;
  copied: boolean;
  canNativeShare: boolean;
  layout: 'grid' | 'icons';
}) {
  const copy = (
    <button
      onClick={() => onShare('copy_link')}
      className={
        layout === 'icons'
          ? 'col-span-3 mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-black/8 text-black/60 hover:border-black/20 hover:text-black text-sm transition-all'
          : 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-black/10 bg-white text-black/70 hover:border-black/30 hover:text-black text-sm transition-all'
      }
    >
      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );

  if (layout === 'icons') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {SHARE_TARGETS.map(t => (
          <button
            key={t.key}
            onClick={() => onShare(t.key)}
            title={`Share on ${t.label}`}
            aria-label={`Share on ${t.label}`}
            className="flex items-center justify-center h-11 rounded-lg border border-black/8 text-black/55 hover:border-[#d4a574] hover:text-black hover:bg-[#d4a574]/5 transition-all"
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
        {copy}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {canNativeShare && (
        <button
          onClick={() => onShare('native')}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black text-white hover:bg-[#d4a574] hover:text-black text-sm transition-all"
        >
          <Share2 className="w-4 h-4" /> Share…
        </button>
      )}
      {SHARE_TARGETS.map(t => (
        <button
          key={t.key}
          onClick={() => onShare(t.key)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-black/10 bg-white text-black/70 hover:border-black/30 hover:text-black text-sm transition-all"
        >
          <t.icon className="w-4 h-4" /> {t.label}
        </button>
      ))}
      {copy}
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.44 9.44zm8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.64l6.04-1.58a11.33 11.33 0 0 0 5.43 1.38h.01c6.26 0 11.36-5.1 11.37-11.37 0-3.04-1.18-5.89-3.34-8.04z" />
    </svg>
  );
}

function CommentCard({
  comment,
  replying,
  onReply,
  onSubmitReply,
  onCancelReply,
}: {
  comment: Comment;
  replying: boolean;
  onReply: () => void;
  onSubmitReply: (v: CommentValues & { website?: string }) => Promise<SubmitResult>;
  onCancelReply: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      id={`comment-${comment.id}`}
      className="rounded-2xl transition-shadow scroll-mt-28"
    >
      <CommentBody comment={comment} size="lg" />
      <div className="ml-14 mt-2">
        <button
          onClick={onReply}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a8743f] hover:text-black transition-colors"
        >
          <CornerDownRight className="w-3.5 h-3.5" />
          {replying ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {((comment.replies?.length ?? 0) > 0 || replying) && (
        <div className="ml-5 sm:ml-14 mt-4 pl-4 border-l-2 border-black/5 space-y-5">
          {comment.replies?.map(r => (
            <div key={r.id} id={`comment-${r.id}`} className="rounded-xl scroll-mt-28">
              <CommentBody comment={r} size="sm" />
            </div>
          ))}
          {replying && (
            <CommentForm
              title={`Reply to ${comment.author_name}`}
              submitLabel="Post reply"
              compact
              focusOnMount
              onSubmit={onSubmitReply}
              onCancel={onCancelReply}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

function CommentBody({ comment, size }: { comment: Comment; size: 'lg' | 'sm' }) {
  const avatar = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className="flex gap-4">
      <div
        className={`${avatar} rounded-full flex-shrink-0 flex items-center justify-center font-semibold ${
          comment.is_author
            ? 'bg-black text-[#d4a574] ring-2 ring-[#d4a574]'
            : 'bg-gradient-to-br from-[#d4a574] to-[#8b7355] text-white'
        }`}
      >
        {(comment.author_name[0] ?? '?').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
          <span className="font-semibold text-sm">{comment.author_name}</span>
          {comment.is_author && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4a574]/15 text-[#8b5a2b] text-[11px] font-semibold uppercase tracking-wider">
              <BadgeCheck className="w-3 h-3" /> Author
            </span>
          )}
          <time dateTime={comment.created_at} className="text-xs text-black/35">
            {formatDate(comment.created_at)}
          </time>
        </div>
        <p
          dir="auto"
          className={`whitespace-pre-line break-words leading-relaxed ${
            size === 'lg' ? 'text-black/75 text-[15px]' : 'text-black/70 text-sm'
          }`}
        >
          {comment.content}
        </p>
      </div>
    </div>
  );
}

const SAVED_IDENTITY_KEY = 'blog_commenter';

function loadIdentity(): { name: string; email: string } {
  try {
    return JSON.parse(localStorage.getItem(SAVED_IDENTITY_KEY) ?? '') as {
      name: string;
      email: string;
    };
  } catch {
    return { name: '', email: '' };
  }
}

function CommentForm({
  title,
  submitLabel,
  onSubmit,
  onCancel,
  compact = false,
  focusOnMount = false,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (v: CommentValues & { website?: string }) => Promise<SubmitResult>;
  onCancel?: () => void;
  compact?: boolean;
  focusOnMount?: boolean;
}) {
  const [values, setValues] = useState(() => ({ ...loadIdentity(), content: '', website: '' }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusOnMount) textRef.current?.focus();
  }, [focusOnMount]);

  const set = (patch: Partial<typeof values>) => setValues(v => ({ ...v, ...patch }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await onSubmit(values);
    setSubmitting(false);
    if (result.ok) {
      try {
        localStorage.setItem(
          SAVED_IDENTITY_KEY,
          JSON.stringify({ name: values.name, email: values.email })
        );
      } catch {
        /* storage unavailable */
      }
      setValues(v => ({ ...v, content: '' }));
      setSent(true);
    } else {
      setError(result.error);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm"
      >
        <p className="flex items-center gap-2 font-semibold mb-1">
          <Check className="w-4 h-4" /> Thank you — it's in.
        </p>
        <p className="text-green-700/80">
          Your {compact ? 'reply' : 'comment'} will appear here once it's approved. If the author
          replies, you'll get an email.
        </p>
        <button
          onClick={() => {
            setSent(false);
            onCancel?.();
          }}
          className="mt-3 text-xs underline underline-offset-2"
        >
          {compact ? 'Close' : 'Write another'}
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handle} className={`bg-[#fafafa] rounded-2xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-black/80 text-sm">{title}</h4>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-black/40 hover:text-black"
          >
            Cancel
          </button>
        )}
      </div>
      {/* Honeypot: hidden from people, filled in by spam bots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={values.website}
        onChange={e => set({ website: e.target.value })}
        className="absolute -left-[9999px] w-px h-px opacity-0"
        aria-hidden="true"
      />
      <textarea
        ref={textRef}
        required
        dir="auto"
        value={values.content}
        onChange={e => set({ content: e.target.value })}
        placeholder={compact ? 'Write your reply…' : 'Share your thoughts…'}
        rows={compact ? 3 : 4}
        maxLength={5000}
        className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#d4a574] transition-colors resize-y mb-3"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          required
          value={values.name}
          onChange={e => set({ name: e.target.value })}
          placeholder="Your name *"
          autoComplete="name"
          maxLength={100}
          className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#d4a574] transition-colors"
        />
        <input
          required
          type="email"
          value={values.email}
          onChange={e => set({ email: e.target.value })}
          placeholder="Email (never published) *"
          autoComplete="email"
          className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#d4a574] transition-colors"
        />
      </div>
      {error && (
        <p className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-[#d4a574] hover:text-black transition-colors text-sm font-medium disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {submitting ? 'Posting…' : submitLabel}
      </button>
    </form>
  );
}
