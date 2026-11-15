import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api-client';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { PhotoBanner } from '../components/ui/photo-banner';
import {
  Search, ChevronDown, ChevronUp, Shield,
  Leaf, Heart, BookOpen, Home, Zap, Users, Building2,
  CheckCircle, ArrowRight, Star, Phone, Globe,
  Landmark, Tractor, Baby, Briefcase, Droplets, Sun
} from 'lucide-react';

type Lang = 'en' | 'hi';

// ─── Categories ───────────────────────────────────────────────────────────────
const categories = [
  { id: 'all', label: 'All Schemes', labelHi: 'सभी योजनाएं', icon: Landmark },
  { id: 'agri', label: 'Agriculture', labelHi: 'कृषि', icon: Tractor },
  { id: 'health', label: 'Healthcare', labelHi: 'स्वास्थ्य', icon: Heart },
  { id: 'edu', label: 'Education', labelHi: 'शिक्षा', icon: BookOpen },
  { id: 'housing', label: 'Housing', labelHi: 'आवास', icon: Home },
  { id: 'women', label: 'Women & Child', labelHi: 'महिला एवं बाल', icon: Baby },
  { id: 'employment', label: 'Employment', labelHi: 'रोजगार', icon: Briefcase },
  { id: 'energy', label: 'Energy', labelHi: 'ऊर्जा', icon: Sun },
  { id: 'water', label: 'Water & Sanitation', labelHi: 'जल एवं स्वच्छता', icon: Droplets },
  { id: 'social', label: 'Social Welfare', labelHi: 'सामाजिक कल्याण', icon: Users },
];

