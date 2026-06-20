import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../components/SEO';
import {
  ArrowLeft, Clock, Eye, Calendar, Heart, MessageCircle,
  Twitter, Linkedin, Facebook, Link2, Check, ChevronUp, Tag,
  Send, Globe,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const REACTIONS = [
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'clap', emoji: '👏', label: 'Clap' },
  { key: 'mind_blown', emoji: '🤯', label: 'Mind Blown' },
  { key: 'insightful', emoji: '💡', label: 'Insightful' },
];

interface ArticleResp { success: boolean; data?: Article }
interface CommentsResp { success: boolean; data?: { results?: Comment[] } | Comment[] }
interface LikeResp { success: boolean; data?: { liked: boolean; count: number } }
interface ReactResp { success: boolean; data?: { reaction: string | null; summary: Record<string, number> } }

function getFingerprint(): string {
  let fp = localStorage.getItem('_fp');
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('_fp', fp);
  }
  return fp;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface Article {
  id: number; title: string; slug: string; excerpt: string;
  thumbnail: string | null; thumbnail_alt: string; category: { name: string; slug: string; color: string } | null;
  tags: string[]; author: string; author_bio: string; language: string;
  read_time: number; views: number; like_count: number; comment_count: number;
  is_featured: boolean; published_date: string; content: string; content_html: string;
  allow_comments: boolean; reaction_summary: Record<string, number>;
  share_counts: Record<string, number>; user_liked: boolean; user_reaction: string | null;
  updated_at: string;
}

