import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { SmartImage } from '../components/ui/smart-image';
import { imageSources } from '../lib/image-sources';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useAppLanguage } from '../hooks/useAppLanguage';
import {
  Mic, MicOff, Search, ArrowRight, Star, MapPin, Shield, Zap, ChevronRight,
  Home, Leaf, Palette, Heart, BookOpen, Truck, AlertCircle, Building2,
  MessageCircle, Globe, Award, TrendingUp, Users, CheckCircle, Phone, Utensils, Scissors
} from 'lucide-react';

// ─── Language Context ────────────────────────────────────────────────────────
const t = {
  en: {
    heroTitle: 'Connecting Bharat',
    heroSubtitle: 'गांव से शहर तक',
    heroDesc: 'AI-powered services for every Indian — from the smallest village to the biggest city.',
    bookService: 'Book a Service',
    joinProvider: 'Join as Provider',
    voicePlaceholder: 'Search by voice / आवाज़ से खोजें...',
    stats: ['50,000+ Providers', '200+ Cities & Villages', '4.8★ Rating'],
    servicesTitle: 'Our Services',
    servicesSubtitle: 'Everything you need, right where you are',
    howTitle: 'How SevaSetu Works',
    howSubtitle: 'Book any service in 3 simple steps',
    aiTitle: 'Meet Your AI Seva Assistant',
    aiSubtitle: 'Speaks Hindi & English — helps you book, track, and discover services',
    schemesTitle: 'Sarkari Yojanaएं',
    schemesSubtitle: 'Know Your Benefits — सरकारी योजनाओं का लाभ उठाएं',
    checkEligibility: 'Check Eligibility with AI',
    providerTitle: 'Empowering India\'s Workforce',
    providerSubtitle: 'Join 50,000+ providers earning with SevaSetu',
    joinNow: 'Join as Provider',
    ctaTitle: "India's Services, Now at Your Fingertips",
    ctaSubtitle: 'Book trusted local services in seconds — in Hindi or English',
    ctaBook: 'Book a Service',
    ctaApp: 'Download App (PWA)',
  },
  hi: {
    heroTitle: 'भारत को जोड़ता है',
    heroSubtitle: 'गांव से शहर तक',
    heroDesc: 'हर भारतीय के लिए AI-संचालित सेवाएं — सबसे छोटे गांव से लेकर सबसे बड़े शहर तक।',
    bookService: 'सेवा बुक करें',
    joinProvider: 'प्रदाता बनें',
    voicePlaceholder: 'आवाज़ से खोजें / Search by voice...',
    stats: ['50,000+ प्रदाता', '200+ शहर और गांव', '4.8★ रेटिंग'],
    servicesTitle: 'हमारी सेवाएं',
    servicesSubtitle: 'जो चाहिए, जहां चाहिए',
    howTitle: 'SevaSetu कैसे काम करता है',
    howSubtitle: '3 आसान चरणों में कोई भी सेवा बुक करें',
    aiTitle: 'AI सेवा सहायक से मिलें',
    aiSubtitle: 'हिंदी और अंग्रेजी में बात करें — सेवाएं बुक करें, ट्रैक करें',
    schemesTitle: 'सरकारी योजनाएं',
    schemesSubtitle: 'अपने अधिकार जानें — Know Your Benefits',
    checkEligibility: 'AI से पात्रता जांचें',
    providerTitle: 'भारत के कार्यबल को सशक्त बनाना',
    providerSubtitle: '50,000+ प्रदाताओं के साथ कमाई शुरू करें',
    joinNow: 'प्रदाता बनें',
    ctaTitle: 'भारत की सेवाएं, अब आपकी उंगलियों पर',
    ctaSubtitle: 'हिंदी या अंग्रेजी में — विश्वसनीय स्थानीय सेवाएं सेकंडों में बुक करें',
    ctaBook: 'सेवा बुक करें',
    ctaApp: 'ऐप डाउनलोड करें (PWA)',
  },
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

// ─── Floating Rangoli Shape ───────────────────────────────────────────────────
function RangoliShape({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`absolute pointer-events-none opacity-10 ${className}`}
      animate={{ rotate: 360, scale: [1, 1.05, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4"/>
        <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="1"/>
        <circle cx="60" cy="60" r="25" stroke="currentColor" strokeWidth="1.5"/>
        {[0,45,90,135,180,225,270,315].map((angle, i) => (
          <line
            key={i}
            x1="60" y1="60"
            x2={60 + 55 * Math.cos((angle * Math.PI) / 180)}
            y2={60 + 55 * Math.sin((angle * Math.PI) / 180)}
            stroke="currentColor" strokeWidth="0.8"
          />
        ))}
        {[0,60,120,180,240,300].map((angle, i) => (
          <circle
            key={i}
            cx={60 + 40 * Math.cos((angle * Math.PI) / 180)}
            cy={60 + 40 * Math.sin((angle * Math.PI) / 180)}
            r="3" fill="currentColor"
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── Service Categories ───────────────────────────────────────────────────────
const services = [
  { icon: Home, label: 'Home Services', labelHi: 'घरेलू सेवाएं', category: 'home', color: 'bg-orange-50 text-orange-600 border-orange-200', size: 'lg' },
  { icon: Leaf, label: 'Agriculture', labelHi: 'कृषि सेवाएं', category: 'agri', color: 'bg-green-50 text-green-600 border-green-200', size: 'sm' },
  { icon: Palette, label: 'Handicrafts', labelHi: 'हस्तशिल्प', category: 'craft', color: 'bg-pink-50 text-pink-600 border-pink-200', size: 'sm' },
  { icon: Utensils, label: 'Food', labelHi: 'खाना', category: 'food', color: 'bg-red-50 text-red-600 border-red-200', size: 'md' },
  { icon: BookOpen, label: 'Education', labelHi: 'शिक्षा', category: 'edu', color: 'bg-blue-50 text-blue-600 border-blue-200', size: 'md' },
  { icon: Truck, label: 'Transport', labelHi: 'परिवहन', category: 'transport', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', size: 'sm' },
  { icon: Scissors, label: 'Beauty', labelHi: 'सौंदर्य', category: 'beauty', color: 'bg-red-50 text-red-700 border-red-300', size: 'sm' },
  { icon: Zap, label: 'All services', labelHi: 'सभी सेवाएं', category: 'all', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', size: 'lg' },
];

// ─── Government Schemes ───────────────────────────────────────────────────────
const schemes = [
  {
    name: 'PM Kisan Samman Nidhi',
    nameHi: 'पीएम किसान सम्मान निधि',
    desc: 'Annual income support of ₹6,000 for small & marginal farmers',
    descHi: 'छोटे किसानों को ₹6,000 वार्षिक सहायता',
    icon: '🌾',
    tag: 'Farmers',
    tagHi: 'किसान',
    color: 'from-green-800 to-green-900',
  },
  {
    name: 'Ayushman Bharat',
    nameHi: 'आयुष्मान भारत',
    desc: 'Health insurance cover of ₹5 lakh per family per year',
    descHi: 'परिवार को ₹5 लाख तक का स्वास्थ्य बीमा',
    icon: '🏥',
    tag: 'Healthcare',
    tagHi: 'स्वास्थ्य',
    color: 'from-teal-800 to-teal-900',
  },
  {
    name: 'Skill India Mission',
    nameHi: 'कौशल भारत मिशन',
    desc: 'Free skill training & certification for youth across India',
    descHi: 'युवाओं के लिए मुफ्त कौशल प्रशिक्षण',
    icon: '🎓',
    tag: 'Youth',
    tagHi: 'युवा',
    color: 'from-blue-900 to-indigo-900',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [lang, setLang] = useAppLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const { voiceState, isSupported, startListening, stopListening } = useVoiceInput({
    lang,
    onResult: (text) => { setSearchQuery(text); navigate(`/services?search=${encodeURIComponent(text)}`); },
  });
  const isListening = voiceState === 'listening';
  const tx = t[lang];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  } as const;

  return (
    <div className="overflow-x-hidden">
      <title>SevaSetu – Connecting Bharat | AI-Powered Service Marketplace</title>
      <meta name="description" content="India's AI-powered service marketplace connecting rural and urban India. Book trusted local services in Hindi or English." />

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E5] to-[#FFF8F0]">
        {/* Rangoli decorative shapes */}
        <RangoliShape className="text-primary top-10 right-10 w-32 h-32" />
        <RangoliShape className="text-secondary bottom-20 left-5 w-24 h-24" />
        <RangoliShape className="text-accent top-1/2 right-1/4 w-16 h-16 opacity-5" />

        {/* Background gradient blobs */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-green-50/60 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50/60 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {/* Left — Rural Visual */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[420px]">
                <SmartImage src={imageSources.rural} alt="Rural farm with a grain silo and fields at sunset" className="h-full w-full" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    🌾 Rural communities
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Center — Main Content */}
            <div className="lg:col-span-1 text-center">
              {/* Language Toggle */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center mb-6"
              >
                <button
                  onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-primary/30 bg-white shadow-sm text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-all duration-300"
                >
                  <Globe size={14} />
                  <span className="transition-all duration-300">
                    {lang === 'en' ? 'हिंदी में देखें' : 'View in English'}
                  </span>
                </button>
              </motion.div>

              {/* Bridge Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                className="flex justify-center mb-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17L7 13L11 15L17 9L21 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="3" cy="17" r="1.5" fill="white"/>
                    <circle cx="21" cy="11" r="1.5" fill="white"/>
                    <path d="M3 17C3 17 8 7 12 7C16 7 21 11 21 11" stroke="white" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6"/>
                  </svg>
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
              >
                <motion.h1
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-1"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {tx.heroTitle}
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="text-2xl md:text-3xl font-bold text-primary mb-3"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {tx.heroSubtitle}
                </motion.p>
                <motion.p
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 max-w-sm mx-auto"
                >
                  {tx.heroDesc}
                </motion.p>

                {/* CTAs */}
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
                >
                  <Link
                    to="/services"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all duration-200"
                  >
                    {tx.bookService}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/join"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-secondary text-secondary font-bold text-sm hover:bg-secondary hover:text-white transition-all duration-200"
                  >
                    {tx.joinProvider}
                  </Link>
                </motion.div>

                {/* Voice Search Bar */}
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="relative max-w-sm mx-auto"
                >
                  <div className="flex items-center gap-2 bg-white rounded-full border-2 border-border shadow-md px-4 py-2.5 focus-within:border-primary transition-colors">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={tx.voicePlaceholder}
                      className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60"
                    />
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={!isSupported}
                      aria-label={isListening ? (lang === 'hi' ? 'आवाज़ सुनना बंद करें' : 'Stop voice search') : (lang === 'hi' ? 'आवाज़ से खोजें' : 'Search by voice')}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
                      }`}
                    >
                      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                  </div>
                  {isListening && (
                    <p className="text-xs text-red-500 text-center mt-1 animate-pulse">
                      🎤 {lang === 'hi' ? 'सुन रहा हूं...' : 'Listening...'}
                    </p>
                  )}
                  {voiceState === 'error' && <p role="status" className="mt-1 text-center text-xs text-amber-700">{lang === 'hi' ? 'माइक की अनुमति दें और फिर कोशिश करें।' : 'Allow microphone access and try again.'}</p>}
                </motion.div>
              </motion.div>
            </div>

            {/* Right — Urban Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="hidden lg:block"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[420px]">
                <SmartImage src={imageSources.urban} alt="Four colleagues collaborating around a laptop in a modern office" className="h-full w-full" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/60 to-transparent" />
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    🏙️ Urban teamwork
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {[
              { value: 50000, suffix: '+', label: lang === 'hi' ? 'प्रदाता' : 'Providers', icon: Users },
              { value: 200, suffix: '+', label: lang === 'hi' ? 'शहर और गांव' : 'Cities & Villages', icon: MapPin },
              { value: 4.8, suffix: '★', label: lang === 'hi' ? 'रेटिंग' : 'Rating', icon: Star },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border">
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {i === 2 ? stat.value : <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                  {i === 2 && stat.suffix}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICE CATEGORIES (BENTO GRID) ──────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              {tx.servicesTitle}
            </motion.p>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.4 }} className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {tx.servicesSubtitle}
            </motion.h2>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {services.map((service, i) => {
              const Icon = service.icon;
              const isLarge = service.size === 'lg';
              return (
                <Link key={service.category} to={`/services?category=${service.category}`} aria-label={`${lang === 'hi' ? service.labelHi : service.label} — ${lang === 'hi' ? 'सेवाएं देखें' : 'Browse services'}`} className="block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className={`group cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200 hover:border-primary hover:shadow-lg hover:shadow-primary/10 bg-card ${service.color} ${
                    isLarge ? 'md:col-span-2 md:row-span-1' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white/80 shadow-sm ${isLarge ? 'w-14 h-14' : ''}`}>
                    <Icon size={isLarge ? 26 : 22} />
                  </div>
                  <h3 className={`font-bold text-gray-800 leading-tight ${isLarge ? 'text-lg' : 'text-sm'}`}>
                    {lang === 'hi' ? service.labelHi : service.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{lang === 'hi' ? 'सेवाएं देखें' : 'Browse services'}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {lang === 'hi' ? 'देखें' : 'Explore'} <ChevronRight size={12} />
                  </div>
                </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mb-12"
          >
            <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              {tx.howTitle}
            </motion.p>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.4 }} className="text-3xl md:text-4xl font-bold text-foreground max-w-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {tx.howSubtitle}
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Mic,
                title: lang === 'hi' ? 'खोजें या बोलें' : 'Search or Speak',
                desc: lang === 'hi' ? 'हिंदी या अंग्रेजी में आवाज़ से या टाइप करके सेवा खोजें' : 'Find services by typing or using voice in Hindi or English',
                color: 'bg-orange-100 text-orange-600',
                image: imageSources.search,
              },
              {
                step: '02',
                icon: Users,
                title: lang === 'hi' ? 'प्रदाता चुनें' : 'Choose Provider',
                desc: lang === 'hi' ? 'रेटिंग, समीक्षा और स्थान के आधार पर सर्वश्रेष्ठ प्रदाता चुनें' : 'Pick the best provider based on ratings, reviews & location',
                color: 'bg-green-100 text-green-600',
                image: imageSources.provider,
              },
              {
                step: '03',
                icon: CheckCircle,
                title: lang === 'hi' ? 'बुक करें और ट्रैक करें' : 'Book & Track',
                desc: lang === 'hi' ? 'तुरंत बुक करें और रियल-टाइम में अपनी सेवा ट्रैक करें' : 'Instantly book and track your service in real-time',
                color: 'bg-blue-100 text-blue-600',
                image: imageSources.streets,
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className={`relative bg-card rounded-3xl overflow-hidden shadow-sm border border-border ${i === 1 ? 'md:mt-8' : ''}`}
                >
                  <div className="h-40 overflow-hidden">
                    <SmartImage src={step.image} alt={i === 0 ? 'Person holding a smartphone to search online' : i === 1 ? 'Plumber repairing plumbing in a bathroom' : 'City skyline and buildings'} className="h-full w-full" />
                    <div className="absolute inset-0 h-40 bg-gradient-to-b from-transparent to-card/20" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.color}`}>
                        <Icon size={20} />
                      </div>
                      <span className="text-3xl font-black text-border" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI ASSISTANT PREVIEW ──────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">AI Assistant</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {tx.aiTitle}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{tx.aiSubtitle}</p>

              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { icon: '🗣️', label: lang === 'hi' ? 'हिंदी में बात करें' : 'Speak in Hindi' },
                  { icon: '🤖', label: lang === 'hi' ? 'AI सुझाव' : 'AI Suggestions' },
                  { icon: '📍', label: lang === 'hi' ? 'पास के प्रदाता' : 'Nearby Providers' },
                  { icon: '🏛️', label: lang === 'hi' ? 'योजना जानकारी' : 'Scheme Info' },
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5 text-sm font-medium text-foreground">
                    <span>{feat.icon}</span>
                    <span>{feat.label}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
              >
                <MessageCircle size={16} />
                {lang === 'hi' ? 'AI से बात करें' : 'Chat with AI'}
              </Link>
            </motion.div>

            {/* Chat Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden max-w-sm mx-auto">
                {/* Chat Header */}
                <div className="bg-primary px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Seva AI</p>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                      <p className="text-white/70 text-[10px]">{lang === 'hi' ? 'ऑनलाइन' : 'Online'}</p>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <motion.button
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <Mic size={14} className="text-white" />
                    </motion.button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-3 bg-gradient-to-b from-orange-50/30 to-background min-h-[260px]">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[75%]">
                      <p className="text-xs">Mujhe plumber chahiye 🔧</p>
                      <p className="text-[9px] text-white/60 mt-0.5 text-right">10:32 AM</p>
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Zap size={12} className="text-primary" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm border border-border">
                      <p className="text-xs text-foreground">Bilkul! Aapke paas <strong>3 plumbers</strong> available hain 📍</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">10:32 AM</p>
                    </div>
                  </div>

                  {/* Provider cards in chat */}
                  {[
                    { name: 'Suresh Yadav', rating: '4.9', dist: '0.8 km', price: '₹299' },
                    { name: 'Mohan Lal', rating: '4.7', dist: '1.2 km', price: '₹249' },
                  ].map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="w-7 h-7 shrink-0" />
                      <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-border flex items-center gap-2 w-full">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                          {p.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">{p.name}</p>
                          <div className="flex items-center gap-1">
                            <Star size={8} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-[9px] text-muted-foreground">{p.rating} • {p.dist}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary">{p.price}</span>
                      </div>
                    </div>
                  ))}

                  {/* User follow-up */}
                  <div className="flex justify-end">
                    <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[75%]">
                      <p className="text-xs">Suresh ko book karo</p>
                      <p className="text-[9px] text-white/60 mt-0.5 text-right">10:33 AM</p>
                    </div>
                  </div>

                  {/* Booking confirmed */}
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle size={12} className="text-green-600" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                      <p className="text-xs text-green-800 font-semibold">✅ Booking Confirmed!</p>
                      <p className="text-[9px] text-green-600 mt-0.5">Suresh will arrive at 2:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="px-3 py-3 border-t border-border bg-background flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
                    className="flex-1 text-xs bg-muted rounded-full px-3 py-2 outline-none"
                    readOnly
                    aria-label={lang === 'hi' ? 'AI चैट खोलें' : 'Open AI chat'}
                    onClick={() => navigate('/assistant')}
                  />
                  <button type="button" onClick={() => navigate('/assistant')} aria-label={lang === 'hi' ? 'आवाज़ सहायक खोलें' : 'Open voice assistant'} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Mic size={13} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg border border-border px-3 py-2 flex items-center gap-2"
              >
                <Globe size={14} className="text-primary" />
                <span className="text-xs font-bold text-foreground">Hindi + English</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GOVERNMENT SCHEMES ────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0F2D1A] relative overflow-hidden">
        <RangoliShape className="text-white top-10 right-10 w-40 h-40 opacity-5" />
        <RangoliShape className="text-primary bottom-10 left-10 w-32 h-32 opacity-10" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="text-center mb-12"
          >
            <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              🏛️ Digital India
            </motion.p>
            <motion.h2 variants={fadeUp} transition={{ duration: 0.4 }} className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {tx.schemesTitle}
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-white/60 max-w-xl mx-auto">
              {tx.schemesSubtitle}
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {schemes.map((scheme, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`bg-gradient-to-br ${scheme.color} rounded-2xl p-6 border border-white/10 cursor-pointer group`}
              >
                <div className="text-4xl mb-3">{scheme.icon}</div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
                  {lang === 'hi' ? scheme.tagHi : scheme.tag}
                </span>
                <h3 className="text-lg font-bold text-white mt-3 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {lang === 'hi' ? scheme.nameHi : scheme.name}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {lang === 'hi' ? scheme.descHi : scheme.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                  {lang === 'hi' ? 'और जानें' : 'Learn More'} <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all duration-200"
            >
              <Zap size={16} />
              {tx.checkEligibility}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── PROVIDER SPOTLIGHT ────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Provider Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-card rounded-3xl overflow-hidden shadow-2xl border border-border">
                <div className="h-64 relative overflow-hidden">
                <SmartImage src={imageSources.artisan} alt="Woman making clay pots by hand" className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Local Pottery Artisan
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> Traditional craft services
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700">4.9</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {['Pottery', 'Clay craft', 'Handmade ceramics'].map((skill) => (
                      <span key={skill} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                    {[
                      { label: lang === 'hi' ? 'बुकिंग' : 'Bookings', value: '234' },
                      { label: lang === 'hi' ? 'कमाई' : 'Earned', value: '₹48K' },
                      { label: lang === 'hi' ? 'समीक्षा' : 'Reviews', value: '189' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className="text-lg font-bold text-primary" style={{ fontFamily: 'Poppins, sans-serif' }}>{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified badge */}
              <div className="absolute -top-3 -right-3 bg-secondary text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-lg">
                <Shield size={12} /> {lang === 'hi' ? 'सत्यापित' : 'Verified'}
              </div>
            </motion.div>

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
                {lang === 'hi' ? 'प्रदाता बनें' : 'Become a Provider'}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {tx.providerTitle}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{tx.providerSubtitle}</p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: TrendingUp, title: lang === 'hi' ? 'अधिक कमाई' : 'Earn More', desc: lang === 'hi' ? 'अपनी शर्तों पर काम करें और अधिक कमाएं' : 'Work on your terms and earn more than ever', color: 'text-orange-500 bg-orange-50' },
                  { icon: Shield, title: lang === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payments', desc: lang === 'hi' ? 'समय पर और सुरक्षित भुगतान की गारंटी' : 'Guaranteed on-time and secure payments', color: 'text-green-600 bg-green-50' },
                  { icon: Award, title: lang === 'hi' ? 'पुरस्कार और बैज' : 'Rewards & Badges', desc: lang === 'hi' ? 'शीर्ष प्रदाता बैज और विशेष लाभ पाएं' : 'Earn Top Provider badges and exclusive benefits', color: 'text-blue-500 bg-blue-50' },
                ].map((benefit, i) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${benefit.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{benefit.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Testimonial */}
              <div className="bg-muted rounded-2xl p-4 mb-6 border-l-4 border-primary">
                <p className="text-sm text-foreground italic leading-relaxed">
                  "{lang === 'hi' ? 'SevaSetu से जुड़कर मेरी आय दोगुनी हो गई। अब मेरे हस्तशिल्प पूरे भारत में बिकते हैं।' : 'Joining SevaSetu doubled my income. Now my handicrafts sell across India.'}"
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-semibold">— Meena Devi, Chandauli</p>
              </div>

              <Link
                to="/join"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-secondary text-white font-bold shadow-lg shadow-secondary/30 hover:bg-secondary/90 hover:scale-105 transition-all duration-200"
              >
                {tx.joinNow}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-primary via-[#E55A00] to-[#C1440E]">
        <RangoliShape className="text-white top-5 left-10 w-48 h-48 opacity-10" />
        <RangoliShape className="text-white bottom-5 right-10 w-36 h-36 opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M3 17L7 13L11 15L17 9L21 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="3" cy="17" r="1.5" fill="white"/>
                  <circle cx="21" cy="11" r="1.5" fill="white"/>
                </svg>
              </div>
            </motion.div>

            <motion.h2 variants={fadeUp} transition={{ duration: 0.5 }} className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl mx-auto leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {tx.ctaTitle}
            </motion.h2>
            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              {tx.ctaSubtitle}
            </motion.p>

            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-primary font-bold text-base shadow-xl hover:scale-105 transition-all duration-200"
              >
                {tx.ctaBook}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/assistant"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/50 text-white font-bold text-base hover:bg-white/10 transition-all duration-200"
              >
                <Phone size={18} />
                {lang === 'hi' ? 'AI सहायक से बात करें' : 'Talk to the AI assistant'}
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="text-white/50 text-sm mt-8">
              🇮🇳 Proudly Made for Bharat • Jai Hind
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
