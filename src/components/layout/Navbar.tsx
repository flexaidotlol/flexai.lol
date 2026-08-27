import React, { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentPath?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath = '/' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from document or localStorage (default light mode)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialDark = savedTheme ? savedTheme === 'dark' : false; // default light mode

    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navLinks = [
    { name: 'Leaderboard', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-dark-border bg-white/90 dark:bg-dark-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-1.5 group">
            <span className="brand-wordmark text-xl sm:text-2xl text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
              FLEXAI<span className="brand-lol">.lol</span>
            </span>
          </a>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-dark-900/60 p-1 rounded-full border border-slate-200 dark:border-dark-border">
          {navLinks.map((link) => {
            const isActive = currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));
            return (
              <a
                key={link.name}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-dark-border-bright'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-dark-800/40'
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* X / Twitter profile */}
          <a
            href="https://x.com/ByManuuDB"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl text-slate-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 border border-slate-300 dark:border-dark-border transition-all flex items-center justify-center"
            title="Follow @ByManuuDB on X"
            aria-label="Follow on X (Twitter)"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            className="p-2.5 rounded-xl text-slate-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-white bg-slate-100 dark:bg-dark-850 hover:bg-slate-200 dark:hover:bg-dark-800 border border-slate-300 dark:border-dark-border transition-all"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-dark-850"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-dark-border bg-white dark:bg-dark-900 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
