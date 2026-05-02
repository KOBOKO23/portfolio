import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Music as MusicIcon, Play, Heart, Download } from 'lucide-react';

export function Music() {
  const songs = [
    {
      id: 1,
      title: 'Grace Unending',
      duration: '4:32',
      album: 'Faith Journey',
      released: '2025',
    },
    {
      id: 2,
      title: 'Restored',
      duration: '3:58',
      album: 'Faith Journey',
      released: '2025',
    },
    {
      id: 3,
      title: 'African Praise',
      duration: '5:12',
      album: 'Heritage & Hope',
      released: '2024',
    },
    {
      id: 4,
      title: 'New Mercies',
      duration: '4:15',
      album: 'Daily Bread',
      released: '2024',
    },
  ];

  const testimonies = [
    {
      text: 'Music is my spiritual language. Through gospel melodies, I express gratitude, worship, and the transformative power of faith.',
      author: 'Personal Reflection',
    },
    {
      text: 'Each song is a testimony of God\'s faithfulness, crafted to inspire, heal, and draw hearts closer to divine purpose.',
      author: 'Artist Statement',
    },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1761901219072-491a18f3ccd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3NwZWwlMjBtdXNpYyUyMHBlcmZvcm1hbmNlJTIwbWljcm9waG9uZXxlbnwxfHx8fDE3NzIyNzI0NjB8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gospel Music"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <MusicIcon className="w-16 h-16 mx-auto mb-6 text-[#d4a574]" />
            <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Gospel Music
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-white/90">
              Faith-driven melodies that inspire, heal, and transform
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Music Ministry */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Music Ministry
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-black/70">
              <p>
                Gospel music is more than art—it's worship, testimony, and ministry. My musical journey 
                is deeply rooted in my faith, using melodies to express gratitude, hope, and the 
                transformative power of God's love.
              </p>
              <p>
                Drawing from African musical heritage and contemporary gospel sounds, I create songs 
                that resonate with believers seeking encouragement, healing, and spiritual renewal.
              </p>
              <p>
                Every note is crafted with intention, every lyric a prayer, and every performance 
                an offering of praise. Music bridges the gap between the human experience and divine 
                presence.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1715960350325-fbfaed379d8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3NwZWwlMjBjaG9pciUyMHdvcnNoaXAlMjBzaW5naW5nfGVufDF8fHx8MTc3MjI3MjY5OXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Worship"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Songs List */}
      <section className="py-24 lg:py-32 bg-[#f5f5f0]">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Recent Releases
            </h2>

            <div className="max-w-3xl mx-auto space-y-4">
              {songs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white p-6 flex items-center justify-between gap-4 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <button className="w-12 h-12 bg-[#d4a574] text-white flex items-center justify-center hover:bg-[#c9a063] transition-colors">
                      <Play size={20} fill="white" />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-xl mb-1 group-hover:text-[#d4a574] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
                        {song.title}
                      </h3>
                      <p className="text-sm text-black/60">
                        {song.album} • {song.released}
                      </p>
                    </div>
                    <div className="text-black/60 text-sm">
                      {song.duration}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:text-[#d4a574] transition-colors" aria-label="Like">
                      <Heart size={20} />
                    </button>
                    <button className="p-2 hover:text-[#d4a574] transition-colors" aria-label="Download">
                      <Download size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonies */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Artist Reflections
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {testimonies.map((testimony, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="border-l-4 border-[#d4a574] pl-8"
                >
                  <p className="text-xl leading-relaxed text-white/90 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                    "{testimony.text}"
                  </p>
                  <p className="text-sm text-[#d4a574] uppercase tracking-wide">
                    {testimony.author}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Studio Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1678356507948-84443bb173e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHJlY29yZGluZyUyMHN0dWRpbyUyMG1pY3JvcGhvbmV8ZW58MXx8fHwxNzcyMjcyNjk5fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Recording Studio"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Creative Process
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-black/70">
              <p>
                Each song begins with prayer and meditation, allowing inspiration to flow from a place 
                of spiritual connection. The creative process is both disciplined and Spirit-led.
              </p>
              <p>
                From writing lyrics that speak truth to arranging melodies that touch hearts, every 
                aspect is approached with excellence and reverence for the craft.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto bg-[#f5f5f0]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            Stay Connected
          </h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto mb-8">
            Subscribe to receive updates on new releases, performances, and ministry events.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300"
          >
            Get Updates
          </a>
        </motion.div>
      </section>
    </div>
  );
}
