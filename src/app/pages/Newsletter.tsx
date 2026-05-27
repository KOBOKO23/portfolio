import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle, Star, Calendar, TrendingUp, BookOpen, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setIsSubscribed(true);
      // Reset form after 5 seconds
      setTimeout(() => {
        setEmail('');
        setName('');
      }, 5000);
    }
  };

  const contentTypes = [
    {
      icon: BookOpen,
      title: 'Weekly Insights',
      description: 'Thoughtful reflections on technology, faith, creativity, and personal growth.',
    },
    {
      icon: TrendingUp,
      title: 'Project Updates',
      description: 'Behind-the-scenes looks at ongoing work in meteorology, software, and mentorship.',
    },
    {
      icon: Heart,
      title: 'Curated Recommendations',
      description: 'Books, music, tools, and resources that inspire excellence and intentional living.',
    },
    {
      icon: Sparkles,
      title: 'Exclusive Content',
      description: 'Early access to articles, music releases, and updates on "Broken Souls."',
    },
  ];

  const testimonials = [
    {
      quote: "Koboko's weekly newsletter is my Sunday morning ritual. The blend of technical insight, faith perspective, and creative inspiration is unmatched.",
      author: 'Michael K.',
      role: 'Software Engineer, Nairobi',
    },
    {
      quote: "I subscribed for the tech content but stayed for the life wisdom. Each email challenges me to think deeper and live more intentionally.",
      author: 'Sarah M.',
      role: 'Data Analyst, Kampala',
    },
    {
      quote: "As a young professional navigating career and purpose, this newsletter feels like mentorship delivered to my inbox every week.",
      author: 'David O.',
      role: 'Student, ALX Africa',
    },
  ];

  const archiveIssues = [
    {
      number: '#12',
      title: 'On Building Systems That Last',
      date: 'February 21, 2026',
      excerpt: 'Why software architecture and character development follow the same principles...',
      topics: ['Engineering', 'Personal Growth'],
    },
    {
      number: '#11',
      title: 'The Intersection of Faith and Code',
      date: 'February 14, 2026',
      excerpt: 'Exploring how spiritual discipline shapes technical excellence...',
      topics: ['Faith', 'Software'],
    },
    {
      number: '#10',
      title: 'Broken Souls: Chapter One Preview',
      date: 'February 7, 2026',
      excerpt: 'An exclusive first look at the opening chapter of my upcoming book...',
      topics: ['Writing', 'Faith'],
    },
    {
      number: '#09',
      title: 'Mentoring the Next Generation',
      date: 'January 31, 2026',
      excerpt: 'Lessons learned from Great Men Moves and why investing in youth matters...',
      topics: ['Mentorship', 'Leadership'],
    },
  ];

  const benefits = [
    'Thoughtful, weekly essays (not daily spam)',
    'Exclusive updates and early access',
    'Curated resources and recommendations',
    'Unsubscribe anytime, no hassle',
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Newsletter"
        description="Subscribe to Koboko's newsletter for insights on meteorology, tech, faith, and life from Nairobi. Join a growing community of curious minds."
        url="/newsletter"
      />
      {/* Hero Section */}
      <section className="relative py-32 lg:py-48 px-6 lg:px-12 bg-black text-white overflow-hidden">
        {/* Atmospheric gradient — no external images */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 60%, #1a1208 0%, #0a0a0a 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#d4a574 1px, transparent 1px)',
            backgroundSize: '100% 2.5rem',
          }}
        />
        <div className="relative z-10 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 bg-[#d4a574]">
              <Mail size={20} />
              <span className="uppercase tracking-widest text-sm">Weekly Newsletter</span>
            </div>
            <h1 
              className="text-[clamp(4rem,10vw,8rem)] leading-[0.9] mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Join the<br />
              Journey
            </h1>
            <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] text-white/80 leading-relaxed max-w-3xl mx-auto mb-12">
              Every Sunday, receive thoughtful reflections on technology, faith, creativity, 
              and the pursuit of excellence—straight to your inbox.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Subscription Form Section */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[800px] mx-auto">
          <AnimatePresence mode="wait">
            {!isSubscribed ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-12">
                  <h2 
                    className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] mb-6"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Subscribe for Free
                  </h2>
                  <p className="text-xl text-black/70">
                    Join over 2,000+ professionals, creatives, and changemakers who start their week with intention.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-[#f5f5f0] p-12 mb-8">
                  <div className="space-y-6">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name *"
                      className="w-full px-6 py-5 bg-white border-2 border-black/10 focus:border-[#d4a574] outline-none transition-colors text-lg"
                      required
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your Email Address *"
                      className="w-full px-6 py-5 bg-white border-2 border-black/10 focus:border-[#d4a574] outline-none transition-colors text-lg"
                      required
                    />
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        id="consent" 
                        className="mt-2" 
                        required 
                      />
                      <label htmlFor="consent" className="text-sm text-black/70">
                        I agree to receive weekly emails from Koboko. I understand I can unsubscribe at any time.
                      </label>
                    </div>
                    <button 
                      type="submit"
                      className="w-full px-10 py-6 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-lg flex items-center justify-center gap-3 group"
                    >
                      <span>Subscribe to Newsletter</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 text-black/70">
                      <CheckCircle size={20} className="text-[#d4a574] flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="bg-[#d4a574] text-white p-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle size={80} className="mx-auto mb-8" />
                </motion.div>
                <h3 
                  className="text-4xl mb-6"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Welcome to the Journey!
                </h3>
                <p className="text-xl leading-relaxed max-w-2xl mx-auto mb-6">
                  Thank you for subscribing. Check your inbox for a confirmation email.
                </p>
                <p className="text-white/80">
                  Your first newsletter arrives this Sunday morning. ☕
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* What You'll Receive */}
      <section className="py-32 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              What You'll Receive
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Each Sunday, expect a carefully crafted email designed to inspire, inform, and invite deeper thinking.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contentTypes.map((content, index) => (
              <motion.div
                key={content.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border border-white/20 p-10 hover:border-[#d4a574] hover:bg-white/5 transition-all"
              >
                <content.icon size={40} className="mb-6 text-[#d4a574]" />
                <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                  {content.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {content.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20">
              <Calendar size={24} className="text-[#d4a574]" />
              <span className="text-lg">Every Sunday at 8:00 AM EAT</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reader Testimonials */}
      <section className="py-32 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              What Readers Say
            </h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">
              Join a community of thoughtful readers who value depth over noise.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-10"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="text-[#d4a574] fill-[#d4a574]" />
                  ))}
                </div>
                <p 
                  className="text-lg leading-relaxed mb-8 text-black/80"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-black/10 pt-6">
                  <p className="text-black mb-1">{testimonial.author}</p>
                  <p className="text-sm text-black/60">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Archive */}
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Recent Issues
            </h2>
            <p className="text-xl text-black/70 max-w-3xl mx-auto">
              Browse past newsletters to get a preview of what lands in your inbox every Sunday.
            </p>
          </motion.div>

          <div className="space-y-6">
            {archiveIssues.map((issue, index) => (
              <motion.article
                key={issue.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border border-black/10 p-8 hover:border-[#d4a574] hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-[#d4a574] uppercase tracking-widest">
                        {issue.number}
                      </span>
                      <span className="text-sm text-black/50">{issue.date}</span>
                    </div>
                    <h3 
                      className="text-2xl mb-3 group-hover:text-[#d4a574] transition-colors"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {issue.title}
                    </h3>
                    <p className="text-black/70 leading-relaxed mb-4">
                      {issue.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {issue.topics.map((topic) => (
                        <span 
                          key={topic}
                          className="px-3 py-1 bg-black/5 text-xs uppercase tracking-wide text-black/60"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
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

          <div className="text-center mt-12">
            <a 
              href="#"
              className="inline-flex items-center gap-2 text-lg text-black hover:text-[#d4a574] transition-colors"
            >
              <span>View Full Archive</span>
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Mail size={60} className="mx-auto mb-8 text-[#d4a574]" />
            <h2 
              className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Ready to Begin?
            </h2>
            <p className="text-xl text-white/80 leading-relaxed mb-12 max-w-2xl mx-auto">
              Join a growing community of thinkers, creators, and leaders who value substance over noise. 
              No spam. No fluff. Just meaningful content, every Sunday.
            </p>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-block px-12 py-5 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg"
            >
              Subscribe Now
            </a>
            <p className="text-white/60 text-sm mt-8">
              Free forever. Unsubscribe anytime with one click.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Visual Divider — pure CSS quote panel */}
      <section className="relative h-[400px] overflow-hidden flex items-center justify-center bg-[#0a0a0a]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 50%, #1a1208 0%, #0a0a0a 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(#d4a574 1px, transparent 1px), linear-gradient(90deg, #d4a574 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <p
          className="relative z-10 text-white text-3xl md:text-5xl text-center px-6 max-w-4xl"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          "The best investment you can make<br />
          is in your own growth."
        </p>
      </section>
    </div>
  );
}
