import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { SmartImage } from '../components/ui/smart-image';
import { imageSources } from '../lib/image-sources';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { apiRequest } from '../lib/api-client';
import {
  Mic, MicOff, Search, ArrowRight, MapPin, Shield, Zap, ChevronRight, Briefcase,
  Home, Leaf, Palette, BookOpen, Truck,
  Globe, Users, CheckCircle, Phone, Utensils, Scissors
} from 'lucide-react';

// ─── Language Context ────────────────────────────────────────────────────────
const t = {
  en: {
    heroTitle: 'Local help, from village to city.',
    heroSubtitle: 'One trusted place to get things done.',
    heroDesc: 'Find farm support, home repairs, learning, and everyday services in one simple marketplace.',
    bookService: 'Book a Service',
    joinProvider: 'Join as Provider',
    voicePlaceholder: 'Search by voice / आवाज़ से खोजें...',
    stats: ['Services in the catalogue', 'Rural services', 'Urban services'],
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
    providerSubtitle: 'List your skills and manage service requests in your area.',
    joinNow: 'Join as Provider',
    ctaTitle: "India's Services, Now at Your Fingertips",
    ctaSubtitle: 'Book trusted local services in seconds — in Hindi or English',
    ctaBook: 'Book a Service',
    ctaApp: 'Talk to the AI assistant',
  },
  hi: {
    heroTitle: 'गांव से शहर तक, भरोसेमंद सेवा।',
    heroSubtitle: 'ज़रूरत की मदद, एक ही जगह।',
    heroDesc: 'खेती, घर की मरम्मत, पढ़ाई और रोज़मर्रा की सेवाएं एक आसान बाज़ार में खोजें।',
    bookService: 'सेवा बुक करें',
    joinProvider: 'प्रदाता बनें',
    voicePlaceholder: 'आवाज़ से खोजें / Search by voice...',
    stats: ['सूची में सेवाएं', 'ग्रामीण सेवाएं', 'शहरी सेवाएं'],
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
    providerSubtitle: 'अपने कौशल सूचीबद्ध करें और अपने क्षेत्र के सेवा अनुरोध संभालें।',
    joinNow: 'प्रदाता बनें',
    ctaTitle: 'भारत की सेवाएं, अब आपकी उंगलियों पर',
    ctaSubtitle: 'हिंदी या अंग्रेजी में — विश्वसनीय स्थानीय सेवाएं सेकंडों में बुक करें',
    ctaBook: 'सेवा बुक करें',
    ctaApp: 'AI सहायक से बात करें',
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
  const [platformSummary, setPlatformSummary] = useState<{ serviceCount: number; ruralServiceCount: number; urbanServiceCount: number; onlineProviderCount: number } | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const { voiceState, isSupported, startListening, stopListening } = useVoiceInput({
    lang,
    onError: setVoiceError,
    onResult: (text) => { setVoiceError(''); setSearchQuery(text); navigate(`/services?search=${encodeURIComponent(text)}`); },
  });
  const isListening = voiceState === 'listening';
  const tx = t[lang];
  useEffect(() => {
    let active = true;
    apiRequest<typeof platformSummary & {}>('/platform/summary')
      .then((summary) => { if (active) { setPlatformSummary(summary); setApiConnected(true); } })
      .catch(() => { if (active) setApiConnected(false); });
    return () => { active = false; };
  }, []);
  const submitSearch = () => {
    const query = searchQuery.trim();
    if (query) navigate(`/services?search=${encodeURIComponent(query)}`);
  };

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
          <div className="grid lg:grid-cols-12 gap-7 items-center">
            {/* Left — Rural Visual */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="hidden lg:col-span-3 lg:block"
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
            <div className="lg:col-span-6 text-center lg:text-left">
              {/* Language Toggle */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex justify-center lg:justify-start mb-6"
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
                className="flex justify-center lg:justify-start mb-4"
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
                  className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 max-w-lg mx-auto lg:mx-0"
                >
                  {tx.heroDesc}
                </motion.p>

                {/* CTAs */}
                <motion.div
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6"
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
                  className="relative max-w-lg mx-auto lg:mx-0"
                >
                  <div className="flex items-center gap-2 bg-white rounded-full border-2 border-border shadow-md px-4 py-2.5 focus-within:border-primary transition-colors">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(); }}
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
                    <button type="button" onClick={submitSearch} disabled={!searchQuery.trim()} aria-label={lang === 'hi' ? 'सेवाएं खोजें' : 'Search services'} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-white transition-colors hover:bg-secondary/90 disabled:opacity-40"><ArrowRight size={14} /></button>
                  </div>
                  {isListening && (
                    <p className="text-xs text-red-500 text-center mt-1 animate-pulse">
                      🎤 {lang === 'hi' ? 'सुन रहा हूं...' : 'Listening...'}
                    </p>
                  )}
                  {voiceState === 'processing' && <p role="status" className="mt-1 text-center text-xs text-primary">{lang === 'hi' ? 'आपकी आवाज़ समझ रहे हैं…' : 'Understanding your request…'}</p>}
                  {voiceError && <p role="alert" className="mt-1 text-center text-xs text-amber-700">{voiceError}</p>}
                </motion.div>
              </motion.div>
            </div>

            {/* Right — Urban Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="hidden lg:col-span-3 lg:block"
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
              { value: platformSummary?.serviceCount ?? 21, label: lang === 'hi' ? 'सूची में सेवाएं' : 'Services in catalogue', icon: Zap },
              { value: platformSummary?.ruralServiceCount ?? 10, label: lang === 'hi' ? 'ग्रामीण सेवाएं' : 'Rural services', icon: Leaf },
              { value: platformSummary?.urbanServiceCount ?? 11, label: lang === 'hi' ? 'शहरी सेवाएं' : 'Urban services', icon: Home },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-border">
                <p className="text-2xl font-bold text-primary" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <AnimatedCounter target={stat.value} />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
          <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${apiConnected ? 'bg-emerald-100 text-emerald-800' : apiConnected === false ? 'bg-amber-100 text-amber-900' : 'bg-white/70'}`}><span className={`h-2 w-2 rounded-full ${apiConnected ? 'bg-emerald-500' : apiConnected === false ? 'bg-amber-500' : 'animate-pulse bg-slate-400'}`} />{apiConnected ? (lang === 'hi' ? 'लाइव सेवा API जुड़ा है' : 'Live service API connected') : apiConnected === false ? (lang === 'hi' ? 'डेमो कैटलॉग • API ऑफ़लाइन' : 'Demo catalogue • API offline') : (lang === 'hi' ? 'सेवा API जांच रहे हैं…' : 'Checking service API…')}</span>
            {platformSummary && <span>{platformSummary.onlineProviderCount} {lang === 'hi' ? 'प्रदाता ऑनलाइन' : 'providers online'}</span>}
          </div>
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
                  <h3 className={`font-bold text-foreground leading-tight ${isLarge ? 'text-lg' : 'text-sm'}`}>
                    {lang === 'hi' ? service.labelHi : service.label}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{lang === 'hi' ? 'सेवाएं देखें' : 'Browse services'}</p>
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
                desc: lang === 'hi' ? 'अपनी ज़रूरत और स्थान के अनुसार सेवा अनुरोध भेजें' : 'Send a service request for your needs and location',
                color: 'bg-green-100 text-green-600',
                image: imageSources.provider,
              },
              {
                step: '03',
                icon: CheckCircle,
                title: lang === 'hi' ? 'बुक करें और ट्रैक करें' : 'Book & Track',
                desc: lang === 'hi' ? 'प्रदाता के स्वीकार करने के बाद स्थिति और साझा की गई लोकेशन देखें' : 'Follow job status and shared provider location after acceptance',
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

      {/* ── AI ASSISTANT ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">Seva AI</p>
            <h2 className="mb-4 text-3xl font-black text-foreground md:text-4xl">{tx.aiTitle}</h2>
            <p className="mb-6 max-w-xl leading-relaxed text-muted-foreground">{lang === 'hi' ? 'आवाज़ या संदेश से सेवाएं खोजें, उपलब्ध प्रदाताओं के बारे में पूछें और सरकारी योजनाओं की जानकारी समझें। बुकिंग से पहले आप विवरण की पुष्टि कर सकते हैं।' : 'Search by voice or message, ask about available providers, and understand government schemes. You review booking details before sending a request.'}</p>
            <div className="mb-7 flex flex-wrap gap-2">{[lang === 'hi' ? 'हिंदी और अंग्रेज़ी' : 'Hindi and English', lang === 'hi' ? 'माइक से बोलें' : 'Speak with your mic', lang === 'hi' ? 'बुकिंग से जुड़ी मदद' : 'Booking assistance'].map((feature) => <span key={feature} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground">{feature}</span>)}</div>
            <Link to="/assistant" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5">{lang === 'hi' ? 'सेवा AI खोलें' : 'Open Seva AI'} <ArrowRight size={16}/></Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-xl">
            <SmartImage src={imageSources.community} alt="People using digital services in their community" className="h-72 rounded-[1.5rem] md:h-96" />
            <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/30 bg-white/90 p-4 shadow-lg backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{lang === 'hi' ? 'अपनी भाषा में पूछें' : 'Ask in your language'}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{lang === 'hi' ? '“मेरे गांव में फसल सलाह कौन देता है?”' : '“Who can help with crop advice near my village?”'}</p>
            </div>
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
              <Link key={scheme.name} to={`/schemes?search=${encodeURIComponent(scheme.name)}`} aria-label={`${lang === 'hi' ? scheme.nameHi : scheme.name} — ${lang === 'hi' ? 'योजना देखें' : 'View scheme'}`} className="block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2">
              <motion.div
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
              </Link>
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

      {/* ── PROVIDER WORKSPACE ───────────────────────────────────────────── */}
      <section className="bg-muted py-20">
        <div className="container mx-auto grid items-center gap-10 px-4 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-xl">
            <SmartImage src={imageSources.artisan} alt="A local artisan creating a handmade craft" className="h-72 rounded-[1.5rem] md:h-96" />
            <div className="absolute bottom-7 left-7 rounded-2xl bg-emerald-950/90 px-4 py-3 text-white shadow-lg"><p className="text-xs text-white/70">SevaSetu Provider</p><p className="font-bold">{lang === 'hi' ? 'आपके कौशल, आपका कार्यक्षेत्र' : 'Your skills. Your workspace.'}</p></div>
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-secondary">{lang === 'hi' ? 'सेवा प्रदाता कार्यक्षेत्र' : 'Provider workspace'}</p>
            <h2 className="mb-4 text-3xl font-black text-foreground md:text-4xl">{tx.providerTitle}</h2>
            <p className="mb-6 max-w-xl leading-relaxed text-muted-foreground">{tx.providerSubtitle}</p>
            <div className="mb-7 grid gap-3 sm:grid-cols-2">{[
              { icon: Briefcase, title: lang === 'hi' ? 'कौशल सूचीबद्ध करें' : 'List your skills', detail: lang === 'hi' ? 'अपने क्षेत्र की सेवाएं चुनें' : 'Choose services you offer locally' },
              { icon: Users, title: lang === 'hi' ? 'अनुरोध पाएं' : 'Receive requests', detail: lang === 'hi' ? 'ऑनलाइन होने पर मेल खाते काम देखें' : 'See matching jobs when you are online' },
              { icon: MapPin, title: lang === 'hi' ? 'प्रगति साझा करें' : 'Share progress', detail: lang === 'hi' ? 'बुकिंग स्थिति अपडेट करें' : 'Update customers as work progresses' },
              { icon: Shield, title: lang === 'hi' ? 'नियंत्रण आपके पास' : 'Stay in control', detail: lang === 'hi' ? 'जब उपलब्ध हों तभी ऑनलाइन जाएं' : 'Go online only when you are available' },
            ].map(({ icon: Icon, title, detail }) => <div key={title} className="flex gap-3 rounded-2xl border border-border bg-card p-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary"><Icon size={17}/></div><div><p className="text-sm font-bold text-foreground">{title}</p><p className="mt-0.5 text-xs text-muted-foreground">{detail}</p></div></div>)}</div>
            <Link to="/join" className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 font-bold text-white shadow-lg shadow-secondary/20 transition-transform hover:-translate-y-0.5">{tx.joinNow} <ArrowRight size={16}/></Link>
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
