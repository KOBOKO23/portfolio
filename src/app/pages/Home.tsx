import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Screen Editorial */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1761001311816-b2a0481e3577?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcHJvZmVzc2lvbmFsJTIwcG9ydHJhaXQlMjBzaWxob3VldHRlfGVufDF8fHx8MTc3MjI3MzE4NXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Koboko"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        
        <div className="relative z-20 px-6 lg:px-12 max-w-[1800px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl"
          >
            <div className="mb-8">
              <div className="w-16 h-[2px] bg-[#d4a574] mb-8" />
              <h1 
                className="text-[clamp(3rem,10vw,8rem)] leading-[0.95] tracking-tight text-white mb-8"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Where Science<br />
                Meets Purpose.
              </h1>
            </div>
            
            <p className="text-[clamp(1.25rem,2.5vw,2rem)] text-white/90 mb-6 max-w-4xl tracking-wide">
              Meteorology. Software. Data. Faith. Creativity.
            </p>
            
            <div className="flex flex-wrap gap-6 mt-12">
              <Link
                to="/projects"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-[#d4a574] hover:text-white transition-all duration-500"
              >
                <span className="text-lg">View Work</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-500"
              >
                <span className="text-lg">Get In Touch</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="flex flex-col items-center gap-2 text-white/60">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-[1px] h-16 bg-white/40" />
          </div>
        </motion.div>
      </section>

      {/* Introduction Section */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-16"
          >
            <div className="lg:col-span-4">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
              <h2 className="text-sm uppercase tracking-[0.3em] text-black/60">Introduction</h2>
            </div>
            
            <div className="lg:col-span-8">
              <p 
                className="text-[clamp(1.75rem,3.5vw,3.5rem)] leading-[1.2] mb-8"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                I am a modern African polymath—combining meteorological science, software engineering, 
                and data-driven innovation with unwavering faith and creative expression.
              </p>
              <p className="text-xl text-black/70 leading-relaxed max-w-3xl">
                At Kenya's Meteorological Department, I predict weather patterns that shape lives. As a backend developer, 
                I architect scalable systems. As a data scientist in training, I transform information into insight. 
                Through Great Men Moves, I mentor the next generation. Through gospel music, I worship. 
                Through my upcoming book "Broken Souls," I tell stories of redemption. This is where purpose transcends profession.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Software Project */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <p className="text-sm uppercase tracking-[0.3em] text-white/60 mb-6">Featured / Software</p>
                <h2 
                  className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] mb-8"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Django REST API Framework
                </h2>
                <p className="text-xl text-white/80 leading-relaxed mb-8">
                  Enterprise-grade backend architecture powering scalable applications. Built with Python, Django, 
                  and PostgreSQL, featuring comprehensive authentication, real-time data processing, and optimized 
                  query performance for high-traffic environments.
                </p>
                
                <div className="flex flex-wrap gap-3 mb-10">
                  {['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Docker'].map((tech) => (
                    <span key={tech} className="px-4 py-2 border border-white/20 text-sm">
                      {tech}
                    </span>
                  ))}
                </div>

                <Link 
                  to="/projects"
                  className="inline-flex items-center gap-2 text-[#d4a574] hover:gap-4 transition-all group"
                >
                  <span className="text-lg">View Project</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="order-1 lg:order-2 relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1753998941488-fc3064ab6094?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQeXRob24lMjBjb2RlJTIwZGV2ZWxvcG1lbnQlMjBzY3JlZW58ZW58MXx8fHwxNzcyMjczMTg1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Django REST API"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Meteorology Project */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1737912133578-159cdde20086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjB3ZWF0aGVyJTIwZGF0YSUyMHNjcmVlbnxlbnwxfHx8fDE3NzIyNzMxODZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Numerical Weather Prediction"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <p className="text-sm uppercase tracking-[0.3em] text-black/60 mb-6">Featured / Meteorology</p>
                <h2 
                  className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] mb-8"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Numerical Weather Prediction
                </h2>
                <p className="text-xl text-black/70 leading-relaxed mb-8">
                  Advanced atmospheric modeling and forecasting systems serving East Africa. Combining computational 
                  science with meteorological expertise to predict weather patterns that impact agriculture, aviation, 
                  and disaster preparedness across the region.
                </p>
                
                <div className="mb-10 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-[#d4a574] mt-2 flex-shrink-0" />
                    <p className="text-black/70">
                      <strong className="text-black">Kenya Meteorological Department</strong> — Numerical Weather Prediction Section
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-[#d4a574] mt-2 flex-shrink-0" />
                    <p className="text-black/70">
                      <strong className="text-black">1 Year of Service</strong> — Contributing to national weather forecasting
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link 
                    to="/weather-forecast"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a574] text-black hover:bg-black hover:text-white transition-all group"
                  >
                    <span className="font-medium">View 72hr Forecast</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link 
                    to="/about"
                    className="inline-flex items-center gap-2 text-black hover:text-[#d4a574] hover:gap-4 transition-all group"
                  >
                    <span className="text-lg">Read More</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Blog Post Preview */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4">
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <h2 className="text-sm uppercase tracking-[0.3em] text-black/60 mb-8">Latest Writing</h2>
                <Link 
                  to="/blog"
                  className="inline-flex items-center gap-2 text-black hover:text-[#d4a574] hover:gap-4 transition-all"
                >
                  <span>View All Articles</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="lg:col-span-8">
                <article>
                  <span className="inline-block px-4 py-2 bg-[#f5f5f0] text-sm mb-6">Faith + Technology</span>
                  <h3 
                    className="text-[clamp(2rem,4vw,4rem)] leading-[1.15] mb-6 hover:text-[#d4a574] transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    The Intersection of Faith and Technology
                  </h3>
                  <p className="text-xl text-black/70 leading-relaxed mb-8">
                    How my spiritual foundation guides my approach to modern technology and innovation in the 
                    meteorological and tech fields. Exploring the harmony between belief and scientific inquiry.
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-black/60">
                    <span>February 15, 2026</span>
                    <span>5 min read</span>
                  </div>
                </article>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fashion Highlight */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-16">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <h2 
                  className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] max-w-3xl"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Men's Fashion<br />
                  Curation
                </h2>
                <Link 
                  to="/fashion"
                  className="inline-flex items-center gap-2 text-[#d4a574] hover:gap-4 transition-all"
                >
                  <span className="text-lg">View Gallery</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="aspect-[16/10] overflow-hidden group cursor-pointer">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1754577060019-f997f5566168?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtZW5zd2VhciUyMGRldGFpbCUyMHRleHR1cmV8ZW58MXx8fHwxNzcyMjczMTg2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Fashion"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-lg text-white/80 leading-relaxed mb-8">
                    Fashion is intentional communication. From boardroom excellence to creative expression, 
                    every choice reflects discipline, culture, and confidence.
                  </p>
                  <p className="text-white/60">
                    Exploring the intersection of classic tailoring, contemporary African aesthetics, 
                    and personal style evolution.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Book Feature - Broken Souls */}
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
                <div className="aspect-[3/4] overflow-hidden bg-[#f5f5f0] flex items-center justify-center relative">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1760840414854-36cd365d14f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYm9vayUyMHBhZ2VzJTIwbGlnaHR8ZW58MXx8fHwxNzcyMjczMTg2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Broken Souls"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-12">
                      <p 
                        className="text-8xl lg:text-9xl text-black/10 mb-4"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        BS
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
                <p className="text-sm uppercase tracking-[0.3em] text-black/60 mb-6">Coming Soon</p>
                <h2 
                  className="text-[clamp(3rem,6vw,6rem)] leading-[1.05] mb-8"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Broken Souls
                </h2>
                <p className="text-2xl text-black/80 leading-relaxed mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
                  "A Journey from Brokenness to Wholeness"
                </p>
                <p className="text-lg text-black/70 leading-relaxed mb-10">
                  An intimate exploration of pain, healing, and redemption. Through raw honesty and profound faith, 
                  this book illuminates the path from shattered souls to beautiful testimonies of God's transformative power.
                </p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-1 bg-[#d4a574] mt-3 flex-shrink-0" />
                    <p className="text-black/70">Themes of redemption, identity, and divine restoration</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-1 bg-[#d4a574] mt-3 flex-shrink-0" />
                    <p className="text-black/70">Personal narrative woven with theological depth</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-1 h-1 bg-[#d4a574] mt-3 flex-shrink-0" />
                    <p className="text-black/70">Practical wisdom for healing and hope</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link 
                    to="/book"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all"
                  >
                    <span>Pre-Order Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link 
                    to="/book"
                    className="inline-flex items-center gap-2 px-8 py-4 border-2 border-black text-black hover:bg-black hover:text-white transition-all"
                  >
                    <span>Learn More</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
            <h2 
              className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] mb-8 max-w-4xl mx-auto"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Stay Connected to<br />
              the Journey
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
              Receive insights on technology, meteorology, faith, leadership, and creativity. 
              Join a community of thinkers, builders, and believers.
            </p>

            <form className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-8 py-5 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4a574] transition-colors text-lg"
                />
                <button
                  type="submit"
                  className="px-10 py-5 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-colors whitespace-nowrap text-lg"
                >
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-white/40 mt-4">
                No spam. Unsubscribe anytime. Your inbox deserves quality.
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-white border-t border-black/10">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-20"
          >
            <div>
              <h2 
                className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] mb-8"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Let's Build<br />
                Something<br />
                Meaningful
              </h2>
              <p className="text-xl text-black/70 leading-relaxed">
                Whether you need a meteorologist, software developer, mentor, or creative collaborator—let's start a conversation.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-6">
              <Link
                to="/contact"
                className="group flex items-center justify-between p-8 border-2 border-black hover:bg-black hover:text-white transition-all"
              >
                <div>
                  <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                    Get In Touch
                  </h3>
                  <p className="text-black/60 group-hover:text-white/60">Discuss opportunities and collaborations</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>

              <Link
                to="/projects"
                className="group flex items-center justify-between p-8 border-2 border-black/20 hover:border-[#d4a574] transition-all"
              >
                <div>
                  <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                    View Projects
                  </h3>
                  <p className="text-black/60">Explore technical work and case studies</p>
                </div>
                <ExternalLink className="w-6 h-6 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}