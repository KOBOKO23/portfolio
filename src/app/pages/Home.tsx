import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cloud, Code, Users, BookOpen, Music, Shirt, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Article { id: number; title: string; slug: string; excerpt: string; category: { name: string; color: string } | null; read_time: number; published_date: string; }
interface Project { id: number; title: string; description: string; technologies: string[]; github_url: string; live_url: string; }
interface ApprovedFeedback { id: number; rating: number; message: string; created_at: string; }
interface ImpactGoal { id: number; number: string; label: string; progress: number; icon: string }
interface Profile { full_name: string; profile_image: string | null }

interface Resp<T> { success: boolean; data?: T }
type PagResp<T> = Resp<{ results?: T[]; count?: number } | T[]>;

const fadeUp = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } };

const DEFAULT_GMM_STAT = '35+ men mentored';

const PILLARS = [
  { icon: Cloud, label: 'Meteorology', sub: 'Kenya Met Department', href: '/weather-forecast', color: '#0ea5e9' },
  { icon: Code, label: 'Software', sub: 'Django · React · APIs', href: '/projects', color: '#d4a574' },
  { icon: Users, label: 'Great Men Moves', sub: DEFAULT_GMM_STAT, href: '/great-men-moves', color: '#10b981', dynamic: true },
  { icon: BookOpen, label: 'Broken Souls', sub: 'Book — coming soon', href: '/book', color: '#8b5cf6' },
  { icon: Music, label: 'Gospel Music', sub: 'Worship ministry', href: '/music', color: '#ec4899' },
  { icon: Shirt, label: 'Fashion', sub: 'Intentional style', href: '/fashion', color: '#f59e0b' },
];

