import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  User, Bell, Globe, Palette, CreditCard,
  ChevronRight, Check, Sun, Moon, Save,
  LayoutDashboard, ShoppingBag, MapPin, Gift, Zap, Building2,
  Info
} from 'lucide-react';
import DashboardLayout, { NavItem } from '@/layouts/DashboardLayout';
import { apiRequest } from '@/lib/api-client';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { PhotoBanner } from '../components/ui/photo-banner';

type Lang = 'en' | 'hi';
type Section = 'profile' | 'notifications' | 'language' | 'appearance' | 'payments';

// ─── Section Nav ──────────────────────────────────────────────────────────────
const sections: { id: Section; label: string; labelHi: string; icon: React.ReactNode; desc: string; descHi: string }[] = [
  { id: 'profile',       label: 'Profile',        labelHi: 'प्रोफ़ाइल',      icon: <User size={16} />,       desc: 'Name and contact info',              descHi: 'नाम और संपर्क जानकारी' },
  { id: 'notifications', label: 'Notifications',  labelHi: 'सूचनाएं',        icon: <Bell size={16} />,       desc: 'Alerts, reminders, updates',         descHi: 'अलर्ट, रिमाइंडर, अपडेट' },
  { id: 'language',      label: 'Language',       labelHi: 'भाषा',           icon: <Globe size={16} />,      desc: 'App language',                       descHi: 'ऐप भाषा' },
  { id: 'appearance',    label: 'Appearance',     labelHi: 'दिखावट',         icon: <Palette size={16} />,    desc: 'Color theme',                        descHi: 'रंग थीम' },
  { id: 'payments',      label: 'Bookings & payments', labelHi: 'बुकिंग और भुगतान', icon: <CreditCard size={16} />, desc: 'Booking history and payment status', descHi: 'बुकिंग इतिहास और भुगतान स्थिति' },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-background rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-bold text-foreground text-sm">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection({ lang }: { lang: Lang }) {
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  useEffect(() => {
    apiRequest<{ user: { name: string; phone: string; city?: string } }>('/auth/me')
      .then(({ user }) => setProfile({ name: user.name || '', phone: user.phone || '', city: user.city || '' }))
      .catch((err) => setError(err instanceof Error ? err.message : t('Sign in to edit your profile.', 'प्रोफ़ाइल बदलने के लिए साइन इन करें।')))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setError('');
    try {
      const { user } = await apiRequest<{ user: { name: string; phone: string; city?: string } }>('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name: profile.name, city: profile.city }) });
      setProfile((current) => ({ ...current, name: user.name, city: user.city || '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : t('Could not save profile.', 'प्रोफ़ाइल सहेजी नहीं जा सकी।')); }
  }

  return (
    <div className="space-y-4">
      {/* Avatar */}
      <SectionCard title={t('Profile Photo', 'प्रोफ़ाइल फोटो')}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-black">
              {profile.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '—'}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{loading ? t('Loading…', 'लोड हो रहा है…') : profile.name || t('Not signed in', 'साइन इन नहीं है')}</p>
            <p className="text-xs text-muted-foreground">{profile.phone}</p>
          </div>
        </div>
      </SectionCard>

      {/* Personal Info */}
      <SectionCard title={t('Personal Information', 'व्यक्तिगत जानकारी')} desc={t('Update your name, phone and address', 'अपना नाम, फोन और पता अपडेट करें')}>
        <div className="grid sm:grid-cols-2 gap-3">
          {[{ key: 'name' as const, label: t('Full Name', 'पूरा नाम') }, { key: 'phone' as const, label: t('Phone Number', 'फोन नंबर') }, { key: 'city' as const, label: t('City', 'शहर') }].map(field => (
            <div key={field.key}><label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label><input value={profile[field.key]} readOnly={field.key === 'phone'} onChange={(event) => setProfile((current) => ({ ...current, [field.key]: event.target.value }))} className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleSave}
          disabled={loading || !profile.name}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {saved ? <><Check size={14} /> {t('Saved!', 'सहेजा!')}</> : <><Save size={14} /> {t('Save Changes', 'बदलाव सहेजें')}</>}
        </button>
      </SectionCard>

    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────
function NotificationsSection({ lang }: { lang: Lang }) {
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const [notifs, setNotifs] = useState({
    bookingUpdates: true, promotions: false, govtSchemes: true,
    smsAlerts: true, emailDigest: false, pushNotifs: true,
    sevaPoints: true, providerArrival: true,
  });
  const [notice, setNotice] = useState('');
  useEffect(() => {
    apiRequest<{ preferences: Partial<typeof notifs> }>('/preferences')
      .then(({ preferences }) => setNotifs(current => ({ ...current, ...preferences })))
      .catch(error => setNotice(error instanceof Error ? error.message : t('Sign in to sync notification settings.', 'सूचना सेटिंग सिंक करने के लिए साइन इन करें।')));
  }, []);
  const toggle = async (key: keyof typeof notifs) => {
    const value = !notifs[key];
    setNotifs(p => ({ ...p, [key]: value })); setNotice('');
    try { await apiRequest('/preferences', { method: 'PATCH', body: JSON.stringify({ [key]: value }) }); }
    catch (error) { setNotifs(p => ({ ...p, [key]: !value })); setNotice(error instanceof Error ? error.message : t('Could not save settings.', 'सेटिंग सहेजी नहीं जा सकी।')); }
  };

  return (
    <div className="space-y-4">
      {notice && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{notice}</p>}
      <SectionCard title={t('Push Notifications', 'पुश सूचनाएं')} desc={t('Control what alerts you receive on your device', 'अपने डिवाइस पर मिलने वाले अलर्ट नियंत्रित करें')}>
        {[
          { key: 'bookingUpdates' as const, label: t('Booking Updates', 'बुकिंग अपडेट'), desc: t('Status changes, provider arrival', 'स्थिति बदलाव, प्रदाता आगमन') },
          { key: 'providerArrival' as const, label: t('Provider Arrival', 'प्रदाता आगमन'), desc: t('When provider is on the way', 'जब प्रदाता रास्ते में हो') },
          { key: 'sevaPoints' as const, label: t('SevaPoints Earned', 'SevaPoints मिले'), desc: t('Reward notifications', 'पुरस्कार सूचनाएं') },
          { key: 'pushNotifs' as const, label: t('All Push Notifications', 'सभी पुश सूचनाएं'), desc: t('Master toggle for push alerts', 'पुश अलर्ट का मास्टर टॉगल') },
        ].map(item => (
          <SettingRow key={item.key} label={item.label} desc={item.desc}>
            <Toggle on={notifs[item.key]} onChange={() => toggle(item.key)} />
          </SettingRow>
        ))}
      </SectionCard>

      <SectionCard title={t('SMS & Email', 'SMS और ईमेल')}>
        {[
          { key: 'smsAlerts' as const, label: t('SMS Alerts', 'SMS अलर्ट'), desc: t('OTP, booking confirmations via SMS', 'OTP, बुकिंग पुष्टि SMS द्वारा') },
          { key: 'emailDigest' as const, label: t('Weekly Email Digest', 'साप्ताहिक ईमेल'), desc: t('Summary of bookings & offers', 'बुकिंग और ऑफर का सारांश') },
          { key: 'promotions' as const, label: t('Promotional Offers', 'प्रमोशनल ऑफर'), desc: t('Discounts and special deals', 'छूट और विशेष ऑफर') },
          { key: 'govtSchemes' as const, label: t('Govt Scheme Alerts', 'सरकारी योजना अलर्ट'), desc: t('New schemes you may be eligible for', 'नई योजनाएं जिनके लिए आप पात्र हो सकते हैं') },
        ].map(item => (
          <SettingRow key={item.key} label={item.label} desc={item.desc}>
            <Toggle on={notifs[item.key]} onChange={() => toggle(item.key)} />
          </SettingRow>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── Language Section ─────────────────────────────────────────────────────────
function LanguageSection({ lang }: { lang: Lang }) {
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const [selectedLang, setSelectedLang] = useAppLanguage();

  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  ] as const;

  return (
    <div className="space-y-4">
      <SectionCard title={t('App Language', 'ऐप भाषा')} desc={t('Choose your preferred language for the app interface', 'ऐप इंटरफेस के लिए अपनी पसंदीदा भाषा चुनें')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {languages.map(l => (
            <button
              key={l.code}
              onClick={() => setSelectedLang(l.code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                selectedLang === l.code
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span>{l.flag}</span>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold truncate">{l.native}</p>
                <p className="text-[10px] text-muted-foreground truncate">{l.name}</p>
              </div>
              {selectedLang === l.code && <Check size={12} className="ml-auto shrink-0 text-primary" />}
            </button>
          ))}
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {t('Language changes apply throughout the app immediately.', 'भाषा परिवर्तन तुरंत पूरे ऐप में लागू होता है।')}
          </p>
        </div>
      </SectionCard>

    </div>
  );
}

// ─── Appearance Section ───────────────────────────────────────────────────────
function AppearanceSection({ lang }: { lang: Lang }) {
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const [isDark, setDark] = useState(() => localStorage.getItem('seva-theme') === 'dark');
  const changeTheme = (dark: boolean) => { setDark(dark); document.documentElement.classList.toggle('dark', dark); localStorage.setItem('seva-theme', dark ? 'dark' : 'light'); };

  return (
    <div className="space-y-4">
      <SectionCard title={t('Theme', 'थीम')} desc={t('Choose how SevaSetu looks on your device', 'SevaSetu आपके डिवाइस पर कैसा दिखे यह चुनें')}>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'light' as const, label: t('Light', 'लाइट'), icon: <Sun size={18} /> },
            { id: 'dark' as const, label: t('Dark', 'डार्क'), icon: <Moon size={18} /> },
          ]).map(opt => (
            <button
              key={opt.id}
              onClick={() => changeTheme(opt.id === 'dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                (isDark ? 'dark' : 'light') === opt.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {opt.icon}
              <span className="text-xs font-bold">{opt.label}</span>
              {(isDark ? 'dark' : 'light') === opt.id && <Check size={12} className="text-primary" />}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('Display', 'दिखावट')} desc={t('Theme is saved on this device.', 'थीम इस डिवाइस पर सहेजी जाती है।')}>
        <SettingRow label={t('Dark mode', 'डार्क मोड')}><Toggle on={isDark} onChange={changeTheme} /></SettingRow>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [lang, setLang] = useAppLanguage();
  const isProvider = localStorage.getItem('sevasetu-role') === 'provider';
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [account, setAccount] = useState({ name: 'User', city: 'India' });
  const [notifications, setNotifications] = useState(0);
  useEffect(() => {
    apiRequest<{ user: { name?: string; city?: string } }>('/auth/me').then(({ user }) => {
      setAccount({ name: user.name || 'User', city: user.city || 'India' });
      localStorage.setItem('sevasetu-user-name', user.name || 'User');
      localStorage.setItem('sevasetu-user-city', user.city || 'India');
    }).catch(() => undefined);
    apiRequest<{ bookings: Array<{ status: string }> }>('/bookings').then(({ bookings }) => setNotifications(bookings.filter(item => ['confirmed', 'assigned', 'in_progress'].includes(item.status)).length)).catch(() => undefined);
  }, []);

  const customerNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: <LayoutDashboard size={17} /> },
    { href: '/services', label: 'Book Service', labelHi: 'सेवा बुक करें', icon: <ShoppingBag size={17} /> },
    { href: '/tracker', label: 'Track Order', labelHi: 'ऑर्डर ट्रैक करें', icon: <MapPin size={17} /> },
    { href: '/rewards', label: 'Rewards', labelHi: 'पुरस्कार', icon: <Gift size={17} /> },
    { href: '/schemes', label: 'Govt Schemes', labelHi: 'सरकारी योजनाएं', icon: <Building2 size={17} /> },
    { href: '/assistant', label: 'AI Assistant', labelHi: 'AI सहायक', icon: <Zap size={17} /> },
  ];
  const navItems: NavItem[] = isProvider ? [
    { href: '/provider-dashboard', label: 'Provider dashboard', labelHi: 'प्रदाता डैशबोर्ड', icon: <LayoutDashboard size={17} /> },
    { href: '/assistant', label: 'Seva AI', labelHi: 'सेवा AI', icon: <Zap size={17} /> },
  ] : customerNavItems;
  const visibleSections = isProvider ? sections.filter((section) => section.id !== 'payments') : sections;

  const activeInfo = sections.find(s => s.id === activeSection)!;

  return (
    <DashboardLayout
      navItems={navItems}
      userType={isProvider ? 'provider' : 'user'}
      userName={account.name}
      userCity={account.city}
      lang={lang}
      onLangToggle={() => setLang(l => l === 'en' ? 'hi' : 'en')}
      notifications={notifications}
    >
      <title>Settings – SevaSetu</title>

      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl font-black text-foreground">
            {lang === 'hi' ? 'सेटिंग्स' : 'Settings'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {lang === 'hi' ? 'अपना अकाउंट और प्राथमिकताएं प्रबंधित करें' : 'Manage your account and preferences'}
          </p>
        </div>
        <PhotoBanner scene="urban" alt="People and services in an urban community" caption="Your SevaSetu account" className="mb-6" />

        <div className="flex gap-5 items-start">

          {/* ── Section Nav (desktop sidebar) ─────────────────────────────── */}
          <nav className="hidden lg:flex flex-col w-52 shrink-0 bg-background rounded-2xl border border-border overflow-hidden">
            {visibleSections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-border last:border-0 ${
                  activeSection === s.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span className="shrink-0">{s.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{lang === 'hi' ? s.labelHi : s.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{lang === 'hi' ? s.descHi : s.desc}</p>
                </div>
                {activeSection === s.id && <ChevronRight size={12} className="ml-auto shrink-0 text-primary" />}
              </button>
            ))}
          </nav>

          {/* ── Mobile Section Tabs ────────────────────────────────────────── */}
          <div className="lg:hidden w-full mb-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {visibleSections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    activeSection === s.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s.icon}
                  {lang === 'hi' ? s.labelHi : s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {activeInfo.icon}
              </div>
              <div>
                <h2 className="text-sm font-black text-foreground">{lang === 'hi' ? activeInfo.labelHi : activeInfo.label}</h2>
                <p className="text-xs text-muted-foreground">{lang === 'hi' ? activeInfo.descHi : activeInfo.desc}</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                {activeSection === 'profile'       && <ProfileSection lang={lang} />}
                {activeSection === 'notifications' && <NotificationsSection lang={lang} />}
                {activeSection === 'language'      && <LanguageSection lang={lang} />}
                {activeSection === 'appearance'    && <AppearanceSection lang={lang} />}
                {activeSection === 'payments' && <section className="rounded-2xl border border-border bg-background p-5"><p className="mb-4 text-sm text-muted-foreground">{lang === 'hi' ? 'बुकिंग इतिहास और भुगतान स्थिति देखें। सेवा के बाद प्रदाता को सीधे भुगतान करें।' : 'Review booking history and payment status. Pay providers directly after the service.'}</p><Link to="/payment" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">{lang === 'hi' ? 'बुकिंग इतिहास खोलें' : 'Open booking history'} <ChevronRight size={14}/></Link></section>}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
