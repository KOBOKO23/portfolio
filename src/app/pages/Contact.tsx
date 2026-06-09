import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MapPin, Phone, Send, Linkedin, Twitter, Github, Instagram, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Resp<T> { success: boolean; data?: T; error?: { message?: string; details?: Record<string, string[]> } }

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  instagram_url: string;
}

const SUBJECTS = [
  { value: 'general',     label: 'General Inquiry' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'project',     label: 'Project Inquiry' },
  { value: 'speaking',    label: 'Speaking Engagement' },
  { value: 'donation',    label: 'Donation / Sponsorship' },
  { value: 'mentorship',  label: 'Mentorship — Great Men Moves' },
  { value: 'music',       label: 'Gospel Music' },
  { value: 'book',        label: 'Book — Broken Souls' },
  { value: 'other',       label: 'Other' },
];

export function Contact() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm]   = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Newsletter mini-form
  const [nlEmail, setNlEmail]   = useState('');
  const [nlName, setNlName]     = useState('');
  const [nlStatus, setNlStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [nlMsg, setNlMsg]       = useState('');

  useEffect(() => {
    fetch(`${API}/profile/`)
      .then(r => r.json() as Promise<Resp<Profile>>)
      .then(d => { if (d.success && d.data) setProfile(d.data); })
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending'); setErrMsg('');
    try {
      const res  = await fetch(`${API}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as Resp<{ message?: string }>;
      if (data.success) {
        setStatus('sent');
        setSuccessMsg(data.data?.message ?? "I'll get back to you within 24 hours.");
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        const details = data.error?.details;
        setErrMsg(details ? Object.values(details).flat().join(' ') : data.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setErrMsg('Unable to connect. Please try again.');
    }
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail) return;
    setNlStatus('sending'); setNlMsg('');
    try {
      const res  = await fetch(`${API}/newsletter/subscribe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nlName || nlEmail.split('@')[0], email: nlEmail }),
      });
      const data = (await res.json()) as Resp<{ message?: string }>;
      if (data.success) {
        setNlStatus('done');
        setNlMsg(data.data?.message ?? 'Subscribed!');
        setNlEmail(''); setNlName('');
      } else {
        setNlStatus('error');
        const details = data.error?.details;
        setNlMsg(details?.email?.[0] ?? data.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setNlStatus('error'); setNlMsg('Unable to connect.');
    }
  };

  const socialLinks = [
    { icon: Linkedin,  label: 'LinkedIn',  url: profile?.linkedin_url  ?? '#' },
    { icon: Twitter,   label: 'Twitter',   url: profile?.twitter_url   ?? '#' },
    { icon: Github,    label: 'GitHub',    url: profile?.github_url    ?? '#' },
    { icon: Instagram, label: 'Instagram', url: profile?.instagram_url ?? '#' },
  ].filter(s => s.url && s.url !== '#');

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="Contact"
        description="Get in touch for collaborations, speaking engagements, mentorship, donation inquiries, or new opportunities. Based in Nairobi, Kenya."
        url="/contact"
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1800px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
          <div className="w-12 h-[2px] bg-[#d4a574] mb-8" />
          <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Get In Touch</h1>
          <p className="text-xl text-black/60 leading-relaxed max-w-2xl">
            Whether it's a collaboration, speaking inquiry, donation, mentorship, or simply a conversation — I'd love to hear from you.
          </p>
        </motion.div>
      </section>

      {/* ── Contact Form & Info ───────────────────────────────────────── */}
      <section className="px-6 lg:px-12 max-w-[1400px] mx-auto pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

          {/* Left — info + socials */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-10">
            <div>
              <h2 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Contact Information</h2>
              <p className="text-black/60 leading-relaxed">
                I'm always open to meaningful conversations — collaborations, partnerships, donations to Great Men Moves, and new opportunities.
              </p>
            </div>

            <div className="space-y-6">
              {[
                profile?.email    ? { icon: Mail,   title: 'Email',    content: profile.email,    link: `mailto:${profile.email}` }          : null,
                profile?.location ? { icon: MapPin, title: 'Location', content: profile.location, link: null as string | null }                : null,
                profile?.phone    ? { icon: Phone,  title: 'Phone',    content: profile.phone,    link: `tel:${profile.phone.replace(/\s/g, '')}` } : null,
              ].filter((x): x is NonNullable<typeof x> => x !== null).map((info) => (
                <div key={info.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#f5f5f0] flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-[#d4a574]" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{info.title}</h3>
                    {info.link ? (
                      <a href={info.link} className="text-black/60 hover:text-[#d4a574] transition-colors">{info.content}</a>
                    ) : (
                      <p className="text-black/60">{info.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {socialLinks.length > 0 && (
              <div>
                <h3 className="font-medium mb-4">Follow Me</h3>
                <div className="flex gap-3 flex-wrap">
                  {socialLinks.map(s => (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="w-10 h-10 bg-[#f5f5f0] flex items-center justify-center hover:bg-[#d4a574] hover:text-white transition-all"
                      aria-label={s.label}>
                      <s.icon size={18} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="pt-4 border-t border-black/8 space-y-3">
              <p className="text-xs uppercase tracking-widest text-black/40 mb-4">Quick Links</p>
              {[
                { label: 'Donate to Great Men Moves', href: '/great-men-moves#donate' },
                { label: 'Pre-order Broken Souls',    href: '/book' },
                { label: 'Join the Newsletter',       href: '/newsletter' },
              ].map(l => (
                <Link key={l.label} to={l.href}
                  className="flex items-center gap-2 text-sm text-black/55 hover:text-[#d4a574] transition-colors group">
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Right — the form */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2">

            <AnimatePresence mode="wait">
              {status === 'sent' ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="bg-[#f5f5f0] p-12 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                  <CheckCircle size={64} className="text-[#d4a574] mb-6" />
                  <h3 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Message Sent!</h3>
                  <p className="text-black/70 text-lg mb-8 max-w-sm">
                    {successMsg}
                  </p>
                  <button onClick={() => setStatus('idle')}
                    className="px-8 py-3 bg-black text-white hover:bg-[#d4a574] transition-all">
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {status === 'error' && errMsg && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /><span>{errMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-black/70 mb-2">Name *</label>
                      <input type="text" id="name" required value={form.name} onChange={set('name')}
                        placeholder="Your full name"
                        className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors bg-white" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-black/70 mb-2">Email *</label>
                      <input type="email" id="email" required value={form.email} onChange={set('email')}
                        placeholder="your.email@example.com"
                        className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors bg-white" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-black/70 mb-2">Subject *</label>
                    <select id="subject" required value={form.subject} onChange={set('subject')}
                      className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors bg-white appearance-none">
                      <option value="">Select a subject…</option>
                      {SUBJECTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Donation hint */}
                  {form.subject === 'donation' && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-4 bg-[#d4a574]/8 border border-[#d4a574]/30 text-sm text-black/70">
                      <span className="text-[#d4a574] mt-0.5">💛</span>
                      <span>
                        Thank you for your generosity. Please include the amount and preferred payment method (M-Pesa / Bank Transfer / Stripe) in your message, and we'll respond within 24 hours with payment details.
                      </span>
                    </motion.div>
                  )}

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-black/70 mb-2">Message *</label>
                    <textarea id="message" required rows={8} value={form.message} onChange={set('message')}
                      placeholder={form.subject === 'donation'
                        ? 'Please share the amount you\'d like to donate, preferred payment method, and any specific program or cause you\'d like to support…'
                        : 'Tell me about your project, inquiry, or how I can help…'}
                      className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors resize-none bg-white" />
                  </div>

                  <button type="submit" disabled={status === 'sending'}
                    className="w-full md:w-auto px-10 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60">
                    <span>{status === 'sending' ? 'Sending…' : 'Send Message'}</span>
                    {status !== 'sending' && <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ── Newsletter (wired) ────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Join My Newsletter</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Weekly insights on technology, faith, leadership, and creativity — delivered every Sunday.
            </p>

            {nlStatus === 'done' ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#d4a574] text-white">
                <CheckCircle size={20} /> {nlMsg || 'You\'re subscribed!'}
              </motion.div>
            ) : (
              <>
                <form onSubmit={handleNewsletter} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                  <input type="email" required placeholder="Your email address" value={nlEmail} onChange={e => setNlEmail(e.target.value)}
                    className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#d4a574] transition-colors" />
                  <button type="submit" disabled={nlStatus === 'sending'}
                    className="px-8 py-4 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-colors whitespace-nowrap disabled:opacity-60">
                    {nlStatus === 'sending' ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </form>
                {nlStatus === 'error' && nlMsg && (
                  <p className="text-red-400 text-sm mt-3">{nlMsg}</p>
                )}
                <p className="text-white/40 text-xs mt-4">No spam. Unsubscribe anytime.</p>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Currently Available ────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="bg-[#f5f5f0] p-12 lg:p-16">
          <div className="max-w-3xl mx-auto">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
            <h2 className="text-3xl md:text-4xl mb-10" style={{ fontFamily: 'var(--font-serif)' }}>Currently Available For</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Opportunities',   items: ['Backend Development', 'Data Science Projects', 'Meteorology Consulting'] },
                { title: 'Collaborations',  items: ['Gospel Music Projects', 'Speaking Engagements', 'Mentorship Programs'] },
                { title: 'Partnerships',    items: ['Donations to GMM', 'Tech Initiatives', 'Youth Development', 'Creative Projects'] },
              ].map(col => (
                <div key={col.title}>
                  <h3 className="text-xl mb-4 text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>{col.title}</h3>
                  <ul className="space-y-2 text-black/70">
                    {col.items.map(item => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
