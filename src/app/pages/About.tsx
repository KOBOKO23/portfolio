import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { 
  Cloud, 
  Code, 
  Database, 
  BookOpen, 
  Heart, 
  Users, 
  Target,
  Award,
  Lightbulb,
  TrendingUp 
} from 'lucide-react';

export function About() {
  const timelineEvents = [
    {
      year: '2024 - Present',
      title: 'Meteorologist',
      organization: 'Kenya Meteorological Department',
      description: 'Numerical Weather Prediction Section - Forecasting atmospheric patterns and contributing to national weather systems.',
      current: true,
    },
    {
      year: '2024 - Present',
      title: 'Data Science Student',
      organization: 'ALX Africa',
      description: 'Advancing technical expertise in machine learning, data analysis, and statistical modeling.',
      current: true,
    },
    {
      year: '2020 - Present',
      title: 'Founder & Mentor',
      organization: 'Great Men Moves',
      description: 'Mentoring young men in leadership, character development, and personal excellence.',
      current: true,
    },
    {
      year: '2019 - Present',
      title: 'Backend Software Developer',
      organization: 'Independent',
      description: 'Building scalable applications with Python, Django, and modern database technologies.',
      current: false,
    },
  ];

  const technicalSkills = [
    { name: 'Python', level: 'Expert' },
    { name: 'Django', level: 'Expert' },
    { name: 'PostgreSQL', level: 'Advanced' },
    { name: 'MongoDB', level: 'Advanced' },
    { name: 'SQL', level: 'Expert' },
    { name: 'REST APIs', level: 'Expert' },
    { name: 'Git & Version Control', level: 'Advanced' },
    { name: 'Data Analysis', level: 'Advanced' },
  ];

  const meteorologySkills = [
    { name: 'Numerical Weather Prediction', level: 'Expert' },
    { name: 'Atmospheric Science', level: 'Expert' },
    { name: 'Climate Modeling', level: 'Advanced' },
    { name: 'Data Visualization', level: 'Advanced' },
    { name: 'Forecasting Systems', level: 'Expert' },
    { name: 'Remote Sensing', level: 'Intermediate' },
  ];

  const dataScienceSkills = [
    { name: 'Machine Learning', level: 'Intermediate' },
    { name: 'Statistical Analysis', level: 'Advanced' },
    { name: 'Data Engineering', level: 'Intermediate' },
    { name: 'Python (NumPy/Pandas)', level: 'Advanced' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Portrait Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1668752600261-e56e7f3780b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMEFmcmljYW4lMjBtYW58ZW58MXx8fHwxNzcyMjcyNTA0fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Koboko - Professional Portrait"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
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
            <p className="text-[clamp(1.25rem,2vw,1.75rem)] text-white/90 leading-relaxed max-w-2xl">
              Meteorologist. Backend Developer. Data Scientist. Mentor. Gospel Artist. Author.
            </p>
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
                  I am Koboko—a modern African polymath whose work exists at the intersection 
                  of science, technology, faith, and creative expression.
                </p>

                <div className="space-y-6 text-lg text-black/70 leading-relaxed">
                  <p>
                    Based in Nairobi, Kenya, I serve as a Meteorologist at the Kenya Meteorological Department, 
                    where I specialize in Numerical Weather Prediction. Every day, I work with complex atmospheric 
                    models and computational systems to forecast weather patterns that affect agriculture, aviation, 
                    disaster preparedness, and the daily lives of millions across East Africa. The work demands 
                    precision, scientific rigor, and an understanding that my predictions carry real-world consequences.
                  </p>

                  <p>
                    Parallel to my meteorological career, I am a backend software developer with deep expertise in 
                    Python and Django. I architect scalable systems, design robust APIs, and work with both SQL and 
                    NoSQL databases to build applications that solve complex problems. Technology, for me, is not 
                    just a profession—it's a language for creating solutions that didn't exist before.
                  </p>

                  <p>
                    Currently, I am expanding my technical horizons through ALX Africa's Data Science program, 
                    where I'm learning to transform raw data into actionable insights through machine learning, 
                    statistical modeling, and advanced analytics. This pursuit represents my commitment to 
                    continuous growth and staying at the forefront of technological innovation.
                  </p>

                  <p>
                    But my identity extends far beyond technical competence. I am the founder of <strong>Great Men Moves</strong>, 
                    a mentorship initiative where I guide young men toward purpose, character, and leadership. I believe 
                    that true success is measured not just by personal achievement, but by the lives we transform and 
                    the legacy we leave behind.
                  </p>

                  <p>
                    Faith is the foundation of everything I do. As a gospel artist, I use music to worship, inspire, 
                    and communicate truths that transcend human understanding. My upcoming book, <em>"Broken Souls,"</em> 
                    explores themes of redemption, healing, and divine restoration—offering hope to those navigating 
                    pain and searching for meaning.
                  </p>

                  <p>
                    I am also passionate about men's fashion, viewing it as a form of intentional communication—an 
                    expression of discipline, culture, and confidence. From classic tailoring to contemporary African 
                    aesthetics, fashion is another canvas for excellence.
                  </p>

                  <p>
                    My life is a tapestry woven from diverse threads—science and creativity, logic and faith, 
                    individual excellence and community impact. I am proof that you don't have to fit into a single 
                    box, and that a life of purpose can span multiple disciplines while remaining deeply coherent.
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
              {timelineEvents.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-white/10 last:border-0"
                >
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg text-white/60">{event.year}</span>
                      {event.current && (
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Meteorology Skills */}
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-black flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-[#d4a574]" />
                    </div>
                    <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                      Meteorology
                    </h3>
                  </div>
                  <p className="text-black/60 mb-8">
                    Atmospheric science and weather forecasting expertise
                  </p>
                </div>

                <div className="space-y-4">
                  {meteorologySkills.map((skill) => (
                    <div key={skill.name} className="bg-white p-4 border-l-2 border-[#d4a574]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-black/60">{skill.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Software Development Skills */}
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-black flex items-center justify-center">
                      <Code className="w-6 h-6 text-[#d4a574]" />
                    </div>
                    <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                      Software Development
                    </h3>
                  </div>
                  <p className="text-black/60 mb-8">
                    Backend engineering with Python and modern databases
                  </p>
                </div>

                <div className="space-y-4">
                  {technicalSkills.map((skill) => (
                    <div key={skill.name} className="bg-white p-4 border-l-2 border-[#d4a574]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-black/60">{skill.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Science Skills */}
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-black flex items-center justify-center">
                      <Database className="w-6 h-6 text-[#d4a574]" />
                    </div>
                    <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                      Data Science
                    </h3>
                  </div>
                  <p className="text-black/60 mb-8">
                    Machine learning and analytical capabilities
                  </p>
                </div>

                <div className="space-y-4">
                  {dataScienceSkills.map((skill) => (
                    <div key={skill.name} className="bg-white p-4 border-l-2 border-[#d4a574]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-black/60">{skill.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Great Men Moves Section */}
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
                    Great Men Moves is more than a mentorship program—it's a movement dedicated to shaping 
                    young men into leaders of character, purpose, and impact. Founded on the belief that 
                    every young man deserves guidance, accountability, and a vision for his future.
                  </p>
                  
                  <p>
                    Through intentional relationships, structured teaching, and personal example, I mentor 
                    young men in leadership principles, emotional intelligence, financial literacy, spiritual 
                    grounding, and practical life skills. The goal is not just success, but significance—raising 
                    men who will transform their communities and nations.
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

              <div className="order-1 lg:order-2">
                <div className="aspect-[4/5] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1770240366288-f6c926c8d8a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW50b3JzaGlwJTIwbGVhZGVyc2hpcCUyMG1lZXRpbmd8ZW58MXx8fHwxNzcyMjczNDg0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Great Men Moves Mentorship"
                    className="w-full h-full object-cover"
                  />
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
              <div>
                <div className="aspect-[4/5] overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1559657608-cf55e9a8b4c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYmlibGUlMjBsaWdodCUyMGZhaXRofGVufDF8fHx8MTc3MjI3MzQ4NXww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Faith and Purpose"
                    className="w-full h-full object-cover opacity-60"
                  />
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
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <Heart className="w-8 h-8 text-[#d4a574]" />
                      <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>Faith Foundation</h3>
                    </div>
                    <p className="text-lg text-white/70 leading-relaxed">
                      My faith in God is not separate from my work—it is the lens through which I see everything. 
                      Every line of code, every weather forecast, every mentoring conversation is an act of worship 
                      and service. I believe that excellence in work is a reflection of divine purpose.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <Target className="w-8 h-8 text-[#d4a574]" />
                      <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>Purpose-Driven</h3>
                    </div>
                    <p className="text-lg text-white/70 leading-relaxed">
                      Success without significance is empty. I am driven by a desire to make a tangible impact—
                      whether through accurate forecasts that save lives, systems that solve problems, or young 
                      men who become transformational leaders. Purpose transcends profession.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <Award className="w-8 h-8 text-[#d4a574]" />
                      <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>Excellence Standard</h3>
                    </div>
                    <p className="text-lg text-white/70 leading-relaxed">
                      Mediocrity is not an option. In everything I do, I pursue excellence—not for ego, but because 
                      quality work honors God, serves people well, and sets a standard for those watching. Excellence 
                      is a habit, not an event.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <TrendingUp className="w-8 h-8 text-[#d4a574]" />
                      <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>Continuous Growth</h3>
                    </div>
                    <p className="text-lg text-white/70 leading-relaxed">
                      I am committed to lifelong learning. From data science studies to musical expression to 
                      theological depth—growth is non-negotiable. The moment we stop learning, we stop leading.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <Lightbulb className="w-8 h-8 text-[#d4a574]" />
                      <h3 className="text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>Servant Leadership</h3>
                    </div>
                    <p className="text-lg text-white/70 leading-relaxed">
                      True leadership is service. Whether mentoring young men, contributing to national weather 
                      systems, or building technology—my goal is to serve others and leave things better than I 
                      found them. Leadership is stewardship, not ownership.
                    </p>
                  </div>
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
              pursuing excellence across science, technology, creativity, and faith—believing that 
              a life well-lived integrates all of who we are into a cohesive mission of purpose and impact."
            </p>
            <p className="text-xl text-black/60">— Koboko</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
