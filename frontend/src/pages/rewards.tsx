import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Gift, Lock, Star, TrendingUp, Zap } from 'lucide-react';
import { apiRequest } from '../lib/api-client';

type Lang = 'en' | 'hi';
type RewardEvent = { id: string; points: number; label: string; labelHi: string; createdAt: string };
const offers = [
  { points: 500, value: 50, en: '₹50 service credit', hi: '₹50 सेवा क्रेडिट' },
  { points: 1000, value: 100, en: '₹100 service credit', hi: '₹100 सेवा क्रेडिट' },
  { points: 2000, value: 200, en: '₹200 service credit', hi: '₹200 सेवा क्रेडिट' },
];

export default function RewardsPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<RewardEvent[]>([]);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const today = new Date().toISOString().slice(0, 10);
  const refresh = useCallback(async () => {
    try { const data = await apiRequest<{ points: number; history: RewardEvent[]; lastCheckIn: string | null }>('/rewards'); setPoints(data.points); setHistory(data.history); setLastCheckIn(data.lastCheckIn); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : t('Sign in to see rewards.', 'पुरस्कार देखने के लिए साइन इन करें।')); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const checkIn = async () => {
    setBusy(true); setError(''); setNotice('');
    try { const result = await apiRequest<{ points: number; lastCheckIn: string }>('/rewards/check-in', { method: 'POST', body: '{}' }); setPoints(result.points); setLastCheckIn(result.lastCheckIn); setNotice(t('5 points added to your balance.', 'आपके खाते में 5 पॉइंट जोड़े गए।')); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : t('Could not check in.', 'चेक-इन नहीं हो सका।')); }
    finally { setBusy(false); }
  };
  const redeem = async (amount: number) => {
    setBusy(true); setError(''); setNotice('');
    try { const result = await apiRequest<{ points: number; code: string; value: number }>('/rewards/redeem', { method: 'POST', body: JSON.stringify({ points: amount }) }); setPoints(result.points); setNotice(t(`Credit code ${result.code} is ready for ₹${result.value}.`, `₹${result.value} के लिए क्रेडिट कोड ${result.code} तैयार है।`)); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : t('Could not redeem points.', 'पॉइंट रिडीम नहीं हो सके।')); }
    finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-background">
    <title>{t('Seva rewards – SevaSetu', 'सेवा पुरस्कार – सेवा सेतु')}</title>
    <section className="bg-gradient-to-br from-violet-600 to-primary py-12 text-white"><div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4"><div><p className="mb-1 text-sm font-semibold">{t('Seva rewards', 'सेवा पुरस्कार')}</p><h1 className="text-3xl font-black">{t('Earn points from real activity', 'वास्तविक गतिविधि से पॉइंट कमाएं')}</h1><p className="mt-2 text-white/80">{t('Complete a booking, leave a review, or check in.', 'बुकिंग पूरी करें, समीक्षा दें या दैनिक चेक-इन करें।')}</p></div><button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="rounded-full border border-white/40 px-4 py-2 text-sm">{lang === 'en' ? 'हिंदी' : 'English'}</button></div></section>
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}{error === 'Sign in to continue' && <Link className="ml-2 font-bold underline" to="/login">{t('Sign in', 'साइन इन')}</Link>}</p>}
      {notice && <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-violet-800 p-6 text-white"><p className="text-sm text-white/70">{t('Your SevaPoints', 'आपके सेवा पॉइंट')}</p><p className="my-2 text-5xl font-black">{points.toLocaleString('en-IN')}</p><p className="text-sm text-white/70">≈ ₹{Math.floor(points / 10)} {t('service credit value', 'सेवा क्रेडिट मूल्य')}</p></div>
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-6"><div className="mb-2 flex items-center gap-2"><CalendarCheck className="text-primary" /><h2 className="font-bold">{t('Daily check-in', 'दैनिक चेक-इन')}</h2></div><p className="mb-4 text-sm text-muted-foreground">{t('Earn 5 points once per day.', 'दिन में एक बार 5 पॉइंट पाएं।')}</p><button disabled={busy || lastCheckIn === today} onClick={() => void checkIn()} className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{lastCheckIn === today ? t('Checked in today', 'आज चेक-इन हो गया') : t('Check in', 'चेक-इन')}</button></div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2"><Gift className="text-primary" /><h2 className="text-lg font-bold">{t('Redeem service credit', 'सेवा क्रेडिट रिडीम करें')}</h2></div><p className="mb-4 text-sm text-muted-foreground">{t('Redeemed codes are stored in your activity. Apply them through customer support; automatic checkout discounts are not connected yet.', 'रिडीम किए गए कोड आपकी गतिविधि में रहेंगे। इन्हें सहायता टीम के माध्यम से इस्तेमाल करें; चेकआउट छूट अभी स्वचालित नहीं है।')}</p><div className="grid gap-3 sm:grid-cols-3">{offers.map((offer) => <article key={offer.points} className="rounded-xl border border-border p-4"><p className="font-bold">{lang === 'hi' ? offer.hi : offer.en}</p><p className="my-2 text-xs text-muted-foreground">{offer.points.toLocaleString('en-IN')} {t('points', 'पॉइंट')}</p><button disabled={busy || points < offer.points} onClick={() => void redeem(offer.points)} className="w-full rounded-full bg-foreground px-3 py-2 text-xs font-bold text-background disabled:opacity-40">{points >= offer.points ? t('Redeem', 'रिडीम करें') : <><Lock className="mr-1 inline" size={11} />{t('Not enough points', 'पर्याप्त पॉइंट नहीं')}</>}</button></article>)}</div></section>
      <section className="rounded-2xl border border-border bg-card p-5"><div className="mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-primary" /><h2 className="font-bold">{t('How to earn', 'पॉइंट कैसे कमाएं')}</h2></div><ul className="grid gap-3 text-sm sm:grid-cols-3"><li className="flex gap-2"><CheckCircleIcon />{t('Completed booking: 50 points', 'पूरी बुकिंग: 50 पॉइंट')}</li><li className="flex gap-2"><Star size={16} className="shrink-0 text-yellow-500" />{t('Completed booking review: 20 points', 'पूरी बुकिंग की समीक्षा: 20 पॉइंट')}</li><li className="flex gap-2"><Zap size={16} className="shrink-0 text-primary" />{t('Daily check-in: 5 points', 'दैनिक चेक-इन: 5 पॉइंट')}</li></ul></section>
      <section className="rounded-2xl border border-border bg-card p-5"><h2 className="mb-3 font-bold">{t('Points activity', 'पॉइंट गतिविधि')}</h2>{history.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t('Your earned and redeemed points will appear here.', 'कमाए और रिडीम किए पॉइंट यहाँ दिखेंगे।')}</p> : <div className="divide-y divide-border">{history.map((event) => <div key={event.id} className="flex justify-between gap-3 py-3 text-sm"><span>{lang === 'hi' ? event.labelHi : event.label}</span><span className={event.points >= 0 ? 'font-bold text-green-700' : 'font-bold text-red-600'}>{event.points > 0 ? '+' : ''}{event.points}</span></div>)}</div>}</section>
      <Link to="/services" className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white">{t('Book a service', 'सेवा बुक करें')} <ArrowRight size={15} /></Link>
    </div>
  </main>;
}

function CheckCircleIcon() { return <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-green-100 text-[10px] text-green-700">✓</span>; }
