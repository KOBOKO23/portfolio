import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music as MusicIcon, Play, ExternalLink, Youtube, X, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface Track {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  cover_image?: string | null;
  duration?: string;
  release_date?: string | null;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
  soundcloud_url?: string;
  is_featured?: boolean;
}

function formatYear(date?: string | null) {
  if (!date) return '';
  return new Date(date).getFullYear().toString();
}

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
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

function WaveBar({ h, delay }: { h: number; delay: number }) {
  return (
    <motion.div
      className="w-1 rounded-full bg-[#d4a574]"
      style={{ height: h }}
      animate={{ scaleY: [1, 1.8, 0.6, 1.4, 1] }}
      transition={{ repeat: Infinity, duration: 1.6 + delay * 0.3, ease: 'easeInOut', delay }}
    />
  );
}

function YouTubeModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 lg:p-12"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.25 }}
        className="w-full max-w-4xl"
        onClick={e => e.stopPropagation()}
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
            allowFullScreen className="w-full h-full" style={{ border: 'none' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrackCard({ track, index, onPlay, onWatch }: {
  track: Track; index: number;
  onPlay: () => void; onWatch: (id: string) => void;
}) {
  const ytId = extractYouTubeId(track.youtube_url);
  const hasVideo = !!ytId;
  const thumbnail = (track.cover_image ?? '') || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null);
  const meta = [track.duration, formatYear(track.release_date)].filter(Boolean).join(' · ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="group relative bg-white border border-black/5 hover:border-[#d4a574]/40 hover:shadow-xl transition-all duration-400"
    >
      {track.is_featured && (
        <div className="absolute top-0 left-0 px-3 py-1 bg-[#d4a574] text-white text-[9px] uppercase tracking-widest font-semibold">
          Featured
        </div>
      )}

      <div className="flex items-stretch">
        {/* Thumbnail / play */}
        <button
          onClick={onPlay}
          disabled={!hasVideo && !track.spotify_url}
          aria-label={`Play ${track.title}`}
          className="relative w-20 flex-shrink-0 overflow-hidden focus:outline-none"
          style={{ minHeight: 88 }}
        >
          {thumbnail ? (
            <>
              <img src={thumbnail} alt={track.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center group-hover:bg-[#d4a574] group-hover:border-[#d4a574] transition-all">
                  <Play size={14} fill="white" className="text-white ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#d4a574]/20 border border-[#d4a574]/40 flex items-center justify-center group-hover:bg-[#d4a574] group-hover:border-[#d4a574] transition-all">
                <Play size={14} fill="white" className="text-white ml-0.5" />
              </div>
            </div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className="text-[1.05rem] leading-snug group-hover:text-[#d4a574] transition-colors"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {track.title}
              </h3>
              {meta && <p className="text-[11px] text-black/35 mt-0.5 tracking-wide">{meta}</p>}
            </div>

            {/* Stream links */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {hasVideo && (
                <button
                  onClick={() => onWatch(ytId)}
                  className="p-2 text-black/25 hover:text-red-500 transition-colors"
                  aria-label="Watch on YouTube"
                >
                  <Youtube size={16} />
                </button>
              )}
              {track.spotify_url && (
                <a href={track.spotify_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-black/25 hover:text-[#1db954] transition-colors" aria-label="Spotify">
                  <ExternalLink size={16} />
                </a>
              )}
              {track.apple_music_url && (
                <a href={track.apple_music_url} target="_blank" rel="noopener noreferrer"
                  className="p-2 text-black/25 hover:text-[#fc3c44] transition-colors" aria-label="Apple Music">
                  <MusicIcon size={16} />
                </a>
              )}
            </div>
          </div>

          {track.description && (
            <p className="mt-2 text-[13px] text-black/50 leading-relaxed line-clamp-2">
              {track.description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function Music() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/music/tracks/`)
      .then(r => r.json() as Promise<{ data?: Track[] | { results?: Track[] } }>)
      .then(body => {
        const d = body.data;
        const items: Track[] = Array.isArray(d) ? d : (d)?.results ?? [];
        setTracks(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = tracks.find(t => t.is_featured) ?? tracks[0] ?? null;
  const featuredYtId = extractYouTubeId(featured?.youtube_url);
  const rest = tracks.filter(t => t.id !== featured?.id);

  const handlePlay = (track: Track) => {
    const vid = extractYouTubeId(track.youtube_url);
    if (vid) { setPlayingVideo({ id: vid, title: track.title }); return; }
    if (track.spotify_url) window.open(track.spotify_url, '_blank', 'noopener');
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Gospel Music"
        description="Gospel music by Koboko — faith-filled sounds from Nairobi. Listen to original tracks and ministry recordings."
        url="/music"
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a] pt-20">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 80% at 50% 60%, #1a0a2e 0%, #0a0a0a 65%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 40% at 50% 50%, #d4a57415 0%, transparent 70%)' }} />
        {/* Rings */}
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="absolute rounded-full border border-[#d4a574] pointer-events-none"
            style={{ width: `${n * 14}vw`, height: `${n * 14}vw`, opacity: 0.02 + n * 0.01, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        ))}

        <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            {/* Animated waveform */}
            <div className="flex items-end justify-center gap-1 mb-10 h-10">
              {[12, 20, 28, 16, 32, 20, 14, 28, 18, 24, 12, 20, 28].map((h, i) => (
                <WaveBar key={i} h={h} delay={i * 0.12} />
              ))}
            </div>

            <div className="w-16 h-[2px] bg-[#d4a574] mx-auto mb-8" />
            <h1 className="leading-[0.92] tracking-tight text-white mb-6" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}>
              Gospel<br /><span className="text-[#d4a574]">Music</span>
            </h1>
            <p className="text-white/60 text-[clamp(1rem,2vw,1.3rem)] max-w-xl mx-auto leading-relaxed">
              Faith-driven melodies from Nairobi — worship, testimony, and ministry in sound.
            </p>

            {!loading && tracks.length > 0 && (
              <p className="mt-6 text-white/25 text-xs uppercase tracking-[0.3em]">
                {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Track ────────────────────────────────────────────── */}
      {!loading && featured && (
        <section className="py-24 px-6 lg:px-16 bg-black text-white">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <div className="w-10 h-[2px] bg-[#d4a574] mb-6" />
              <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-10">
                {featured.is_featured ? 'Featured Track' : 'Latest Track'}
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Player / thumbnail */}
                <div className="relative group">
                  {featuredYtId ? (
                    <button
                      onClick={() => setPlayingVideo({ id: featuredYtId, title: featured.title })}
                      className="relative w-full aspect-video overflow-hidden block focus:outline-none"
                    >
                      <img
                        src={(featured.cover_image ?? '') || `https://img.youtube.com/vi/${featuredYtId}/maxresdefault.jpg`}
                        alt={featured.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-18 h-18 rounded-full bg-white/10 border-2 border-white/40 flex items-center justify-center backdrop-blur-sm group-hover:bg-[#d4a574] group-hover:border-[#d4a574] transition-all duration-300 w-20 h-20">
                          <Play size={32} fill="white" className="text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4a574]" />
                    </button>
                  ) : featured.cover_image ? (
                    <div className="relative w-full aspect-video overflow-hidden">
                      <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4a574]" />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-[#1a0a2e] to-[#0a0a0a] flex items-center justify-center">
                      <Radio className="w-16 h-16 text-[#d4a574]/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <h2 className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                    {featured.title}
                  </h2>
                  {[featured.duration, formatYear(featured.release_date)].filter(Boolean).length > 0 && (
                    <p className="text-white/35 text-sm mb-6 tracking-wide">
                      {[featured.duration, formatYear(featured.release_date)].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {featured.description && (
                    <p className="text-white/65 text-[17px] leading-[1.85] mb-8">{featured.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {featuredYtId && (
                      <button
                        onClick={() => setPlayingVideo({ id: featuredYtId, title: featured.title })}
                        className="flex items-center gap-2 px-6 py-3 bg-[#d4a574] text-white text-sm font-medium hover:bg-white hover:text-black transition-all"
                      >
                        <Play size={16} fill="currentColor" /> Play Now
                      </button>
                    )}
                    {featured.spotify_url && (
                      <a href={featured.spotify_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 border border-white/20 text-white/70 text-sm hover:border-white hover:text-white transition-all">
                        <ExternalLink size={16} /> Spotify
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Track List ────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-16 bg-[#f5f5f0]">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-10 h-[2px] bg-[#d4a574]" />
              <h2 className="text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
                {rest.length > 0 ? 'All Tracks' : 'Tracks'}
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white h-[88px] flex items-center gap-4 px-4 animate-pulse">
                    <div className="w-20 h-full bg-black/6 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-black/6 rounded w-1/2" />
                      <div className="h-3 bg-black/4 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-24">
                <MusicIcon className="w-12 h-12 mx-auto mb-4 text-black/15" />
                <p className="text-black/35 text-lg">No tracks added yet.</p>
                <p className="text-black/25 text-sm mt-1">Add tracks from the admin dashboard.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(rest.length > 0 ? rest : tracks).map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    index={index}
                    onPlay={() => handlePlay(track)}
                    onWatch={(id) => setPlayingVideo({ id, title: track.title })}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 px-6 lg:px-16 bg-black text-white text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="w-10 h-[2px] bg-[#d4a574] mx-auto mb-8" />
          <h2 className="text-[clamp(2rem,5vw,4rem)] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
            Stay Connected
          </h2>
          <p className="text-white/50 max-w-md mx-auto mb-10 leading-relaxed">
            Get notified about new releases, live performances, and ministry events.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/newsletter"
              className="px-8 py-3 bg-[#d4a574] text-white text-sm font-medium hover:bg-white hover:text-black transition-all">
              Subscribe
            </Link>
            <Link to="/contact"
              className="px-8 py-3 border border-white/20 text-white/70 text-sm hover:border-white hover:text-white transition-all">
              Get in Touch
            </Link>
          </div>
        </motion.div>
      </section>

      {/* YouTube modal */}
      <AnimatePresence>
        {playingVideo && (
          <YouTubeModal videoId={playingVideo.id} title={playingVideo.title} onClose={() => setPlayingVideo(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
