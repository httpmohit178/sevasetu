import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Building2, CalendarDays, Gift, LayoutDashboard, MapPin, Plus, Zap } from 'lucide-react';
import DashboardLayout, { NavItem } from '@/layouts/DashboardLayout';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { apiRequest } from '../lib/api-client';
import { PhotoBanner } from '../components/ui/photo-banner';

type Booking = { id: string; serviceName: string; status: string; amount: number; createdAt: string; scheduledAt?: string | null; providerName?: string | null };
type User = { name: string; city?: string; role: string };

const statusLabel: Record<string, { en: string; hi: string }> = {
  confirmed: { en: 'Waiting for a provider', hi: 'सेवा प्रदाता की प्रतीक्षा' }, assigned: { en: 'Provider assigned', hi: 'प्रदाता नियुक्त' },
  en_route: { en: 'On the way', hi: 'रास्ते में' }, arrived: { en: 'Arrived', hi: 'पहुँच गए' },
  in_progress: { en: 'In progress', hi: 'काम जारी' }, completed: { en: 'Completed', hi: 'पूरी हुई' }, cancelled: { en: 'Cancelled', hi: 'रद्द' },
};

export default function UserDashboard() {
  const [lang, setLang] = useAppLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [points, setPoints] = useState(0);
  const [error, setError] = useState('');
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const refresh = useCallback(async () => {
    try {
      const [me, records, rewards] = await Promise.all([
        apiRequest<{ user: User }>('/auth/me'), apiRequest<{ bookings: Booking[] }>('/bookings'), apiRequest<{ points: number }>('/rewards'),
      ]);
      setUser(me.user); setBookings(records.bookings); setPoints(rewards.points); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : t('Sign in to view your dashboard.', 'डैशबोर्ड देखने के लिए साइन इन करें।')); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: <LayoutDashboard size={17} /> },
    { href: '/services', label: 'Book Service', labelHi: 'सेवा बुक करें', icon: <Plus size={17} /> },
    { href: '/tracker', label: 'Track Booking', labelHi: 'बुकिंग ट्रैक करें', icon: <MapPin size={17} /> },
    { href: '/rewards', label: 'Rewards', labelHi: 'पुरस्कार', icon: <Gift size={17} /> },
    { href: '/schemes', label: 'Government Schemes', labelHi: 'सरकारी योजनाएं', icon: <Building2 size={17} /> },
    { href: '/assistant', label: 'Seva AI', labelHi: 'सेवा AI', icon: <Zap size={17} /> },
  ];

  return <DashboardLayout navItems={navItems} userType="user" userName={user?.name || t('Guest', 'अतिथि')} userCity={user?.city || ''} lang={lang} onLangToggle={() => setLang(lang === 'en' ? 'hi' : 'en')} notifications={bookings.filter((item) => ['confirmed', 'assigned', 'en_route', 'arrived', 'in_progress'].includes(item.status)).length}>
    <title>{t('My dashboard – SevaSetu', 'मेरा डैशबोर्ड – सेवा सेतु')}</title>
    <main className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 text-white"><div><p className="text-sm text-white/75">{t('Namaste', 'नमस्ते')} 🙏</p><h1 className="text-2xl font-black">{user?.name || t('Your SevaSetu account', 'आपका सेवा सेतु अकाउंट')}</h1><p className="text-sm text-white/80">{t('Your bookings, status and SevaPoints.', 'आपकी बुकिंग, स्थिति और सेवा पॉइंट्स।')}</p></div><Link to="/services" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary"><Plus size={16} />{t('Book a service', 'सेवा बुक करें')}</Link></header>
      <PhotoBanner scene="rural" alt="Animated village fields" caption="Village fields and city streets, one account" />
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}{!user && <Link to="/login" className="ml-2 font-bold underline">{t('Sign in', 'साइन इन')}</Link>}</p>}
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('Total bookings', 'कुल बुकिंग')}</p><p className="mt-1 text-2xl font-bold">{bookings.length}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('Active bookings', 'सक्रिय बुकिंग')}</p><p className="mt-1 text-2xl font-bold">{bookings.filter((item) => !['completed', 'cancelled'].includes(item.status)).length}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{t('SevaPoints', 'सेवा पॉइंट्स')}</p><p className="mt-1 text-2xl font-bold">{points}</p></div></div>
      <section className="rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-bold">{t('Recent bookings', 'हाल की बुकिंग')}</h2><Link to="/tracker" className="flex items-center gap-1 text-xs font-semibold text-primary">{t('Open tracker', 'ट्रैकर खोलें')} <ArrowRight size={13} /></Link></div>
        {bookings.length === 0 ? <div className="p-8 text-center"><Activity className="mx-auto mb-2 text-muted-foreground" /><p className="font-semibold">{t('Your real bookings will appear here.', 'आपकी बुकिंग यहाँ दिखेंगी।')}</p><Link to="/services" className="mt-3 inline-block text-sm font-bold text-primary">{t('Browse services', 'सेवाएं देखें')}</Link></div> : <div className="divide-y divide-border">{bookings.slice(0, 8).map((booking) => <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{booking.serviceName}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays size={12} />{new Date(booking.scheduledAt || booking.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</p>{booking.providerName && <p className="text-xs text-muted-foreground">{booking.providerName}</p>}</div><div className="flex items-center gap-3"><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{statusLabel[booking.status]?.[lang] || booking.status}</span><span className="font-bold">₹{booking.amount}</span><Link to="/tracker" aria-label={t('Track booking', 'बुकिंग ट्रैक करें')} className="text-primary"><MapPin size={16} /></Link></div></div>)}</div>}
      </section>
    </main>
  </DashboardLayout>;
}
