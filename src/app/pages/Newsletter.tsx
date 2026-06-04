import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, CheckCircle, Star, Calendar, TrendingUp, BookOpen,
  Heart, Sparkles, ArrowRight,
} from 'lucide-react';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface NewsletterIssue {
  id: number;
  number: number;
  title: string;
  excerpt: string;
  published_date: string;
  topics_list: string[];
}

interface ApprovedFeedback {
  id: number;
  rating: number;
  message: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CONTENT_TYPES = [
  { icon: BookOpen,   title: 'Weekly Insights',          description: 'Thoughtful reflections on technology, faith, creativity, and personal growth.' },
  { icon: TrendingUp, title: 'Project Updates',          description: 'Behind-the-scenes looks at ongoing work in meteorology, software, and mentorship.' },
  { icon: Heart,      title: 'Curated Recommendations',  description: 'Books, music, tools, and resources that inspire excellence and intentional living.' },
  { icon: Sparkles,   title: 'Exclusive Content',        description: 'Early access to articles, music releases, and updates on "Broken Souls."' },
];

const BENEFITS = [
  'Thoughtful, weekly essays (not daily spam)',
  'Exclusive updates and early access',
  'Curated resources and recommendations',
  'Unsubscribe anytime, no hassle',
];

export function Newsletter() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [testimonials, setTestimonials] = useState<ApprovedFeedback[]>([]);

  useEffect(() => {
    fetch(`${API}/newsletter/issues/`)
      .then(r => r.json())
      .then(d => { if (d.success) setIssues(d.data?.results ?? d.data ?? []); })
      .catch(() => {});

    fetch(`${API}/feedback/approved/`)
      .then(r => r.json())
      .then(d => { if (d.success) setTestimonials((d.data?.results ?? d.data ?? []).slice(0, 3)); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch(`${API}/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.data?.message || 'Thank you for subscribing!');
        setName('');
        setEmail('');
      } else {
        setStatus('error');
        const errMsg = data.error?.details?.email?.[0] || data.error?.message || 'Something went wrong.';
        setMessage(errMsg);
      }
    } catch {
      setStatus('error');
      setMessage('Unable to connect. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Newsletter"
        description="Subscribe to Koboko's newsletter for insights on meteorology, tech, faith, and life from Nairobi."
        url="/newsletter"
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-12 bg-black text-white overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 60%, #1a1208 0%, #0a0a0a 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#d4a574 1px, transparent 1px)', backgroundSize: '100% 2.5rem' }} />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 bg-[#d4a574]">
              <Mail size={20} />
              <span className="uppercase tracking-widest text-sm">Weekly Newsletter</span>
            </div>
            <h1 className="text-[clamp(4rem,10vw,8rem)] leading-[0.9] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              Join the<br />Journey
            </h1>
            <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] text-white/80 leading-relaxed max-w-3xl mx-auto">
              Every Sunday, receive thoughtful reflections on technology, faith, creativity, and the pursuit of excellence — straight to your inbox.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Subscribe Form ────────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[800px] mx-auto">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }} className="bg-[#d4a574] text-white p-16 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                  <CheckCircle size={80} className="mx-auto mb-8" />
                </motion.div>
                <h3 className="text-4xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Welcome to the Journey!</h3>
                <p className="text-xl leading-relaxed max-w-2xl mx-auto mb-4">{message}</p>
                <p className="text-white/80">Your first newsletter arrives this Sunday morning. ☕</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-12">
                  <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                    Subscribe for Free
                  </h2>
                  <p className="text-xl text-black/70">
                    Join professionals, creatives, and changemakers who start their week with intention.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#f5f5f0] p-12 mb-8">
                  <div className="space-y-6">
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your Name *" required
                      className="w-full px-6 py-5 bg-white border-2 border-black/10 focus:border-[#d4a574] outline-none transition-colors text-lg"
                    />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Your Email Address *" required
                      className="w-full px-6 py-5 bg-white border-2 border-black/10 focus:border-[#d4a574] outline-none transition-colors text-lg"
                    />
                    <div className="flex items-start gap-3">
                      <input type="checkbox" id="consent" className="mt-2" required />
                      <label htmlFor="consent" className="text-sm text-black/70">
                        I agree to receive weekly emails from Koboko. I understand I can unsubscribe at any time.
                      </label>
                    </div>

                    {status === 'error' && message && (
                      <p className="text-red-600 text-sm bg-red-50 px-4 py-3 border border-red-200">{message}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full px-10 py-6 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-lg flex items-center justify-center gap-3 group disabled:opacity-60"
                    >
                      <span>{status === 'submitting' ? 'Subscribing…' : 'Subscribe to Newsletter'}</span>
                      {status !== 'submitting' && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BENEFITS.map(b => (
                    <div key={b} className="flex items-center gap-3 text-black/70">
                      <CheckCircle size={20} className="text-[#d4a574] flex-shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── What You'll Receive ───────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>What You'll Receive</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Each Sunday, expect a carefully crafted email designed to inspire, inform, and invite deeper thinking.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CONTENT_TYPES.map(({ icon: Icon, title, description }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border border-white/20 p-10 hover:border-[#d4a574] hover:bg-white/5 transition-all">
                <Icon size={40} className="mb-6 text-[#d4a574]" />
                <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{title}</h3>
                <p className="text-white/70 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20">
              <Calendar size={24} className="text-[#d4a574]" />
              <span className="text-lg">Every Sunday at 8:00 AM EAT</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Reader Testimonials (approved feedback) ───────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-32 px-6 lg:px-12 bg-[#f5f5f0]">
          <div className="max-w-[1400px] mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
              <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>What Readers Say</h2>
              <p className="text-xl text-black/70 max-w-3xl mx-auto">Join a community of thoughtful readers who value depth over noise.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white p-10">
                  <div className="flex gap-1 mb-6">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={18} className="text-[#d4a574] fill-[#d4a574]" />)}
                  </div>
                  <p className="text-lg leading-relaxed text-black/80" style={{ fontFamily: 'var(--font-serif)' }}>
                    "{t.message}"
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter Archive ────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Recent Issues</h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">Browse past newsletters to get a preview of what lands in your inbox every Sunday.</p>
          </motion.div>

          {issues.length === 0 ? (
            <div className="text-center py-16 text-black/30">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No issues published yet — first one coming soon.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {issues.map((issue, i) => (
                <motion.article key={issue.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="border border-black/10 p-8 hover:border-[#d4a574] hover:shadow-lg transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm text-[#d4a574] uppercase tracking-widest">#{issue.number}</span>
                        <span className="text-sm text-black/50">{formatDate(issue.published_date)}</span>
                      </div>
                      <h3 className="text-2xl mb-3 group-hover:text-[#d4a574] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
                        {issue.title}
                      </h3>
                      <p className="text-black/70 leading-relaxed mb-4">{issue.excerpt}</p>
                      {issue.topics_list.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {issue.topics_list.map(topic => (
                            <span key={topic} className="px-3 py-1 bg-black/5 text-xs uppercase tracking-wide text-black/60">{topic}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-2 text-black group-hover:text-[#d4a574] transition-colors">
                        <span className="text-sm uppercase tracking-wide">Read</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Mail size={60} className="mx-auto mb-8 text-[#d4a574]" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Ready to Begin?</h2>
            <p className="text-xl text-white/80 leading-relaxed mb-12 max-w-2xl mx-auto">
              No spam. No fluff. Just meaningful content, every Sunday.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-12 py-5 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg"
            >
              Subscribe Now
            </button>
            <p className="text-white/60 text-sm mt-8">Free forever. Unsubscribe anytime with one click.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
