// ─── SevaSetu AI Response Engine ─────────────────────────────────────────────
// Bilingual mock AI that understands Hindi & English service requests

export type Lang = 'en' | 'hi';

export interface Provider {
  id: string;
  name: string;
  skill: string;
  skillHi: string;
  rating: number;
  reviews: number;
  distance: string;
  price: string;
  location: string;
  available: boolean;
  verified: boolean;
  avatar: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  contentHi?: string;
  timestamp: Date;
  type: 'text' | 'providers' | 'schemes' | 'booking-confirm' | 'quick-replies' | 'greeting';
  providers?: Provider[];
  serviceId?: string;
  quickReplies?: { en: string; hi: string }[];
  schemeCards?: SchemeCard[];
  bookingDetails?: BookingDetails;
}

export interface SchemeCard {
  name: string;
  nameHi: string;
  icon: string;
  benefit: string;
  benefitHi: string;
  tag: string;
}

export interface BookingDetails {
  provider: Provider;
  service: string;
  serviceHi: string;
  time: string;
  price: string;
  bookingId: string;
}

// ─── Keyword Matching ─────────────────────────────────────────────────────────
const serviceKeywords: Record<string, string[]> = {
  plumber: ['plumber', 'plumbing', 'pipe', 'leak', 'water', 'tap', 'नल', 'पाइप', 'प्लंबर', 'पानी', 'लीक'],
  electrician: ['electrician', 'electric', 'wiring', 'light', 'fan', 'switch', 'इलेक्ट्रीशियन', 'बिजली', 'तार', 'लाइट', 'पंखा'],
  carpenter: ['carpenter', 'furniture', 'wood', 'door', 'window', 'बढ़ई', 'फर्नीचर', 'लकड़ी', 'दरवाजा', 'खिड़की'],
  cleaner: ['clean', 'maid', 'sweep', 'wash', 'housekeeping', 'सफाई', 'झाड़ू', 'धुलाई', 'मेड', 'बाई'],
  farmer: ['farm', 'agriculture', 'crop', 'soil', 'खेती', 'फसल', 'किसान', 'मिट्टी', 'बुवाई'],
  tutor: ['tutor', 'teacher', 'study', 'education', 'class', 'शिक्षक', 'पढ़ाई', 'ट्यूटर', 'क्लास', 'पढ़ाना'],
  crop: ['crop', 'farm', 'agriculture', 'farming', 'खेती', 'फसल', 'किसान'],
  soil: ['soil test', 'soil testing', 'मिट्टी जांच', 'मिट्टी परीक्षण'],
  tractor: ['tractor', 'farm equipment', 'ट्रैक्टर', 'कृषि उपकरण'],
  dairy: ['dairy', 'milk', 'डेयरी', 'दूध'],
  veterinary: ['vet', 'veterinary', 'livestock', 'animal doctor', 'पशु चिकित्सक', 'पशु डॉक्टर'],
  pump: ['water pump', 'pump repair', 'पानी पंप', 'पंप मरम्मत'],
  solar: ['solar', 'सोलर', 'सौर ऊर्जा'],
  handicraft: ['handicraft', 'craft', 'हस्तशिल्प'],
  biogas: ['biogas', 'बायोगैस'],
  gardening: ['gardening', 'gardener', 'बागवानी', 'माली'],
  painting: ['painter', 'painting', 'पेंटर', 'रंगाई'],
  cooking: ['cook', 'cooking', 'chef', 'रसोइया', 'खाना बनाना'],
  driving: ['driver', 'driving', 'ड्राइवर', 'गाड़ी चलाना'],
  beauty: ['beauty', 'salon', 'makeup', 'ब्यूटी', 'सैलून'],
  ac: ['ac repair', 'air conditioner', 'एसी मरम्मत'],
  security: ['security guard', 'security', 'सुरक्षा गार्ड'],
};

const schemeKeywords = ['scheme', 'yojana', 'government', 'benefit', 'योजना', 'सरकार', 'लाभ', 'सरकारी', 'pm kisan', 'ayushman', 'skill india'];
const greetingKeywords = ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'हेलो', 'हाय', 'start', 'help', 'मदद'];
const bookingKeywords = ['book', 'confirm', 'yes', 'ok', 'haan', 'theek', 'बुक', 'हां', 'ठीक', 'confirm', 'schedule'];

function detectService(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [service, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) return service;
  }
  return null;
}

