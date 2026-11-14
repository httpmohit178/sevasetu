import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  User, Bell, Globe, Palette, Shield, CreditCard,
  ChevronRight, Camera, Check, Sun, Moon, Smartphone,
  Lock, Eye, EyeOff, Trash2, Save,
  LayoutDashboard, ShoppingBag, MapPin, Gift, Zap, Building2,
  Info
} from 'lucide-react';
import DashboardLayout, { NavItem } from '@/layouts/DashboardLayout';
import { apiRequest } from '@/lib/api-client';
import { PhotoBanner } from '../components/ui/photo-banner';
import { imageSources } from '../lib/image-sources';

type Lang = 'en' | 'hi';
type Section = 'profile' | 'notifications' | 'language' | 'appearance' | 'security' | 'payments';

// ─── Section Nav ──────────────────────────────────────────────────────────────
const sections: { id: Section; label: string; labelHi: string; icon: React.ReactNode; desc: string; descHi: string }[] = [
  { id: 'profile',       label: 'Profile',        labelHi: 'प्रोफ़ाइल',      icon: <User size={16} />,       desc: 'Name, photo, contact info',          descHi: 'नाम, फोटो, संपर्क जानकारी' },
  { id: 'notifications', label: 'Notifications',  labelHi: 'सूचनाएं',        icon: <Bell size={16} />,       desc: 'Alerts, reminders, updates',         descHi: 'अलर्ट, रिमाइंडर, अपडेट' },
  { id: 'language',      label: 'Language',       labelHi: 'भाषा',           icon: <Globe size={16} />,      desc: 'App language & region',              descHi: 'ऐप भाषा और क्षेत्र' },
  { id: 'appearance',    label: 'Appearance',     labelHi: 'दिखावट',         icon: <Palette size={16} />,    desc: 'Theme, font size, display',          descHi: 'थीम, फ़ॉन्ट साइज़, डिस्प्ले' },
  { id: 'security',      label: 'Security',       labelHi: 'सुरक्षा',        icon: <Shield size={16} />,     desc: 'Password, PIN, 2FA',                 descHi: 'पासवर्ड, PIN, 2FA' },
  { id: 'payments',      label: 'Payments',       labelHi: 'भुगतान',         icon: <CreditCard size={16} />, desc: 'UPI, cards, wallet balance',         descHi: 'UPI, कार्ड, वॉलेट बैलेंस' },
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
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center text-white hover:bg-primary/90 transition-all">
              <Camera size={11} />
            </button>
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

      {/* Danger Zone */}
      <SectionCard title={t('Danger Zone', 'खतरनाक क्षेत्र')}>
        <div className="flex items-center justify-between p-3 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10">
          <div>
            <p className="text-sm font-bold text-red-600">{t('Delete Account', 'अकाउंट हटाएं')}</p>
            <p className="text-xs text-red-500/80">{t('Permanently delete your account and all data', 'अकाउंट और सभी डेटा स्थायी रूप से हटाएं')}</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-300 dark:border-red-800 px-3 py-1.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/30 transition-all">
            <Trash2 size={13} /> {t('Delete', 'हटाएं')}
          </button>
        </div>
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

  const toggle = (key: keyof typeof notifs) => setNotifs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-4">
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
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedRegion, setSelectedRegion] = useState('IN-DL');

  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  const regions = [
    { code: 'IN-DL', name: t('Delhi', 'दिल्ली') },
    { code: 'IN-MH', name: t('Maharashtra', 'महाराष्ट्र') },
    { code: 'IN-KA', name: t('Karnataka', 'कर्नाटक') },
    { code: 'IN-TN', name: t('Tamil Nadu', 'तमिलनाडु') },
    { code: 'IN-WB', name: t('West Bengal', 'पश्चिम बंगाल') },
    { code: 'IN-GJ', name: t('Gujarat', 'गुजरात') },
    { code: 'IN-UP', name: t('Uttar Pradesh', 'उत्तर प्रदेश') },
    { code: 'IN-RJ', name: t('Rajasthan', 'राजस्थान') },
  ];

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
            {t('Language change will apply after you restart the app.', 'भाषा परिवर्तन ऐप पुनः आरंभ करने के बाद लागू होगा।')}
          </p>
        </div>
      </SectionCard>

      <SectionCard title={t('Region', 'क्षेत्र')} desc={t('Set your state for relevant government schemes and services', 'प्रासंगिक सरकारी योजनाओं और सेवाओं के लिए अपना राज्य सेट करें')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {regions.map(r => (
            <button
              key={r.code}
              onClick={() => setSelectedRegion(r.code)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                selectedRegion === r.code
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Appearance Section ───────────────────────────────────────────────────────
function AppearanceSection({ lang }: { lang: Lang }) {
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);

  return (
    <div className="space-y-4">
      <SectionCard title={t('Theme', 'थीम')} desc={t('Choose how SevaSetu looks on your device', 'SevaSetu आपके डिवाइस पर कैसा दिखे यह चुनें')}>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'light' as const, label: t('Light', 'लाइट'), icon: <Sun size={18} /> },
            { id: 'dark' as const, label: t('Dark', 'डार्क'), icon: <Moon size={18} /> },
            { id: 'system' as const, label: t('System', 'सिस्टम'), icon: <Smartphone size={18} /> },
          ]).map(opt => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                theme === opt.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {opt.icon}
              <span className="text-xs font-bold">{opt.label}</span>
              {theme === opt.id && <Check size={12} className="text-primary" />}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('Text Size', 'टेक्स्ट साइज़')}>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'small' as const, label: t('Small', 'छोटा'), size: 'text-xs' },
            { id: 'medium' as const, label: t('Medium', 'मध्यम'), size: 'text-sm' },
            { id: 'large' as const, label: t('Large', 'बड़ा'), size: 'text-base' },
          ]).map(opt => (
            <button
              key={opt.id}
              onClick={() => setFontSize(opt.id)}
              className={`py-3 rounded-xl border-2 font-bold transition-all ${opt.size} ${
                fontSize === opt.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t('Display Options', 'डिस्प्ले विकल्प')}>
        <SettingRow label={t('Compact Mode', 'कॉम्पैक्ट मोड')} desc={t('Reduce spacing for more content on screen', 'स्क्रीन पर अधिक सामग्री के लिए स्पेसिंग कम करें')}>
          <Toggle on={compactMode} onChange={setCompactMode} />
        </SettingRow>
        <SettingRow label={t('Animations', 'एनिमेशन')} desc={t('Enable smooth transitions and effects', 'स्मूद ट्रांज़िशन और इफेक्ट सक्षम करें')}>
          <Toggle on={animations} onChange={setAnimations} />
        </SettingRow>
      </SectionCard>
    </div>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────
function SecuritySection({ lang }: { lang: Lang }) {
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const [showPass, setShowPass] = useState(false);
  const [twoFA, setTwoFA] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <div className="space-y-4">
      <SectionCard title={t('Change Password', 'पासवर्ड बदलें')}>
        <div className="space-y-3">
          {[
            { label: t('Current Password', 'वर्तमान पासवर्ड'), placeholder: '••••••••' },
            { label: t('New Password', 'नया पासवर्ड'), placeholder: t('Min 8 characters', 'न्यूनतम 8 अक्षर') },
            { label: t('Confirm New Password', 'नया पासवर्ड पुष्टि करें'), placeholder: '••••••••' },
          ].map((field, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">{field.label}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {i === 0 && (
                  <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
            <Lock size={14} /> {t('Update Password', 'पासवर्ड अपडेट करें')}
          </button>
        </div>
      </SectionCard>

      <SectionCard title={t('Security Options', 'सुरक्षा विकल्प')}>
        <SettingRow label={t('Two-Factor Authentication', 'दो-चरण प्रमाणीकरण')} desc={t('Extra security via OTP on login', 'लॉगिन पर OTP द्वारा अतिरिक्त सुरक्षा')}>
          <Toggle on={twoFA} onChange={setTwoFA} />
        </SettingRow>
        <SettingRow label={t('Biometric Login', 'बायोमेट्रिक लॉगिन')} desc={t('Use fingerprint or face ID', 'फिंगरप्रिंट या फेस ID का उपयोग करें')}>
          <Toggle on={biometric} onChange={setBiometric} />
        </SettingRow>
        <SettingRow label={t('Login Alerts', 'लॉगिन अलर्ट')} desc={t('Get notified of new sign-ins', 'नए साइन-इन की सूचना पाएं')}>
          <Toggle on={loginAlerts} onChange={setLoginAlerts} />
        </SettingRow>
      </SectionCard>

      <SectionCard title={t('Active Sessions', 'सक्रिय सत्र')}>
        {[
          { device: t('Chrome · Windows 11', 'Chrome · Windows 11'), location: t('New Delhi, IN', 'नई दिल्ली, IN'), time: t('Now (current)', 'अभी (वर्तमान)'), current: true },
          { device: t('SevaSetu App · Android', 'SevaSetu App · Android'), location: t('New Delhi, IN', 'नई दिल्ली, IN'), time: '2 days ago', current: false },
        ].map((session, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${session.current ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                <Smartphone size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{session.device}</p>
                <p className="text-[10px] text-muted-foreground">{session.location} · {session.time}</p>
              </div>
            </div>
            {session.current
              ? <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-950/30 px-2 py-0.5 rounded-full">{t('Active', 'सक्रिय')}</span>
              : <button className="text-[10px] font-bold text-red-500 hover:underline">{t('Revoke', 'रद्द करें')}</button>
            }
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

// ─── Payments Section ─────────────────────────────────────────────────────────
function PaymentsSection({ lang }: { lang: Lang }) {
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  return (
    <div className="space-y-4">
      <SectionCard title={t('Wallet Balance', 'वॉलेट बैलेंस')}>
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white">
          <div>
            <p className="text-white/70 text-xs">{t('Available Balance', 'उपलब्ध बैलेंस')}</p>
            <p className="text-3xl font-black">₹250.00</p>
            <p className="text-white/60 text-[10px] mt-0.5">{t('Last added: ₹500 on Apr 1', 'अंतिम जोड़: ₹500 on Apr 1')}</p>
          </div>
          <button className="bg-white text-primary text-xs font-bold px-4 py-2 rounded-full hover:bg-white/90 transition-all">
            {t('Add Money', 'पैसे जोड़ें')}
          </button>
        </div>
      </SectionCard>

      <SectionCard title={t('Saved UPI IDs', 'सहेजे UPI ID')} desc={t('Manage your UPI payment methods', 'अपने UPI भुगतान तरीके प्रबंधित करें')}>
        {[
          { id: 'priya@gpay', app: 'Google Pay', icon: '🟢', primary: true },
          { id: 'priya@paytm', app: 'Paytm', icon: '🔵', primary: false },
        ].map((upi, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xl">{upi.icon}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{upi.id}</p>
                <p className="text-xs text-muted-foreground">{upi.app}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {upi.primary && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t('Primary', 'प्राथमिक')}</span>}
              <button className="text-xs text-red-500 hover:underline font-semibold">{t('Remove', 'हटाएं')}</button>
            </div>
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all font-semibold">
          + {t('Add UPI ID', 'UPI ID जोड़ें')}
        </button>
      </SectionCard>

      <SectionCard title={t('Saved Cards', 'सहेजे कार्ड')}>
        {[
          { last4: '4242', brand: 'Visa', expiry: '12/26', icon: '💳' },
        ].map((card, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xl">{card.icon}</span>
              <div>
                <p className="text-sm font-bold text-foreground">{card.brand} •••• {card.last4}</p>
                <p className="text-xs text-muted-foreground">{t('Expires', 'समाप्त')} {card.expiry}</p>
              </div>
            </div>
            <button className="text-xs text-red-500 hover:underline font-semibold">{t('Remove', 'हटाएं')}</button>
          </div>
        ))}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all font-semibold">
          + {t('Add Card', 'कार्ड जोड़ें')}
        </button>
      </SectionCard>

      <SectionCard title={t('Transaction History', 'लेनदेन इतिहास')}>
        {[
          { desc: t('Plumbing Repair', 'प्लंबिंग मरम्मत'), date: 'Apr 4', amount: -350, icon: '🔧' },
          { desc: t('Wallet Top-up', 'वॉलेट टॉप-अप'), date: 'Apr 1', amount: +500, icon: '💰' },
          { desc: t('House Cleaning', 'घर की सफाई'), date: 'Mar 28', amount: -500, icon: '🧹' },
        ].map((tx, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-base">{tx.icon}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{tx.desc}</p>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
            </div>
            <p className={`text-sm font-black ${tx.amount > 0 ? 'text-green-600' : 'text-foreground'}`}>
              {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
            </p>
          </div>
        ))}
        <Link to="/payment" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
          {t('View all transactions', 'सभी लेनदेन देखें')} <ChevronRight size={12} />
        </Link>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [activeSection, setActiveSection] = useState<Section>('profile');

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: <LayoutDashboard size={17} /> },
    { href: '/services', label: 'Book Service', labelHi: 'सेवा बुक करें', icon: <ShoppingBag size={17} /> },
    { href: '/tracker', label: 'Track Order', labelHi: 'ऑर्डर ट्रैक करें', icon: <MapPin size={17} /> },
    { href: '/rewards', label: 'Rewards', labelHi: 'पुरस्कार', icon: <Gift size={17} /> },
    { href: '/schemes', label: 'Govt Schemes', labelHi: 'सरकारी योजनाएं', icon: <Building2 size={17} /> },
    { href: '/assistant', label: 'AI Assistant', labelHi: 'AI सहायक', icon: <Zap size={17} /> },
  ];

  const activeInfo = sections.find(s => s.id === activeSection)!;

  return (
    <DashboardLayout
      navItems={navItems}
      userType="user"
      userName="Priya Sharma"
      userCity="New Delhi"
      lang={lang}
      onLangToggle={() => setLang(l => l === 'en' ? 'hi' : 'en')}
      notifications={2}
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
        <PhotoBanner src={imageSources.community} alt="Four colleagues collaborating around a laptop in a modern office" caption="Four colleagues collaborating around a laptop" className="mb-6" />

        <div className="flex gap-5 items-start">

          {/* ── Section Nav (desktop sidebar) ─────────────────────────────── */}
          <nav className="hidden lg:flex flex-col w-52 shrink-0 bg-background rounded-2xl border border-border overflow-hidden">
            {sections.map(s => (
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
              {sections.map(s => (
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
                {activeSection === 'security'      && <SecuritySection lang={lang} />}
                {activeSection === 'payments'      && <PaymentsSection lang={lang} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
