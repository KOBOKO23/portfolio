import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music as MusicIcon, Play, Heart, ExternalLink, Youtube, X } from 'lucide-react';
import { SEO } from '../components/SEO';

interface Track {
  id: number;
  title: string;
  slug?: string;
  album?: string;
  duration?: string;
  released?: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
  description?: string;
}

const FALLBACK_TRACKS: Track[] = [
  { id: 1, title: 'Grace Unending', album: 'Faith Journey', duration: '4:32', released: '2025' },
  { id: 2, title: 'Restored', album: 'Faith Journey', duration: '3:58', released: '2025' },
  { id: 3, title: 'African Praise', album: 'Heritage & Hope', duration: '5:12', released: '2024' },
  { id: 4, title: 'New Mercies', album: 'Daily Bread', duration: '4:15', released: '2024' },
];

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function MusicHero() {
  return (
    <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 60%, #1a0a2e 0%, #0a0a0a 65%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 40% 40% at 50% 50%, #d4a57412 0%, transparent 70%)' }}
      />
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="absolute rounded-full border border-[#d4a574] pointer-events-none"
          style={{
            width: `${n * 12}vw`, height: `${n * 12}vw`,
            opacity: 0.03 + n * 0.01,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <div className="relative z-10 text-center text-white px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div
            className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border border-[#d4a574]/40"
            style={{ background: 'rgba(212,165,116,0.08)' }}
          >
            <MusicIcon className="w-10 h-10 text-[#d4a574]" />
          </div>
          <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            Gospel Music
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-white/80">
            Faith-driven melodies that inspire, heal, and transform
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function WorshipVisual() {
  return (
    <div
      className="aspect-square relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #1a0d08 0%, #2e1a0a 50%, #0a0a0a 100%)' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 35%, #d4a57420 0%, transparent 70%)' }}
      />
      {[1, 2, 3].map((n) => (
        <div key={n} className="absolute rounded-full border border-[#d4a574]"
          style={{ width: `${n * 30}%`, height: `${n * 30}%`, opacity: 0.08, top: '35%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-[#d4a574]/25 text-5xl text-center" style={{ fontFamily: 'var(--font-serif)' }}>Worship</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4a574]" />
    </div>
  );
}

function StudioVisual() {
  return (
    <div
      className="aspect-[4/3] relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #081a18 0%, #0d2e2a 50%, #0a0a0a 100%)' }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 35% 45%, #1a4a4420 0%, transparent 70%)' }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-2 px-16">
        {[4, 8, 14, 10, 6, 12, 8, 16, 6, 10, 14, 8, 4].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm"
            style={{ height: `${h * 4}px`, background: `rgba(212,165,116,${0.08 + (h / 16) * 0.12})` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-end justify-center pb-8">
        <p className="text-white/20 text-xs uppercase tracking-[0.4em]">Recording Studio</p>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4a574]" />
    </div>
  );
}

function YouTubeModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 lg:p-12"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-lg" style={{ fontFamily: 'var(--font-serif)' }}>{title}</p>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Music() {
  const [tracks, setTracks] = useState<Track[]>(FALLBACK_TRACKS);
  const [playingVideo, setPlayingVideo] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
    fetch(`${apiBase}/music/tracks/`)
      .then((r) => r.json())
      .then((body) => {
        const items: Track[] = body?.data?.results ?? body?.data ?? [];
        if (items.length > 0) setTracks(items);
      })
      .catch(() => {});
  }, []);

  const handlePlay = (track: Track) => {
    if (track.youtube_url) {
      const vid = extractYouTubeId(track.youtube_url);
      if (vid) { setPlayingVideo({ id: vid, title: track.title }); return; }
    }
    if (track.spotify_url) window.open(track.spotify_url, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="Music"
        description="Gospel music by Koboko — faith-filled sounds from Nairobi. Listen to original tracks and ministry recordings."
        url="/music"
      />
      <MusicHero />

      {/* About */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Music Ministry
            </h2>
            <div className="space-y-4 text-lg leading-relaxed text-black/70">
              <p>
                Gospel music is more than art — it's worship, testimony, and ministry. My musical journey
                is deeply rooted in my faith, using melodies to express gratitude, hope, and the
                transformative power of God's love.
              </p>
              <p>
                Drawing from African musical heritage and contemporary gospel sounds, I create songs
                that resonate with believers seeking encouragement, healing, and spiritual renewal.
              </p>
              <p>
                Every note is crafted with intention, every lyric a prayer, and every performance
                an offering of praise.
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <WorshipVisual />
          </motion.div>
        </div>
      </section>

      {/* Track list */}
      <section className="py-24 lg:py-32 bg-[#f5f5f0]">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Recent Releases
            </h2>

            <div className="max-w-3xl mx-auto space-y-4">
              {tracks.map((track, index) => {
                const hasVideo = !!(track.youtube_url && extractYouTubeId(track.youtube_url));
                const ytId = hasVideo ? extractYouTubeId(track.youtube_url!) : null;

                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white p-6 flex items-center justify-between gap-4 hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      {/* Play / thumbnail */}
                      <button
                        onClick={() => handlePlay(track)}
                        className="w-12 h-12 flex items-center justify-center flex-shrink-0 transition-colors relative overflow-hidden"
                        style={hasVideo && ytId ? { padding: 0 } : { background: '#d4a574' }}
                        aria-label={`Play ${track.title}`}
                      >
                        {hasVideo && ytId ? (
                          <div className="w-12 h-12 relative">
                            <img
                              src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                              <Play size={16} fill="white" className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <Play size={20} fill="white" className="text-white" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xl mb-1 group-hover:text-[#d4a574] transition-colors truncate"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {track.title}
                        </h3>
                        <p className="text-sm text-black/60">
                          {track.album}{track.released ? ` · ${track.released}` : ''}
                        </p>
                      </div>

                      {track.duration && (
                        <div className="text-black/60 text-sm flex-shrink-0">{track.duration}</div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {hasVideo && (
                        <button
                          onClick={() => setPlayingVideo({ id: extractYouTubeId(track.youtube_url!)!, title: track.title })}
                          className="p-2 hover:text-red-500 transition-colors"
                          aria-label="Watch on YouTube"
                        >
                          <Youtube size={20} />
                        </button>
                      )}
                      {track.spotify_url && (
                        <a
                          href={track.spotify_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:text-[#d4a574] transition-colors"
                          aria-label="Listen on Spotify"
                        >
                          <ExternalLink size={20} />
                        </a>
                      )}
                      <button className="p-2 hover:text-[#d4a574] transition-colors" aria-label="Like">
                        <Heart size={20} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Artist Reflections */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Artist Reflections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { text: 'Music is my spiritual language. Through gospel melodies, I express gratitude, worship, and the transformative power of faith.', author: 'Personal Reflection' },
                { text: "Each song is a testimony of God's faithfulness, crafted to inspire, heal, and draw hearts closer to divine purpose.", author: 'Artist Statement' },
              ].map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.2 }} className="border-l-4 border-[#d4a574] pl-8">
                  <p className="text-xl leading-relaxed text-white/90 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                    "{item.text}"
                  </p>
                  <p className="text-sm text-[#d4a574] uppercase tracking-wide">{item.author}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Creative Process */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="order-2 lg:order-1">
            <StudioVisual />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="order-1 lg:order-2">
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Creative Process</h2>
            <div className="space-y-4 text-lg leading-relaxed text-black/70">
              <p>Each song begins with prayer and meditation, allowing inspiration to flow from a place of spiritual connection. The creative process is both disciplined and Spirit-led.</p>
              <p>From writing lyrics that speak truth to arranging melodies that touch hearts, every aspect is approached with excellence and reverence for the craft.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto bg-[#f5f5f0]">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Stay Connected</h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto mb-8">
            Subscribe to receive updates on new releases, performances, and ministry events.
          </p>
          <a href="/contact" className="inline-block px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300">
            Get Updates
          </a>
        </motion.div>
      </section>

      {/* YouTube modal */}
      <AnimatePresence>
        {playingVideo && (
          <YouTubeModal
            videoId={playingVideo.id}
            title={playingVideo.title}
            onClose={() => setPlayingVideo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
