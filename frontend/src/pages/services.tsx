import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Shield, Home, Leaf, Palette, BookOpen, Truck, Wrench, Zap, Scissors, Utensils, ArrowRight, Wifi } from 'lucide-react';
import { apiRequest } from '../lib/api-client';
import { SmartImage } from '../components/ui/smart-image';
import { serviceImage } from '../lib/image-sources';

type Lang = 'en' | 'hi';
type CatalogService = { id: string; name: string; nameHi: string; startingPrice: number; onlineProviders: number; category: string };
const fallbackCatalog: CatalogService[] = [
  { id: 'plumbing', name: 'Plumbing', nameHi: 'प्लंबिंग', startingPrice: 299, onlineProviders: 0, category: 'home' },
  { id: 'electrical', name: 'Electrical', nameHi: 'इलेक्ट्रिकल', startingPrice: 349, onlineProviders: 0, category: 'home' },
  { id: 'cleaning', name: 'Cleaning', nameHi: 'सफाई', startingPrice: 249, onlineProviders: 0, category: 'home' },
  { id: 'painting', name: 'Painting', nameHi: 'पेंटिंग', startingPrice: 499, onlineProviders: 0, category: 'home' },
  { id: 'carpentry', name: 'Carpentry', nameHi: 'बढ़ईगीरी', startingPrice: 399, onlineProviders: 0, category: 'home' },
  { id: 'cooking', name: 'Cooking', nameHi: 'खाना पकाना', startingPrice: 299, onlineProviders: 0, category: 'food' },
  { id: 'tutoring', name: 'Tutoring', nameHi: 'ट्यूटरिंग', startingPrice: 399, onlineProviders: 0, category: 'edu' },
  { id: 'driving', name: 'Driving', nameHi: 'ड्राइविंग', startingPrice: 299, onlineProviders: 0, category: 'transport' },
  { id: 'beauty', name: 'Beauty & Salon', nameHi: 'ब्यूटी और सैलून', startingPrice: 299, onlineProviders: 0, category: 'beauty' },
  { id: 'ac', name: 'AC Repair', nameHi: 'AC मरम्मत', startingPrice: 499, onlineProviders: 0, category: 'home' },
  { id: 'gardening', name: 'Gardening', nameHi: 'बागवानी', startingPrice: 249, onlineProviders: 0, category: 'agri' },
  { id: 'security', name: 'Security', nameHi: 'सुरक्षा', startingPrice: 499, onlineProviders: 0, category: 'home' },
];
const categories = [
  { id: 'all', label: 'All Services', labelHi: 'सभी सेवाएं', icon: Zap },
  { id: 'home', label: 'Home', labelHi: 'घरेलू सेवाएं', icon: Home },
  { id: 'agri', label: 'Agriculture', labelHi: 'कृषि', icon: Leaf },
  { id: 'edu', label: 'Education', labelHi: 'शिक्षा', icon: BookOpen },
  { id: 'beauty', label: 'Beauty', labelHi: 'सौंदर्य', icon: Scissors },
  { id: 'food', label: 'Food', labelHi: 'खाना', icon: Utensils },
  { id: 'transport', label: 'Transport', labelHi: 'परिवहन', icon: Truck },
];
const icons = [Wrench, Zap, Home, Palette, Home, Utensils, BookOpen, Truck, Scissors, Wifi, Leaf, Shield];
const sortOptions = [
  { value: 'popular', label: 'Most providers online', labelHi: 'ऑनलाइन प्रदाता' },
  { value: 'price_asc', label: 'Price: Low to High', labelHi: 'कम से अधिक कीमत' },
  { value: 'price_desc', label: 'Price: High to Low', labelHi: 'अधिक से कम कीमत' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('en');
  const [catalog, setCatalog] = useState<CatalogService[]>([]);
  const [activeCategory, setActiveCategory] = useState(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get('category');
    return categories.some((category) => category.id === requestedCategory) ? requestedCategory! : 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [catalogWarning, setCatalogWarning] = useState(false);
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const loadCatalog = async () => {
    try {
      const result = await apiRequest<{ services: CatalogService[] }>('/services');
      if (!Array.isArray(result.services)) throw new Error('Service catalogue response was invalid');
      setCatalog(result.services);
      setCatalogWarning(false);
    }
    catch { setCatalog(fallbackCatalog); setCatalogWarning(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadCatalog(); }, []);

  const filtered = useMemo(() => {
    let result = catalog.filter((service) => (activeCategory === 'all' || service.category === activeCategory)
      && (!searchQuery || service.name.toLowerCase().includes(searchQuery.toLowerCase()) || service.nameHi.includes(searchQuery)));
    if (sortBy === 'popular') result = [...result].sort((a, b) => b.onlineProviders - a.onlineProviders);
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.startingPrice - b.startingPrice);
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.startingPrice - a.startingPrice);
    return result;
  }, [catalog, activeCategory, searchQuery, sortBy]);

  const book = async (service: CatalogService) => {
    if (!localStorage.getItem('sevasetu-token')) { navigate('/login', { state: { from: '/services' } }); return; }
    setBusyId(service.id); setError(''); setBookingId('');
    try {
      const result = await apiRequest<{ booking: { id: string } }>('/bookings', { method: 'POST', body: JSON.stringify({ serviceId: service.id, paymentMethod: 'cod' }) });
      setBookingId(result.booking.id);
    } catch (e) { setError(e instanceof Error ? e.message : t('Booking failed', 'बुकिंग नहीं हो सकी')); }
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
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{categories.map(({ id, label, labelHi, icon: Icon }) => <button key={id} onClick={() => setActiveCategory(id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ${activeCategory === id ? 'bg-primary text-white' : 'border border-border bg-card text-muted-foreground'}`}><Icon size={13} />{lang === 'hi' ? labelHi : label}</button>)}</div>
      <div className="mb-5 flex items-center justify-between"><p className="text-sm text-muted-foreground">{loading ? t('Loading…', 'लोड हो रहा है…') : `${filtered.length} ${t('services', 'सेवाएं')}`}</p><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs">{sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{lang === 'hi' ? opt.labelHi : opt.label}</option>)}</select></div>
      {loading ? <p className="py-12 text-center text-sm text-muted-foreground">{t('Loading service catalogue…', 'सेवाओं की सूची लोड हो रही है…')}</p> : filtered.length === 0 ? <div className="py-16 text-center"><Search className="mx-auto mb-3 text-muted-foreground" /><h2 className="font-bold">{t('No matching services', 'कोई मिलती-जुलती सेवा नहीं')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('Try a different search or category.', 'दूसरा शब्द या श्रेणी आज़माएं।')}</p></div> : <AnimatePresence mode="wait"><motion.div key={`${activeCategory}-${searchQuery}-${sortBy}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((service, index) => { const Icon = icons[catalog.findIndex((item) => item.id === service.id)] || Wrench; return <motion.article key={service.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="overflow-hidden rounded-2xl border border-border bg-card">
          <SmartImage src={serviceImage(service.category, service.name)} alt={`${service.name} service`} className="h-36 w-full" />
          <div className="p-5">
          <div className="mb-3 flex items-center justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></div>{service.onlineProviders > 0 && <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-800">{t('Online', 'ऑनलाइन')}</span>}</div>
          <h2 className="font-bold">{lang === 'hi' ? service.nameHi : service.name}</h2>
          <div className="my-3 flex items-center gap-2 text-xs text-muted-foreground"><Shield size={12} />{service.onlineProviders} {t('online providers', 'ऑनलाइन प्रदाता')}</div>
          <div className="flex items-center justify-between border-t border-border pt-3"><div><span className="text-lg font-black text-primary">₹{service.startingPrice}</span><span className="ml-1 text-[10px] text-muted-foreground">{t('starting', 'से शुरू')}</span></div><button disabled={busyId === service.id} onClick={() => void book(service)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">{busyId === service.id ? t('Sending…', 'भेज रहे हैं…') : t('Book', 'बुक करें')} <ArrowRight size={11} /></button></div>
          </div>
        </motion.article>; })}
      </motion.div></AnimatePresence>}
      <p className="mt-6 text-xs text-muted-foreground">{t('Ratings, reviews and provider counts are shown only when backed by actual customer activity.', 'रेटिंग, समीक्षाएं और प्रदाताओं की संख्या वास्तविक ग्राहक गतिविधि से अपडेट होती हैं।')}</p>
    </main>
  </div>;
}
