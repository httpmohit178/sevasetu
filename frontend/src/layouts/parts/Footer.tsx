import { Link } from 'react-router-dom';
import { Globe, MessageCircle } from 'lucide-react';
import { useAppLanguage } from '../../hooks/useAppLanguage';

export default function Footer() {
  const [lang, setLang] = useAppLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F2D1A] text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <svg width="38" height="38" viewBox="0 0 40 40" fill="none" className="shrink-0 group-hover:scale-105 transition-transform">
                <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
                <path d="M36 20 A16 16 0 0 1 20 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none"/>
                <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
                <path d="M4 20 A16 16 0 0 1 20 4" stroke="#000080" strokeWidth="4" strokeLinecap="round" fill="none"/>
                <circle cx="20" cy="20" r="7" fill="#000080"/>
                {[0,45,90,135,180,225,270,315].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  return <line key={i} x1={20+3*Math.cos(rad)} y1={20+3*Math.sin(rad)} x2={20+6.5*Math.cos(rad)} y2={20+6.5*Math.sin(rad)} stroke="white" strokeWidth="0.8"/>;
                })}
                <circle cx="20" cy="20" r="2" fill="white"/>
                <circle cx="20" cy="20" r="6.5" stroke="white" strokeWidth="0.6" fill="none"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seva<span style={{ color: '#FF9933' }}>Setu</span>
                </span>
                <span className="text-[9px] font-semibold tracking-wider -mt-0.5" style={{ color: '#FF9933' }}>
                  {lang === 'hi' ? 'भारत को जोड़ता है' : 'Connecting Bharat'}
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-2">
              {lang === 'hi'
                ? 'भारत के हर गांव और शहर को जोड़ने वाला AI-संचालित सेवा मंच।'
                : 'AI-powered service marketplace connecting every village and city of India.'}
            </p>
            <p className="text-xs text-white/40 italic mb-4">
              {lang === 'hi' ? '"गांव से शहर तक, सेवा हर कदम पर"' : '"Seva har kadam par — Service at every step"'}
            </p>
            <Link to="/assistant" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-primary transition-colors"><MessageCircle size={14} />{lang === 'hi' ? 'सहायता चैट खोलें' : 'Open support chat'}</Link>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {lang === 'hi' ? 'सेवाएं' : 'Services'}
            </h4>
            <ul className="space-y-2">
              {[
                { en: 'Home Services', hi: 'घरेलू सेवाएं', href: '/services?category=home' },
                { en: 'Agriculture', hi: 'कृषि सेवाएं', href: '/services?category=agri' },
                { en: 'Education', hi: 'शिक्षा', href: '/services?category=edu' },
                { en: 'Beauty', hi: 'सौंदर्य', href: '/services?category=beauty' },
                { en: 'Food', hi: 'खाना', href: '/services?category=food' },
                { en: 'Transport', hi: 'परिवहन', href: '/services?category=transport' },
              ].map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-white/60 hover:text-primary transition-colors">
                    {lang === 'hi' ? item.hi : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {lang === 'hi' ? 'प्लेटफॉर्म' : 'Platform'}
            </h4>
            <ul className="space-y-2">
              {[
                { en: 'Find Providers', hi: 'प्रदाता खोजें', href: '/services' },
                { en: 'Government Schemes', hi: 'सरकारी योजनाएं', href: '/schemes' },
                { en: 'Join as Provider', hi: 'प्रदाता बनें', href: '/join' },
                { en: 'Rewards Program', hi: 'पुरस्कार कार्यक्रम', href: '/rewards' },
                { en: 'AI Assistant', hi: 'AI सहायक', href: '/assistant' },
                { en: 'About Us', hi: 'हमारे बारे में', href: '/' },
              ].map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-white/60 hover:text-primary transition-colors">
                    {lang === 'hi' ? item.hi : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              {lang === 'hi' ? 'संपर्क' : 'Contact'}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/60">
                <Phone size={14} className="mt-0.5 text-primary shrink-0" />
                <Link to="/assistant" className="hover:text-white">{lang === 'hi' ? 'AI सहायता चैट' : 'Support through AI assistant'}</Link>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <Mail size={14} className="mt-0.5 text-primary shrink-0" />
                <Link to="/assistant" className="hover:text-white">{lang === 'hi' ? 'सेवा सहायता खोलें' : 'Open service support'}</Link>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/60">
                <MapPin size={14} className="mt-0.5 text-primary shrink-0" />
                <span>{lang === 'hi' ? 'भारत भर में सेवाएं 🇮🇳' : 'Services across India 🇮🇳'}</span>
              </li>
            </ul>

            {/* Language Toggle */}
            <div className="mt-5">
              <p className="text-xs text-white/40 mb-2">{lang === 'hi' ? 'भाषा बदलें' : 'Change Language'}</p>
              <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 text-sm text-white/70 hover:border-primary hover:text-primary transition-all"
              >
                <Globe size={13} />
                {lang === 'en' ? 'हिंदी में देखें' : 'View in English'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/40">
            © {currentYear} SevaSetu. {lang === 'hi' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-white/50 flex items-center gap-1">
            Made with <span className="text-red-400">♥</span> for Bharat 🇮🇳
          </p>
          <div className="flex gap-4">
            <Link to="/assistant" className="text-xs text-white/40 hover:text-white/70 transition-colors">{lang === 'hi' ? 'सहायता' : 'Support'}</Link>
            <Link to="/schemes" className="text-xs text-white/40 hover:text-white/70 transition-colors">{lang === 'hi' ? 'योजनाएं' : 'Schemes'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
