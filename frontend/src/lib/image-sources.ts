/** Images are served by the Unsplash image CDN. Keep a local UI fallback in SmartImage. */
const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const imageSources = {
  rural: photo('photo-1500382017468-9049fed747ef'),
  urban: photo('photo-1521737711867-e3b97375f902'),
  search: photo('photo-1581578731548-c64695cc6952'),
  provider: photo('photo-1621905251189-08b45d6a269e'),
  artisan: photo('photo-1678082309214-3b2941e387f8'),
  agriculture: photo('photo-1500382017468-9049fed747ef', 900),
  healthcare: photo('photo-1576091160399-112ba8d25d1d', 900),
  education: photo('photo-1503676260728-1c00da094a0b', 900),
  transport: photo('photo-1511919884226-fd3cad34687c', 900),
  home: photo('photo-1600585154340-be6161a56a0c', 900),
  beauty: photo('photo-1560869713-7d0a29430803', 900),
  food: photo('photo-1556911220-e15b29be8c8f', 900),
} as const;

export function serviceImage(category: string, name: string): string {
  const key = `${category} ${name}`.toLowerCase();
  if (/agri|farm|crop|कृषि|किसान/.test(key)) return imageSources.agriculture;
  if (/health|medical|doctor|स्वास्थ्य|चिकित्सा/.test(key)) return imageSources.healthcare;
  if (/edu|tutor|teach|शिक्षा|पढ़/.test(key)) return imageSources.education;
  if (/transport|driver|यातायात|परिवहन/.test(key)) return imageSources.transport;
  if (/beauty|salon|ब्यूटी|सौंदर्य/.test(key)) return imageSources.beauty;
  if (/food|cook|cater|खाना|भोजन/.test(key)) return imageSources.food;
  if (/art|craft|pottery|हस्तशिल्प/.test(key)) return imageSources.artisan;
  return imageSources.home;
}
