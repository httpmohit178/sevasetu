import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Briefcase, Clock3, LocateFixed, MapPin, Power, RefreshCw } from 'lucide-react';
import DashboardLayout, { NavItem } from '@/layouts/DashboardLayout';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { apiRequest } from '../lib/api-client';
import { PhotoBanner } from '../components/ui/photo-banner';

type Lang = 'en' | 'hi';
type Provider = { id: string; name: string; city: string; skills: string[]; online: boolean; status: string };
type Job = { id: string; serviceId: string; serviceName: string; scheduledAt?: string; address?: string; amount: number; status: string; createdAt: string; providerUserId?: string | null };

const labels: Record<string, { en: string; hi: string }> = {
  confirmed: { en: 'New request', hi: 'नई बुकिंग' }, assigned: { en: 'Assigned to you', hi: 'आपको सौंपी गई' },
  en_route: { en: 'On the way', hi: 'रास्ते में' }, arrived: { en: 'Arrived', hi: 'पहुँच गए' },
  in_progress: { en: 'In progress', hi: 'काम जारी' }, completed: { en: 'Completed', hi: 'पूरी हुई' }, cancelled: { en: 'Cancelled', hi: 'रद्द' },
};
const nextStatus: Record<string, string> = { assigned: 'en_route', en_route: 'arrived', arrived: 'in_progress', in_progress: 'completed' };

