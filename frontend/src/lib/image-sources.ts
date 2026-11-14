/** Images are served by the Unsplash image CDN. Keep a local UI fallback in SmartImage. */
const photo = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const imageSources = {
  rural: photo('photo-1768902730346-ffcde810c7f2'),
  urban: photo('photo-1603201667230-bd139210db18'),
  search: photo('photo-1628320281190-89b24da58b0f'),
  provider: photo('photo-1749532125405-70950966b0e5'),
  artisan: photo('photo-1727344513672-220f20bef9c8'),
  agriculture: photo('photo-1768902730346-ffcde810c7f2', 900),
  healthcare: photo('photo-1576091160399-112ba8d25d1d', 900),
  education: photo('photo-1503676260728-1c00da094a0b', 900),
  transport: photo('photo-1511919884226-fd3cad34687c', 900),
  home: photo('photo-1771366260867-7e07094579d7', 900),
  beauty: photo('photo-1560869713-7d0a29430803', 900),
  food: photo('photo-1556911220-e15b29be8c8f', 900),
  community: photo('photo-1603201667230-bd139210db18'),
  streets: photo('photo-1480714378408-67cf0d13bc1b', 1000),
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
