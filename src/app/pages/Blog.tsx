import { useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { 
  Calendar, 
  Clock, 
  Tag, 
  ArrowRight, 
  Search,
  Heart,
  MessageCircle,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2
} from 'lucide-react';

export function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Meteorology',
    'Software Engineering',
    'Data Science',
    'Fashion',
    'Gospel Music',
    'Faith / Word',
    'Personal Growth'
  ];

  const blogPosts = [
    {
      id: 1,
      title: 'The Intersection of Faith and Technology',
      excerpt: 'How my spiritual foundation guides my approach to modern technology and innovation in the meteorological and tech fields. Exploring the harmony between belief and scientific inquiry.',
      category: 'Faith / Word',
      date: '2026-02-15',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1634906829567-3a40d87b08a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYmlibGUlMjBmYWl0aHxlbnwxfHx8fDE3NzIyNzQzMTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Faith', 'Technology', 'Purpose'],
      featured: true,
      likes: 124,
      comments: 18,
    },
    {
      id: 2,
      title: 'Building Scalable Django REST APIs',
      excerpt: 'Best practices for architecting robust backend systems using Django, PostgreSQL, and modern deployment strategies for production-grade applications.',
      category: 'Software Engineering',
      date: '2026-02-10',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1623282033815-40b05d96c903?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQeXRob24lMjBjb2RlJTIwZGV2ZWxvcG1lbnR8ZW58MXx8fHwxNzcyMjc0MzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Django', 'Python', 'Backend', 'APIs'],
      featured: false,
      likes: 89,
      comments: 12,
    },
    {
      id: 3,
      title: 'Understanding Numerical Weather Prediction Models',
      excerpt: 'A deep dive into how modern meteorology uses computational models to forecast weather patterns across East Africa and the science behind atmospheric predictions.',
      category: 'Meteorology',
      date: '2026-02-08',
      readTime: '10 min read',
      image: 'https://images.unsplash.com/photo-1771974301591-af40b9b996d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWF0aGVyJTIwZm9yZWNhc3QlMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc3MjI3NDMwOHww&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['NWP', 'Forecasting', 'Atmospheric Science'],
      featured: false,
      likes: 156,
      comments: 24,
    },
    {
      id: 4,
      title: 'Machine Learning for Weather Pattern Analysis',
      excerpt: 'Combining data science with meteorological expertise to predict climate patterns using Python, TensorFlow, and statistical modeling techniques.',
      category: 'Data Science',
      date: '2026-02-05',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwc2NpZW5jZSUyMGFuYWx5dGljc3xlbnwxfHx8fDE3NzIyMTg3Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Machine Learning', 'Python', 'Analytics'],
      featured: false,
      likes: 201,
      comments: 31,
    },
    {
      id: 5,
      title: 'The Art of Intentional Dressing',
      excerpt: 'Fashion as communication—exploring how classic tailoring, contemporary African aesthetics, and personal style reflect discipline and confidence.',
      category: 'Fashion',
      date: '2026-02-01',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1768854510946-c91174e3b93c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zd2VhciUyMGZhc2hpb24lMjBkZXRhaWx8ZW58MXx8fHwxNzcyMjc0MzA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Fashion', 'Style', 'Menswear'],
      featured: false,
      likes: 73,
      comments: 9,
    },
    {
      id: 6,
      title: 'Worship Through Music: My Gospel Journey',
      excerpt: 'How gospel music became my expression of faith, worship, and ministry—stories from the journey of creating soul-stirring worship.',
      category: 'Gospel Music',
      date: '2026-01-28',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1622870912473-622dca067226?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JzaGlwJTIwbXVzaWMlMjBjaHVyY2h8ZW58MXx8fHwxNzcyMjc0MzA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Gospel', 'Music', 'Worship'],
      featured: false,
      likes: 142,
      comments: 27,
    },
    {
      id: 7,
      title: 'Mentoring Young Men: Lessons from Great Men Moves',
      excerpt: 'Insights from founding and running a mentorship program focused on character development, leadership, and raising transformational men.',
      category: 'Personal Growth',
      date: '2026-01-22',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1765648496288-e1760f547711?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBZnJpY2FuJTIwcHJvZmVzc2lvbmFsJTIwd3JpdGluZyUyMGRlc2t8ZW58MXx8fHwxNzcyMjc0MzA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Mentorship', 'Leadership', 'Growth'],
      featured: false,
      likes: 98,
      comments: 15,
    },
    {
      id: 8,
      title: 'SQL vs NoSQL: Choosing the Right Database',
      excerpt: 'A practical guide to selecting between relational and non-relational databases based on project requirements and scalability needs.',
      category: 'Software Engineering',
      date: '2026-01-18',
      readTime: '9 min read',
      image: 'https://images.unsplash.com/photo-1636347172071-6d17b1139816?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhYmFzZSUyMHNlcnZlciUyMGFyY2hpdGVjdHVyZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzcyMjczNzU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['Databases', 'PostgreSQL', 'MongoDB'],
      featured: false,
      likes: 112,
      comments: 19,
    },
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find(post => post.featured);
  const recentPosts = blogPosts.slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="w-16 h-[2px] bg-[#d4a574] mb-8" />
            <h1 
              className="text-[clamp(3.5rem,8vw,7rem)] leading-[0.95] tracking-tight mb-8"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Thoughts &<br />
              Insights
            </h1>
            <p className="text-[clamp(1.25rem,2vw,1.75rem)] text-white/80 leading-relaxed max-w-3xl">
              Exploring the intersection of science, technology, faith, and creative expression.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-12 px-6 lg:px-12 bg-white border-b border-black/10">
        <div className="max-w-[1800px] mx-auto">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-[#f5f5f0] border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredPost && !searchQuery && selectedCategory === 'All' && (
        <section className="py-20 px-6 lg:px-12 bg-white">
          <div className="max-w-[1800px] mx-auto">
            <div className="mb-12">
              <div className="w-12 h-[2px] bg-[#d4a574] mb-4" />
              <h2 className="text-sm uppercase tracking-[0.3em] text-black/60">Featured Article</h2>
            </div>

            <motion.article
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              <div className="relative group overflow-hidden aspect-[4/3]">
                <ImageWithFallback
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider">
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-black/60">
                    <Calendar size={16} />
                    {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                <h2 
                  className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.1] mb-6 hover:text-[#d4a574] transition-colors cursor-pointer"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {featuredPost.title}
                </h2>
                <p className="text-xl text-black/70 leading-relaxed mb-8">
                  {featuredPost.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {featuredPost.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-[#f5f5f0] text-sm text-black/70">
                      <Tag size={14} />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-black/60">
                    <span className="flex items-center gap-2">
                      <Heart size={18} />
                      {featuredPost.likes}
                    </span>
                    <span className="flex items-center gap-2">
                      <MessageCircle size={18} />
                      {featuredPost.comments}
                    </span>
                  </div>

                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white hover:bg-[#d4a574] transition-colors"
                  >
                    <span>Read Article</span>
                    <ArrowRight size={18} />
                  </a>
                </div>
              </div>
            </motion.article>
          </div>
        </section>
      )}

      {/* Main Content with Sidebar */}
      <section className="py-20 px-6 lg:px-12 bg-[#f5f5f0]">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Sidebar */}
            <aside className="lg:col-span-3 space-y-12">
              {/* Categories */}
              <div>
                <h3 className="text-lg font-medium mb-6 pb-3 border-b-2 border-black">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-3 transition-all ${
                        selectedCategory === category
                          ? 'bg-black text-white'
                          : 'bg-white text-black hover:bg-black/5'
                      }`}
                    >
                      <span>{category}</span>
                      <span className="float-right text-sm opacity-60">
                        {category === 'All' 
                          ? blogPosts.length 
                          : blogPosts.filter(p => p.category === category).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Posts */}
              <div>
                <h3 className="text-lg font-medium mb-6 pb-3 border-b-2 border-black">
                  Recent Posts
                </h3>
                <div className="space-y-6">
                  {recentPosts.map((post) => (
                    <a key={post.id} href="#" className="block group">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden">
                          <ImageWithFallback
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm mb-2 group-hover:text-[#d4a574] transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-black/60">{post.readTime}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div>
                <h3 className="text-lg font-medium mb-6 pb-3 border-b-2 border-black">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'Faith', 'Leadership', 'Django', 'NWP', 'Machine Learning', 'Worship', 'Style'].map((tag) => (
                    <span 
                      key={tag} 
                      className="px-3 py-2 bg-white text-sm hover:bg-black hover:text-white transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            {/* Blog Posts Grid */}
            <main className="lg:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white group"
                  >
                    <a href="#" className="block">
                      <div className="relative overflow-hidden aspect-[16/10]">
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-black text-white text-xs uppercase tracking-wider">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4 text-sm text-black/60">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(post.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric' 
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {post.readTime}
                          </span>
                        </div>

                        <h3 
                          className="text-2xl mb-3 group-hover:text-[#d4a574] transition-colors" 
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {post.title}
                        </h3>
                        <p className="text-black/70 leading-relaxed mb-6 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-1 bg-[#f5f5f0] text-black/60">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-black/10">
                          <div className="flex items-center gap-4 text-sm text-black/60">
                            <button className="flex items-center gap-1 hover:text-[#d4a574] transition-colors">
                              <Heart size={16} />
                              {post.likes}
                            </button>
                            <button className="flex items-center gap-1 hover:text-[#d4a574] transition-colors">
                              <MessageCircle size={16} />
                              {post.comments}
                            </button>
                          </div>

                          <button className="text-sm text-black/60 hover:text-[#d4a574] transition-colors">
                            <Share2 size={16} />
                          </button>
                        </div>
                      </div>
                    </a>
                  </motion.article>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-xl text-black/60">No articles found matching your criteria.</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-32 lg:py-40 px-6 lg:px-12 bg-black text-white">
        <div className="max-w-[1400px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-12 h-[2px] bg-[#d4a574] mb-8 mx-auto" />
            <h2 
              className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-6 max-w-3xl mx-auto"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Subscribe to My Newsletter
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
              Get weekly insights on technology, meteorology, faith, leadership, and creativity delivered to your inbox.
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
                Join 500+ readers. No spam, unsubscribe anytime.
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}