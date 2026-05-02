import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Github, Instagram, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-3xl mb-4 text-[#d4a574]" style={{ fontFamily: 'var(--font-serif)' }}>
              KOBOKO
            </h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Modern African polymath. Meteorologist, developer, data scientist, mentor, artist, author.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm uppercase tracking-wider mb-4 text-white/90">Navigate</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-white/70 hover:text-[#d4a574] transition-colors">About</Link></li>
              <li><Link to="/projects" className="text-white/70 hover:text-[#d4a574] transition-colors">Projects</Link></li>
              <li><Link to="/blog" className="text-white/70 hover:text-[#d4a574] transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="text-white/70 hover:text-[#d4a574] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Creative Works */}
          <div>
            <h4 className="text-sm uppercase tracking-wider mb-4 text-white/90">Creative</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/fashion" className="text-white/70 hover:text-[#d4a574] transition-colors">Fashion</Link></li>
              <li><Link to="/music" className="text-white/70 hover:text-[#d4a574] transition-colors">Music</Link></li>
              <li><Link to="/book" className="text-white/70 hover:text-[#d4a574] transition-colors">Broken Souls</Link></li>
              <li><Link to="/great-men-moves" className="text-white/70 hover:text-[#d4a574] transition-colors">Great Men Moves</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-sm uppercase tracking-wider mb-4 text-white/90">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="text-white/70 hover:text-[#d4a574] transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-[#d4a574] transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-[#d4a574] transition-colors" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className="text-white/70 hover:text-[#d4a574] transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="mailto:hello@koboko.com" className="text-white/70 hover:text-[#d4a574] transition-colors" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            © {currentYear} Koboko. All rights reserved.
          </p>
          <p className="text-sm text-white/50">
            Designed with excellence in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