// ─── Schemes Data ─────────────────────────────────────────────────────────────
const schemes = [
  {
    id: 1, cat: 'agri',
    name: 'PM Kisan Samman Nidhi', nameHi: 'पीएम किसान सम्मान निधि',
    ministry: 'Ministry of Agriculture', ministryHi: 'कृषि मंत्रालय',
    benefit: '₹6,000/year', benefitHi: '₹6,000/वर्ष',
    desc: 'Direct income support of ₹6,000 per year to all landholding farmer families in three equal installments.',
    descHi: 'सभी भूमिधारक किसान परिवारों को तीन समान किस्तों में ₹6,000 प्रति वर्ष की प्रत्यक्ष आय सहायता।',
    eligibility: ['Indian farmer with cultivable land', 'Valid Aadhaar card', 'Bank account linked to Aadhaar'],
    eligibilityHi: ['खेती योग्य भूमि वाले भारतीय किसान', 'वैध आधार कार्ड', 'आधार से जुड़ा बैंक खाता'],
    documents: ['Aadhaar Card', 'Land Records (Khasra/Khatauni)', 'Bank Passbook', 'Mobile Number'],
    documentsHi: ['आधार कार्ड', 'भूमि रिकॉर्ड (खसरा/खतौनी)', 'बैंक पासबुक', 'मोबाइल नंबर'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-orange-100 text-orange-700',
    popular: true, helpline: '155261', website: 'pmkisan.gov.in',
    icon: Tractor, color: 'from-green-600 to-emerald-500',
  },
  {
    id: 2, cat: 'health',
    name: 'Ayushman Bharat PM-JAY', nameHi: 'आयुष्मान भारत पीएम-जेएवाई',
    ministry: 'Ministry of Health', ministryHi: 'स्वास्थ्य मंत्रालय',
    benefit: '₹5 Lakh/year health cover', benefitHi: '₹5 लाख/वर्ष स्वास्थ्य कवर',
    desc: 'Health insurance cover of ₹5 lakh per family per year for secondary and tertiary care hospitalization.',
    descHi: 'माध्यमिक और तृतीयक देखभाल अस्पताल में भर्ती के लिए प्रति परिवार प्रति वर्ष ₹5 लाख का स्वास्थ्य बीमा।',
    eligibility: ['SECC 2011 listed families', 'BPL card holders', 'No age limit'],
    eligibilityHi: ['SECC 2011 सूचीबद्ध परिवार', 'बीपीएल कार्ड धारक', 'कोई आयु सीमा नहीं'],
    documents: ['Aadhaar Card', 'Ration Card', 'Income Certificate', 'SECC Data verification'],
    documentsHi: ['आधार कार्ड', 'राशन कार्ड', 'आय प्रमाण पत्र', 'SECC डेटा सत्यापन'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-blue-100 text-blue-700',
    popular: true, helpline: '14555', website: 'pmjay.gov.in',
    icon: Heart, color: 'from-red-500 to-rose-400',
  },
  {
    id: 3, cat: 'housing',
    name: 'PM Awas Yojana (Gramin)', nameHi: 'पीएम आवास योजना (ग्रामीण)',
    ministry: 'Ministry of Rural Development', ministryHi: 'ग्रामीण विकास मंत्रालय',
    benefit: '₹1.2–1.3 Lakh subsidy', benefitHi: '₹1.2–1.3 लाख सब्सिडी',
    desc: 'Financial assistance to rural households for construction of pucca houses with basic amenities.',
    descHi: 'बुनियादी सुविधाओं के साथ पक्के मकानों के निर्माण के लिए ग्रामीण परिवारों को वित्तीय सहायता।',
    eligibility: ['Homeless or kutcha house dwellers', 'BPL families', 'SC/ST/OBC priority'],
    eligibilityHi: ['बेघर या कच्चे घर में रहने वाले', 'बीपीएल परिवार', 'SC/ST/OBC को प्राथमिकता'],
    documents: ['Aadhaar Card', 'BPL Certificate', 'Bank Account', 'Land Ownership Proof'],
    documentsHi: ['आधार कार्ड', 'बीपीएल प्रमाण पत्र', 'बैंक खाता', 'भूमि स्वामित्व प्रमाण'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-orange-100 text-orange-700',
    popular: false, helpline: '1800-11-6446', website: 'pmayg.nic.in',
    icon: Home, color: 'from-amber-600 to-yellow-500',
  },
  {
    id: 4, cat: 'edu',
    name: 'PM Scholarship Scheme', nameHi: 'पीएम छात्रवृत्ति योजना',
    ministry: 'Ministry of Education', ministryHi: 'शिक्षा मंत्रालय',
    benefit: '₹2,500–3,000/month', benefitHi: '₹2,500–3,000/माह',
    desc: 'Scholarship for wards of ex-servicemen and ex-coast guard personnel for professional degree courses.',
    descHi: 'पेशेवर डिग्री पाठ्यक्रमों के लिए पूर्व सैनिकों और पूर्व तटरक्षक कर्मियों के वार्डों के लिए छात्रवृत्ति।',
    eligibility: ['Ward of ex-serviceman/coast guard', 'Minimum 60% in Class 12', 'Age below 25 years'],
    eligibilityHi: ['पूर्व सैनिक/तटरक्षक के वार्ड', 'कक्षा 12 में न्यूनतम 60%', 'आयु 25 वर्ष से कम'],
    documents: ['Aadhaar Card', 'Class 12 Marksheet', 'Ex-serviceman Certificate', 'Bank Account'],
    documentsHi: ['आधार कार्ड', 'कक्षा 12 की मार्कशीट', 'पूर्व सैनिक प्रमाण पत्र', 'बैंक खाता'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-purple-100 text-purple-700',
    popular: false, helpline: '1800-11-0001', website: 'scholarships.gov.in',
    icon: BookOpen, color: 'from-violet-600 to-purple-500',
  },
  {
    id: 5, cat: 'women',
    name: 'Beti Bachao Beti Padhao', nameHi: 'बेटी बचाओ बेटी पढ़ाओ',
    ministry: 'Ministry of Women & Child', ministryHi: 'महिला एवं बाल विकास मंत्रालय',
    benefit: 'Education & welfare support', benefitHi: 'शिक्षा एवं कल्याण सहायता',
    desc: 'Scheme to address declining Child Sex Ratio and promote welfare and education of the girl child.',
    descHi: 'घटते बाल लिंगानुपात को संबोधित करने और बालिका के कल्याण और शिक्षा को बढ़ावा देने की योजना।',
    eligibility: ['Girl child (0–10 years)', 'Parents/guardians', 'All income groups'],
    eligibilityHi: ['बालिका (0–10 वर्ष)', 'माता-पिता/अभिभावक', 'सभी आय वर्ग'],
    documents: ['Birth Certificate', 'Aadhaar Card', 'Bank Account (Sukanya Samriddhi)'],
    documentsHi: ['जन्म प्रमाण पत्र', 'आधार कार्ड', 'बैंक खाता (सुकन्या समृद्धि)'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-pink-100 text-pink-700',
    popular: true, helpline: '181', website: 'wcd.nic.in',
    icon: Baby, color: 'from-pink-500 to-rose-400',
  },
  {
    id: 6, cat: 'employment',
    name: 'MGNREGS (MNREGA)', nameHi: 'मनरेगा',
    ministry: 'Ministry of Rural Development', ministryHi: 'ग्रामीण विकास मंत्रालय',
    benefit: '100 days guaranteed work/year', benefitHi: '100 दिन गारंटीड काम/वर्ष',
    desc: 'Guarantees 100 days of wage employment per year to every rural household whose adult members volunteer to do unskilled manual work.',
    descHi: 'प्रत्येक ग्रामीण परिवार को प्रति वर्ष 100 दिन की मजदूरी रोजगार की गारंटी जिनके वयस्क सदस्य अकुशल शारीरिक कार्य करने के लिए स्वयंसेवा करते हैं।',
    eligibility: ['Rural household adult member', 'Willing to do unskilled work', 'Job card holder'],
    eligibilityHi: ['ग्रामीण परिवार के वयस्क सदस्य', 'अकुशल काम करने के इच्छुक', 'जॉब कार्ड धारक'],
    documents: ['Job Card', 'Aadhaar Card', 'Bank Account', 'Residence Proof'],
    documentsHi: ['जॉब कार्ड', 'आधार कार्ड', 'बैंक खाता', 'निवास प्रमाण'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-green-100 text-green-700',
    popular: true, helpline: '1800-11-0707', website: 'nrega.nic.in',
    icon: Briefcase, color: 'from-teal-600 to-cyan-500',
  },
  {
    id: 7, cat: 'energy',
    name: 'PM Ujjwala Yojana', nameHi: 'पीएम उज्ज्वला योजना',
    ministry: 'Ministry of Petroleum', ministryHi: 'पेट्रोलियम मंत्रालय',
    benefit: 'Free LPG connection', benefitHi: 'मुफ्त LPG कनेक्शन',
    desc: 'Provides free LPG connections to women from BPL households to replace traditional cooking fuels.',
    descHi: 'पारंपरिक खाना पकाने के ईंधन को बदलने के लिए बीपीएल परिवारों की महिलाओं को मुफ्त एलपीजी कनेक्शन प्रदान करता है।',
    eligibility: ['Women from BPL household', 'Age 18 years or above', 'No existing LPG connection'],
    eligibilityHi: ['बीपीएल परिवार की महिला', 'आयु 18 वर्ष या उससे अधिक', 'कोई मौजूदा LPG कनेक्शन नहीं'],
    documents: ['BPL Ration Card', 'Aadhaar Card', 'Bank Account', 'Address Proof'],
    documentsHi: ['बीपीएल राशन कार्ड', 'आधार कार्ड', 'बैंक खाता', 'पता प्रमाण'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-yellow-100 text-yellow-700',
    popular: false, helpline: '1906', website: 'pmuy.gov.in',
    icon: Sun, color: 'from-orange-500 to-amber-400',
  },
  {
    id: 8, cat: 'water',
    name: 'Jal Jeevan Mission', nameHi: 'जल जीवन मिशन',
    ministry: 'Ministry of Jal Shakti', ministryHi: 'जल शक्ति मंत्रालय',
    benefit: 'Tap water connection at home', benefitHi: 'घर पर नल जल कनेक्शन',
    desc: 'Provides safe and adequate drinking water through individual household tap connections to all rural households.',
    descHi: 'सभी ग्रामीण परिवारों को व्यक्तिगत घरेलू नल कनेक्शन के माध्यम से सुरक्षित और पर्याप्त पेयजल प्रदान करता है।',
    eligibility: ['Rural household', 'No existing tap water connection', 'All income groups'],
    eligibilityHi: ['ग्रामीण परिवार', 'कोई मौजूदा नल जल कनेक्शन नहीं', 'सभी आय वर्ग'],
    documents: ['Aadhaar Card', 'Residence Proof', 'Application to Gram Panchayat'],
    documentsHi: ['आधार कार्ड', 'निवास प्रमाण', 'ग्राम पंचायत को आवेदन'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-cyan-100 text-cyan-700',
    popular: false, helpline: '1800-11-8800', website: 'jaljeevanmission.gov.in',
    icon: Droplets, color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 9, cat: 'social',
    name: 'PM Jan Dhan Yojana', nameHi: 'पीएम जन धन योजना',
    ministry: 'Ministry of Finance', ministryHi: 'वित्त मंत्रालय',
    benefit: 'Zero-balance bank account + ₹2L insurance', benefitHi: 'जीरो बैलेंस खाता + ₹2L बीमा',
    desc: 'National mission for financial inclusion to ensure access to financial services — savings, credit, insurance, pension.',
    descHi: 'वित्तीय सेवाओं तक पहुंच सुनिश्चित करने के लिए वित्तीय समावेशन का राष्ट्रीय मिशन — बचत, ऋण, बीमा, पेंशन।',
    eligibility: ['Indian citizen', 'Age 10 years or above', 'No existing bank account required'],
    eligibilityHi: ['भारतीय नागरिक', 'आयु 10 वर्ष या उससे अधिक', 'मौजूदा बैंक खाता आवश्यक नहीं'],
    documents: ['Aadhaar Card', 'PAN Card (optional)', 'Passport size photo', 'Address Proof'],
    documentsHi: ['आधार कार्ड', 'पैन कार्ड (वैकल्पिक)', 'पासपोर्ट साइज फोटो', 'पता प्रमाण'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-indigo-100 text-indigo-700',
    popular: true, helpline: '1800-11-0001', website: 'pmjdy.gov.in',
    icon: Building2, color: 'from-indigo-600 to-violet-500',
  },
  {
    id: 10, cat: 'agri',
    name: 'Pradhan Mantri Fasal Bima Yojana', nameHi: 'प्रधानमंत्री फसल बीमा योजना',
    ministry: 'Ministry of Agriculture', ministryHi: 'कृषि मंत्रालय',
    benefit: 'Crop insurance at low premium', benefitHi: 'कम प्रीमियम पर फसल बीमा',
    desc: 'Provides financial support to farmers suffering crop loss/damage due to unforeseen events like natural calamities.',
    descHi: 'प्राकृतिक आपदाओं जैसी अप्रत्याशित घटनाओं के कारण फसल हानि/क्षति से पीड़ित किसानों को वित्तीय सहायता।',
    eligibility: ['All farmers growing notified crops', 'Loanee and non-loanee farmers', 'Sharecroppers/tenant farmers'],
    eligibilityHi: ['अधिसूचित फसलें उगाने वाले सभी किसान', 'ऋणी और गैर-ऋणी किसान', 'बटाईदार/किरायेदार किसान'],
    documents: ['Land Records', 'Aadhaar Card', 'Bank Account', 'Sowing Certificate'],
    documentsHi: ['भूमि रिकॉर्ड', 'आधार कार्ड', 'बैंक खाता', 'बुवाई प्रमाण पत्र'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-orange-100 text-orange-700',
    popular: false, helpline: '1800-200-7710', website: 'pmfby.gov.in',
    icon: Leaf, color: 'from-green-500 to-lime-400',
  },
  {
    id: 11, cat: 'employment',
    name: 'PM Mudra Yojana', nameHi: 'पीएम मुद्रा योजना',
    ministry: 'Ministry of Finance', ministryHi: 'वित्त मंत्रालय',
    benefit: 'Loans up to ₹10 Lakh', benefitHi: '₹10 लाख तक ऋण',
    desc: 'Provides loans up to ₹10 lakh to non-corporate, non-farm small/micro enterprises for income-generating activities.',
    descHi: 'आय-सृजन गतिविधियों के लिए गैर-कॉर्पोरेट, गैर-कृषि लघु/सूक्ष्म उद्यमों को ₹10 लाख तक ऋण।',
    eligibility: ['Non-farm micro/small enterprises', 'Individuals, proprietorships, partnerships', 'No collateral required for Shishu loans'],
    eligibilityHi: ['गैर-कृषि सूक्ष्म/लघु उद्यम', 'व्यक्ति, स्वामित्व, साझेदारी', 'शिशु ऋण के लिए कोई संपार्श्विक नहीं'],
    documents: ['Aadhaar Card', 'PAN Card', 'Business Plan', 'Bank Statement (6 months)'],
    documentsHi: ['आधार कार्ड', 'पैन कार्ड', 'व्यवसाय योजना', 'बैंक स्टेटमेंट (6 माह)'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-teal-100 text-teal-700',
    popular: true, helpline: '1800-180-1111', website: 'mudra.org.in',
    icon: Briefcase, color: 'from-teal-600 to-green-500',
  },
  {
    id: 12, cat: 'social',
    name: 'Atal Pension Yojana', nameHi: 'अटल पेंशन योजना',
    ministry: 'Ministry of Finance', ministryHi: 'वित्त मंत्रालय',
    benefit: '₹1,000–5,000/month pension', benefitHi: '₹1,000–5,000/माह पेंशन',
    desc: 'Guaranteed minimum pension of ₹1,000–5,000 per month at age 60 for unorganized sector workers.',
    descHi: 'असंगठित क्षेत्र के श्रमिकों के लिए 60 वर्ष की आयु में ₹1,000–5,000 प्रति माह की गारंटीड न्यूनतम पेंशन।',
    eligibility: ['Age 18–40 years', 'Bank account holder', 'Not an income tax payer'],
    eligibilityHi: ['आयु 18–40 वर्ष', 'बैंक खाता धारक', 'आयकर दाता नहीं'],
    documents: ['Aadhaar Card', 'Bank Account', 'Mobile Number'],
    documentsHi: ['आधार कार्ड', 'बैंक खाता', 'मोबाइल नंबर'],
    tag: 'Central', tagHi: 'केंद्रीय', tagColor: 'bg-slate-100 text-slate-700',
    popular: false, helpline: '1800-110-069', website: 'npscra.nsdl.co.in',
    icon: Shield, color: 'from-slate-600 to-gray-500',
  },
];

// ─── Scheme Card ──────────────────────────────────────────────────────────────
function SchemeCard({ scheme, lang, onApply }: { scheme: typeof schemes[0]; lang: Lang; onApply: (s: typeof schemes[0]) => void }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = scheme.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-card border-2 rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
        expanded ? 'border-primary shadow-md shadow-primary/10' : 'border-border hover:border-primary/40'
      }`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scheme.color} flex items-center justify-center shrink-0 shadow-md`}>
            <Icon size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-foreground text-sm leading-tight">
                {lang === 'hi' ? scheme.nameHi : scheme.name}
              </h3>
              {scheme.popular && (
                <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                  {lang === 'hi' ? 'लोकप्रिय' : 'Popular'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {lang === 'hi' ? scheme.ministryHi : scheme.ministry}
            </p>
          </div>
        </div>

        {/* Benefit badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scheme.tagColor}`}>
            {lang === 'hi' ? scheme.tagHi : scheme.tag}
          </span>
          <span className="text-sm font-black text-primary">
            {lang === 'hi' ? scheme.benefitHi : scheme.benefit}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
          {lang === 'hi' ? scheme.descHi : scheme.desc}
        </p>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
        >
          {expanded
            ? (lang === 'hi' ? 'कम दिखाएं' : 'Show less')
            : (lang === 'hi' ? 'पात्रता और दस्तावेज़ देखें' : 'View eligibility & documents')}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4 grid sm:grid-cols-2 gap-4">
              {/* Eligibility */}
              <div>
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                  <CheckCircle size={12} className="text-secondary" />
                  {lang === 'hi' ? 'पात्रता' : 'Eligibility'}
                </p>
                <ul className="space-y-1.5">
                  {(lang === 'hi' ? scheme.eligibilityHi : scheme.eligibility).map((e, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-secondary mt-0.5">•</span> {e}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1">
                  <Shield size={12} className="text-primary" />
                  {lang === 'hi' ? 'आवश्यक दस्तावेज़' : 'Required Documents'}
                </p>
                <ul className="space-y-1.5">
                  {(lang === 'hi' ? scheme.documentsHi : scheme.documents).map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onApply(scheme)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
              >
                {lang === 'hi' ? 'सहायता लें' : 'Get Help Applying'} <ArrowRight size={11} />
              </button>
              <a
                href={`https://${scheme.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
              >
                <Globe size={11} /> {scheme.website}
              </a>
              <a
                href={`tel:${scheme.helpline}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-all"
              >
                <Phone size={11} /> {scheme.helpline}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Apply Modal ──────────────────────────────────────────────────────────────
function ApplyModal({ scheme, lang, onClose }: { scheme: typeof schemes[0]; lang: Lang; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await apiRequest('/schemes/applications', { method: 'POST', body: JSON.stringify({ schemeId: scheme.id, name: form.name, phone: form.phone }) });
      setSubmitted(true);
    } catch (e) { setError(e instanceof Error ? e.message : (lang === 'hi' ? 'अनुरोध सहेजा नहीं जा सका।' : 'Could not save your request.')); }
    finally { setBusy(false); }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-card rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border border-border"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {lang === 'hi' ? 'अनुरोध सबमिट हुआ!' : 'Request Submitted!'}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            {lang === 'hi'
              ? 'आपकी सहायता का अनुरोध सेवा सेतु खाते में सहेजा गया है। यह सरकारी पोर्टल पर आवेदन नहीं है।'
              : 'Your request for assistance was saved to SevaSetu. This is not an application to a government portal.'}
          </p>
          <button onClick={onClose} className="w-full py-2.5 rounded-full bg-primary text-white font-bold text-sm">
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scheme.color} flex items-center justify-center`}>
            <scheme.icon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">
              {lang === 'hi' ? 'आवेदन सहायता' : 'Application Assistance'}
            </h3>
            <p className="text-xs text-muted-foreground">{lang === 'hi' ? scheme.nameHi : scheme.name}</p>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          {[
            { key: 'name', label: lang === 'hi' ? 'पूरा नाम' : 'Full Name', placeholder: lang === 'hi' ? 'आपका नाम' : 'Your name' },
            { key: 'phone', label: lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number', placeholder: '+91 XXXXX XXXXX' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs font-semibold text-foreground mb-1 block">{field.label}</label>
              <input
                type="text"
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mb-4 flex items-start gap-1">
          <Shield size={10} className="shrink-0 mt-0.5 text-secondary" />
          {lang === 'hi'
            ? 'यह केवल सहायता अनुरोध सहेजता है। आधिकारिक पात्रता और आवेदन सरकारी पोर्टल पर जांचें।'
            : 'This only records an assistance request. Check official eligibility and apply through the government portal.'}
        </p>
        {error && <p role="alert" className="mb-3 text-xs text-red-700">{error}{error === 'Sign in to continue' && <Link to="/login" className="ml-1 underline">{lang === 'hi' ? 'साइन इन' : 'Sign in'}</Link>}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-border text-muted-foreground text-sm font-semibold hover:bg-muted">
            {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            onClick={() => void submit()}
            className="flex-1 py-2.5 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-40"
            disabled={!form.name || !form.phone || busy}
          >
            {busy ? (lang === 'hi' ? 'सहेज रहे हैं…' : 'Saving…') : (lang === 'hi' ? 'अनुरोध सहेजें' : 'Save Request')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SchemesPage() {
  const [lang, setLang] = useAppLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applyScheme, setApplyScheme] = useState<typeof schemes[0] | null>(null);

  const filtered = useMemo(() => {
    let result = schemes;
    if (activeCategory !== 'all') result = result.filter(s => s.cat === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.nameHi.includes(q) ||
        s.desc.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

  const popularSchemes = schemes.filter(s => s.popular);

  return (
    <div className="min-h-screen bg-background">
      <title>Government Schemes – SevaSetu | Find & Apply for Govt Benefits</title>
      <meta name="description" content="Discover and apply for government schemes like PM Kisan, Ayushman Bharat, MNREGA and more. Get expert assistance in Hindi and English." />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary/90 via-secondary to-primary py-14 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <PhotoBanner scene="agri" alt="Animated farmland" caption="Schemes for farms, homes, and health" className="mb-7" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-white text-sm font-semibold mb-4">
              <Landmark size={14} /> {lang === 'hi' ? 'सरकारी योजनाएं' : 'Government Schemes'}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              {lang === 'hi' ? 'अपनी योजना खोजें' : 'Find Your Scheme'}
              <br />
              <span className="text-yellow-300">{lang === 'hi' ? 'और लाभ उठाएं' : '& Claim Benefits'}</span>
            </h1>
            <p className="text-white/80 text-lg mb-6 max-w-xl mx-auto">
              {lang === 'hi'
                ? '12+ केंद्रीय योजनाएं — पात्रता जांचें, दस्तावेज़ तैयार करें, आवेदन करें'
                : '12+ central schemes — check eligibility, prepare documents, apply with expert help'}
            </p>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-xl max-w-xl mx-auto mb-4">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'योजना खोजें... जैसे "किसान" या "health"' : 'Search schemes... e.g. "kisan" or "health"'}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 text-sm"
              />
            </div>

            <button
              onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
              className="text-xs px-4 py-2 rounded-full bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all font-semibold"
            >
              {lang === 'en' ? 'हिंदी में देखें' : 'View in English'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {[
              { value: '12+', label: lang === 'hi' ? 'योजनाएं' : 'Schemes', icon: Landmark },
              { value: '₹10L+', label: lang === 'hi' ? 'अधिकतम लाभ' : 'Max Benefit', icon: Star },
              { value: '2.4Cr+', label: lang === 'hi' ? 'लाभार्थी' : 'Beneficiaries', icon: Users },
              { value: '24h', label: lang === 'hi' ? 'सहायता समय' : 'Help Response', icon: Zap },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-center">
                <Icon size={16} className="text-primary" />
                <div>
                  <p className="font-black text-foreground text-sm">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* ── Popular Schemes Quick Access ───────────────────────────────── */}
        {!searchQuery && activeCategory === 'all' && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Star size={18} className="text-yellow-500 fill-yellow-500" />
              {lang === 'hi' ? 'लोकप्रिय योजनाएं' : 'Popular Schemes'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {popularSchemes.map((scheme, i) => {
                const Icon = scheme.icon;
                return (
                  <motion.button
                    key={scheme.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={() => setActiveCategory(scheme.cat)}
                    className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scheme.color} flex items-center justify-center shadow`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <p className="text-[11px] font-bold text-foreground leading-tight">
                      {lang === 'hi' ? scheme.nameHi.split(' ').slice(0, 3).join(' ') : scheme.name.split(' ').slice(0, 3).join(' ')}
                    </p>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {lang === 'hi' ? scheme.benefitHi.split('/')[0] : scheme.benefit.split('/')[0]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Category Tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-secondary text-white shadow-md'
                    : 'bg-card border border-border text-muted-foreground hover:text-secondary hover:border-secondary/40'
                }`}
              >
                <Icon size={12} />
                {lang === 'hi' ? cat.labelHi : cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Results count ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filtered.length}</span>{' '}
            {lang === 'hi' ? 'योजनाएं मिलीं' : 'schemes found'}
          </p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-primary hover:underline">
              {lang === 'hi' ? 'खोज साफ करें' : 'Clear search'}
            </button>
          )}
        </div>

        {/* ── Scheme Cards ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + searchQuery}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {filtered.map(scheme => (
              <SchemeCard key={scheme.id} scheme={scheme} lang={lang} onApply={setApplyScheme} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-foreground font-bold text-lg mb-1">
              {lang === 'hi' ? 'कोई योजना नहीं मिली' : 'No schemes found'}
            </p>
            <p className="text-muted-foreground text-sm">
              {lang === 'hi' ? 'अलग कीवर्ड आज़माएं' : 'Try a different keyword'}
            </p>
          </div>
        )}

        {/* ── Help CTA ───────────────────────────────────────────────────── */}
        <section className="mt-16 bg-gradient-to-br from-secondary/90 to-primary rounded-3xl p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
          <div className="relative z-10">
            <Building2 size={36} className="text-white mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">
              {lang === 'hi' ? 'योजना आवेदन में मदद चाहिए?' : 'Need Help Applying?'}
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto text-sm">
              {lang === 'hi'
                ? 'हमारे विशेषज्ञ आपको सही योजना खोजने और आवेदन करने में मदद करेंगे'
                : 'Our experts will help you find the right scheme and complete your application'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/assistant"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-secondary font-bold text-sm hover:scale-105 transition-all shadow-lg"
              >
                {lang === 'hi' ? 'AI सहायक से पूछें' : 'Ask AI Assistant'} <ArrowRight size={14} />
              </Link>
              <a
                href="tel:1800-11-0001"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 text-white border border-white/30 font-bold text-sm hover:bg-white/30 transition-all"
              >
                <Phone size={14} /> 1800-11-0001
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyScheme && (
          <ApplyModal scheme={applyScheme} lang={lang} onClose={() => setApplyScheme(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
