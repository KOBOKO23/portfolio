import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Github, ExternalLink, Calendar, Tag } from 'lucide-react';
import { SEO } from '../components/SEO';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ProjectImage { id: number; image: string; caption: string; order: number; }

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  detailed_description: string;
  category: { name: string; color: string } | null;
  technologies_list: string[];
  technologies: string[];
  github_url?: string;
  live_url?: string;
  image?: string | null;
  gallery?: ProjectImage[];
  year?: number;
}

function renderDetailedDescription(text: string) {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      blocks.push(
        <ul key={key++} className="space-y-2 mb-6">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-3 text-black/70 text-[17px] leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#d4a574] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const isSectionHeading = (line: string) =>
    line.length > 0 &&
    line.length < 70 &&
    !/[.,;]$/.test(line) &&
    /^[A-Z]/.test(line);

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      return;
    }

    if (i === 0) {
      flushList();
      blocks.push(
        <p key={key++} className="text-[#d4a574] text-sm uppercase tracking-[0.25em] mb-8 font-medium">
          {line}
        </p>
      );
      return;
    }

    if (isSectionHeading(line) && line.split(' ').length <= 6) {
      flushList();
      blocks.push(
        <h3 key={key++} className="text-2xl mt-10 mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
          {line}
        </h3>
      );
      return;
    }

    // Lines under a section heading (after a heading, shorter lines = list items)
    const prevBlock = blocks[blocks.length - 1];
    const underHeading = prevBlock && (prevBlock as React.ReactElement).type === 'h3';
    if (underHeading || listItems.length > 0) {
      listItems.push(line);
      return;
    }

    flushList();
    blocks.push(
      <p key={key++} className="text-[17px] text-black/70 leading-[1.85] mb-5">
        {line}
      </p>
    );
  });

  flushList();
  return blocks;
}

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/projects/${slug}/`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) setProject(data.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-6 lg:px-16 max-w-4xl mx-auto animate-pulse">
        <div className="h-4 bg-black/8 rounded w-24 mb-12" />
        <div className="h-16 bg-black/8 rounded w-3/4 mb-6" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-black/5 rounded" />)}
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center gap-6 text-center px-6">
        <h1 className="text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>Project not found</h1>
        <Link to="/projects" className="text-[#d4a574] flex items-center gap-2 hover:gap-4 transition-all text-sm font-medium">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>
    );
  }

  const techs = project.technologies_list?.length ? project.technologies_list : project.technologies;

  return (
    <div className="min-h-screen">
      <SEO
        title={project.title}
        description={project.description}
        url={`/projects/${project.slug}`}
      />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 lg:px-16 bg-black text-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link to="/projects"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
              <ArrowLeft size={16} /> All Projects
            </Link>

            <div className="w-12 h-[2px] bg-[#d4a574] mb-6" />

            {project.category && (
              <p className="text-[#d4a574] text-xs uppercase tracking-[0.3em] mb-4">
                {project.category.name}
              </p>
            )}

            <h1 className="text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}>
              {project.title}
            </h1>

            <p className="text-white/60 text-[18px] leading-relaxed max-w-3xl mb-10">
              {project.description}
            </p>

            <div className="flex flex-wrap items-center gap-6">
              {project.year && (
                <span className="flex items-center gap-2 text-white/40 text-sm">
                  <Calendar size={14} /> {project.year}
                </span>
              )}
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-[#d4a574] transition-colors">
                  <Github size={16} /> View on GitHub
                </a>
              )}
              {project.live_url && (
                <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-[#d4a574] transition-colors">
                  <ExternalLink size={16} /> Live Demo
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Images */}
      {(project.image || (project.gallery && project.gallery.length > 0)) && (
        <div className="bg-[#0a0a0a] py-12 px-6 lg:px-16">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Main image — full width */}
            {project.image && (
              <img
                src={project.image}
                alt={project.title}
                className="w-full object-contain max-h-[520px]"
              />
            )}
            {/* Gallery grid */}
            {project.gallery && project.gallery.length > 0 && (
              <div className={`grid gap-4 ${project.gallery.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {project.gallery.map(img => (
                  <div key={img.id} className="relative overflow-hidden bg-black/40 group">
                    <img
                      src={img.image}
                      alt={img.caption || project.title}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {img.caption && (
                      <p className="absolute bottom-0 inset-x-0 bg-black/60 text-white/80 text-xs px-3 py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        {img.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technologies */}
      <section className="py-10 px-6 lg:px-16 border-b border-black/8 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          <Tag size={14} className="text-black/30" />
          {techs.map(t => (
            <span key={t} className="px-3 py-1.5 bg-white border border-black/10 text-sm text-black/70">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Detailed description */}
      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {project.detailed_description
              ? renderDetailedDescription(project.detailed_description)
              : <p className="text-[17px] text-black/70 leading-[1.85]">{project.description}</p>
            }
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 lg:px-16 bg-black text-white text-center">
        <div className="max-w-xl mx-auto">
          <div className="w-10 h-[2px] bg-[#d4a574] mx-auto mb-8" />
          <h2 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
            Interested in working together?
          </h2>
          <p className="text-white/50 mb-8">Let's build something meaningful.</p>
          <div className="flex justify-center gap-4">
            <Link to="/contact"
              className="px-8 py-3 bg-[#d4a574] text-white text-sm hover:bg-white hover:text-black transition-all">
              Get in Touch
            </Link>
            <Link to="/projects"
              className="px-8 py-3 border border-white/20 text-white/70 text-sm hover:border-white hover:text-white transition-all">
              More Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
