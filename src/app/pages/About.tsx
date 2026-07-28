import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import {
  Cloud,
  Code,
  Database,
  Heart,
  Users,
  Target,
  Award,
  Lightbulb,
  TrendingUp,
  Globe,
  Wrench,
  Palette,
  Server,
  Download,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Mail,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Resp<T> { success: boolean; data?: T }

interface Skill { id: number; name: string; category: string; proficiency: number; icon: string; }
interface CareerEvent { id: number; year: string; title: string; organization: string; description: string; is_current: boolean; order: number; }
interface Profile {
  full_name: string; tagline: string; profile_image: string | null; resume_pdf: string | null;
  email: string; linkedin_url: string; github_url: string; twitter_url: string; instagram_url: string;
  years_experience: number; projects_completed: number;
}

const CATEGORY_META: Record<string, { label: string; Icon: React.ElementType; desc: string }> = {
  meteorology: { label: 'Meteorology', Icon: Cloud, desc: 'Atmospheric science and weather forecasting expertise' },
  software:    { label: 'Software Development', Icon: Code, desc: 'Backend engineering with Python and modern databases' },
  data_science:{ label: 'Data Science', Icon: Database, desc: 'Machine learning and analytical capabilities' },
  frontend:    { label: 'Frontend', Icon: Globe, desc: 'UI development with modern frameworks' },
  backend:     { label: 'Backend', Icon: Server, desc: 'Server-side engineering and APIs' },
  devops:      { label: 'DevOps & Tools', Icon: Wrench, desc: 'Infrastructure, CI/CD, and tooling' },
  design:      { label: 'Design', Icon: Palette, desc: 'Visual design and prototyping' },
  other:       { label: 'Other', Icon: Lightbulb, desc: 'Additional skills and expertise' },
};

const CATEGORY_ORDER = ['meteorology', 'software', 'data_science', 'frontend', 'backend', 'devops', 'design', 'other'];

function proficiencyLabel(p: number) {
  if (p >= 85) return 'Expert';
  if (p >= 70) return 'Advanced';
  if (p >= 50) return 'Intermediate';
  return 'Beginner';
}

export function About() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [careerEvents, setCareerEvents] = useState<CareerEvent[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch(`${API}/skills/`)
      .then(r => r.json() as Promise<Resp<Skill[]>>)
      .then(data => setSkills(data.success && data.data ? data.data : []))
      .catch(() => {});
    fetch(`${API}/career/`)
      .then(r => r.json() as Promise<Resp<CareerEvent[]>>)
      .then(data => setCareerEvents(data.success && data.data ? data.data : []))
      .catch(() => {});
    fetch(`${API}/profile/`)
      .then(r => r.json() as Promise<Resp<Profile>>)
      .then(data => { if (data.success && data.data) setProfile(data.data); })
      .catch(() => {});
  }, []);

  const socialLinks = profile ? [
    { Icon: Linkedin, url: profile.linkedin_url },
    { Icon: Github, url: profile.github_url },
    { Icon: Twitter, url: profile.twitter_url },
    { Icon: Instagram, url: profile.instagram_url },
    { Icon: Mail, url: profile.email ? `mailto:${profile.email}` : '' },
  ].filter(s => s.url) : [];

  const groupedSkills = CATEGORY_ORDER
    .map(cat => ({
      cat,
      meta: CATEGORY_META[cat] ?? { label: cat, Icon: Lightbulb, desc: '' },
      skills: skills.filter(s => s.category === cat),
    }))
    .filter(g => g.skills.length > 0);


  return (
    <div className="min-h-screen">
      <SEO
        title="About"
        description="Kenyan meteorologist, backend developer, data scientist, gospel artist, author, and founder of Great Men Moves. Based in Nairobi."
        url="/about"
        type="profile"
      />
      {/* Hero Section — Pure CSS atmospheric portrait */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Background gradient atmosphere */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 60% 40%, #1a1208 0%, #0a0a0a 60%)',
          }}
        />
        {/* Gold glow top-right */}
        <div
          className="absolute top-0 right-0 w-[55vw] h-[55vw] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 80% 20%, #d4a57418 0%, transparent 65%)',
          }}
        />
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#d4a574 1px, transparent 1px), linear-gradient(90deg, #d4a574 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Portrait — real photo once uploaded in the admin, abstract art until then */}
        <div className="absolute right-12 lg:right-24 bottom-0 w-[40vw] max-w-[520px] h-[80vh] hidden lg:block">
          {profile?.profile_image ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }}
              className="absolute inset-x-8 top-8 bottom-0 overflow-hidden">
              <img src={profile.profile_image} alt={profile.full_name}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #0a0a0a 0%, transparent 30%)' }} />
            </motion.div>
          ) : (
            <div className="pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(170deg, #d4a57412 0%, #d4a57406 40%, transparent 75%)',
                  clipPath: 'ellipse(48% 50% at 50% 50%)',
                }}
              />
              <div
                className="absolute inset-x-8 top-0 bottom-0"
                style={{
                  background:
                    'linear-gradient(180deg, #d4a57420 0%, #d4a57408 60%, transparent 100%)',
                  clipPath: 'polygon(30% 0%, 70% 0%, 90% 30%, 85% 100%, 15% 100%, 10% 30%)',
                }}
              />
            </div>
          )}
        </div>

        <div className="relative z-20 px-6 lg:px-12 max-w-[1800px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="w-16 h-[2px] bg-[#d4a574] mb-8" />
            <h1
              className="text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] tracking-tight text-white mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              A Life of<br />
              Purpose &<br />
              Precision
            </h1>
            <p className="text-[clamp(1.25rem,2vw,1.75rem)] text-white/80 leading-relaxed max-w-2xl mb-10">
              Meteorologist. Backend Developer. Data Scientist. Mentor. Gospel Artist. Author.
            </p>

            {/* Resume, socials, stats — sourced from the Profile record in the admin */}
            <div className="flex flex-wrap items-center gap-8">
              {profile?.resume_pdf && (
                <a href={profile.resume_pdf} target="_blank" rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[#d4a574] text-black hover:bg-white transition-all duration-500 text-sm font-semibold uppercase tracking-wide">
                  <Download className="w-4 h-4" /> Download Resume
                </a>
              )}

              {socialLinks.length > 0 && (
                <div className="flex items-center gap-4">
                  {socialLinks.map(({ Icon, url }, i) => (
                    <a key={i} href={url} target={url.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
                      className="text-white/50 hover:text-[#d4a574] transition-colors">
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {(!!profile?.years_experience || !!profile?.projects_completed) && (
              <div className="flex gap-12 mt-12 pt-8 border-t border-white/10 max-w-md">
                {!!profile.years_experience && (
                  <div>
                    <p className="font-serif text-4xl text-[#d4a574]">{profile.years_experience}+</p>
                    <p className="text-xs uppercase tracking-widest text-white/40 mt-1">Years Experience</p>
                  </div>
                )}
                {!!profile.projects_completed && (
                  <div>
                    <p className="font-serif text-4xl text-[#d4a574]">{profile.projects_completed}+</p>
                    <p className="text-xs uppercase tracking-widest text-white/40 mt-1">Projects Completed</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Long-form Biography */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-3">
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <h2 className="text-sm uppercase tracking-[0.3em] text-black/60">Biography</h2>
              </div>

              <div className="lg:col-span-9 space-y-8">
                <p
                  className="text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.35]"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  I am Koboko — a modern African polymath whose work exists at the intersection
                  of science, technology, faith, and creative expression.
                </p>

                <div className="space-y-6 text-lg text-black/70 leading-relaxed">
                  <p>
                    Based in Nairobi, Kenya, I serve as a Meteorologist at the Kenya Meteorological Department,
                    where I specialize in Numerical Weather Prediction. Every day, I work with complex atmospheric
                    models and computational systems to forecast weather patterns that affect agriculture, aviation,
                    disaster preparedness, and the daily lives of millions across East Africa.
                  </p>
                  <p>
                    Parallel to my meteorological career, I am a backend software developer with deep expertise in
                    Python and Django. I architect scalable systems, design robust APIs, and work with both SQL and
                    NoSQL databases to build applications that solve complex problems.
                  </p>
                  <p>
                    Currently, I am expanding my technical horizons through ALX Africa's Data Science program,
                    where I'm learning to transform raw data into actionable insights through machine learning,
                    statistical modeling, and advanced analytics.
                  </p>
                  <p>
                    But my identity extends far beyond technical competence. I am the founder of{' '}
                    <strong>Great Men Moves</strong>, a mentorship initiative where I guide young men toward
                    purpose, character, and leadership.
                  </p>
                  <p>
                    Faith is the foundation of everything I do. As a gospel artist, I use music to worship,
                    inspire, and communicate truths that transcend human understanding. My upcoming book,{' '}
                    <em>"Broken Souls,"</em> explores themes of redemption, healing, and divine restoration.
                  </p>
                  <p className="text-black text-xl pt-4" style={{ fontFamily: 'var(--font-serif)' }}>
                    This is my journey. This is Koboko.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Career Timeline */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-20">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
              <h2
                className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Career Journey
              </h2>
            </div>

            <div className="space-y-12">
              {careerEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/10 last:border-0"
                >
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg text-white/60">{event.year}</span>
                      {event.is_current && (
                        <span className="px-3 py-1 bg-[#d4a574] text-white text-xs uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-9">
                    <h3
                      className="text-[clamp(1.75rem,3vw,2.5rem)] mb-3"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {event.title}
                    </h3>
                    <p className="text-xl text-[#d4a574] mb-4">{event.organization}</p>
                    <p className="text-lg text-white/70 leading-relaxed max-w-3xl">
                      {event.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-20 text-center">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
              <h2
                className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.1]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Skills & Expertise
              </h2>
            </div>

            {groupedSkills.length === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-black/10" />
                      <div className="h-6 bg-black/10 rounded w-40" />
                    </div>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="bg-white p-4 border-l-2 border-black/10 h-14" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {groupedSkills.map(({ cat, meta: { label, Icon, desc }, skills: catSkills }) => (
                  <div key={cat}>
                    <div className="mb-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-black flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#d4a574]" />
                        </div>
                        <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                          {label}
                        </h3>
                      </div>
                      <p className="text-black/60 mb-8">{desc}</p>
                    </div>
                    <div className="space-y-4">
                      {catSkills.map(skill => (
                        <div key={skill.id} className="bg-white p-4 border-l-2 border-[#d4a574]">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-sm text-black/60">{proficiencyLabel(skill.proficiency)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Great Men Moves */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-white">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <h2
                  className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.05] mb-8"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Great Men<br />
                  Moves
                </h2>
                <p className="text-2xl text-black/80 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
                  Mentoring the Next Generation of Leaders
                </p>
                <div className="space-y-6 text-lg text-black/70 leading-relaxed mb-10">
                  <p>
                    Great Men Moves is more than a mentorship program — it's a movement dedicated to shaping
                    young men into leaders of character, purpose, and impact. Founded on the belief that
                    every young man deserves guidance, accountability, and a vision for his future.
                  </p>
                  <p>
                    Through intentional relationships, structured teaching, and personal example, I mentor
                    young men in leadership principles, emotional intelligence, financial literacy, spiritual
                    grounding, and practical life skills.
                  </p>
                  <p>
                    Great men are not born; they are made through discipline, mentorship, and purpose.
                    This is my contribution to building a better Africa, one young man at a time.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-5 h-5 text-[#d4a574]" />
                      <h4 className="font-medium">Core Values</h4>
                    </div>
                    <ul className="space-y-2 text-black/70">
                      <li>• Leadership</li>
                      <li>• Integrity</li>
                      <li>• Excellence</li>
                      <li>• Service</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Target className="w-5 h-5 text-[#d4a574]" />
                      <h4 className="font-medium">Focus Areas</h4>
                    </div>
                    <ul className="space-y-2 text-black/70">
                      <li>• Character Building</li>
                      <li>• Life Skills</li>
                      <li>• Spiritual Growth</li>
                      <li>• Career Guidance</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CSS-gradient visual — mentorship */}
              <div className="order-1 lg:order-2">
                <div
                  className="aspect-[4/5] relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #0d1a0d 0%, #1a2e1a 50%, #0a0a0a 100%)' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse 60% 60% at 50% 35%, #2d5a2d30 0%, transparent 70%)',
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-white/20">
                    <Users className="w-24 h-24 text-[#d4a574]/30" />
                    <div className="text-center px-8">
                      <p
                        className="text-3xl text-[#d4a574]/50 leading-tight"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        Shaping<br />the Future
                      </p>
                    </div>
                  </div>
                  {/* Gold accent bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#d4a574]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Faith, Purpose & Leadership Philosophy */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              {/* CSS-gradient visual — faith */}
              <div>
                <div
                  className="aspect-[4/5] relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #0d0a1a 0%, #1a1030 50%, #0a0a0a 100%)' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(ellipse 55% 65% at 50% 40%, #d4a57418 0%, transparent 70%)',
                    }}
                  />
                  {/* Cross light ray */}
                  <div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[2px] h-1/2 opacity-20"
                    style={{ background: 'linear-gradient(180deg, #d4a574 0%, transparent 100%)' }}
                  />
                  <div
                    className="absolute top-1/3 left-1/4 right-1/4 h-[2px] opacity-20"
                    style={{ background: 'linear-gradient(90deg, transparent, #d4a574 50%, transparent)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p
                      className="text-5xl text-[#d4a574]/20"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      Faith
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#d4a574]" />
                </div>
              </div>

              <div>
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <h2
                  className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.05] mb-8"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Faith, Purpose<br />
                  & Leadership
                </h2>

                <div className="space-y-8">
                  {[
                    {
                      icon: Heart,
                      title: 'Faith Foundation',
                      text: 'My faith in God is not separate from my work — it is the lens through which I see everything. Every line of code, every weather forecast, every mentoring conversation is an act of worship and service.',
                    },
                    {
                      icon: Target,
                      title: 'Purpose-Driven',
                      text: 'Success without significance is empty. I am driven by a desire to make a tangible impact — whether through accurate forecasts that save lives, systems that solve problems, or young men who become transformational leaders.',
                    },
                    {
                      icon: Award,
                      title: 'Excellence Standard',
                      text: 'Mediocrity is not an option. In everything I do, I pursue excellence — not for ego, but because quality work honors God, serves people well, and sets a standard for those watching.',
                    },
                    {
                      icon: TrendingUp,
                      title: 'Continuous Growth',
                      text: 'I am committed to lifelong learning. From data science studies to musical expression to theological depth — growth is non-negotiable.',
                    },
                    {
                      icon: Lightbulb,
                      title: 'Servant Leadership',
                      text: 'True leadership is service. Whether mentoring young men, contributing to national weather systems, or building technology — my goal is to serve others and leave things better than I found them.',
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title}>
                      <div className="flex items-center gap-4 mb-4">
                        <Icon className="w-8 h-8 text-[#d4a574]" />
                        <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>{title}</h3>
                      </div>
                      <p className="text-lg text-white/70 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Closing Statement */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
            <p
              className="text-[clamp(1.75rem,3vw,3rem)] leading-[1.3] text-black/80 mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              "I am not defined by a single skill or title. I am a multidimensional individual
              pursuing excellence across science, technology, creativity, and faith — believing that
              a life well-lived integrates all of who we are into a cohesive mission of purpose and impact."
            </p>
            <p className="text-xl text-black/60">— Koboko</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