const serviceIds: Record<string, string> = {
  plumber: 'plumbing', electrician: 'electrical', carpenter: 'carpentry', cleaner: 'cleaning', tutor: 'tutoring', farmer: 'crop',
  crop: 'crop', soil: 'soil', tractor: 'tractor', dairy: 'dairy', veterinary: 'veterinary', pump: 'pump', solar: 'solar',
  handicraft: 'handicraft', biogas: 'biogas', gardening: 'gardening', painting: 'painting', cooking: 'cooking', driving: 'driving', beauty: 'beauty', ac: 'ac', security: 'security',
};
export function getRequestedServiceId(text: string): string | null {
  const service = detectService(text.toLowerCase());
  return service ? serviceIds[service] || null : null;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Main AI Response Function ────────────────────────────────────────────────
export function getAIResponse(
  userMessage: string,
  conversationHistory: AIMessage[],
  preferredLang: Lang = 'en',
  pendingProvider?: Provider | null
): AIMessage {
  const lower = userMessage.toLowerCase().trim();

  // ── Greeting ──────────────────────────────────────────────────────────────
  if (greetingKeywords.some(kw => /[\u0900-\u097F]/.test(kw) ? lower.includes(kw) : new RegExp(`\\b${kw}\\b`).test(lower)) && conversationHistory.length <= 2) {
    return {
      id: generateId(),
      role: 'assistant',
      content: "Namaste! 🙏 I'm Seva AI, your personal service assistant. I can help you:\n\n• Book home services (plumber, electrician, carpenter)\n• Find agricultural experts\n• Discover government schemes\n• Connect with tutors & healthcare\n\nWhat service do you need today?",
      contentHi: "नमस्ते! 🙏 मैं सेवा AI हूं, आपका व्यक्तिगत सेवा सहायक। मैं आपकी मदद कर सकता हूं:\n\n• घरेलू सेवाएं बुक करें (प्लंबर, इलेक्ट्रीशियन, बढ़ई)\n• कृषि विशेषज्ञ खोजें\n• सरकारी योजनाएं जानें\n• ट्यूटर और स्वास्थ्य सेवाएं\n\nआज आपको कौन सी सेवा चाहिए?",
      timestamp: new Date(),
      type: 'greeting',
      quickReplies: [
        { en: 'Book a Plumber', hi: 'प्लंबर बुक करें' },
        { en: 'Find Electrician', hi: 'इलेक्ट्रीशियन खोजें' },
        { en: 'Government Schemes', hi: 'सरकारी योजनाएं' },
        { en: 'Home Cleaning', hi: 'घर की सफाई' },
      ],
    };
  }

  // ── Booking Confirmation ──────────────────────────────────────────────────
  if (pendingProvider && bookingKeywords.some(kw => lower.includes(kw))) {
    return {
      id: generateId(),
      role: 'assistant',
      content: `To request ${pendingProvider.name}, tap the **Book** button on their provider card. The booking is not confirmed until you do that.`,
      contentHi: `${pendingProvider.name} को बुलाने के लिए प्रदाता कार्ड पर **बुक करें** दबाएं। बटन दबाने से पहले बुकिंग पक्की नहीं होती।`,
      timestamp: new Date(),
      type: 'text',
    };
  }

  // ── Service Search ────────────────────────────────────────────────────────
  const service = detectService(lower);
  if (service) {
    const serviceId = serviceIds[service];
    if (!serviceId) return {
      id: generateId(), role: 'assistant',
      content: 'I can help with this topic, but there are no matching live provider listings yet. Browse available services to see what is supported.',
      contentHi: 'मैं इस विषय में मदद कर सकता हूं, लेकिन अभी इसके लिए कोई सक्रिय सेवा प्रदाता सूचीबद्ध नहीं है। उपलब्ध सेवाएं देखने के लिए सेवाएं पेज खोलें।',
      timestamp: new Date(), type: 'text',
    };
    return {
      id: generateId(),
      role: 'assistant',
      content: 'Here are service providers who are currently online and match your request:',
      contentHi: 'आपके अनुरोध से मेल खाने वाले अभी ऑनलाइन सेवा प्रदाता:',
      timestamp: new Date(),
      type: 'providers',
      providers: [], serviceId,
    };
  }

  // ── Government Schemes ────────────────────────────────────────────────────
  if (schemeKeywords.some(kw => lower.includes(kw))) {
    return {
      id: generateId(),
      role: 'assistant',
      content: "Here are government schemes you may be eligible for:",
      contentHi: "यहाँ सरकारी योजनाएं हैं जिनके लिए आप पात्र हो सकते हैं:",
      timestamp: new Date(),
      type: 'schemes',
      schemeCards: [
        { name: 'PM Kisan Samman Nidhi', nameHi: 'पीएम किसान सम्मान निधि', icon: '🌾', benefit: '₹6,000/year for farmers', benefitHi: 'किसानों को ₹6,000/वर्ष', tag: 'Farmers' },
        { name: 'Ayushman Bharat', nameHi: 'आयुष्मान भारत', icon: '🏥', benefit: '₹5 lakh health cover/family', benefitHi: 'परिवार को ₹5 लाख स्वास्थ्य बीमा', tag: 'Healthcare' },
        { name: 'Skill India Mission', nameHi: 'कौशल भारत मिशन', icon: '🎓', benefit: 'Free skill training & certification', benefitHi: 'मुफ्त कौशल प्रशिक्षण', tag: 'Youth' },
        { name: 'PM Awas Yojana', nameHi: 'पीएम आवास योजना', icon: '🏠', benefit: 'Affordable housing subsidy', benefitHi: 'किफायती आवास सब्सिडी', tag: 'Housing' },
      ],
      quickReplies: [
        { en: 'Check PM Kisan eligibility', hi: 'पीएम किसान पात्रता जांचें' },
        { en: 'Apply for Ayushman Bharat', hi: 'आयुष्मान भारत के लिए आवेदन करें' },
      ],
    };
  }

  // ── Price / Cost Query ────────────────────────────────────────────────────
  if (['price', 'cost', 'rate', 'charge', 'kitna', 'कितना', 'दाम', 'कीमत'].some(kw => lower.includes(kw))) {
    return {
      id: generateId(),
      role: 'assistant',
      content: "Prices depend on the service and location. Browse the live service catalog for current starting prices, then confirm the final amount with your provider before booking.",
      contentHi: "कीमत सेवा और स्थान के अनुसार बदलती है। मौजूदा शुरुआती कीमत के लिए लाइव सेवा सूची देखें और बुकिंग से पहले प्रदाता से अंतिम राशि की पुष्टि करें।",
      timestamp: new Date(),
      type: 'text',
      quickReplies: [
        { en: 'Book a Plumber', hi: 'प्लंबर बुक करें' },
        { en: 'Book Electrician', hi: 'इलेक्ट्रीशियन बुक करें' },
      ],
    };
  }

  // ── Emergency ─────────────────────────────────────────────────────────────
  if (['emergency', 'urgent', 'asap', 'now', 'abhi', 'जल्दी', 'तुरंत', 'आपातकाल'].some(kw => lower.includes(kw))) {
    return {
      id: generateId(),
      role: 'assistant',
      content: "🚨 If anyone is in immediate danger, contact your local emergency services now. I can't dispatch providers or provide emergency response times. For non-emergency home repairs, browse currently available providers below.",
      contentHi: "🚨 अगर किसी की जान या सुरक्षा को तुरंत खतरा है, तो अभी स्थानीय आपातकालीन सेवाओं से संपर्क करें। मैं आपातकालीन सहायता भेजने या पहुंचने का समय बताने में सक्षम नहीं हूं। सामान्य मरम्मत के लिए उपलब्ध सेवा प्रदाता देखें।",
      timestamp: new Date(),
      type: 'text',
      quickReplies: [
        { en: 'Find Emergency Plumber', hi: 'आपातकालीन प्लंबर खोजें' },
        { en: 'Find Emergency Electrician', hi: 'आपातकालीन इलेक्ट्रीशियन खोजें' },
      ],
    };
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return {
    id: generateId(),
    role: 'assistant',
    content: `I understand you need help! I can assist with:\n\n🔧 **Home Services** — Plumber, Electrician, Carpenter\n🌾 **Agriculture** — Farming experts, soil testing\n📚 **Education** — Home tutors, coaching\n🏛️ **Government Schemes** — PM Kisan, Ayushman Bharat\n\nTry saying: *"I need a plumber"* or *"मुझे प्लंबर चाहिए"*`,
    contentHi: `मैं समझता हूं आपको मदद चाहिए! मैं इनमें सहायता कर सकता हूं:\n\n🔧 **घरेलू सेवाएं** — प्लंबर, इलेक्ट्रीशियन, बढ़ई\n🌾 **कृषि** — खेती विशेषज्ञ, मिट्टी परीक्षण\n📚 **शिक्षा** — गृह शिक्षक, कोचिंग\n🏛️ **सरकारी योजनाएं** — पीएम किसान, आयुष्मान भारत\n\nकहें: *"मुझे प्लंबर चाहिए"* या *"I need a plumber"*`,
    timestamp: new Date(),
    type: 'text',
    quickReplies: [
      { en: 'Book a Plumber', hi: 'प्लंबर बुक करें' },
      { en: 'Find Electrician', hi: 'इलेक्ट्रीशियन खोजें' },
      { en: 'Government Schemes', hi: 'सरकारी योजनाएं' },
      { en: 'Home Cleaning', hi: 'घर की सफाई' },
    ],
  };
}

// ─── Text-to-Speech ───────────────────────────────────────────────────────────
export function speakText(text: string, lang: Lang = 'en'): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return false;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean markdown from text
  const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[#_`]/g, '').replace(/\n+/g, '. ').trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const targetLang = lang === 'hi' ? 'hi' : 'en';
  const voice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
}