export default function ProviderDashboard() {
  const [lang, setLang] = useAppLanguage();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [geoError, setGeoError] = useState('');
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const refresh = useCallback(async () => {
    try {
      const [profile, jobList] = await Promise.all([
        apiRequest<{ provider: Provider | null }>('/providers/me'),
        apiRequest<{ jobs: Job[] }>('/provider/jobs'),
      ]);
      setProvider(profile.provider);
      setJobs(jobList.jobs);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load provider dashboard'); }
  }, []);

  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 7000); return () => window.clearInterval(timer); }, [refresh]);

  const activeJobs = useMemo(() => jobs.filter((job) => ['assigned', 'en_route', 'arrived', 'in_progress'].includes(job.status)), [jobs]);
  useEffect(() => {
    if (!provider?.online || activeJobs.length === 0 || !navigator.geolocation) return;
    let lastUpdate = 0;
    const watcher = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (Date.now() - lastUpdate < 10000) return;
      lastUpdate = Date.now(); setGeoError('');
      await Promise.allSettled(activeJobs.map((job) => apiRequest(`/bookings/${job.id}/location`, {
        method: 'POST', body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
      })));
    }, (e) => setGeoError(e.code === e.PERMISSION_DENIED
      ? (lang === 'hi' ? 'लाइव लोकेशन साझा करने के लिए ब्राउज़र में लोकेशन की अनुमति दें।' : 'Allow location access in your browser to share your live position.')
      : (lang === 'hi' ? 'GPS नहीं मिल रहा। लोकेशन सेटिंग देखें और फिर कोशिश करें।' : 'Could not read GPS. Check location settings and try again.')),
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(watcher);
  }, [provider?.online, activeJobs, lang]);

  const changeOnline = async () => {
    if (!provider) return;
    setBusy('availability'); setError('');
    try {
      const result = await apiRequest<{ provider: Provider }>('/providers/me/availability', { method: 'PATCH', body: JSON.stringify({ online: !provider.online }) });
      setProvider(result.provider);
      if (!result.provider.online) setGeoError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update availability'); }
    finally { setBusy(''); }
  };

  const accept = async (job: Job) => {
    setBusy(job.id); setError('');
    try { await apiRequest(`/bookings/${job.id}/accept`, { method: 'POST', body: '{}' }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'This request could not be accepted'); }
    finally { setBusy(''); }
  };

  const advance = async (job: Job) => {
    const status = nextStatus[job.status]; if (!status) return;
    setBusy(job.id); setError('');
    try { await apiRequest(`/bookings/${job.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update this job'); }
    finally { setBusy(''); }
  };

  const navItems: NavItem[] = [
    { href: '/provider-dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: <Activity size={17} /> },
    { href: '/provider-dashboard#jobs', label: 'My Jobs', labelHi: 'मेरे काम', icon: <Briefcase size={17} /> },
    { href: '/tracker', label: 'Location Tracker', labelHi: 'लोकेशन ट्रैकर', icon: <MapPin size={17} /> },
    { href: '/assistant', label: 'AI Assistant', labelHi: 'AI सहायक', icon: <Activity size={17} /> },
  ];

  return <DashboardLayout navItems={navItems} userType="provider" userName={provider?.name || 'Provider'} userCity={provider?.city || ''} lang={lang} onLangToggle={() => setLang(lang === 'en' ? 'hi' : 'en')} notifications={activeJobs.length}>
    <title>{t('Provider dashboard – SevaSetu', 'सेवा प्रदाता डैशबोर्ड – सेवा सेतु')}</title>
    <main className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 p-5 text-white">
        <div><p className="text-sm text-white/75">{t('Provider workspace', 'सेवा प्रदाता कार्यक्षेत्र')}</p><h1 className="text-2xl font-bold">{provider?.name || t('Welcome', 'नमस्ते')}</h1><p className="text-sm text-white/75">{provider?.skills.join(', ') || t('No skills listed', 'कोई कौशल नहीं')} {provider?.city ? `• ${provider.city}` : ''}</p></div>
        {provider && <button disabled={busy === 'availability'} onClick={() => void changeOnline()} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${provider.online ? 'bg-green-500' : 'bg-white/20'} disabled:opacity-50`}><Power size={16} />{provider.online ? t('Online', 'ऑनलाइन') : t('Offline', 'ऑफ़लाइन')}</button>}
      </header>
      <PhotoBanner scene="plumbing" alt="Animated plumbing service card" caption="Share GPS while you are on a job" />
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}{error === 'Sign in to continue' && <Link className="ml-2 underline" to="/login">{t('Sign in', 'साइन इन')}</Link>}</p>}
      {!provider && !error && <div className="rounded-2xl border border-border bg-card p-8 text-center"><h2 className="font-bold">{t('Set up your provider profile', 'अपनी सेवा प्रदाता प्रोफ़ाइल बनाएं')}</h2><p className="my-2 text-sm text-muted-foreground">{t('Add your skills and service area to receive matching bookings.', 'बुकिंग पाने के लिए अपने कौशल और सेवा क्षेत्र जोड़ें।')}</p><Link to="/join" className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-bold text-white">{t('Join as a provider', 'सेवा प्रदाता बनें')}</Link></div>}
      {provider && <>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('Open or assigned jobs', 'खुले या सौंपे गए काम')}</p><p className="text-2xl font-bold">{jobs.filter((job) => job.status !== 'completed' && job.status !== 'cancelled').length}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('Completed bookings', 'पूरी हुई बुकिंग')}</p><p className="text-2xl font-bold">{jobs.filter((job) => job.status === 'completed').length}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('Earnings recorded', 'दर्ज कमाई')}</p><p className="text-2xl font-bold">₹{jobs.filter((job) => job.status === 'completed').reduce((sum, job) => sum + job.amount, 0)}</p></div></div>
        <section id="jobs" className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">{t('Matching bookings', 'मेल खाती बुकिंग')}</h2><button onClick={() => void refresh()} className="flex items-center gap-1 text-xs text-primary"><RefreshCw size={13} />{t('Refresh', 'रीफ़्रेश')}</button></div>
          {jobs.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{provider.online ? t('No matching bookings yet. New requests will appear here.', 'अभी कोई मेल खाती बुकिंग नहीं है। नई बुकिंग यहाँ दिखेंगी।') : t('Go online to see new matching bookings.', 'नई बुकिंग देखने के लिए ऑनलाइन हों।')}</p>}
          {jobs.map((job) => <article key={job.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{job.serviceName}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} />{job.address || t('Customer location not provided', 'ग्राहक का पता नहीं दिया गया')}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 size={12} />{new Date(job.scheduledAt || job.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</p></div><div className="text-right"><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{labels[job.status]?.[lang] || job.status}</span><p className="mt-2 font-bold">₹{job.amount}</p></div></div>
            <div className="mt-3 flex flex-wrap gap-2">{!job.providerUserId && <button disabled={!provider.online || busy === job.id} onClick={() => void accept(job)} className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{t('Accept booking', 'बुकिंग स्वीकार करें')}</button>}{job.providerUserId && nextStatus[job.status] && <button disabled={busy === job.id} onClick={() => void advance(job)} className="rounded-full bg-secondary px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{t('Mark', 'स्थिति बदलें')}: {labels[nextStatus[job.status]]?.[lang]}</button>}{job.providerUserId && <Link to="/tracker" className="flex items-center gap-1 rounded-full border px-4 py-2 text-xs font-semibold"><LocateFixed size={13} />{t('Location tracker', 'लोकेशन ट्रैकर')}</Link>}</div>
          </article>)}
        </section>
        {provider.online && activeJobs.length > 0 && <p className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-xs text-green-800"><LocateFixed size={14} />{t('Live GPS sharing is active for your assigned bookings while this page is open.', 'यह पेज खुला रहने पर आपकी सौंपे गए कामों की लाइव GPS लोकेशन साझा होगी।')}</p>}
        {geoError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{geoError}</p>}
        {provider.status === 'pending' && <p className="text-xs text-muted-foreground">{t('Your profile is marked as pending verification. Document verification is not connected yet.', 'आपकी प्रोफ़ाइल सत्यापन की प्रतीक्षा में है। दस्तावेज़ सत्यापन अभी जुड़ा नहीं है।')}</p>}
      </>}
    </main>
  </DashboardLayout>;
}
