import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { BookOpen, Heart, User, Sparkles } from 'lucide-react';

export function Book() {
  const chapters = [
    { number: 1, title: 'Shattered', theme: 'The Breaking' },
    { number: 2, title: 'The Wilderness', theme: 'Isolation & Discovery' },
    { number: 3, title: 'Echoes of Grace', theme: 'Divine Whispers' },
    { number: 4, title: 'Rebuilding', theme: 'Restoration Begins' },
    { number: 5, title: 'New Foundations', theme: 'Transformed Purpose' },
  ];

  const themes = [
    {
      icon: Heart,
      title: 'Redemption',
      description: 'The journey from brokenness to wholeness through divine grace',
    },
    {
      icon: User,
      title: 'Identity',
      description: 'Discovering who you are beyond your wounds and failures',
    },
    {
      icon: Sparkles,
      title: 'Hope',
      description: 'Finding light in the darkest moments of life',
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1642901798358-7b7a663dc57b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3cml0aW5nJTIwYm9vayUyMG1hbnVzY3JpcHQlMjBkZXNrfGVufDF8fHx8MTc3MjI3MjQ2MXww&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Broken Souls"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <BookOpen className="w-16 h-16 mx-auto mb-6 text-[#d4a574]" />
            <p className="text-sm uppercase tracking-widest mb-4 text-[#d4a574]">Coming Soon</p>
            <h1 className="text-6xl md:text-8xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Broken Souls
            </h1>
            <p className="text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed text-white/90 mb-12">
              A Journey from Brokenness to Wholeness
            </p>
            <button className="px-10 py-4 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-all duration-300 text-lg">
              Pre-Order Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* About the Book */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              About the Book
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-black/70">
              <p>
                "Broken Souls" is a deeply personal exploration of pain, healing, and redemption. 
                Drawing from personal experiences, biblical truths, and universal human struggles, 
                this book speaks to anyone who has felt shattered by life's circumstances.
              </p>
              <p>
                Through raw honesty and profound faith, I navigate the difficult terrain of 
                brokenness—not to glorify suffering, but to illuminate the path to restoration. 
                This is a story of how God meets us in our most fractured moments and makes us whole.
              </p>
              <p>
                The book weaves together narrative storytelling, theological reflection, and practical 
                wisdom for those seeking healing, purpose, and a renewed sense of identity in Christ.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#f5f5f0] p-12"
          >
            <blockquote className="text-2xl md:text-3xl leading-relaxed mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              "We are not defined by our brokenness, but by the One who redeems it."
            </blockquote>
            <p className="text-black/60 uppercase text-sm tracking-wide">— Koboko, Author</p>
          </motion.div>
        </div>
      </section>

      {/* Key Themes */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Key Themes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {themes.map((theme, index) => (
                <motion.div
                  key={theme.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4a574] rounded-full mb-6">
                    <theme.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                    {theme.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {theme.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Chapter Preview */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
            Chapter Preview
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="border-l-4 border-[#d4a574] pl-8 py-4 hover:bg-[#f5f5f0] transition-colors"
              >
                <div className="flex items-baseline gap-6">
                  <span className="text-5xl text-[#d4a574]/30" style={{ fontFamily: 'var(--font-serif)' }}>
                    {chapter.number}
                  </span>
                  <div>
                    <h3 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
                      {chapter.title}
                    </h3>
                    <p className="text-black/60 italic">{chapter.theme}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            <p className="text-center text-black/60 pt-8">...and many more chapters to come</p>
          </div>
        </motion.div>
      </section>

      {/* Author's Note */}
      <section className="py-24 lg:py-32 bg-[#f5f5f0]">
        <div className="px-6 lg:px-12 max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl mb-8" style={{ fontFamily: 'var(--font-serif)' }}>
              Author's Note
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-black/70">
              <p>
                Writing "Broken Souls" has been one of the most vulnerable and rewarding experiences of my life. 
                This book is not just theory or theology—it's lived experience. It's the story of my own 
                journey through brokenness and the miraculous process of being made whole.
              </p>
              <p>
                My prayer is that these pages become a companion for anyone walking through their own 
                season of pain. May you find hope, healing, and the assurance that broken souls can 
                become beautiful testimonies of God's redemptive power.
              </p>
              <p className="text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
                — Koboko
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pre-Order CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            Reserve Your Copy
          </h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto mb-12">
            Be among the first to receive "Broken Souls" when it launches. Pre-order now and receive exclusive bonus content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-10 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 text-lg">
              Pre-Order Book
            </button>
            <a
              href="/contact"
              className="px-10 py-4 border-2 border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-lg"
            >
              Get Notified
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
