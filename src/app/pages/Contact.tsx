import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Send, Linkedin, Twitter, Github, Instagram } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'hello@koboko.com',
      link: 'mailto:hello@koboko.com',
    },
    {
      icon: MapPin,
      title: 'Location',
      content: 'Nairobi, Kenya',
      link: null,
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+254 XXX XXX XXX',
      link: 'tel:+254XXXXXXXXX',
    },
  ];

  const socialLinks = [
    { icon: Linkedin, label: 'LinkedIn', url: '#' },
    { icon: Twitter, label: 'Twitter', url: '#' },
    { icon: Github, label: 'GitHub', url: '#' },
    { icon: Instagram, label: 'Instagram', url: '#' },
  ];

  const subjects = [
    'General Inquiry',
    'Job Opportunity',
    'Collaboration',
    'Great Men Moves',
    'Music',
    'Book - Broken Souls',
    'Other',
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
            Get In Touch
          </h1>
          <p className="text-xl text-black/60 leading-relaxed">
            Let's connect and explore how we can work together
          </p>
        </motion.div>
      </section>

      {/* Contact Form & Info */}
      <section className="px-6 lg:px-12 max-w-[1400px] mx-auto pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
                Contact Information
              </h2>
              <p className="text-black/70 leading-relaxed">
                I'm always open to discussing new opportunities, collaborations, or just having a conversation.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info) => (
                <div key={info.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#f5f5f0] flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-5 h-5 text-[#d4a574]" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{info.title}</h3>
                    {info.link ? (
                      <a href={info.link} className="text-black/60 hover:text-[#d4a574] transition-colors">
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-black/60">{info.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-medium mb-4">Follow Me</h3>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    className="w-10 h-10 bg-[#f5f5f0] flex items-center justify-center hover:bg-[#d4a574] hover:text-white transition-all"
                    aria-label={social.label}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors bg-white"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors bg-white"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors bg-white"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={8}
                  className="w-full px-6 py-4 border border-black/10 focus:border-[#d4a574] focus:outline-none transition-colors resize-none bg-white"
                  placeholder="Tell me about your project or inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-10 py-4 bg-black text-white hover:bg-[#d4a574] transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span>Send Message</span>
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 lg:py-32 bg-black text-white">
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Join My Newsletter
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Receive updates on projects, blog posts, music releases, and insights on technology, faith, and leadership.
            </p>
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-[#d4a574]"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#d4a574] text-white hover:bg-[#c9a063] transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Availability */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#f5f5f0] p-12 lg:p-16"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              Currently Available For
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-xl mb-2 text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Opportunities
                </h3>
                <ul className="space-y-2 text-black/70">
                  <li>• Backend Development</li>
                  <li>• Data Science Projects</li>
                  <li>• Meteorology Consulting</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl mb-2 text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Collaborations
                </h3>
                <ul className="space-y-2 text-black/70">
                  <li>• Gospel Music Projects</li>
                  <li>• Speaking Engagements</li>
                  <li>• Mentorship Programs</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl mb-2 text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
                  Partnerships
                </h3>
                <ul className="space-y-2 text-black/70">
                  <li>• Tech Initiatives</li>
                  <li>• Youth Development</li>
                  <li>• Creative Projects</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
