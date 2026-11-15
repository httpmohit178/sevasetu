import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, MapPin, Navigation, Phone, RefreshCw, Star, UserRound, XCircle } from 'lucide-react';
import { apiRequest } from '../lib/api-client';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { PhotoBanner } from '../components/ui/photo-banner';

type Point = { latitude: number; longitude: number; updatedAt?: string };
type Booking = {
  id: string; serviceId: string; serviceName: string; scheduledAt?: string | null; address?: string;
  amount: number; paymentStatus: string; status: string; createdAt: string;
  providerName?: string; providerPhone?: string; providerLocation?: Point | null;
  events?: { status: string; at: string }[];
};

const statusOrder = ['confirmed', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed'];
const statusLabels: Record<string, { en: string; hi: string }> = {
  confirmed: { en: 'Booking confirmed', hi: 'बुकिंग की पुष्टि हुई' },
  assigned: { en: 'Provider assigned', hi: 'सेवा प्रदाता नियुक्त' },
  en_route: { en: 'Provider on the way', hi: 'सेवा प्रदाता रास्ते में' },
  arrived: { en: 'Provider arrived', hi: 'सेवा प्रदाता पहुँच गए' },
  in_progress: { en: 'Service in progress', hi: 'सेवा जारी है' },
  completed: { en: 'Service completed', hi: 'सेवा पूरी हुई' },
  cancelled: { en: 'Booking cancelled', hi: 'बुकिंग रद्द हुई' },
};

function distanceKm(a: Point, b: Point) {
  const toRad = (n: number) => n * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude), dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function TrackerPage() {
  const [lang, setLang] = useAppLanguage();
  const [hasSession, setHasSession] = useState(() => Boolean(localStorage.getItem('sevasetu-token')));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeId, setActiveId] = useState('');
  const [customerLocation, setCustomerLocation] = useState<Point | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('sevasetu-token')));
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [reviewSaved, setReviewSaved] = useState(false);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('sevasetu-token')) { setHasSession(false); setBookings([]); setLoading(false); setError(''); return; }
    setHasSession(true);
    try {
      const result = await apiRequest<{ bookings: Booking[] }>('/bookings');
      setBookings(result.bookings);
      setActiveId((current) => result.bookings.some((item) => item.id === current) ? current : result.bookings[0]?.id || '');
      setError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load bookings';
      if (message === 'Sign in to continue') setHasSession(false);
      setError(message);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!hasSession) return;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(interval);
  }, [refresh, hasSession]);

  const active = bookings.find((booking) => booking.id === activeId) || null;
  const mapPoint = active?.providerLocation || customerLocation;
  const mapUrl = useMemo(() => {
    if (!mapPoint) return '';
    const lat = mapPoint.latitude, lon = mapPoint.longitude;
    const delta = 0.008;
    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;
  }, [mapPoint]);

  const shareLocation = () => {
    if (!navigator.geolocation) { setError(lang === 'hi' ? 'इस डिवाइस पर लोकेशन उपलब्ध नहीं है।' : 'Location is not available on this device.'); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        if (!active) { setError(lang === 'hi' ? 'पहले एक बुकिंग चुनें।' : 'Select a booking before sharing your location.'); return; }
        try {
          await apiRequest(`/bookings/${active.id}/customer-location`, { method: 'POST', body: JSON.stringify(point) });
          setCustomerLocation(point); setError('');
        } catch (e) { setError(e instanceof Error ? e.message : (lang === 'hi' ? 'लोकेशन साझा नहीं हो सकी।' : 'Could not share your location.')); }
      },
      (e) => setError(e.code === e.PERMISSION_DENIED
        ? (lang === 'hi' ? 'लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग्स में अनुमति दें।' : 'Location permission was denied. Allow it in your browser settings.')
        : (lang === 'hi' ? 'लोकेशन नहीं मिल सकी। फिर से कोशिश करें।' : 'Could not get your location. Please try again.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  };

  const cancelBooking = async () => {
    if (!active) return;
    try { await apiRequest(`/bookings/${active.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not cancel booking'); }
  };

  const submitReview = async () => {
    if (!active || rating < 1) return;
    try { await apiRequest(`/bookings/${active.id}/review`, { method: 'POST', body: JSON.stringify({ rating }) }); setReviewSaved(true); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save review'); }
  };

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;
  const providerDistance = active?.providerLocation && customerLocation ? distanceKm(active.providerLocation, customerLocation) : null;

  return <div className="min-h-screen bg-background">
    <title>{t('Booking tracker – SevaSetu', 'बुकिंग ट्रैकर – सेवा सेतु')}</title>
    <header className="sticky top-16 z-30 border-b border-border bg-card">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3"><Link to="/" aria-label={t('Home', 'होम')}><ArrowLeft size={18} /></Link><h1 className="font-bold">{t('Booking tracker', 'बुकिंग ट्रैकर')}</h1></div>
        <div className="flex gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="rounded-full border px-3 py-1 text-xs">{lang === 'en' ? 'हिंदी' : 'English'}</button>
          <button onClick={() => void refresh()} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs"><RefreshCw size={12} />{t('Refresh', 'रीफ़्रेश')}</button>
        </div>
      </div>
    </header>
    <div className="container mx-auto max-w-5xl px-4 pt-5"><PhotoBanner scene="gps" alt="Street view representing local provider directions" caption="Live GPS tracking for your booking" /></div>
    <main className="container mx-auto max-w-5xl px-4 py-6">
      {!hasSession && <div role="status" className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center"><h2 className="font-bold">{t('Sign in to see your bookings', 'अपनी बुकिंग देखने के लिए साइन इन करें')}</h2><p className="my-2 text-sm text-muted-foreground">{t('You can browse services and schemes without an account. Sign in to view booking details and live provider locations.', 'आप बिना खाते के सेवाएं और योजनाएं देख सकते हैं। बुकिंग और लाइव लोकेशन देखने के लिए साइन इन करें।')}</p><Link to="/login" state={{ from: '/tracker' }} className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-bold text-white">{t('Sign in', 'साइन इन')}</Link></div>}
      {error && hasSession && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {!hasSession ? null : loading ? <p className="py-12 text-center text-muted-foreground">{t('Loading your bookings…', 'आपकी बुकिंग लोड हो रही हैं…')}</p>
        : bookings.length === 0 ? <div className="rounded-2xl border border-border bg-card p-8 text-center"><MapPin className="mx-auto mb-3 text-primary" /><h2 className="font-bold">{t('No bookings yet', 'अभी कोई बुकिंग नहीं')}</h2><p className="my-2 text-sm text-muted-foreground">{t('Bookings you make will appear here with their live status.', 'आपकी बुकिंग यहाँ उनकी मौजूदा स्थिति के साथ दिखेंगी।')}</p><Link className="inline-block rounded-full bg-primary px-5 py-2 text-sm font-bold text-white" to="/services">{t('Browse services', 'सेवाएं देखें')}</Link></div>
        : <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <section className="space-y-3">
            <h2 className="font-bold">{t('Your bookings', 'आपकी बुकिंग')}</h2>
            {bookings.map((booking) => <button key={booking.id} onClick={() => { setActiveId(booking.id); setReviewSaved(false); setRating(0); }} className={`w-full rounded-xl border p-4 text-left ${activeId === booking.id ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
              <span className="block font-semibold">{booking.serviceName}</span><span className="block text-xs text-muted-foreground">#{booking.id}</span>
              <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] ${booking.status === 'completed' ? 'bg-green-100 text-green-800' : booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>{statusLabels[booking.status]?.[lang] || booking.status}</span>
            </button>)}
            <Link to="/services" className="block rounded-xl border border-dashed border-border p-3 text-center text-sm text-primary">+ {t('Book a service', 'सेवा बुक करें')}</Link>
          </section>

          {active && <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{active.serviceName}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} />{active.address || t('Address not added', 'पता नहीं दिया गया')}</p></div><div className="text-right"><p className="text-xl font-black text-primary">₹{active.amount}</p><p className="text-xs text-muted-foreground">#{active.id}</p></div></div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted p-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary"><UserRound size={18} /></div><div className="min-w-0 flex-1"><p className="font-semibold">{active.providerName || t('Waiting for a provider', 'सेवा प्रदाता की प्रतीक्षा')}</p><p className="text-xs text-muted-foreground">{active.providerName ? t('Assigned to your booking', 'आपकी बुकिंग के लिए नियुक्त') : t('A nearby provider can accept this booking.', 'नज़दीकी सेवा प्रदाता यह बुकिंग स्वीकार कर सकता है।')}</p></div>{active.providerPhone && <a href={`tel:${active.providerPhone}`} aria-label={t('Call provider', 'सेवा प्रदाता को कॉल करें')} className="rounded-full bg-secondary/10 p-2 text-secondary"><Phone size={16} /></a>}</div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 p-4"><div><h3 className="font-bold">{t('Live location', 'लाइव लोकेशन')}</h3><p className="text-xs text-muted-foreground">{active.providerLocation ? `${t('Last update', 'आख़िरी अपडेट')}: ${new Date(active.providerLocation.updatedAt || '').toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN')}` : t('The map updates when your provider shares GPS.', 'सेवा प्रदाता के GPS साझा करने पर नक्शा अपडेट होगा।')}</p></div><button onClick={shareLocation} className="flex items-center gap-1 rounded-full border border-primary/30 px-3 py-2 text-xs font-semibold text-primary"><Navigation size={13} />{t('Share my location', 'अपनी लोकेशन साझा करें')}</button></div>
              {mapUrl ? <iframe title={t('OpenStreetMap showing the latest shared position', 'नवीनतम साझा स्थान का OpenStreetMap नक्शा')} src={mapUrl} className="h-72 w-full border-0" loading="lazy" referrerPolicy="no-referrer" /> : <div className="grid h-48 place-items-center bg-muted px-6 text-center text-sm text-muted-foreground">{t('The map will appear after a provider shares their location. You can optionally share your location to see your distance.', 'सेवा प्रदाता लोकेशन साझा करने पर नक्शा दिखेगा। दूरी देखने के लिए आप अपनी लोकेशन भी साझा कर सकते हैं।')}</div>}
              {providerDistance !== null && <p className="px-4 py-2 text-xs text-muted-foreground">{t('Approximate straight-line distance', 'लगभग सीधी दूरी')}: {providerDistance.toFixed(1)} km</p>}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-4 font-bold">{t('Booking progress', 'बुकिंग की स्थिति')}</h3><ol className="space-y-3">{(active.status === 'cancelled' ? ['confirmed', 'cancelled'] : statusOrder).map((step) => {
              const currentIndex = statusOrder.indexOf(active.status), stepIndex = statusOrder.indexOf(step);
              const done = step === 'cancelled' ? active.status === 'cancelled' : stepIndex <= currentIndex;
              const event = active.events?.find((item) => item.status === step);
              return <li key={step} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full ${done ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'}`}>{step === 'cancelled' ? <XCircle size={15} /> : done ? <CheckCircle size={15} /> : <Clock size={15} />}</span><span className={`flex-1 text-sm ${done ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{statusLabels[step]?.[lang] || step}</span>{event && <time className="text-xs text-muted-foreground">{new Date(event.at).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })}</time>}</li>;
            })}</ol>
            {['confirmed', 'assigned'].includes(active.status) && <button onClick={() => void cancelBooking()} className="mt-4 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-700">{t('Cancel booking', 'बुकिंग रद्द करें')}</button>}
            {active.status === 'completed' && <div className="mt-5 border-t border-border pt-4"><h4 className="mb-2 text-sm font-semibold">{t('Rate this service', 'सेवा को रेट करें')}</h4><div className="mb-3 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setRating(value)} aria-label={`${value} stars`}><Star size={22} className={value <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'} /></button>)}</div>{reviewSaved ? <p className="text-sm text-green-700">{t('Thank you for your review.', 'समीक्षा देने के लिए धन्यवाद।')}</p> : <button onClick={() => void submitReview()} disabled={rating === 0} className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{t('Submit review', 'समीक्षा भेजें')}</button>}</div>}
            </div>
          </section>}
        </div>}
    </main>
  </div>;
}