export function Home() {
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [featuredProject, setFeaturedProject] = useState<Project | null>(null);
  const [approvedFeedback, setApprovedFeedback] = useState<ApprovedFeedback[]>([]);
  const [gmmStat, setGmmStat] = useState(DEFAULT_GMM_STAT);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    void fetch(`${API}/blog/articles/?is_featured=true&page_size=3&ordering=-published_date`)
      .then(r => r.json() as Promise<PagResp<Article>>)
      .then(res => {
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as { results?: Article[] }).results ?? [];
          setLatestArticles(items.slice(0, 3));
        }
      });

    void fetch(`${API}/projects/?is_featured=true&page_size=1`)
      .then(r => r.json() as Promise<PagResp<Project>>)
      .then(res => {
        if (res.success && res.data) {
          const items = Array.isArray(res.data) ? res.data : (res.data as { results?: Project[] }).results ?? [];
          const p = items[0];
          if (p) setFeaturedProject(p);
        }
      });

    fetch(`${API}/feedback/approved/`)
      .then(r => r.json() as Promise<Resp<ApprovedFeedback[] | { results?: ApprovedFeedback[] }>>)
      .then(data => {
        if (data.success && data.data) {
          const items = Array.isArray(data.data) ? data.data : (data.data).results ?? [];
          setApprovedFeedback(items.slice(0, 6));
        }
      })
      .catch(() => {});

    // Great Men Moves pillar card pulls its live figure straight from the
    // Impact Goals CMS instead of a number baked into the code.
    fetch(`${API}/great-men-moves/impact-goals/`)
      .then(r => r.json() as Promise<Resp<ImpactGoal[] | { results?: ImpactGoal[] }>>)
      .then(data => {
        if (!data.success || !data.data) return;
        const goals = Array.isArray(data.data) ? data.data : data.data.results ?? [];
        const mentored = goals.find(g => /mentor/i.test(g.label)) ?? goals[0];
        if (mentored) setGmmStat(`${mentored.number} ${mentored.label.toLowerCase()}`);
      })
      .catch(() => {});

    fetch(`${API}/profile/`)
      .then(r => r.json() as Promise<Resp<Profile>>)
      .then(res => { if (res.success && res.data) setProfile(res.data); })
      .catch(() => {});
  }, []);

  const subscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterName) return;
    setNewsletterStatus('sending');
    try {
      const res = await fetch(`${API}/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newsletterName, email: newsletterEmail }),
      });
      const data = (await res.json()) as { success: boolean };
      setNewsletterStatus(data.success ? 'done' : 'error');
    } catch { setNewsletterStatus('error'); }
  };

  return (
    <div className="min-h-screen">
      <SEO type="profile" />
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
        {/* Radial atmospheric glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-[70vh] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #d4a574 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-8"
            style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }} />
        </div>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(0deg, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%), linear-gradient(90deg, transparent 49.5%, white 49.5%, white 50.5%, transparent 50.5%)', backgroundSize: '80px 80px' }} />

        <div className="relative z-10 px-6 lg:px-16 max-w-[1600px] mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
            <div className="w-16 h-[2px] bg-[#d4a574] mb-10" />
            <h1 className="font-serif leading-[0.92] tracking-tight text-white mb-8"
              style={{ fontSize: 'clamp(3.5rem,11vw,10rem)' }}>
              Where Science<br />
              <span className="text-[#d4a574]">Meets</span> Purpose.
            </h1>
            <p className="text-white/60 text-[clamp(1.1rem,2vw,1.5rem)] mb-4 max-w-2xl leading-relaxed">
              Meteorologist · Backend Developer · Mentor · Author · Gospel Artist
            </p>
            <p className="text-white/35 text-sm uppercase tracking-[0.25em] mb-14">
              Nairobi, Kenya
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/projects" className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-[#d4a574] hover:text-white transition-all duration-500 text-sm font-semibold uppercase tracking-wide">
                View Work <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 text-white/80 hover:border-white hover:text-white transition-all duration-500 text-sm font-semibold uppercase tracking-wide">
                Get In Touch
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/30">
          <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-px h-14 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* ── Pillars / Disciplines ─────────────────────────────────────────── */}
      <section className="py-28 px-6 lg:px-16 bg-white border-b border-black/6">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="mb-12">
            <div className="w-10 h-[2px] bg-[#d4a574] mb-5" />
            <h2 className="text-xs uppercase tracking-[0.3em] text-black/40">Six Disciplines, One Calling</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PILLARS.map((p, i) => (
              <motion.div key={p.label} initial={{ opacity: 0, y: 16, boxShadow: `0 0 0 0 ${p.color}00` }}
                whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -6, boxShadow: `0 16px 32px -8px ${p.color}55`, transition: { duration: 0.4 } }}
                className="rounded-2xl">
                <Link to={p.href}
                  className="group relative flex flex-col items-center text-center p-7 rounded-2xl bg-black overflow-hidden h-full border border-white/5">
                  {/* live color fill — sweeps in from the center on hover */}
                  <div className="absolute inset-0 scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-2xl"
                    style={{ background: `radial-gradient(circle at 50% 30%, ${p.color}35 0%, transparent 70%)` }} />
                  {/* constant top accent so each card pops even before hover */}
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: p.color }} />

                  <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110"
                    style={{ background: p.color, boxShadow: `0 8px 24px -6px ${p.color}80` }}>
                    <p.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <span className="relative font-semibold text-sm text-white mb-1.5">{p.label}</span>
                  <span className="relative text-[11px] text-white/45 group-hover:text-white/70 transition-colors duration-500">
                    {p.dynamic ? gmmStat : p.sub}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Introduction ─────────────────────────────────────────────────── */}
      <section className="py-36 lg:py-48 px-6 lg:px-16 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-16">
            <div>
              {/* Profile photo — falls back to a monogram until one is uploaded in the admin */}
              <div className="relative w-full max-w-[220px] mb-8">
                <div className="aspect-[4/5] overflow-hidden bg-black">
                  {profile?.profile_image ? (
                    <img src={profile.profile_image} alt={profile.full_name}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-white/15 text-7xl">{(profile?.full_name || 'K')[0]}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -right-3 -bottom-3 w-full h-full border border-[#d4a574]/40 -z-10" />
              </div>
              <div className="w-10 h-[2px] bg-[#d4a574] mb-5" />
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">Introduction</p>
            </div>
            <div>
              <p className="font-serif text-[clamp(1.8rem,3.5vw,3.5rem)] leading-[1.18] text-black mb-8">
                I am a modern African polymath — combining meteorological science, software engineering, and data-driven innovation with unwavering faith and creative expression.
              </p>
              <p className="text-[17px] text-black/60 leading-[1.85] max-w-3xl">
                At Kenya's Meteorological Department I work in the Numerical Weather Prediction section, forecasting atmospheric patterns that shape lives across East Africa. As a backend developer, I architect scalable systems with Python and Django. As a data scientist, I transform information into insight. Through Great Men Moves I mentor the next generation of purpose-driven men. Through gospel music I worship. Through my upcoming book "Broken Souls" I tell stories of redemption. This is where purpose transcends profession.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 mt-8 text-[#d4a574] text-sm font-medium hover:gap-4 transition-all">
                Read my full story <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Project ─────────────────────────────────────────────── */}
      {featuredProject && (
        <section className="py-36 lg:py-48 px-6 lg:px-16 bg-black text-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <div className="w-10 h-[2px] bg-[#d4a574] mb-6" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-6">Featured Project</p>
                <h2 className="font-serif text-[clamp(2.5rem,5vw,5rem)] leading-[1.08] mb-8">
                  {featuredProject.title}
                </h2>
                <p className="text-white/60 text-[17px] leading-[1.85] mb-10">
                  {featuredProject.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-10">
                  {featuredProject.technologies?.map(t => (
                    <span key={t} className="px-3 py-1 border border-white/15 text-white/60 text-xs rounded-full">{t}</span>
                  ))}
                </div>
                <Link to="/projects" className="inline-flex items-center gap-2 text-[#d4a574] text-sm font-medium hover:gap-4 transition-all">
                  View All Projects <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Code card placeholder */}
              <div className="relative">
                <div className="bg-[#111] rounded-2xl p-8 border border-white/8 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-3 text-white/20 text-xs">portfolio_api.py</span>
                  </div>
                  <div className="space-y-1.5 text-[13px]">
                    <p><span className="text-[#7c9edb]">from</span> <span className="text-[#d4a574]">rest_framework</span> <span className="text-[#7c9edb]">import</span> generics</p>
                    <p className="text-white/20">—</p>
                    <p><span className="text-[#7c9edb]">class</span> <span className="text-[#d4a574]">ArticleDetailView</span>(generics.RetrieveAPIView):</p>
                    <p className="pl-4 text-white/50">queryset = BlogArticle.objects</p>
                    <p className="pl-8 text-white/50">.filter(is_published=True)</p>
                    <p className="pl-8 text-white/50">.select_related(<span className="text-[#a8d58d]">"category"</span>)</p>
                    <p className="pl-4 text-white/50">serializer_class = BlogArticleDetailSerializer</p>
                    <p className="pl-4 text-white/50">lookup_field = <span className="text-[#a8d58d]">"slug"</span></p>
                    <p className="text-white/20">—</p>
                    <p className="text-white/30 text-[11px]"># 20+ endpoints · PostgreSQL · Jazzmin CMS</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-full h-full border border-[#d4a574]/20 rounded-2xl -z-10" />
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Latest Writing ────────────────────────────────────────────────── */}
      <section className="py-36 lg:py-48 px-6 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="flex items-end justify-between mb-16">
            <div>
              <div className="w-10 h-[2px] bg-[#d4a574] mb-5" />
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] leading-[1.1]">Latest Writing</h2>
            </div>
            <Link to="/blog" className="hidden md:flex items-center gap-2 text-black/40 hover:text-black text-sm transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="space-y-0 divide-y divide-black/6">
            {latestArticles.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-8 flex items-center gap-8 animate-pulse">
                  <div className="h-4 bg-black/6 rounded w-24" />
                  <div className="h-6 bg-black/8 rounded flex-1" />
                  <div className="h-3 bg-black/5 rounded w-16" />
                </div>
              ))
            ) : (
              latestArticles.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                  <Link to={`/blog/${a.slug}`}
                    className="group flex flex-col md:flex-row md:items-center gap-4 py-8 hover:pl-2 transition-all duration-300">
                    {a.category && (
                      <span className="text-[11px] font-bold uppercase tracking-widest flex-shrink-0 w-40"
                        style={{ color: a.category.color }}>
                        {a.category.name}
                      </span>
                    )}
                    <h3 className="font-serif text-[1.2rem] text-black group-hover:text-[#d4a574] transition-colors duration-300 flex-1 leading-snug">
                      {a.title}
                    </h3>
                    <span className="text-xs text-black/35 flex-shrink-0 md:text-right">
                      {a.read_time}m read
                    </span>
                    <ArrowRight className="w-4 h-4 text-black/20 group-hover:text-[#d4a574] group-hover:translate-x-1 transition-all flex-shrink-0 hidden md:block" />
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          <Link to="/blog" className="mt-8 flex md:hidden items-center gap-2 text-black/40 hover:text-black text-sm transition-colors">
            View all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── GMM + Book twin CTAs ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        {/* GMM */}
        <motion.div {...fadeUp} className="py-28 px-12 lg:px-20 bg-[#0a0a0a] text-white flex flex-col justify-between min-h-[440px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ background: 'radial-gradient(circle at 80% 20%, #10b981, transparent 60%)' }} />
          <div className="relative">
            <div className="w-8 h-[2px] bg-[#10b981] mb-6" />
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Nonprofit · Kenya</p>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.1] mb-4">Great Men Moves</h2>
            <p className="text-white/55 text-[15px] leading-relaxed max-w-sm">
              Raising the next generation of purpose-driven men through mentorship, leadership programmes, and community impact.
            </p>
          </div>
          <Link to="/great-men-moves" className="relative inline-flex items-center gap-2 text-[#10b981] text-sm font-medium mt-8 hover:gap-4 transition-all">
            Learn More <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Book */}
        <motion.div {...fadeUp} className="py-28 px-12 lg:px-20 bg-[#1a0a2e] text-white flex flex-col justify-between min-h-[440px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 20% 80%, #8b5cf6, transparent 60%)' }} />
          <div className="relative">
            <div className="w-8 h-[2px] bg-[#8b5cf6] mb-6" />
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Debut Book · Coming Soon</p>
            <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.1] mb-4">Broken Souls</h2>
            <p className="text-white/55 text-[15px] leading-relaxed max-w-sm italic">
              "Finding Wholeness in a Fractured World" — a journey through pain, faith, and redemption.
            </p>
          </div>
          <Link to="/book" className="relative inline-flex items-center gap-2 text-[#8b5cf6] text-sm font-medium mt-8 hover:gap-4 transition-all">
            Pre-Register <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {approvedFeedback.length > 0 && (
        <section className="py-28 px-6 lg:px-16 bg-[#fafafa] border-t border-black/6">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp} className="mb-14">
              <div className="w-10 h-[2px] bg-[#d4a574] mb-5" />
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] leading-[1.1]">What People Say</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedFeedback.map((fb, i) => (
                <motion.div key={fb.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
                  className="bg-white border border-black/8 p-8 flex flex-col gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={16} className={s <= fb.rating ? 'text-[#d4a574] fill-[#d4a574]' : 'text-black/15'} />
                    ))}
                  </div>
                  <p className="text-black/70 text-[15px] leading-relaxed flex-1">"{fb.message}"</p>
                  <p className="text-xs text-black/30 uppercase tracking-widest">
                    {new Date(fb.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ────────────────────────────────────────────────────── */}
      <section className="py-36 lg:py-48 px-6 lg:px-16 bg-[#d4a574]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="w-10 h-[2px] bg-black/30 mx-auto mb-8" />
            <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] text-black mb-6">
              Stay Connected<br />to the Journey
            </h2>
            <p className="text-black/65 text-[17px] leading-relaxed mb-12 max-w-xl mx-auto">
              Insights on technology, meteorology, faith, leadership, and creativity — delivered with intention.
            </p>

            {newsletterStatus === 'done' ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-black text-white rounded-2xl p-8">
                <p className="font-serif text-2xl mb-2">You're in. ✓</p>
                <p className="text-white/60">Look out for the next issue in your inbox.</p>
              </motion.div>
            ) : (
              <form onSubmit={subscribeNewsletter} className="flex flex-col sm:flex-row gap-3">
                <input type="text" required placeholder="Your name" value={newsletterName}
                  onChange={e => setNewsletterName(e.target.value)}
                  className="flex-1 px-5 py-4 bg-black/10 border border-black/20 text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 rounded-xl text-sm"
                />
                <input type="email" required placeholder="Your email" value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-5 py-4 bg-black/10 border border-black/20 text-black placeholder:text-black/40 focus:outline-none focus:border-black/50 rounded-xl text-sm"
                />
                <button type="submit" disabled={newsletterStatus === 'sending'}
                  className="px-8 py-4 bg-black text-white hover:bg-white hover:text-black transition-all rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-60">
                  {newsletterStatus === 'sending' ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-red-900 text-sm mt-3">Something went wrong. Please try again.</p>
            )}
            <p className="text-black/40 text-xs mt-4">No spam. No noise. Unsubscribe anytime.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-36 lg:py-48 px-6 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div {...fadeUp}>
            <h2 className="font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[0.95] text-black mb-8">
              Let's Build<br />Something<br /><span className="text-[#d4a574]">Meaningful.</span>
            </h2>
            <p className="text-black/55 text-[17px] leading-relaxed max-w-md">
              Whether you need a meteorologist, backend developer, mentor, or creative collaborator — let's start a conversation.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-4">
            {[
              { to: '/contact', label: 'Get In Touch', sub: 'Collaborations & opportunities', arrow: true },
              { to: '/projects', label: 'View Projects', sub: 'Technical work & case studies', arrow: false },
              { to: '/great-men-moves', label: 'Join the Movement', sub: 'Volunteer with Great Men Moves', arrow: false },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className={`group flex items-center justify-between p-6 border-2 transition-all duration-300 ${
                  item.arrow ? 'border-black hover:bg-black hover:text-white' : 'border-black/15 hover:border-[#d4a574]'
                }`}>
                <div>
                  <p className="font-serif text-xl mb-0.5">{item.label}</p>
                  <p className="text-black/40 group-hover:text-black/30 text-sm transition-colors">{item.sub}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-black/30 group-hover:text-current group-hover:translate-x-2 transition-all" />
              </Link>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
