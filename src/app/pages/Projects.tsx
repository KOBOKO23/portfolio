import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ExternalLink, Github, Cloud, Code, Database, Gauge } from 'lucide-react';

export function Projects() {
  const projects = [
    {
      id: 1,
      title: 'Numerical Weather Prediction System',
      category: 'Meteorology',
      description: 'Advanced weather forecasting system using numerical models to predict atmospheric conditions for Kenya and East Africa region.',
      image: 'https://images.unsplash.com/photo-1771974301591-af40b9b996d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWF0aGVyJTIwZm9yZWNhc3RpbmclMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MjI3MjU1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
      technologies: ['Python', 'Atmospheric Science', 'Data Visualization', 'Meteorological Models'],
      icon: Cloud,
    },
    {
      id: 2,
      title: 'Django REST API Framework',
      category: 'Backend Development',
      description: 'Scalable REST API built with Django and PostgreSQL for enterprise-level applications, featuring authentication, data validation, and comprehensive documentation.',
      image: 'https://images.unsplash.com/photo-1679278966309-080c6533d90e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQeXRob24lMjBEamFuZ28lMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NzIyNzI1NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      technologies: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'JWT Auth'],
      icon: Code,
      github: '#',
    },
    {
      id: 3,
      title: 'Database Architecture Design',
      category: 'Database Management',
      description: 'Comprehensive database solutions implementing both SQL and NoSQL architectures for optimal data storage and retrieval performance.',
      image: 'https://images.unsplash.com/photo-1636347172071-6d17b1139816?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhYmFzZSUyMGFyY2hpdGVjdHVyZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzcyMjcyNTUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      technologies: ['PostgreSQL', 'MongoDB', 'Redis', 'Database Design', 'Query Optimization'],
      icon: Database,
      github: '#',
    },
    {
      id: 4,
      title: 'Real-Time Data Processing Pipeline',
      category: 'Data Science',
      description: 'High-performance data pipeline for processing and analyzing meteorological data in real-time, supporting decision-making processes.',
      image: 'https://images.unsplash.com/photo-1760548425425-e42e77fa38f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3ZWIlMjBkZXZlbG9wbWVudCUyMGNvZGV8ZW58MXx8fHwxNzcyMjcwNzg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      technologies: ['Python', 'Pandas', 'NumPy', 'Data Analysis', 'Visualization'],
      icon: Gauge,
    },
  ];

  const technologies = [
    { name: 'Python', category: 'Language' },
    { name: 'Django', category: 'Framework' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'MongoDB', category: 'Database' },
    { name: 'Git', category: 'Version Control' },
    { name: 'Linux', category: 'OS' },
    { name: 'REST APIs', category: 'Architecture' },
    { name: 'Docker', category: 'DevOps' },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            Projects
          </h1>
          <p className="text-xl text-black/60 leading-relaxed">
            A selection of technical projects spanning meteorology, backend development, and data science
          </p>
        </motion.div>
      </section>

      {/* Projects Grid */}
      <section className="px-6 lg:px-12 max-w-[1800px] mx-auto pb-24">
        <div className="space-y-24">
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <div className="relative group overflow-hidden aspect-[4/3]">
                  <ImageWithFallback
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute top-6 left-6">
                    <div className="w-12 h-12 bg-[#d4a574] flex items-center justify-center">
                      <project.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <p className="text-[#d4a574] uppercase text-sm tracking-wider mb-4">{project.category}</p>
                <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
                  {project.title}
                </h2>
                <p className="text-lg text-black/70 leading-relaxed mb-6">
                  {project.description}
                </p>

                <div className="mb-6">
                  <h3 className="text-sm uppercase tracking-wide mb-3 text-black/60">Technologies</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-[#f5f5f0] text-sm border border-black/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {project.github && (
                  <div className="flex gap-4">
                    <a
                      href={project.github}
                      className="inline-flex items-center gap-2 text-sm hover:text-[#d4a574] transition-colors"
                    >
                      <Github size={18} />
                      <span>View Code</span>
                    </a>
                    {project.id > 1 && (
                      <a
                        href="#"
                        className="inline-flex items-center gap-2 text-sm hover:text-[#d4a574] transition-colors"
                      >
                        <ExternalLink size={18} />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Technologies Section */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl mb-16 text-center" style={{ fontFamily: 'var(--font-serif)' }}>
              Technical Stack
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {technologies.map((tech, index) => (
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

      {/* CTA Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
            Let's Build Something
          </h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto mb-8">
            I'm always interested in new opportunities and collaborations. Let's discuss your next project.
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300"
          >
            Get In Touch
          </a>
        </motion.div>
      </section>
    </div>
  );
}
