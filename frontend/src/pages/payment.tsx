import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, RefreshCw } from 'lucide-react';
import { apiRequest } from '../lib/api-client';
import { useAppLanguage } from '../hooks/useAppLanguage';

type Booking = { id: string; serviceName?: string; service?: string; amount?: number; status: string; paymentMethod?: string; createdAt?: string };
type BookingResponse = { bookings: Booking[] };

export default function PaymentPage() {
  const [lang, setLang] = useAppLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await apiRequest<BookingResponse>('/bookings'); setBookings(result.bookings || []); }
    catch (err) {
      const message = err instanceof Error ? err.message : t('Could not load transaction history.', 'लेनदेन इतिहास लोड नहीं हुआ।');
      setError(message);
      if (!localStorage.getItem('sevasetu-token')) navigate('/login?redirect=/payment');
    } finally { setLoading(false); }
  }, [navigate, lang]);
  useEffect(() => { void load(); }, [load]);

  return <main className="min-h-screen bg-muted/30 px-4 py-8"><div className="mx-auto max-w-3xl">
    <Link to="/settings" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16}/>{t('Settings', 'सेटिंग्स')}</Link>
    <header className="mb-6 flex items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-primary"><CreditCard size={20}/><span className="text-sm font-bold">SevaSetu</span></div><h1 className="text-2xl font-black">{t('Payments & bookings', 'भुगतान और बुकिंग')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('Service charges are paid directly to the provider after service. Online payments are not enabled.', 'सेवा के बाद प्रदाता को सीधे भुगतान करें। ऑनलाइन भुगतान अभी उपलब्ध नहीं है।')}</p></div><button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="rounded-full border px-3 py-1.5 text-xs">{lang === 'en' ? 'हिंदी' : 'English'}</button></header>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={() => void load()} className="ml-2 inline-flex items-center gap-1 font-bold underline"><RefreshCw size={12}/>{t('Retry', 'फिर कोशिश करें')}</button></div>}
    {loading ? <p className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">{t('Loading your bookings…', 'आपकी बुकिंग लोड हो रही है…')}</p> : bookings.length === 0 ? <section className="rounded-2xl border bg-background p-8 text-center"><p className="font-bold">{t('No bookings yet', 'अभी कोई बुकिंग नहीं')}</p><p className="mt-1 text-sm text-muted-foreground">{t('Your confirmed service bookings will appear here.', 'आपकी सेवा बुकिंग यहां दिखाई देंगी।')}</p><Link to="/services" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">{t('Browse services', 'सेवाएं देखें')}</Link></section> : <div className="space-y-3">{bookings.map(booking => <article key={booking.id} className="rounded-2xl border bg-background p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">{booking.serviceName || booking.service || t('Service booking', 'सेवा बुकिंग')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('Booking', 'बुकिंग')} #{booking.id} · {booking.createdAt ? new Date(booking.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN') : ''}</p></div><div className="text-right"><p className="font-black text-primary">{typeof booking.amount === 'number' ? `₹${booking.amount}` : t('To be confirmed', 'पुष्टि होगी')}</p><p className="text-xs capitalize text-muted-foreground">{booking.status.replaceAll('_', ' ')}</p></div></div><p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{t('Payment: Cash after service', 'भुगतान: सेवा के बाद नकद')}</p></article>)}</div>}
  </div></main>;
}
