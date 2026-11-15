import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Shield, Home, Leaf, Palette, BookOpen, Truck, Wrench, Zap, Scissors, Utensils, ArrowRight, Wifi } from 'lucide-react';
import { apiRequest } from '../lib/api-client';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { SmartImage } from '../components/ui/smart-image';
import { pendingOfflineBookings, queueOfflineBooking } from '../lib/offline-bookings';

type Area = 'all' | 'rural' | 'urban';
type CatalogService = { id: string; name: string; nameHi: string; startingPrice: number; onlineProviders: number; category: string; area: 'rural' | 'urban' };
type ServiceCredit = { code: string; value: number; usedAt: string | null };
const fallbackCatalog: CatalogService[] = [
  { id: 'crop', name: 'Crop Advisory', nameHi: 'फसल सलाह', startingPrice: 199, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'soil', name: 'Soil Testing', nameHi: 'मिट्टी जांच', startingPrice: 249, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'tractor', name: 'Tractor & Equipment', nameHi: 'ट्रैक्टर और उपकरण', startingPrice: 499, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'dairy', name: 'Dairy Support', nameHi: 'डेयरी सहायता', startingPrice: 249, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'veterinary', name: 'Veterinary Visit', nameHi: 'पशु चिकित्सा', startingPrice: 399, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'pump', name: 'Water Pump Repair', nameHi: 'पानी पंप मरम्मत', startingPrice: 349, onlineProviders: 0, category: 'home', area: 'rural' },
  { id: 'solar', name: 'Solar Setup', nameHi: 'सोलर सेटअप', startingPrice: 799, onlineProviders: 0, category: 'home', area: 'rural' },
  { id: 'handicraft', name: 'Handicrafts', nameHi: 'हस्तशिल्प', startingPrice: 299, onlineProviders: 0, category: 'craft', area: 'rural' },
  { id: 'biogas', name: 'Biogas Service', nameHi: 'बायोगैस सेवा', startingPrice: 449, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'gardening', name: 'Gardening', nameHi: 'बागवानी', startingPrice: 249, onlineProviders: 0, category: 'agri', area: 'rural' },
  { id: 'plumbing', name: 'Plumbing', nameHi: 'प्लंबिंग', startingPrice: 299, onlineProviders: 0, category: 'home', area: 'urban' },
  { id: 'electrical', name: 'Electrical', nameHi: 'इलेक्ट्रिकल', startingPrice: 349, onlineProviders: 0, category: 'home', area: 'urban' },
  { id: 'cleaning', name: 'Cleaning', nameHi: 'सफाई', startingPrice: 249, onlineProviders: 0, category: 'home', area: 'urban' },
  { id: 'painting', name: 'Painting', nameHi: 'पेंटिंग', startingPrice: 499, onlineProviders: 0, category: 'home', area: 'urban' },
  { id: 'carpentry', name: 'Carpentry', nameHi: 'बढ़ईगीरी', startingPrice: 399, onlineProviders: 0, category: 'home', area: 'urban' },
  { id: 'cooking', name: 'Cooking', nameHi: 'खाना पकाना', startingPrice: 299, onlineProviders: 0, category: 'food', area: 'urban' },
  { id: 'tutoring', name: 'Tutoring', nameHi: 'ट्यूटरिंग', startingPrice: 399, onlineProviders: 0, category: 'edu', area: 'urban' },
  { id: 'driving', name: 'Driving', nameHi: 'ड्राइविंग', startingPrice: 299, onlineProviders: 0, category: 'transport', area: 'urban' },
  { id: 'beauty', name: 'Beauty & Salon', nameHi: 'ब्यूटी और सैलून', startingPrice: 299, onlineProviders: 0, category: 'beauty', area: 'urban' },
  { id: 'ac', name: 'AC Repair', nameHi: 'AC मरम्मत', startingPrice: 499, onlineProviders: 0, category: 'home', area: 'urban' },
  { id: 'security', name: 'Security', nameHi: 'सुरक्षा', startingPrice: 499, onlineProviders: 0, category: 'home', area: 'urban' },
];
const categories = [
  { id: 'all', label: 'All Services', labelHi: 'सभी सेवाएं', icon: Zap },
  { id: 'home', label: 'Home', labelHi: 'घरेलू सेवाएं', icon: Home },
  { id: 'agri', label: 'Agriculture', labelHi: 'कृषि', icon: Leaf },
  { id: 'craft', label: 'Handicrafts', labelHi: 'हस्तशिल्प', icon: Palette },
  { id: 'edu', label: 'Education', labelHi: 'शिक्षा', icon: BookOpen },
  { id: 'beauty', label: 'Beauty', labelHi: 'सौंदर्य', icon: Scissors },
  { id: 'food', label: 'Food', labelHi: 'खाना', icon: Utensils },
  { id: 'transport', label: 'Transport', labelHi: 'परिवहन', icon: Truck },
];
const serviceIcons: Record<string, typeof Wrench> = { crop: Leaf, soil: Leaf, tractor: Truck, dairy: Leaf, veterinary: Shield, pump: Wrench, solar: Zap, handicraft: Palette, biogas: Leaf, gardening: Leaf, plumbing: Wrench, electrical: Zap, cleaning: Home, painting: Palette, carpentry: Wrench, cooking: Utensils, tutoring: BookOpen, driving: Truck, beauty: Scissors, ac: Wifi, security: Shield };
const servicePhotos: Record<string, string> = {
  crop: 'photo-1500382017468-9049fed747ef', soil: 'photo-1416879595882-3373a0480b5b', tractor: 'photo-1530268729831-4b0b9e170218',
  dairy: 'photo-1516467508483-a7212febe31a', veterinary: 'photo-1548199973-03cce0bbc87b', pump: 'photo-1581092160562-40aa08e78837',
  solar: 'photo-1508514177221-188b1cf16e9d', handicraft: 'photo-1452860606245-08befc0ff44b', biogas: 'photo-1473341304170-971dccb5ac1e',
  gardening: 'photo-1416879595882-3373a0480b5b', plumbing: 'photo-1607472586893-edb57bdc0e39', electrical: 'photo-1621905251189-08b45d6a269e',
  cleaning: 'photo-1581578731548-c64695cc6952', painting: 'photo-1562259949-e8d7689d7828', carpentry: 'photo-1620626011761-996317b8d101',
  cooking: 'photo-1556911220-e15b29be8c8f', tutoring: 'photo-1503676260728-1c00da094a0b', driving: 'photo-1449965408869-eaa3f722e40d',
  beauty: 'photo-1560869713-7d0a29430803', ac: 'photo-1631545806609-5d2e797f9273', security: 'photo-1453873531674-2151bcd01707',
};
const photoForService = (id: string) => `https://images.unsplash.com/${servicePhotos[id] || 'photo-1603201667230-bd139210db18'}?auto=format&fit=crop&w=900&q=80`;
const areas: { id: Area; en: string; hi: string }[] = [
  { id: 'all', en: 'Rural + Urban', hi: 'ग्रामीण + शहरी' },
  { id: 'rural', en: 'Rural area', hi: 'ग्रामीण क्षेत्र' },
  { id: 'urban', en: 'Urban area', hi: 'शहरी क्षेत्र' },
];
const sortOptions = [
  { value: 'popular', label: 'Most providers online', labelHi: 'ऑनलाइन प्रदाता' },
  { value: 'price_asc', label: 'Price: Low to High', labelHi: 'कम से अधिक कीमत' },
  { value: 'price_desc', label: 'Price: High to Low', labelHi: 'अधिक से कम कीमत' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useAppLanguage();
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [activeArea, setActiveArea] = useState<Area>(() => {
    const requested = new URLSearchParams(window.location.search).get('area');
    return requested === 'rural' || requested === 'urban' ? requested : 'all';
  });
  const [activeCategory, setActiveCategory] = useState(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get('category');
    return categories.some((category) => category.id === requestedCategory) ? requestedCategory! : 'all';
  });
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState('');
  const [bookingDiscount, setBookingDiscount] = useState(0);
  const [offlineQueueId, setOfflineQueueId] = useState(() => {
    const token = localStorage.getItem('sevasetu-token');
    return pendingOfflineBookings().find((item) => item.ownerId === token?.split('.', 1)[0])?.id || '';
  });
  const [smsInfo, setSmsInfo] = useState<{ enabled: boolean; number: string | null }>({ enabled: false, number: null });
  const [serviceCredits, setServiceCredits] = useState<ServiceCredit[]>([]);
  const [selectedCreditCode, setSelectedCreditCode] = useState(() => new URLSearchParams(window.location.search).get('credit') || '');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [catalogWarning, setCatalogWarning] = useState(false);
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const loadCatalog = useCallback(async () => {
    try {
      const result = await apiRequest<{ services: CatalogService[] }>('/services');
      if (!Array.isArray(result.services)) throw new Error('Service catalogue response was invalid');
      const incoming = result.services.map((service) => ({ ...service, area: service.area === 'rural' || service.area === 'urban' ? service.area : (service.category === 'agri' || ['crop', 'soil', 'tractor', 'dairy', 'veterinary', 'pump', 'solar', 'handicraft', 'biogas', 'gardening'].includes(service.id) ? 'rural' as const : 'urban' as const) }));
      const present = new Set(incoming.map((service) => service.id));
      setCatalog([...incoming, ...fallbackCatalog.filter((service) => !present.has(service.id))]);
      setCatalogWarning(false);
    }
    catch { setCatalog(fallbackCatalog); setCatalogWarning(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void loadCatalog();
    const refreshTimer = window.setInterval(() => void loadCatalog(), 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadCatalog]);

  useEffect(() => {
    let active = true;
    const loadSmsInfo = () => { void apiRequest<{ smsBooking?: boolean; smsNumber?: string | null }>('/health').then((data) => { if (active) setSmsInfo({ enabled: Boolean(data.smsBooking && data.smsNumber), number: data.smsNumber || null }); }).catch(() => {}); };
    loadSmsInfo(); window.addEventListener('online', loadSmsInfo);
    return () => { active = false; window.removeEventListener('online', loadSmsInfo); };
  }, []);

  useEffect(() => {
    const synced = (event: Event) => {
      const detail = (event as CustomEvent<{ queueId: string; bookingId: string }>).detail;
      if (detail?.queueId === offlineQueueId) { setOfflineQueueId(''); setBookingId(detail.bookingId); setError(''); }
    };
    window.addEventListener('sevasetu-offline-booking-synced', synced);
    return () => window.removeEventListener('sevasetu-offline-booking-synced', synced);
  }, [offlineQueueId]);

  const loadCredits = useCallback(async () => {
    if (!localStorage.getItem('sevasetu-token')) { setServiceCredits([]); setSelectedCreditCode(''); return; }
    try {
      const data = await apiRequest<{ serviceCredits?: ServiceCredit[] }>('/rewards');
      const available = (data.serviceCredits || []).filter((credit) => !credit.usedAt);
      setServiceCredits(available);
      setSelectedCreditCode((current) => available.some((credit) => credit.code === current) ? current : '');
    } catch { setServiceCredits([]); }
  }, []);
  useEffect(() => {
    void loadCredits();
    window.addEventListener('sevasetu-auth-change', loadCredits);
    return () => window.removeEventListener('sevasetu-auth-change', loadCredits);
  }, [loadCredits]);

  const filtered = useMemo(() => {
    let result = catalog.filter((service) => (activeArea === 'all' || service.area === activeArea)
      && (activeCategory === 'all' || service.category === activeCategory)
      && (!searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase()) || service.nameHi.includes(searchQuery)));
    if (sortBy === 'popular') result = [...result].sort((a, b) => b.onlineProviders - a.onlineProviders);
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.startingPrice - b.startingPrice);
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.startingPrice - a.startingPrice);
    return result;
  }, [catalog, activeArea, activeCategory, searchQuery, sortBy]);

  const book = async (service: CatalogService) => {
    if (!localStorage.getItem('sevasetu-token')) { navigate('/login', { state: { from: '/services' } }); return; }
    setBusyId(service.id); setError(''); setBookingId(''); setOfflineQueueId('');
    try {
      const result = await apiRequest<{ booking: { id: string; creditDiscount?: number } }>('/bookings', { method: 'POST', body: JSON.stringify({ serviceId: service.id, paymentMethod: 'cod', ...(selectedCreditCode ? { creditCode: selectedCreditCode } : {}) }) });
      setBookingId(result.booking.id);
      setBookingDiscount(result.booking.creditDiscount || 0);
      if (result.booking.creditDiscount) { setSelectedCreditCode(''); void loadCredits(); }
    } catch (e) {
      const message = e instanceof Error ? e.message : t('Booking failed', 'बुकिंग नहीं हो सकी');
      if (!navigator.onLine || message.startsWith('Could not connect to the SevaSetu API.')) {
        try { setOfflineQueueId(queueOfflineBooking(service.id)); setError(''); }
        catch (queueError) { setError(queueError instanceof Error ? queueError.message : message); }
      } else setError(message);
    }
    finally { setBusyId(''); }
  };

  return <div className="min-h-screen bg-background">
    <title>{t('Services – SevaSetu', 'सेवाएं – सेवा सेतु')}</title>
    <meta name="description" content="Browse services from the SevaSetu catalogue and request a booking." />
    <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-10">
      <div className="container mx-auto px-4 text-center"><p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">{t('Available SevaSetu services', 'उपलब्ध सेवा सेतु सेवाएं')}</p><h1 className="mb-3 text-3xl font-bold">{t('Find a service', 'सेवा खोजें')}</h1><p className="mx-auto mb-6 max-w-xl text-muted-foreground">{t('See live online provider counts and current starting prices.', 'अभी ऑनलाइन प्रदाताओं की संख्या और शुरुआती कीमत देखें।')}</p>
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 focus-within:border-primary"><Search size={18} className="text-muted-foreground" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('Search in English or Hindi', 'अंग्रेज़ी या हिंदी में खोजें')} className="flex-1 bg-transparent text-sm outline-none" /><button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="rounded-full border px-3 py-1 text-xs">{lang === 'en' ? 'हिंदी' : 'English'}</button></div>
      </div>
    </section>
    <main className="container mx-auto px-4 py-8">
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {catalogWarning && <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{t('Showing the service catalogue. Live provider availability is temporarily unavailable.', 'सेवाओं की सूची दिखाई जा रही है। लाइव प्रदाता उपलब्धता अभी उपलब्ध नहीं है।')} <button onClick={() => { setLoading(true); void loadCatalog(); }} className="ml-2 font-bold underline">{t('Retry', 'फिर कोशिश करें')}</button></p>}
      {bookingId && <p role="status" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">{t('Booking request created', 'बुकिंग अनुरोध भेज दिया गया')} · #{bookingId}<Link className="font-bold underline" to="/tracker">{t('Track it', 'स्थिति देखें')}</Link></p>}
      {bookingId && bookingDiscount > 0 && <p role="status" className="-mt-3 mb-4 text-sm font-semibold text-green-800">{t(`₹${bookingDiscount} service credit applied.`, `₹${bookingDiscount} सेवा क्रेडिट लागू हुआ।`)}</p>}
      {offlineQueueId && <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{t('Saved on this phone. It has not been sent yet. It will sync when internet returns; keep this browser signed in.', 'इस फोन पर सुरक्षित। अभी भेजा नहीं गया। इंटरनेट लौटने पर सिंक होगा; इस ब्राउज़र में साइन इन रखें।')}</p>}
      {smsInfo.enabled && smsInfo.number && <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{t('No mobile data? Book by SMS', 'मोबाइल डेटा नहीं है? SMS से बुक करें')}</p><p className="mt-1 text-sm text-muted-foreground">{t(`Text BOOK service-id | village and landmark to ${smsInfo.number}. Example: BOOK pump | Rampur, near school.`, `BOOK सेवा-id | गांव और पहचान लिखकर ${smsInfo.number} पर SMS भेजें। उदाहरण: BOOK pump | रामपुर, स्कूल के पास।`)}</p></div><a href={`sms:${smsInfo.number}?body=${encodeURIComponent('BOOK pump | Village, landmark')}`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white">{t('Open SMS', 'SMS खोलें')}</a></div>}
      {serviceCredits.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3"><label htmlFor="service-credit" className="text-sm font-semibold">{t('Apply service credit', 'सेवा क्रेडिट लगाएं')}</label><select id="service-credit" value={selectedCreditCode} onChange={(event) => setSelectedCreditCode(event.target.value)} className="min-w-56 rounded-lg border border-border bg-card px-3 py-2 text-sm"><option value="">{t('No credit selected', 'कोई क्रेडिट नहीं')}</option>{serviceCredits.map((credit) => <option key={credit.code} value={credit.code}>{credit.code} · ₹{credit.value}</option>)}</select></div>}
      <div className="mb-4 grid grid-cols-3 gap-2">{areas.map((area) => <button key={area.id} onClick={() => setActiveArea(area.id)} className={`rounded-2xl border px-3 py-3 text-sm font-bold ${activeArea === area.id ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}>{lang === 'hi' ? area.hi : area.en}</button>)}</div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{categories.map(({ id, label, labelHi, icon: Icon }) => <button key={id} onClick={() => setActiveCategory(id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${activeCategory === id ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground'}`}><Icon size={13} />{lang === 'hi' ? labelHi : label}</button>)}</div>
      <div className="mb-5 flex items-center justify-between"><p className="text-sm text-muted-foreground">{loading ? t('Loading…', 'लोड हो रहा है…') : `${filtered.length} ${t('services', 'सेवाएं')}`}</p><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">{sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{lang === 'hi' ? opt.labelHi : opt.label}</option>)}</select></div>
      {loading ? <p className="py-12 text-center text-sm text-muted-foreground">{t('Loading service catalogue…', 'सेवाओं की सूची लोड हो रही है…')}</p> : filtered.length === 0 ? <div className="py-16 text-center"><Search className="mx-auto mb-3 text-muted-foreground" /><h2 className="font-bold">{t('No matching services', 'कोई मिलती-जुलती सेवा नहीं')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('Try a different search or category.', 'दूसरा शब्द या श्रेणी आज़माएं।')}</p></div> : <AnimatePresence mode="wait"><motion.div key={`${activeArea}-${activeCategory}-${searchQuery}-${sortBy}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        {(activeArea === 'all' ? (['rural', 'urban'] as const) : [activeArea]).map((area) => {
          const group = filtered.filter((service) => service.area === area);
          if (group.length === 0) return null;
          return <section key={area}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black">{area === 'rural' ? t('Rural area services', 'ग्रामीण क्षेत्र की सेवाएं') : t('Urban area services', 'शहरी क्षेत्र की सेवाएं')}</h2><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{group.length} {t('services', 'सेवाएं')}</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{group.map((service, index) => { const Icon = serviceIcons[service.id] || Wrench; return <motion.article key={service.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <SmartImage src={photoForService(service.id)} alt={`${service.name} service`} className="mb-4 h-36 rounded-xl" imageClassName="transition-transform duration-300 group-hover:scale-105" />
          <div>
          <div className="mb-3 flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${service.area === 'rural' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{service.area === 'rural' ? t('Rural', 'ग्रामीण') : t('Urban', 'शहरी')}</span></div>
          <h3 className="font-bold">{lang === 'hi' ? service.nameHi : service.name}</h3>
          <div className="my-3 flex items-center gap-2 text-xs text-muted-foreground"><Shield size={12} />{service.onlineProviders} {t('online providers', 'ऑनलाइन प्रदाता')}</div>
          <div className="flex items-center justify-between border-t border-border pt-3"><div><span className="text-lg font-black text-primary">₹{service.startingPrice}</span><span className="ml-1 text-[10px] text-muted-foreground">{t('starting', 'से शुरू')}</span></div><button disabled={busyId === service.id} onClick={() => void book(service)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{busyId === service.id ? t('Sending…', 'भेज रहे हैं…') : t('Book', 'बुक करें')} <ArrowRight size={11} /></button></div>
          </div>
        </motion.article>; })}</div></section>;
        })}
      </motion.div></AnimatePresence>}
      <p className="mt-6 text-xs text-muted-foreground">{t('Ratings, reviews and provider counts are shown only when backed by actual customer activity.', 'रेटिंग, समीक्षाएं और प्रदाताओं की संख्या वास्तविक ग्राहक गतिविधि से अपडेट होती हैं।')}</p>
    </main>
  </div>;
}
