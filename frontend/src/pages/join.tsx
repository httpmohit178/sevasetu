import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, CheckCircle, Shield, Zap,
  Phone, Globe, Star, TrendingUp, Users, Briefcase,
  MapPin, Camera, Upload, ChevronDown
} from 'lucide-react';
import { apiRequest } from '../lib/api-client';
import { PhotoBanner } from '../components/ui/photo-banner';
import { imageSources } from '../lib/image-sources';

type Lang = 'en' | 'hi';
type Step = 'intro' | 'personal' | 'skills' | 'docs' | 'success';

// ─── Service Categories ───────────────────────────────────────────────────────
const serviceCategories = [
  { id: 'plumbing', label: 'Plumbing', labelHi: 'प्लंबिंग', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', labelHi: 'इलेक्ट्रिकल', icon: '⚡' },
  { id: 'cleaning', label: 'Cleaning', labelHi: 'सफाई', icon: '🧹' },
  { id: 'painting', label: 'Painting', labelHi: 'पेंटिंग', icon: '🎨' },
  { id: 'carpentry', label: 'Carpentry', labelHi: 'बढ़ईगीरी', icon: '🪚' },
  { id: 'cooking', label: 'Cooking/Chef', labelHi: 'खाना पकाना', icon: '👨‍🍳' },
  { id: 'tutoring', label: 'Tutoring', labelHi: 'ट्यूटरिंग', icon: '📚' },
  { id: 'driving', label: 'Driving', labelHi: 'ड्राइविंग', icon: '🚗' },
  { id: 'beauty', label: 'Beauty/Salon', labelHi: 'ब्यूटी/सैलून', icon: '💇' },
  { id: 'ac', label: 'AC Repair', labelHi: 'AC मरम्मत', icon: '❄️' },
  { id: 'gardening', label: 'Gardening', labelHi: 'बागवानी', icon: '🌱' },
  { id: 'security', label: 'Security Guard', labelHi: 'सुरक्षा गार्ड', icon: '🛡️' },
];

const cities = [
  'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Patna', 'Bhopal', 'Indore', 'Nagpur', 'Surat',
  'Varanasi', 'Agra', 'Kanpur', 'Meerut', 'Ranchi',
];

// ─── Step Indicator ───────────────────────────────────────────────────────────
const steps: { id: Step; label: string; labelHi: string }[] = [
  { id: 'personal', label: 'Personal', labelHi: 'व्यक्तिगत' },
  { id: 'skills', label: 'Skills', labelHi: 'कौशल' },
  { id: 'docs', label: 'Documents', labelHi: 'दस्तावेज़' },
];

function StepBar({ current, lang }: { current: Step; lang: Lang }) {
  const idx = steps.findIndex(s => s.id === current);
  if (idx < 0) return null;
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
            i < idx ? 'bg-secondary text-white' :
            i === idx ? 'bg-primary text-white shadow-lg shadow-primary/30' :
            'bg-muted text-muted-foreground border border-border'
          }`}>
            {i < idx ? <CheckCircle size={14} /> : i + 1}
          </div>
          <div className="flex-1 flex flex-col ml-1.5 mr-3">
            <span className={`text-[10px] font-semibold ${i === idx ? 'text-primary' : i < idx ? 'text-secondary' : 'text-muted-foreground'}`}>
              {lang === 'hi' ? s.labelHi : s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`h-0.5 mt-1 rounded-full ${i < idx ? 'bg-secondary' : 'bg-border'}`} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function JoinPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<Step>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    name: '', phone: '', city: '', address: '',
    experience: '1', aadhaar: '', pan: '', photo: false,
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    setSubmitError('');
    setIsLoading(true);
    try {
      if (step === 'personal') setStep('skills');
      else if (step === 'skills') setStep('docs');
      else if (step === 'docs') {
        await apiRequest('/providers', { method: 'POST', body: JSON.stringify({ ...form, skills: selectedSkills }) });
        setStep('success');
        setTimeout(() => navigate('/provider-dashboard'), 1200);
      }
    } catch (error) { setSubmitError(error instanceof Error ? error.message : 'Could not submit your provider application'); }
    finally { setIsLoading(false); }
  };

  const canProceed = () => {
    if (step === 'personal') return form.name && form.phone.length >= 10 && form.city;
    if (step === 'skills') return selectedSkills.length > 0;
    if (step === 'docs') return form.aadhaar.length >= 4;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {submitError && <div role="alert" className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">{submitError}</div>}
      <title>Join as Provider – SevaSetu | Earn with Your Skills</title>
      <meta name="description" content="Join SevaSetu as a service provider. Earn ₹500–2000/day, get verified, and connect with customers across India." />

      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M36 20 A16 16 0 0 1 20 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M4 20 A16 16 0 0 1 20 4" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
              <circle cx="20" cy="20" r="7" fill="white" opacity="0.2"/>
              <circle cx="20" cy="20" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return <line key={i} x1={20+3*Math.cos(rad)} y1={20+3*Math.sin(rad)} x2={20+6.5*Math.cos(rad)} y2={20+6.5*Math.sin(rad)} stroke="white" strokeWidth="0.8"/>;
              })}
              <circle cx="20" cy="20" r="2" fill="white"/>
            </svg>
            <div>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Seva<span className="text-yellow-300">Setu</span>
              </p>
              <p className="text-xs font-semibold" style={{ color: '#FF9933' }}>Connecting Bharat</p>
            </div>
          </Link>
        </div>

        {/* Center */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 text-white text-xs font-semibold mb-4">
            <Briefcase size={12} /> {lang === 'hi' ? 'प्रदाता बनें' : 'Become a Provider'}
          </div>
          <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
            {lang === 'hi' ? 'अपने हुनर से\nकमाई करें' : 'Earn with\nYour Skills'}
          </h2>
          <p className="text-white/75 text-base mb-8">
            {lang === 'hi'
              ? '50,000+ प्रदाता रोज़ ₹500–2,000 कमा रहे हैं'
              : '50,000+ providers earning ₹500–2,000 daily'}
          </p>

          {/* Earnings cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: lang === 'hi' ? 'औसत दैनिक कमाई' : 'Avg Daily Earning', value: '₹850', icon: TrendingUp },
              { label: lang === 'hi' ? 'सक्रिय प्रदाता' : 'Active Providers', value: '50K+', icon: Users },
              { label: lang === 'hi' ? 'औसत रेटिंग' : 'Avg Rating', value: '4.8★', icon: Star },
              { label: lang === 'hi' ? 'शहर कवरेज' : 'City Coverage', value: '200+', icon: MapPin },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <Icon size={14} className="text-yellow-300 mb-1" />
                <p className="text-white font-black text-lg">{value}</p>
                <p className="text-white/60 text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            {[
              lang === 'hi' ? 'मुफ्त प्रोफाइल और वेरिफिकेशन' : 'Free profile & verification',
              lang === 'hi' ? 'सीधे बैंक में भुगतान' : 'Direct bank payments',
              lang === 'hi' ? 'AI से ग्राहक मिलान' : 'AI-powered customer matching',
              lang === 'hi' ? '24/7 सहायता' : '24/7 support',
            ].map(b => (
              <div key={b} className="flex items-center gap-2">
                <CheckCircle size={13} className="text-yellow-300 shrink-0" />
                <span className="text-white/80 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 rounded-2xl p-4">
          <p className="text-white/85 text-sm italic mb-2">
            "{lang === 'hi' ? 'SevaSetu से जुड़कर मेरी कमाई दोगुनी हो गई। अब घर बैठे काम मिलता है।' : 'Joining SevaSetu doubled my income. I get work from home now.'}"
          </p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">R</div>
            <div>
              <p className="text-white text-xs font-bold">Ramesh Kumar</p>
              <p className="text-white/60 text-[10px]">{lang === 'hi' ? 'प्लंबर, दिल्ली' : 'Plumber, Delhi'}</p>
            </div>
            <div className="ml-auto flex">
              {[1,2,3,4,5].map(s => <Star key={s} size={10} className="text-yellow-400 fill-yellow-400" />)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 text-center w-full">
          <Link to="/" className="inline-flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M36 20 A16 16 0 0 1 20 36" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M4 20 A16 16 0 0 1 20 4" stroke="#000080" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="20" cy="20" r="7" fill="#000080"/>
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return <line key={i} x1={20+3*Math.cos(rad)} y1={20+3*Math.sin(rad)} x2={20+6.5*Math.cos(rad)} y2={20+6.5*Math.sin(rad)} stroke="white" strokeWidth="0.8"/>;
              })}
              <circle cx="20" cy="20" r="2" fill="white"/>
            </svg>
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Seva<span className="text-primary">Setu</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <PhotoBanner src={imageSources.provider} alt="Plumber repairing plumbing in a bathroom" caption="Plumber repairing plumbing in a bathroom" className="mb-5" />
          {/* Lang toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              <Globe size={12} />
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>

          <AnimatePresence mode="wait">

            {/* ── INTRO ───────────────────────────────────────────────── */}
            {step === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'प्रदाता बनें 🙌' : 'Become a Provider 🙌'}
                </h1>
                <p className="text-muted-foreground text-sm mb-6">
                  {lang === 'hi' ? 'अपने हुनर से रोज़ ₹500–2,000 कमाएं' : 'Earn ₹500–2,000 daily with your skills'}
                </p>

                {/* Steps preview */}
                <div className="space-y-3 mb-6">
                  {[
                    { step: '1', title: lang === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Details', desc: lang === 'hi' ? 'नाम, फोन, शहर' : 'Name, phone, city', icon: Phone },
                    { step: '2', title: lang === 'hi' ? 'कौशल चुनें' : 'Choose Your Skills', desc: lang === 'hi' ? 'आप क्या काम करते हैं' : 'What services you offer', icon: Briefcase },
                    { step: '3', title: lang === 'hi' ? 'दस्तावेज़ अपलोड करें' : 'Upload Documents', desc: lang === 'hi' ? 'आधार और फोटो' : 'Aadhaar & photo', icon: Upload },
                  ].map(({ step: s, title, desc, icon: Icon }) => (
                    <div key={s} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <span className="ml-auto text-xs font-bold text-muted-foreground">0{s}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep('personal')}
                  className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 mb-3"
                >
                  {lang === 'hi' ? 'अभी शुरू करें' : 'Start Registration'} <ArrowRight size={15} />
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    {lang === 'hi' ? 'लॉगिन करें' : 'Login'}
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── PERSONAL ────────────────────────────────────────────── */}
            {step === 'personal' && (
              <motion.div key="personal" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <button onClick={() => setStep('intro')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground">
                  <ArrowLeft size={15} /> {lang === 'hi' ? 'वापस' : 'Back'}
                </button>
                <StepBar current="personal" lang={lang} />

                <h2 className="text-xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'व्यक्तिगत जानकारी' : 'Personal Details'}
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  {lang === 'hi' ? 'अपनी बुनियादी जानकारी भरें' : 'Fill in your basic information'}
                </p>

                <div className="space-y-3">
                  {/* Photo upload */}
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => setForm(f => ({ ...f, photo: true }))}
                      className={`w-16 h-16 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                        form.photo ? 'border-secondary bg-secondary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {form.photo ? <CheckCircle size={22} className="text-secondary" /> : <Camera size={20} className="text-muted-foreground" />}
                    </button>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {lang === 'hi' ? 'प्रोफाइल फोटो' : 'Profile Photo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {form.photo ? (lang === 'hi' ? 'अपलोड हो गया ✓' : 'Uploaded ✓') : (lang === 'hi' ? 'टैप करके अपलोड करें' : 'Tap to upload')}
                      </p>
                    </div>
                  </div>

                  {[
                    { key: 'name', label: lang === 'hi' ? 'पूरा नाम *' : 'Full Name *', placeholder: lang === 'hi' ? 'आपका नाम' : 'Your full name', type: 'text' },
                    { key: 'phone', label: lang === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *', placeholder: '98765 43210', type: 'tel' },
                    { key: 'address', label: lang === 'hi' ? 'पता' : 'Address', placeholder: lang === 'hi' ? 'मकान नंबर, गली, मोहल्ला' : 'House no, street, locality', type: 'text' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">{field.label}</label>
                      <input
                        type={field.type}
                        value={form[field.key as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [field.key]: field.key === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                      />
                    </div>
                  ))}

                  {/* City select */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      {lang === 'hi' ? 'शहर *' : 'City *'}
                    </label>
                    <div className="relative">
                      <select
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        className="w-full bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground appearance-none"
                      >
                        <option value="">{lang === 'hi' ? 'शहर चुनें' : 'Select city'}</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      {lang === 'hi' ? 'अनुभव (वर्षों में)' : 'Experience (years)'}
                    </label>
                    <div className="flex gap-2">
                      {['<1', '1', '2-3', '4-5', '5+'].map(exp => (
                        <button
                          key={exp}
                          onClick={() => setForm(f => ({ ...f, experience: exp }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            form.experience === exp ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SKILLS ──────────────────────────────────────────────── */}
            {step === 'skills' && (
              <motion.div key="skills" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <button onClick={() => setStep('personal')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground">
                  <ArrowLeft size={15} /> {lang === 'hi' ? 'वापस' : 'Back'}
                </button>
                <StepBar current="skills" lang={lang} />

                <h2 className="text-xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'अपने कौशल चुनें' : 'Choose Your Skills'}
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  {lang === 'hi' ? 'एक या अधिक सेवाएं चुनें जो आप प्रदान करते हैं' : 'Select one or more services you offer'}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {serviceCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => toggleSkill(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        selectedSkills.includes(cat.id)
                          ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                          : 'border-border hover:border-primary/40 bg-card'
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-[10px] font-semibold text-foreground text-center leading-tight">
                        {lang === 'hi' ? cat.labelHi : cat.label}
                      </span>
                      {selectedSkills.includes(cat.id) && (
                        <CheckCircle size={12} className="text-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {selectedSkills.length > 0 && (
                  <p className="text-xs text-primary font-semibold text-center">
                    {selectedSkills.length} {lang === 'hi' ? 'कौशल चुने गए' : 'skills selected'}
                  </p>
                )}
              </motion.div>
            )}

            {/* ── DOCS ────────────────────────────────────────────────── */}
            {step === 'docs' && (
              <motion.div key="docs" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <button onClick={() => setStep('skills')} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground">
                  <ArrowLeft size={15} /> {lang === 'hi' ? 'वापस' : 'Back'}
                </button>
                <StepBar current="docs" lang={lang} />

                <h2 className="text-xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'दस्तावेज़ अपलोड करें' : 'Upload Documents'}
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  {lang === 'hi' ? 'वेरिफिकेशन के लिए आवश्यक' : 'Required for verification'}
                </p>

                <div className="space-y-4">
                  {/* Aadhaar */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      {lang === 'hi' ? 'आधार नंबर (अंतिम 4 अंक) *' : 'Aadhaar Number (last 4 digits) *'}
                    </label>
                    <input
                      type="text"
                      value={form.aadhaar}
                      onChange={e => setForm(f => ({ ...f, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="XXXX"
                      className="w-full bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 font-mono tracking-widest"
                    />
                  </div>

                  {/* PAN */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      {lang === 'hi' ? 'PAN कार्ड (वैकल्पिक)' : 'PAN Card (optional)'}
                    </label>
                    <input
                      type="text"
                      value={form.pan}
                      onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase().slice(0, 10) }))}
                      placeholder="ABCDE1234F"
                      className="w-full bg-muted border-2 border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 font-mono tracking-wider"
                    />
                  </div>

                  {/* Upload boxes */}
                  {[
                    { label: lang === 'hi' ? 'आधार कार्ड फोटो' : 'Aadhaar Card Photo', icon: Upload },
                    { label: lang === 'hi' ? 'कौशल प्रमाण पत्र (वैकल्पिक)' : 'Skill Certificate (optional)', icon: Upload },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label}>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block">{label}</label>
                      <button className="w-full border-2 border-dashed border-border rounded-xl py-5 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                        <Icon size={20} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {lang === 'hi' ? 'टैप करके अपलोड करें' : 'Tap to upload'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">JPG, PNG, PDF • Max 5MB</span>
                      </button>
                    </div>
                  ))}

                  {/* Privacy note */}
                  <div className="flex items-start gap-2 bg-secondary/10 rounded-xl p-3">
                    <Shield size={14} className="text-secondary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      {lang === 'hi'
                        ? 'आपके दस्तावेज़ सुरक्षित हैं। केवल वेरिफिकेशन के लिए उपयोग किए जाएंगे।'
                        : 'Your documents are secure and will only be used for verification purposes.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SUCCESS ─────────────────────────────────────────────── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle size={48} className="text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {lang === 'hi' ? 'आवेदन सबमिट हुआ! 🎉' : 'Application Submitted! 🎉'}
                </h2>
                <p className="text-muted-foreground text-sm mb-5">
                  {lang === 'hi'
                    ? 'हम 24 घंटे में आपसे संपर्क करेंगे और वेरिफिकेशन पूरा करेंगे'
                    : 'We\'ll contact you within 24 hours to complete verification'}
                </p>

                <div className="space-y-2 mb-5">
                  {[
                    lang === 'hi' ? '✅ आवेदन प्राप्त हुआ' : '✅ Application received',
                    lang === 'hi' ? '🔍 वेरिफिकेशन 24 घंटे में' : '🔍 Verification within 24 hours',
                    lang === 'hi' ? '🚀 प्रोफाइल 48 घंटे में लाइव' : '🚀 Profile live within 48 hours',
                  ].map(s => (
                    <div key={s} className="bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground font-medium">{s}</div>
                  ))}
                </div>

                <div className="bg-primary/10 rounded-xl p-3 flex items-center justify-center gap-2">
                  <Zap size={16} className="text-primary" />
                  <span className="text-primary font-bold text-sm">+200 SevaPoints {lang === 'hi' ? 'मिलेंगे' : 'will be credited on approval'}</span>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  {lang === 'hi' ? 'होम पेज पर जा रहे हैं...' : 'Redirecting to home...'}
                </p>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Next / Submit button (shown for form steps) */}
          {(step === 'personal' || step === 'skills' || step === 'docs') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {step === 'docs'
                      ? (lang === 'hi' ? 'आवेदन सबमिट करें' : 'Submit Application')
                      : (lang === 'hi' ? 'अगला' : 'Next')}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
