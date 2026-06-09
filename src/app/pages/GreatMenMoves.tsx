import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import {
  Users, Target, Heart, Award, TrendingUp, BookOpen, Compass,
  Lightbulb, Shield, Calendar, UserPlus, DollarSign, CheckCircle,
  MapPin, Star, Zap, Globe, ArrowRight, Handshake,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Resp<T> { success: boolean; data?: T; error?: { message?: string; details?: Record<string, string[]> } }

// ── Types ──────────────────────────────────────────────────────────────────────
interface Program {
  id: number; title: string; date: string; location: string;
  description: string; spots: number; image: string | null;
}
interface ImpactGoal {
  id: number; number: string; label: string; progress: number; icon: string;
}

// ── Icon map ───────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  users: Users, target: Target, heart: Heart, award: Award,
  'trending-up': TrendingUp, 'book-open': BookOpen, compass: Compass,
  lightbulb: Lightbulb, shield: Shield, calendar: Calendar,
  'map-pin': MapPin, star: Star, zap: Zap, globe: Globe, handshake: Handshake,
};
function DynIcon({ name, ...props }: { name: string } & React.ComponentProps<typeof Users>) {
  const Icon = ICON_MAP[name] ?? Target;
  return <Icon {...props} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── Volunteer form ─────────────────────────────────────────────────────────────
function VolunteerForm() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', profession: '', motivation: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting'); setMsg('');
    try {
      const res  = await fetch(`${API}/great-men-moves/volunteer/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = (await res.json()) as Resp<{ message?: string }>;
      if (data.success) {
        setStatus('success');
        setMsg(data.data?.message ?? "Application received! We'll be in touch soon.");
        setForm({ full_name: '', email: '', phone: '', profession: '', motivation: '' });
      } else {
        setStatus('error');
        const detail = data.error?.details;
        setMsg(detail ? Object.values(detail).flat().join(' ') : data.error?.message ?? 'Something went wrong.');
      }
    } catch {
      setStatus('error'); setMsg('Unable to connect. Please try again.');
    }
  };

  if (status === 'success') return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#d4a574] text-white p-12 text-center">
      <CheckCircle size={64} className="mx-auto mb-6" />
      <h3 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>Application Received!</h3>
      <p className="text-white/90 text-lg">{msg}</p>
    </motion.div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-[#f5f5f0] p-12 space-y-6">
      {status === 'error' && msg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{msg}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="text" placeholder="Full Name *" required value={form.full_name} onChange={set('full_name')}
          className="px-5 py-4 bg-white border border-black/10 focus:border-[#d4a574] outline-none transition-colors" />
        <input type="email" placeholder="Email Address *" required value={form.email} onChange={set('email')}
          className="px-5 py-4 bg-white border border-black/10 focus:border-[#d4a574] outline-none transition-colors" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="tel" placeholder="Phone Number" value={form.phone} onChange={set('phone')}
          className="px-5 py-4 bg-white border border-black/10 focus:border-[#d4a574] outline-none transition-colors" />
        <input type="text" placeholder="Profession / Industry" value={form.profession} onChange={set('profession')}
          className="px-5 py-4 bg-white border border-black/10 focus:border-[#d4a574] outline-none transition-colors" />
      </div>
      <textarea placeholder="Why do you want to become a mentor? *" rows={5} required value={form.motivation} onChange={set('motivation')}
        className="w-full px-5 py-4 bg-white border border-black/10 focus:border-[#d4a574] outline-none transition-colors resize-none" />
      <div className="flex items-start gap-3">
        <input type="checkbox" id="terms" className="mt-1" required />
        <label htmlFor="terms" className="text-sm text-black/70">
          I commit to the values of Great Men Moves and understand the responsibility of mentoring young men with integrity and purpose.
        </label>
      </div>
      <button type="submit" disabled={status === 'submitting'}
        className="w-full px-10 py-5 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-lg disabled:opacity-60">
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}

// ── Static data ────────────────────────────────────────────────────────────────
const VALUES = [
  { icon: Heart,     title: 'Character First',   description: 'Building integrity, honesty, and moral foundations that last a lifetime.' },
  { icon: Lightbulb, title: 'Boundless Thinking', description: 'Teaching men to think beyond limitations and embrace impossible dreams.' },
  { icon: Shield,    title: 'Faith & Discipline', description: 'Grounding young men in spiritual values and self-discipline.' },
  { icon: Compass,   title: 'Purpose-Driven',     description: 'Helping every man discover and pursue his unique calling.' },
];

const HOW_TO_HELP = [
  { icon: UserPlus,   title: 'Become a Mentor', description: 'Share your experience and guide a young man toward his potential.', action: 'Volunteer', href: '#volunteer' },
  { icon: DollarSign, title: 'Make a Donation', description: 'Support our programs and help us reach more young men.',           action: 'Donate',    href: '#donate'    },
  { icon: Users,      title: 'Partner With Us', description: 'Organizations and businesses can sponsor programs and events.',    action: 'Contact Us', href: '/contact'  },
];

// ── Main page ──────────────────────────────────────────────────────────────────
export function GreatMenMoves() {
  const [programs, setPrograms]     = useState<Program[]>([]);
  const [goals, setGoals]           = useState<ImpactGoal[]>([]);
  const [loadingProgs, setLoadingP] = useState(true);
  const [loadingGoals, setLoadingG] = useState(true);

  useEffect(() => {
    fetch(`${API}/great-men-moves/programs/`)
      .then(r => r.json() as Promise<Resp<Program[] | { results?: Program[] }>>)
      .then(d => {
        if (d.success && d.data) {
          setPrograms(Array.isArray(d.data) ? d.data : (d.data).results ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingP(false));

    fetch(`${API}/great-men-moves/impact-goals/`)
      .then(r => r.json() as Promise<Resp<ImpactGoal[] | { results?: ImpactGoal[] }>>)
      .then(d => {
        if (d.success && d.data) {
          setGoals(Array.isArray(d.data) ? d.data : (d.data).results ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingG(false));
  }, []);

  return (
    <div className="min-h-screen">
      <SEO
        title="Great Men Moves"
        description="A mentorship movement building the next generation of great men in Kenya — purpose, character, and legacy."
        url="/great-men-moves"
      />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-12 bg-black text-white overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 80% at 30% 60%, #0d1a0d 0%, #0a0a0a 60%)' }} />
        <div className="absolute top-0 left-0 w-[50vw] h-[50vw]" style={{ background: 'radial-gradient(circle at 15% 20%, #d4a57410 0%, transparent 60%)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#d4a574 1px, transparent 1px), linear-gradient(90deg, #d4a574 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 bg-[#d4a574] text-white">
              <Users size={24} />
              <span className="uppercase tracking-widest text-sm">Nonprofit Initiative</span>
            </div>
            <h1 className="text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              Great Men<br />Moves
            </h1>
            <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] text-white/80 leading-relaxed max-w-2xl mb-12">
              Empowering young men to think beyond impossibilities and create lasting change in their communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#donate" className="inline-block px-10 py-5 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg text-center">
                Support Our Mission
              </a>
              <a href="#volunteer" className="inline-block px-10 py-5 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 text-lg text-center">
                Become a Mentor
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Mission & Vision ───────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            {[
              { title: 'Our Mission', body: ['Great Men Moves exists to transform the lives of young men in Kenya and across Africa by providing mentorship, character development, and leadership training.', 'We believe every man has greatness within him. Our mission is to unlock that potential through intentional guidance, faith-based principles, and a community that believes in their future.'] },
              { title: 'Our Vision',  body: ['A generation of African young men who are confident, compassionate, and equipped to lead their families, communities, and nations with integrity and purpose.', 'We envision a future where no man is left behind — where impossibilities become possibilities, and young men rise as pillars of positive change.'] },
            ].map(({ title, body }, i) => (
              <motion.div key={title} initial={{ opacity: 0, x: i === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                <div className="w-16 h-[2px] bg-[#d4a574] mb-6" />
                <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>{title}</h2>
                {body.map((p, j) => <p key={j} className="text-xl text-black/70 leading-relaxed mb-6">{p}</p>)}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ────────────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Our Core Values</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">The principles that guide every program, every session, and every interaction.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="border border-white/20 p-8 hover:border-[#d4a574] hover:bg-white/5 transition-all duration-300">
                <div className="w-14 h-14 bg-[#d4a574] flex items-center justify-center mb-6"><v.icon size={28} /></div>
                <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{v.title}</h3>
                <p className="text-white/70 leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder's Message ──────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-2">
              <div className="aspect-[3/4] relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #1a1208 0%, #2e1e0a 50%, #0a0a0a 100%)' }}>
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 65% at 45% 35%, #d4a57418 0%, transparent 70%)' }} />
                <div className="absolute inset-x-[20%] top-[10%] bottom-0"
                  style={{ background: 'linear-gradient(180deg, #d4a57420 0%, #d4a57408 60%, transparent 100%)', clipPath: 'polygon(30% 0%, 70% 0%, 90% 25%, 85% 100%, 15% 100%, 10% 25%)' }} />
                <div className="absolute inset-0 flex items-end justify-center pb-10">
                  <p className="text-[#d4a574]/30 text-sm uppercase tracking-[0.4em]">Founder</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4a574]" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-3">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
              <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>A Message from the Founder</h2>
              <div className="space-y-6 text-lg text-black/70 leading-relaxed">
                <p>Growing up, I witnessed countless young men with limitless potential lose their way due to lack of guidance, mentorship, and belief. I saw brilliance dimmed by circumstance, dreams deferred by discouragement, and futures compromised by the absence of strong male role models.</p>
                <p>Great Men Moves was born from a deep conviction: <strong className="text-black">every man deserves to be seen, heard, and believed in.</strong> As someone who has walked the journey from meteorology to software development, from music to mentorship, I understand the power of having someone who pushes you to think beyond your current reality.</p>
                <p className="text-xl text-black" style={{ fontFamily: 'var(--font-serif)' }}>The future is theirs. Our role is to help them see it.</p>
              </div>
              <div className="mt-8 pt-6 border-t border-black/10">
                <p className="text-2xl mb-1" style={{ fontFamily: 'var(--font-serif)' }}>Koboko</p>
                <p className="text-black/60">Founder & Lead Mentor, Great Men Moves</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Impact Goals (dynamic) ─────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Our Impact</h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">Measurable, meaningful change in the lives of young men across Kenya and beyond.</p>
          </motion.div>

          {loadingGoals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="border border-black/8 p-8 h-48 animate-pulse bg-black/3" />)}
            </div>
          ) : goals.length === 0 ? null : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {goals.map((goal, i) => (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center border border-black/10 p-8 hover:border-[#d4a574] transition-all">
                  <DynIcon name={goal.icon} size={40} className="mx-auto mb-6 text-[#d4a574]" />
                  <div className="text-5xl mb-4 text-black" style={{ fontFamily: 'var(--font-serif)' }}>{goal.number}</div>
                  <p className="text-black/70 mb-6 leading-relaxed">{goal.label}</p>
                  <div className="w-full h-2 bg-black/10 overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${goal.progress}%` }} viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 }} className="h-full bg-[#d4a574]" />
                  </div>
                  <p className="text-sm text-black/50 mt-2">{goal.progress}% Progress</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Upcoming Programs (dynamic) ────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Upcoming Programs</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">Join us in transforming lives through structured mentorship and leadership development.</p>
          </motion.div>

          {loadingProgs ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="border border-white/10 p-8 h-48 animate-pulse" />)}
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>No upcoming programs at the moment — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {programs.map((prog, i) => (
                <motion.div key={prog.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="border border-white/20 hover:border-[#d4a574] hover:bg-white/5 transition-all overflow-hidden">
                  {prog.image && (
                    <img src={prog.image} alt={prog.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <Calendar size={28} className="text-[#d4a574] mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>{prog.title}</h3>
                        <p className="text-white/60">{formatDate(prog.date)}</p>
                        <p className="text-white/50 text-sm flex items-center gap-1 mt-0.5"><MapPin size={12} />{prog.location}</p>
                      </div>
                    </div>
                    <p className="text-white/80 leading-relaxed mb-6">{prog.description}</p>
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[#d4a574] text-sm uppercase tracking-wide">
                        {prog.spots > 0 ? `${prog.spots} spot${prog.spots !== 1 ? 's' : ''} available` : 'Registration open'}
                      </span>
                      <Link to="/contact" className="flex items-center gap-1.5 px-5 py-2 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-colors text-sm">
                        Learn More <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How You Can Help ───────────────────────────────────────────── */}
      <section className="py-32 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-20">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>How You Can Help</h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">Every contribution, big or small, creates lasting change in a young man's life.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_TO_HELP.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white p-10 text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
                  <item.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>{item.title}</h3>
                <p className="text-black/70 leading-relaxed mb-8">{item.description}</p>
                <a href={item.href}
                  className="block px-8 py-3 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 w-full text-center">
                  {item.action}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Volunteer Form (wired) ─────────────────────────────────────── */}
      <section id="volunteer" className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[900px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Become a Mentor</h2>
            <p className="text-xl text-black/70">Join our team of dedicated mentors shaping the next generation of African leaders.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <VolunteerForm />
          </motion.div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {['Flexible commitment (2–4 hrs/month)', 'Training and support provided', 'Make a lasting impact'].map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-black/70">
                <CheckCircle size={20} className="text-[#d4a574] flex-shrink-0" /><span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Donation CTA ───────────────────────────────────────────────── */}
      <section id="donate" className="py-32 px-6 lg:px-12 bg-[#d4a574] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <DollarSign size={60} className="mx-auto mb-8" />
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>Invest in the Future</h2>
            <p className="text-xl leading-relaxed mb-12 max-w-3xl mx-auto">
              Your donation provides mentorship, resources, and opportunities for young men who will lead the next generation.
            </p>
            <Link to="/contact"
              className="inline-block px-12 py-5 bg-black text-white hover:bg-white hover:text-black transition-all duration-300 text-lg mb-6">
              Get in Touch to Donate
            </Link>
            <p className="text-white/80 text-sm">Great Men Moves is a registered nonprofit.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.2] mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              "The future belongs to those who believe<br />in the beauty of their dreams."
            </h2>
            <p className="text-white/60 text-lg mb-12">Let's build that future together. One young man at a time.</p>
            <Link to="/contact" className="inline-block px-10 py-5 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 text-lg">
              Get in Touch
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