interface Comment {
  id: number; author_name: string; content: string; likes: number; created_at: string;
  replies: Comment[];
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '', parent: null as number | null });
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fp = getFingerprint();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

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
        } else {
          setError('Article not found.');
        }
      })
      .catch(err => {
        console.error('[BlogDetail] fetch failed:', err);
        setError('Failed to load article. Please try again.');
      })
      .finally(() => setLoading(false));

    fetch(`${API}/blog/articles/${slug}/comments/`)
      .then(r => r.json() as Promise<CommentsResp>)
      .then(res => {
        if (res.success) {
          const d = res.data;
          setComments(Array.isArray(d) ? d : (d as { results?: Comment[] })?.results ?? []);
        }
      })
      .catch(() => {});
  }, [slug, fp]);

  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight;
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, (scrolled / total) * 100));
      setShowScrollTop(window.scrollY > 600);
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
        method: 'POST', headers: { 'X-Fingerprint': fp, 'Content-Type': 'application/json' },
      });
      const data = (await res.json()) as LikeResp;
      if (data.success && data.data) { setLiked(data.data.liked); setLikeCount(data.data.count); }
    } catch { setLiked(prev); setLikeCount(c => c + (prev ? 1 : -1)); }
  }, [slug, liked, fp]);

  const toggleReaction = useCallback(async (type: string) => {
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
    } catch { /* optimistic update failed silently */ }
  }, [slug, fp]);

  const share = useCallback(async (platform: string) => {
    const url = window.location.href;
    const title = article?.title ?? '';
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    };
    if (platform === 'copy_link') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    void fetch(`${API}/blog/articles/${slug}/share/${platform}/`, { method: 'POST', headers: { 'X-Fingerprint': fp } });
  }, [article, slug, fp]);

  const submitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      const body: Record<string, unknown> = {
        author_name: commentForm.name,
        author_email: commentForm.email,
        content: commentForm.content,
      };
      if (commentForm.parent) body.parent = commentForm.parent;
      const res = await fetch(`${API}/blog/articles/${slug}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Fingerprint': fp },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { success: boolean; error?: { message?: string; details?: Record<string, string[]> } };
      if (data.success) {
        setCommentSuccess(true);
        setCommentForm({ name: '', email: '', content: '', parent: null });
        setReplyingTo(null);
        setTimeout(() => setCommentSuccess(false), 4000);
        const refresh = await fetch(`${API}/blog/articles/${slug}/comments/`);
        const refreshData = (await refresh.json()) as CommentsResp;
        if (refreshData.success) {
          const d = refreshData.data;
          setComments(Array.isArray(d) ? d : (d as { results?: Comment[] })?.results ?? []);
        }
      } else {
        const details = data.error?.details;
        setCommentError(
          details ? Object.values(details).flat().join(' ') : (data.error?.message ?? 'Could not post comment.')
        );
      }
    } catch {
      setCommentError('Something went wrong. Please try again.');
    } finally { setCommentSubmitting(false); }
  }, [slug, commentForm, fp]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-black/40 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );

  if (error || !article) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-2xl font-serif mb-4">{error ?? 'Article not found'}</p>
        <button onClick={() => navigate('/blog')} className="text-[#d4a574] flex items-center gap-2 mx-auto hover:gap-3 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </button>
      </div>
    </div>
  );

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.thumbnail ?? undefined}
        url={`/blog/${article.slug}`}
        type="article"
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

      {/* Hero */}
      <section className="relative min-h-[60vh] flex flex-col justify-end bg-black overflow-hidden">
        {article.thumbnail ? (
          <>
            <img
              src={article.thumbnail}
              alt={article.thumbnail_alt || article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${article.category?.color ?? '#d4a574'}22 0%, #000 60%)` }}
          />
        )}

        <div className="relative z-10 px-6 lg:px-16 pb-16 pt-32 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Link to="/blog" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" /> All Articles
            </Link>

            {article.category && (
              <span className="inline-block px-3 py-1 text-xs uppercase tracking-widest mb-4 rounded-full"
                style={{ background: article.category.color + '33', color: article.category.color, border: `1px solid ${article.category.color}55` }}>
                {article.category.name}
              </span>
            )}

            <h1 className="text-[clamp(2rem,5vw,4rem)] leading-[1.1] text-white font-serif mb-6">
              {article.title}
            </h1>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl">{article.excerpt}</p>

            <div className="flex flex-wrap items-center gap-6 text-white/50 text-sm">
              <span className="text-white/80 font-medium">{article.author}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(article.published_date)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{article.read_time} min read</span>
              <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{formatNumber(article.views)} views</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{article.language.toUpperCase()}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content + Sidebar */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-16">
        {/* Main Content */}
        <div ref={contentRef}>
          {/* Prose */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-serif prose-headings:text-black
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[17px] prose-p:leading-[1.85] prose-p:text-black/80
              prose-strong:text-black prose-strong:font-semibold
              prose-a:text-[#d4a574] prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-4 prose-blockquote:border-[#d4a574] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-black/60
              prose-code:bg-black/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-[#0a0a0a] prose-pre:text-white prose-pre:rounded-xl prose-pre:p-6
              prose-ol:text-black/80 prose-ul:text-black/80
              prose-hr:border-black/10
              [&_img]:rounded-xl [&_img]:my-8 [&_img]:shadow-md
              [&_img.img-right]:float-right [&_img.img-right]:ml-8 [&_img.img-right]:mb-4 [&_img.img-right]:max-w-[45%]
              [&_img.img-left]:float-left [&_img.img-left]:mr-8 [&_img.img-left]:mb-4 [&_img.img-left]:max-w-[45%]
              [&_img.img-center]:mx-auto [&_img.img-center]:block [&_img.img-center]:max-w-[80%]
              [&_figure]:my-8 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-black/45 [&_figcaption]:mt-2
              [&_.clearfix]:clear-both"
            dangerouslySetInnerHTML={{ __html: article.content_html }}
          />

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-black/8">
              {article.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f0] text-black/60 text-sm rounded-full hover:bg-[#d4a574]/15 transition-colors">
                  <Tag className="w-3 h-3" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author */}
          {article.author_bio && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="mt-12 p-8 bg-[#f5f5f0] rounded-2xl flex gap-5 items-start">
              <div className="w-14 h-14 rounded-full bg-[#d4a574] flex items-center justify-center text-white text-xl font-serif flex-shrink-0">
                {article.author[0]}
              </div>
              <div>
                <p className="font-semibold text-black mb-1">{article.author}</p>
                <p className="text-black/60 text-sm leading-relaxed">{article.author_bio}</p>
              </div>
            </motion.div>
          )}

          {/* Mobile Share */}
          <div className="mt-10 p-6 border border-black/8 rounded-2xl lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-widest text-black/40 mb-4">Share</p>
            <ShareButtons onShare={share} copied={copied} />
          </div>

          {/* Reactions */}
          <div className="mt-12 p-6 bg-[#fafafa] rounded-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-black/40 mb-5">React</p>
            <div className="flex flex-wrap gap-3">
              {REACTIONS.map(r => (
                <motion.button key={r.key} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  onClick={() => toggleReaction(r.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    userReaction === r.key
                      ? 'border-[#d4a574] bg-[#d4a574]/10 text-black'
                      : 'border-black/8 bg-white text-black/60 hover:border-black/20'
                  }`}>
                  <span className="text-lg">{r.emoji}</span>
                  <span className="font-medium">{reactions[r.key] || 0}</span>
                </motion.button>
              ))}
            </div>
            {totalReactions > 0 && (
              <p className="text-xs text-black/40 mt-3">{totalReactions} total reactions</p>
            )}
          </div>

          {/* Like */}
          <div className="mt-6 flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleLike}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl border-2 transition-all ${
                liked ? 'border-red-400 bg-red-50 text-red-500' : 'border-black/10 text-black/60 hover:border-red-300 hover:text-red-400'
              }`}>
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-400' : ''}`} />
              <span className="font-medium">{formatNumber(likeCount)}</span>
              <span className="text-sm">{liked ? 'Liked' : 'Like'}</span>
            </motion.button>
            <span className="flex items-center gap-2 text-black/40 text-sm">
              <MessageCircle className="w-4 h-4" /> {article.comment_count} comments
            </span>
          </div>

          {/* Comments */}
          {article.allow_comments && (
            <div className="mt-16">
              <h3 className="font-serif text-2xl mb-8 flex items-center gap-3">
                Comments
                <span className="text-base text-black/30 font-sans font-normal">({comments.length})</span>
              </h3>

              {commentSuccess && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                  <Check className="w-5 h-5" />
                  Your comment was posted! It may take a moment to appear.
                </motion.div>
              )}

              {commentError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {commentError}
                </motion.div>
              )}

              {/* Comment Form */}
              <CommentForm
                parentId={replyingTo}
                onCancel={() => setReplyingTo(null)}
                onSubmit={submitComment}
                form={commentForm}
                setForm={(f) => setCommentForm(p => ({ ...p, ...f }))}
                submitting={commentSubmitting}
              />

              {/* Comment List */}
              <div className="mt-10 space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-16 text-black/30">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>Be the first to comment.</p>
                  </div>
                ) : comments.map(c => (
                  <CommentCard key={c.id} comment={c} onReply={() => setReplyingTo(c.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            {/* Like sticky */}
            <div className="p-5 border border-black/8 rounded-2xl text-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={toggleLike}
                className={`w-full flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${
                  liked ? 'text-red-500' : 'text-black/40 hover:text-red-400'
                }`}>
                <Heart className={`w-7 h-7 ${liked ? 'fill-red-400' : ''}`} />
                <span className="text-xl font-semibold">{formatNumber(likeCount)}</span>
                <span className="text-xs uppercase tracking-widest">{liked ? 'Liked' : 'Like'}</span>
              </motion.button>
            </div>

            {/* Share */}
            <div className="p-5 border border-black/8 rounded-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-black/40 mb-4">Share</p>
              <ShareButtons onShare={share} copied={copied} vertical />
            </div>

            {/* Reactions mini */}
            {totalReactions > 0 && (
              <div className="p-5 border border-black/8 rounded-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-black/40 mb-3">Reactions</p>
                <div className="flex flex-wrap gap-2">
                  {REACTIONS.filter(r => (reactions[r.key] || 0) > 0).map(r => (
                    <span key={r.key} className="flex items-center gap-1 text-sm text-black/60">
                      {r.emoji} <span className="font-medium">{reactions[r.key]}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#d4a574] transition-colors">
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareButtons({ onShare, copied, vertical = false }: {
  onShare: (p: string) => void; copied: boolean; vertical?: boolean;
}) {
  const btns = [
    { key: 'twitter', icon: Twitter, label: 'X / Twitter', color: '#000' },
    { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: '#0077b5' },
    { key: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877f2' },
    { key: 'copy_link', icon: copied ? Check : Link2, label: copied ? 'Copied!' : 'Copy Link', color: '#d4a574' },
  ];
  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-wrap'} gap-2`}>
      {btns.map(b => (
        <button key={b.key} onClick={() => onShare(b.key)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-black/8 text-black/60 hover:border-black/20 hover:text-black text-sm transition-all w-full">
          <b.icon className="w-4 h-4" />
          <span>{b.label}</span>
        </button>
      ))}
    </div>
  );
}

function CommentCard({ comment, onReply }: { comment: Comment; onReply: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="group">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a574] to-[#8b7355] flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold">
          {comment.author_name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-semibold text-sm">{comment.author_name}</span>
            <span className="text-xs text-black/30">{formatDate(comment.created_at)}</span>
          </div>
          <p className="text-black/75 text-[15px] leading-relaxed">{comment.content}</p>
          <button onClick={onReply}
            className="mt-2 text-xs text-[#d4a574] hover:text-black transition-colors opacity-0 group-hover:opacity-100">
            Reply
          </button>
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <div className="ml-14 mt-4 pl-4 border-l-2 border-black/5 space-y-4">
          {comment.replies.map(r => (
            <div key={r.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-black/10 flex-shrink-0 flex items-center justify-center text-black/60 text-xs font-semibold">
                {r.author_name[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm">{r.author_name}</span>
                  <span className="text-xs text-black/30">{formatDate(r.created_at)}</span>
                </div>
                <p className="text-black/70 text-sm leading-relaxed">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CommentForm({ parentId, onCancel, onSubmit, form, setForm, submitting }: {
  parentId: number | null; onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { name: string; email: string; content: string };
  setForm: (f: Partial<{ name: string; email: string; content: string }>) => void;
  submitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="bg-[#fafafa] rounded-2xl p-6">
      <h4 className="font-semibold mb-5 text-black/80">
        {parentId ? '↳ Replying to comment' : 'Leave a comment'}
      </h4>
      {parentId && (
        <button type="button" onClick={onCancel} className="text-xs text-black/40 hover:text-black mb-4 block">
          Cancel reply
        </button>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <input required value={form.name} onChange={e => setForm({ name: e.target.value })}
          placeholder="Your name *" className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#d4a574] transition-colors" />
        <input required type="email" value={form.email} onChange={e => setForm({ email: e.target.value })}
          placeholder="Email (not published) *" className="px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#d4a574] transition-colors" />
      </div>
      <textarea required value={form.content} onChange={e => setForm({ content: e.target.value })}
        placeholder="Share your thoughts..." rows={4}
        className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#d4a574] transition-colors resize-none mb-4" />
      <button type="submit" disabled={submitting}
        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-[#d4a574] transition-colors text-sm font-medium disabled:opacity-50">
        <Send className="w-4 h-4" />
        {submitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
