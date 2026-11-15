import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Phone, ArrowRight, ArrowLeft, Shield, CheckCircle,
  Globe, Zap, Star, Users, RefreshCw
} from 'lucide-react';
import { apiRequest } from '../lib/api-client';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { SceneCard } from '../components/ui/scene-card';
import { PhotoBanner } from '../components/ui/photo-banner';

type Step = 'phone' | 'email' | 'otp' | 'profile' | 'success';

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OTPInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
    if (newOtp.every(d => d !== '')) onComplete(newOtp.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`login-otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`login-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-12 h-13 text-center text-xl font-bold bg-muted border-2 border-border rounded-xl outline-none focus:border-primary transition-colors text-foreground"
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function Countdown({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onEnd(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  return <span className="font-bold text-primary">{remaining}s</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [lang, setLang] = useAppLanguage();
  // Start on the direct email form so a normal sign-in is one screen.
  const [step, setStep] = useState<Step>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailName, setEmailName] = useState('');
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [canResend, setCanResend] = useState(false);
  const [resendKey, setResendKey] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');
  const [demoOtp, setDemoOtp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = (location.state as { from?: string } | null)?.from || new URLSearchParams(location.search).get('redirect');
  const redirectPath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '';
  const navigateAfterLogin = (role?: string) => navigate(redirectPath || (role === 'provider' ? '/provider-dashboard' : '/dashboard'), { replace: true });

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      const endpoint = emailMode === 'register' ? '/auth/register' : '/auth/login';
      const payload = emailMode === 'register'
        ? { name: emailName, email, password: emailPassword }
        : { email, password: emailPassword };
      const result = await apiRequest<{ token: string; user: { role?: string } }>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem('sevasetu-token', result.token);
      window.dispatchEvent(new Event('sevasetu-auth-change'));
      navigateAfterLogin(result.user.role);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not sign in'); }
    finally { setIsLoading(false); }
  };

  const handleSendOTP = async () => {
    if (phone.replace(/\D/g, '').length < 10) return;
    setIsLoading(true);
    setAuthError('');
    try {
      const result = await apiRequest<{ developmentCode?: string; demoMode?: boolean }>('/auth/otp', { method: 'POST', body: JSON.stringify({ phone }) });
      setDevelopmentCode(result.developmentCode || '');
      setDemoOtp(Boolean(result.demoMode));
      setCanResend(false);
      setStep('otp');
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not send a verification code'); }
    finally { setIsLoading(false); }
  };

  const handleOTPComplete = async (otp: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const result = await apiRequest<{ token: string; user: { name?: string; city?: string } }>('/auth/verify', { method: 'POST', body: JSON.stringify({ phone, code: otp }) });
      localStorage.setItem('sevasetu-token', result.token);
      setName(result.user.name || ''); setCity(result.user.city || ''); setStep(result.user.name ? 'success' : 'profile');
      window.dispatchEvent(new Event('sevasetu-auth-change'));
      if (result.user.name) setTimeout(() => navigateAfterLogin(), 1000);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not verify the code'); }
    finally { setIsLoading(false); }
  };

  const handleProfileSubmit = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    setAuthError('');
    try {
      await apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name, city }) });
      setStep('success');
      window.dispatchEvent(new Event('sevasetu-auth-change'));
      setTimeout(() => navigateAfterLogin(), 1200);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not save your profile'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <title>Login – SevaSetu | Sign in to Your Account</title>
      <meta name="description" content="Sign in or create a SevaSetu account with email and password, or use phone OTP." />

      {/* ── Left Panel (desktop) ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-primary flex-col justify-between p-12">
        <SceneCard scene="urban" alt="Animated city skyline" className="absolute inset-0 h-full w-full opacity-40" />
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-emerald-900/65 to-orange-900/75" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 -left-10 w-40 h-40 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M36 20 A16 16 0 0 1 20 36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M4 20 A16 16 0 0 1 20 4" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
              <circle cx="20" cy="20" r="7" fill="white" opacity="0.2"/>
              <circle cx="20" cy="20" r="7" stroke="white" strokeWidth="1.5" fill="none"/>
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return <line key={i} x1={20 + 3*Math.cos(rad)} y1={20 + 3*Math.sin(rad)} x2={20 + 6.5*Math.cos(rad)} y2={20 + 6.5*Math.sin(rad)} stroke="white" strokeWidth="0.8"/>;
              })}
              <circle cx="20" cy="20" r="2" fill="white"/>
            </svg>
            <div>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Seva<span className="text-yellow-300">Setu</span>
              </p>
              <p className="text-white/70 text-xs" style={{ color: '#FF9933' }}>Connecting Bharat</p>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            {lang === 'hi' ? 'भारत की सेवाएं,\nआपकी उंगलियों पर' : 'India\'s Services,\nAt Your Fingertips'}
          </h2>
          <p className="text-white/75 text-lg mb-8">
            {lang === 'hi'
              ? 'लॉगिन करें और 50,000+ विश्वसनीय प्रदाताओं तक पहुंचें'
              : 'Sign in and access 50,000+ trusted service providers'}
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: Zap, text: lang === 'hi' ? 'AI-संचालित सेवा बुकिंग' : 'AI-powered service booking' },
              { icon: Shield, text: lang === 'hi' ? 'सत्यापित और भरोसेमंद प्रदाता' : 'Verified & trusted providers' },
              { icon: Star, text: lang === 'hi' ? 'हर बुकिंग पर SevaPoints कमाएं' : 'Earn SevaPoints on every booking' },
              { icon: Users, text: lang === 'hi' ? '200+ शहरों और गांवों में उपलब्ध' : 'Available in 200+ cities & villages' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-white/85 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex gap-6">
          {[['50K+', lang === 'hi' ? 'प्रदाता' : 'Providers'], ['4.8★', lang === 'hi' ? 'रेटिंग' : 'Rating'], ['200+', lang === 'hi' ? 'शहर' : 'Cities']].map(([val, label]) => (
            <div key={label}>
              <p className="text-white font-black text-xl">{val}</p>
              <p className="text-white/60 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <path d="M20 4 A16 16 0 0 1 36 20" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M36 20 A16 16 0 0 1 20 36" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M20 36 A16 16 0 0 1 4 20" stroke="#138808" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M4 20 A16 16 0 0 1 20 4" stroke="#000080" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="20" cy="20" r="7" fill="#000080"/>
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                return <line key={i} x1={20 + 3*Math.cos(rad)} y1={20 + 3*Math.sin(rad)} x2={20 + 6.5*Math.cos(rad)} y2={20 + 6.5*Math.sin(rad)} stroke="white" strokeWidth="0.8"/>;
              })}
              <circle cx="20" cy="20" r="2" fill="white"/>
            </svg>
            <span className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Seva<span className="text-primary">Setu</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <PhotoBanner scene="urban" alt="Animated city skyline" caption="Urban and rural services, one account" className="mb-5 lg:hidden" />
          {/* Lang toggle */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
            >
              <Globe size={12} />
              {lang === 'en' ? 'हिंदी' : 'English'}
            </button>
          </div>

          <AnimatePresence mode="wait">

            {authError && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{authError}</p>}

            {/* ── STEP: Phone ─────────────────────────────────────────── */}
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'स्वागत है! 🙏' : 'Welcome! 🙏'}
                </h1>
                <p className="text-muted-foreground text-sm mb-6">
                  {lang === 'hi' ? 'अपना मोबाइल नंबर दर्ज करें' : 'Enter your mobile number to continue'}
                </p>

                {/* Phone input */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                  </label>
                  <div className="flex items-center gap-2 bg-muted border-2 border-border rounded-xl px-3 py-3 focus-within:border-primary transition-colors">
                    <div className="flex items-center gap-1.5 border-r border-border pr-2.5 shrink-0">
                      <span className="text-base">🇮🇳</span>
                      <span className="text-sm font-semibold text-foreground">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm font-mono tracking-wider"
                      onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                      autoFocus
                    />
                    {phone.length === 10 && <CheckCircle size={16} className="text-secondary shrink-0" />}
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={phone.length < 10 || isLoading}
                  className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 mb-4"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Phone size={15} />
                      {lang === 'hi' ? 'OTP भेजें' : 'Send OTP'}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{lang === 'hi' ? 'या' : 'or'}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  type="button"
                  onClick={() => { setAuthError(''); setStep('email'); }}
                  className="w-full py-3 rounded-full border-2 border-border text-foreground font-semibold text-sm hover:border-primary/40 hover:bg-muted transition-all flex items-center justify-center gap-2.5"
                >
                  <Shield size={16} />
                  {lang === 'hi' ? 'ईमेल और पासवर्ड से जारी रखें' : 'Continue with email and password'}
                </button>

                <p className="text-[10px] text-muted-foreground text-center mt-4">
                  {lang === 'hi'
                    ? 'जारी रखकर आप हमारी गोपनीयता नीति और उपयोग की शर्तों से सहमत हैं'
                    : 'By continuing, you agree to our Privacy Policy and Terms of Service'}
                </p>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {lang === 'hi' ? 'प्रदाता बनना चाहते हैं?' : 'Want to become a provider?'}{' '}
                  <Link to="/join" className="text-primary font-semibold hover:underline">
                    {lang === 'hi' ? 'यहां जुड़ें' : 'Join here'}
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP: Email sign-in / registration ───────────────────── */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
                <h1 className="mb-1 text-2xl font-bold text-foreground">
                  {emailMode === 'login' ? (lang === 'hi' ? 'ईमेल से साइन इन करें' : 'Sign in with email') : (lang === 'hi' ? 'अपना खाता बनाएं' : 'Create your account')}
                </h1>
                <p className="mb-5 text-sm text-muted-foreground">
                  {lang === 'hi' ? 'ईमेल और पासवर्ड से सुरक्षित रूप से जारी रखें।' : 'Use your email and password to continue securely.'}
                </p>
                <form onSubmit={(event) => void handleEmailSubmit(event)} className="space-y-3">
                  {emailMode === 'register' && <div>
                    <label htmlFor="auth-name" className="mb-1 block text-xs font-semibold">{lang === 'hi' ? 'पूरा नाम' : 'Full name'}</label>
                    <input id="auth-name" autoComplete="name" required maxLength={100} value={emailName} onChange={(event) => setEmailName(event.target.value)} className="w-full rounded-xl border-2 border-border bg-muted px-3 py-3 text-sm text-foreground outline-none focus:border-primary" placeholder={lang === 'hi' ? 'आपका नाम' : 'Your name'} />
                  </div>}
                  <div>
                    <label htmlFor="auth-email" className="mb-1 block text-xs font-semibold">{lang === 'hi' ? 'ईमेल' : 'Email'}</label>
                    <input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border-2 border-border bg-muted px-3 py-3 text-sm text-foreground outline-none focus:border-primary" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className="mb-1 block text-xs font-semibold">{lang === 'hi' ? 'पासवर्ड' : 'Password'}</label>
                    <input id="auth-password" type="password" autoComplete={emailMode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={200} value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} className="w-full rounded-xl border-2 border-border bg-muted px-3 py-3 text-sm text-foreground outline-none focus:border-primary" placeholder={lang === 'hi' ? 'कम से कम 8 अक्षर' : 'At least 8 characters'} />
                  </div>
                  <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-50">
                    {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <>{emailMode === 'login' ? (lang === 'hi' ? 'साइन इन करें' : 'Sign in') : (lang === 'hi' ? 'खाता बनाएं' : 'Create account')} <ArrowRight size={15} /></>}
                  </button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {emailMode === 'login' ? (lang === 'hi' ? 'नया उपयोगकर्ता?' : 'New to SevaSetu?') : (lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?')} {' '}
                  <button type="button" onClick={() => { setAuthError(''); setEmailMode(emailMode === 'login' ? 'register' : 'login'); }} className="font-semibold text-primary hover:underline">
                    {emailMode === 'login' ? (lang === 'hi' ? 'खाता बनाएं' : 'Create an account') : (lang === 'hi' ? 'साइन इन करें' : 'Sign in')}
                  </button>
                </p>
                <button type="button" onClick={() => { setAuthError(''); setStep('phone'); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
                  <Phone size={14} /> {lang === 'hi' ? 'फोन OTP से जारी रखें' : 'Continue with phone OTP'}
                </button>
              </motion.div>
            )}

            {/* ── STEP: OTP ───────────────────────────────────────────── */}
            {step === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-muted-foreground text-sm mb-5 hover:text-foreground">
                  <ArrowLeft size={15} /> {lang === 'hi' ? 'वापस' : 'Back'}
                </button>

                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Phone size={26} className="text-primary" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
                </h1>
                <p className="text-muted-foreground text-sm mb-6">
                  {lang === 'hi' ? `+91 ${phone} पर भेजा गया` : `Sent to +91 ${phone}`}
                </p>
                {developmentCode && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">{lang === 'hi' ? (demoOtp ? 'डेमो OTP:' : 'स्थानीय OTP:') : (demoOtp ? 'Demo OTP:' : 'Local development code:')} <strong>{developmentCode}</strong></p>}

                <div className="mb-6">
                  <OTPInput onComplete={handleOTPComplete} />
                </div>

                {isLoading && (
                  <div className="flex justify-center mb-4">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  {lang === 'hi' ? 'OTP नहीं मिला? ' : "Didn't receive OTP? "}
                  {canResend ? (
                    <button
                      onClick={() => { setCanResend(false); setResendKey(k => k + 1); handleSendOTP(); }}
                      className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <RefreshCw size={11} /> {lang === 'hi' ? 'पुनः भेजें' : 'Resend'}
                    </button>
                  ) : (
                    <span>
                      {lang === 'hi' ? 'पुनः भेजें ' : 'Resend in '}
                      <Countdown key={resendKey} seconds={30} onEnd={() => setCanResend(true)} />
                    </span>
                  )}
                </p>

                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Shield size={11} className="text-secondary" />
                  {lang === 'hi' ? 'सुरक्षित OTP सत्यापन' : 'Secure OTP verification'}
                </div>
              </motion.div>
            )}

            {/* ── STEP: Profile ────────────────────────────────────────── */}
            {step === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                  <CheckCircle size={26} className="text-secondary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {lang === 'hi' ? 'लगभग हो गया! 🎉' : 'Almost there! 🎉'}
                </h1>
                <p className="text-muted-foreground text-sm mb-6">
                  {lang === 'hi' ? 'अपना नाम और शहर बताएं' : 'Tell us your name and city'}
                </p>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={lang === 'hi' ? 'आपका नाम' : 'Your full name'}
                      className="w-full bg-muted border-2 border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block">
                      {lang === 'hi' ? 'शहर / जिला' : 'City / District'}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder={lang === 'hi' ? 'जैसे: नई दिल्ली, मुंबई' : 'e.g. New Delhi, Mumbai'}
                      className="w-full bg-muted border-2 border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                <button
                  onClick={handleProfileSubmit}
                  disabled={!name.trim() || isLoading}
                  className="w-full py-3.5 rounded-full bg-secondary text-white font-bold text-sm hover:bg-secondary/90 disabled:opacity-40 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{lang === 'hi' ? 'शुरू करें' : 'Get Started'} <ArrowRight size={15} /></>
                  )}
                </button>
              </motion.div>
            )}

            {/* ── STEP: Success ────────────────────────────────────────── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle size={40} className="text-green-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {lang === 'hi' ? 'लॉगिन सफल! 🎉' : 'Login Successful! 🎉'}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {lang === 'hi' ? 'आपके पेज पर जा रहे हैं...' : 'Taking you to your page...'}
                </p>
                <div className="bg-primary/10 rounded-xl p-3 flex items-center justify-center gap-2">
                  <Zap size={16} className="text-primary" />
                  <span className="text-primary font-bold text-sm">{lang === 'hi' ? 'आपका खाता तैयार है' : 'Your account is ready'}</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
