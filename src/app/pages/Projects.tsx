import { useState, useEffect, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ExternalLink, Github, Cloud, Code, Database, Gauge, Terminal, Globe, ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO';

interface ProjectCategory {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory | null;
  technologies: string[];
  technologies_list?: string[];
  github_url?: string;
  live_url?: string;
  is_featured?: boolean;
  image?: string;
}

const CATEGORY_ICONS: Record<string, ElementType> = {
  Meteorology: Cloud,
  'Backend Development': Code,
  'Database Management': Database,
  'Data Science': Gauge,
  'Full Stack': Terminal,
  'Web Development': Globe,
};

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Numerical Weather Prediction System',
    slug: 'nwp-system',
    description: 'Advanced weather forecasting system using numerical models to predict atmospheric conditions for Kenya and East Africa.',
    category: { id: 1, name: 'Meteorology', color: '#1a4a6e', icon: 'cloud' },
    technologies: ['Python', 'Atmospheric Science', 'Data Visualization', 'Meteorological Models'],
  },
  {
    id: 2,
    title: 'Django REST API Framework',
    slug: 'django-api',
    description: 'Scalable REST API built with Django and PostgreSQL for enterprise-level applications, featuring authentication and comprehensive documentation.',
    category: { id: 2, name: 'Backend Development', color: '#2d5a2d', icon: 'code' },
    technologies: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'JWT Auth'],
    github_url: '#',
  },
  {
    id: 3,
    title: 'Database Architecture Design',
    slug: 'db-architecture',
    description: 'Comprehensive database solutions implementing both SQL and NoSQL architectures for optimal data storage and retrieval performance.',
    category: { id: 3, name: 'Database Management', color: '#4a2d6e', icon: 'database' },
    technologies: ['PostgreSQL', 'MongoDB', 'Redis', 'Query Optimization'],
    github_url: '#',
  },
  {
    id: 4,
    title: 'Real-Time Data Processing Pipeline',
    slug: 'data-pipeline',
    description: 'High-performance data pipeline for processing and analyzing meteorological data in real-time, supporting decision-making processes.',
    category: { id: 4, name: 'Data Science', color: '#6e3a1a', icon: 'gauge' },
    technologies: ['Python', 'Pandas', 'NumPy', 'Data Analysis', 'Visualization'],
  },
];

const TECH_STACK = [
  { name: 'Python', category: 'Language' },
  { name: 'Django', category: 'Framework' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'Git', category: 'Version Control' },
  { name: 'Linux', category: 'OS' },
  { name: 'REST APIs', category: 'Architecture' },
  { name: 'Docker', category: 'DevOps' },
];

function ProjectVisual({ project }: { project: Project }) {
  const categoryName = project.category?.name ?? '';
  const color = project.category?.color ?? '#1a1a1a';
  const Icon: ElementType = CATEGORY_ICONS[categoryName] ?? Terminal;

  if (project.image) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover/visual:scale-105"
        />
        {/* Gold corner accent */}
        <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
          <div className="absolute top-0 left-0 w-16 h-[2px]" style={{ background: 'linear-gradient(90deg, #d4a574, transparent)' }} />
          <div className="absolute top-0 left-0 h-16 w-[2px]" style={{ background: 'linear-gradient(180deg, #d4a574, transparent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden"
      style={{ background: `linear-gradient(145deg, ${color}99 0%, ${color}22 60%, #0a0a0a 100%)` }}
    >
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 60% 60% at 30% 40%, ${color}44 0%, transparent 70%)` }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div
          className="w-20 h-20 flex items-center justify-center border border-white/20"
          style={{ background: `${color}55` }}
        >
          <Icon className="w-10 h-10 text-white/70" />
        </div>
        <p className="text-white/30 text-xs uppercase tracking-[0.3em]">{categoryName}</p>
      </div>
      {/* Gold corner accent */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
        <div className="absolute top-0 left-0 w-16 h-[2px]" style={{ background: 'linear-gradient(90deg, #d4a574, transparent)' }} />
        <div className="absolute top-0 left-0 h-16 w-[2px]" style={{ background: 'linear-gradient(180deg, #d4a574, transparent)' }} />
      </div>
    </div>
  );
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
    fetch(`${apiBase}/projects/`)
      .then((r) => r.json() as Promise<{ data?: Project[] | { results?: Project[] } }>)
      .then((body) => {
        const d = body.data;
        const items: Project[] = Array.isArray(d) ? d : (d)?.results ?? [];
        if (items.length > 0) setProjects(items);
        else setUsingFallback(true);
      })
      .catch(() => setUsingFallback(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-20">
      <SEO
        title="Projects"
        description="Technical projects spanning meteorology, backend development, and data science — built with Python, Django, PostgreSQL, and more."
        url="/projects"
      />
      {/* Hero */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
          <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            Projects
          </h1>
          <p className="text-xl text-black/60 leading-relaxed">
            Technical work spanning meteorology, backend development, and data science
          </p>
        </motion.div>
      </section>

      {/* Projects */}
      <section className="px-6 lg:px-12 max-w-[1800px] mx-auto pb-24">
        {usingFallback && !loading && (
          <p className="text-center text-black/30 text-xs mb-8 uppercase tracking-widest">
            Showing sample projects — connect to the API to load live data
          </p>
        )}
        {loading ? (
          <div className="space-y-24">
            {[1, 2, 3].map((n) => (
              <div key={n} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="aspect-[4/3] bg-black/5 animate-pulse" />
                <div className="space-y-4">
                  <div className="h-4 bg-black/5 w-24 animate-pulse" />
                  <div className="h-10 bg-black/5 w-3/4 animate-pulse" />
                  <div className="h-20 bg-black/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-24">
            {projects.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center group ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <Link to={`/projects/${project.slug}`} className="block group/visual">
                    <ProjectVisual project={project} />
                  </Link>
                </div>

                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  {project.category && (
                    <p className="text-[#d4a574] uppercase text-sm tracking-wider mb-4">
                      {project.category.name}
                    </p>
                  )}
                  <Link to={`/projects/${project.slug}`}>
                    <h2 className="text-3xl md:text-4xl mb-4 hover:text-[#d4a574] transition-colors" style={{ fontFamily: 'var(--font-serif)' }}>
                      {project.title}
                    </h2>
                  </Link>
                  <p className="text-lg text-black/70 leading-relaxed mb-6">{project.description}</p>

                  <div className="mb-6">
                    <h3 className="text-sm uppercase tracking-wide mb-3 text-black/60">Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {(project.technologies_list ?? project.technologies).map((tech) => (
                        <span key={tech} className="px-3 py-1 bg-[#f5f5f0] text-sm border border-black/10">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <Link to={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#d4a574] hover:gap-3 transition-all">
                      Read More <ArrowRight size={16} />
                    </Link>
                    {project.github_url && project.github_url !== '#' && (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors">
                        <Github size={18} /><span>View Code</span>
                      </a>
                    )}
                    {project.live_url && project.live_url !== '#' && (
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors">
                        <ExternalLink size={18} /><span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Tech Stack */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="w-12 h-[2px] bg-[#d4a574] mb-6 mx-auto" />
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Technical Stack
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TECH_STACK.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="text-center p-6 border border-white/10 hover:border-[#d4a574] transition-colors"
                >
                  <p className="text-lg mb-2">{tech.name}</p>
                  <p className="text-sm text-white/50">{tech.category}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center">
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>Let's Build Something</h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto mb-8">
            Interested in collaboration or new opportunities? Let's talk.
          </p>
          <a href="/contact" className="inline-block px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300">
            Get In Touch
          </a>
        </motion.div>
      </section>
    </div>
  );
}
