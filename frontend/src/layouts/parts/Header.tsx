import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, ArrowRight, Sun, Moon, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAppLanguage } from '@/hooks/useAppLanguage';

interface HeaderProps {
  lang?: 'en' | 'hi';
  onLangToggle?: () => void;
}

export default function Header({ lang: providedLang, onLangToggle }: HeaderProps) {
  const [appLang, setAppLang] = useAppLanguage();
  const lang = providedLang ?? appLang;
  const toggleLanguage = onLangToggle ?? (() => setAppLang(current => current === 'en' ? 'hi' : 'en'));
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('sevasetu-token')));
  const { isDark, toggle: toggleDark } = useDarkMode();

  useEffect(() => {
    const syncAuthentication = () => setIsAuthenticated(Boolean(localStorage.getItem('sevasetu-token')));
    window.addEventListener('sevasetu-auth-change', syncAuthentication);
    window.addEventListener('storage', syncAuthentication);
    return () => {
      window.removeEventListener('sevasetu-auth-change', syncAuthentication);
      window.removeEventListener('storage', syncAuthentication);
    };
  }, []);

  const navItems = [
    { href: '/', label: lang === 'hi' ? 'होम' : 'Home' },
    { href: '/services', label: lang === 'hi' ? 'सेवाएं' : 'Services' },
    { href: '/tracker', label: lang === 'hi' ? 'ट्रैकर' : 'Tracker' },
    { href: '/rewards', label: lang === 'hi' ? 'पुरस्कार' : 'Rewards' },
    { href: '/schemes', label: lang === 'hi' ? 'योजनाएं' : 'Schemes' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Indian-themed logo: Ashoka Chakra-inspired emblem */}
            <div className="relative w-10 h-10 group-hover:scale-105 transition-transform shrink-0">
              {/* Tricolor ring */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                {/* Saffron arc */}
                <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
                {/* White arc */}
                <path d="M36 20 A16 16 0 0 1 20 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none"/>
                {/* Green arc */}
                <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
                {/* Navy arc (completes circle) */}
                <path d="M4 20 A16 16 0 0 1 20 4" stroke="#000080" strokeWidth="4" strokeLinecap="round" fill="none"/>
                {/* Center circle — Chakra */}
                <circle cx="20" cy="20" r="7" fill="#000080"/>
                {/* Ashoka Chakra spokes (24 spokes simplified to 8) */}
                {[0,45,90,135,180,225,270,315].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 20 + 3 * Math.cos(rad);
                  const y1 = 20 + 3 * Math.sin(rad);
                  const x2 = 20 + 6.5 * Math.cos(rad);
                  const y2 = 20 + 6.5 * Math.sin(rad);
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="0.8"/>;
                })}
                <circle cx="20" cy="20" r="2" fill="white"/>
                <circle cx="20" cy="20" r="6.5" stroke="white" strokeWidth="0.6" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Seva<span className="text-primary">Setu</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider -mt-0.5" style={{ color: '#FF9933' }}>
                {lang === 'hi' ? 'भारत को जोड़ता है' : 'Connecting Bharat'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-all hover:text-primary hover:bg-primary/8 ${
                  location.pathname === item.href
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
                {item.href === '/rewards' && (
                  <span className="ml-1 text-[9px] bg-primary text-white px-1 py-0.5 rounded-full font-bold">NEW</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* AI Assistant */}
            <Link
              to="/assistant"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all duration-200"
            >
              <Zap size={13} />
              AI
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
            >
              <Globe size={14} />
              <span>{lang === 'en' ? 'हिं' : 'EN'}</span>
            </button>

            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="px-4 py-1.5 rounded-full border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all duration-200"
            >
              {isAuthenticated ? (lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard') : (lang === 'hi' ? 'लॉगिन' : 'Login')}
            </Link>

            <Link
              to="/join"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-all duration-200 shadow-sm"
            >
              {lang === 'hi' ? 'प्रदाता बनें' : 'Join'}
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-border text-muted-foreground"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 bg-background">
            <nav className="flex flex-col gap-1 mb-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary py-2.5 px-3 rounded-md flex items-center gap-2 ${
                    location.pathname === item.href
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                  {item.href === '/rewards' && (
                    <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                  )}
                </Link>
              ))}
              <Link
                to="/assistant"
                className="text-sm font-medium text-primary py-2.5 px-3 rounded-md flex items-center gap-2 hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Zap size={14} /> AI Assistant
              </Link>
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-all w-full"
              >
                <Globe size={14} />
                {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
              </button>
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-semibold text-center hover:bg-primary hover:text-white transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isAuthenticated ? (lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard') : (lang === 'hi' ? 'लॉगिन' : 'Login')}
              </Link>
              <Link
                to="/join"
                className="px-4 py-2 rounded-full bg-secondary text-white text-sm font-semibold text-center hover:bg-secondary/90 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {lang === 'hi' ? 'प्रदाता बनें' : 'Join as Provider'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
