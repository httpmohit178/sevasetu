import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api-client';
import { PhotoBanner } from '../components/ui/photo-banner';
import { imageSources } from '../lib/image-sources';
import {
  CreditCard, Smartphone, Building2, Shield, Lock,
  CheckCircle, ArrowLeft, Zap, Gift,
  Eye, EyeOff, ArrowRight, Wallet
} from 'lucide-react';

type Lang = 'en' | 'hi';
type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
type Step = 'method' | 'details' | 'otp' | 'success';

// ─── UPI Apps ─────────────────────────────────────────────────────────────────
const upiApps = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢', color: 'border-green-200 bg-green-50 dark:bg-green-950/20' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20' },
  { id: 'paytm', name: 'Paytm', icon: '🔵', color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' },
  { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳', color: 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' },
];

const banks = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Union Bank',
];

const wallets = [
  { id: 'paytm', name: 'Paytm Wallet', balance: '₹450', icon: '💙' },
  { id: 'mobikwik', name: 'MobiKwik', balance: '₹120', icon: '💜' },
  { id: 'freecharge', name: 'FreeCharge', balance: '₹0', icon: '🟠' },
];

// ─── Order Summary ────────────────────────────────────────────────────────────
const orderDetails = {
  service: 'Plumbing Repair',
  serviceHi: 'प्लंबिंग मरम्मत',
  provider: 'Suresh Yadav',
  date: 'Today, 2:00 PM',
  dateHi: 'आज, दोपहर 2:00 बजे',
  subtotal: 299,
  platformFee: 15,
  discount: 30,
  rewardDiscount: 50,
  bookingId: 'SVS847291',
};

// ─── OTP Input ────────────────────────────────────────────────────────────────
function OTPInput({ onComplete }: { onComplete: (otp: string) => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
    if (newOtp.every(d => d !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-lg font-bold bg-muted border-2 border-border rounded-xl outline-none focus:border-primary transition-colors text-foreground"
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const [lang, setLang] = useState<Lang>('en');
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [selectedUPI, setSelectedUPI] = useState('gpay');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [showCVV, setShowCVV] = useState(false);
  const [useRewardPoints, setUseRewardPoints] = useState(true);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const total = orderDetails.subtotal + orderDetails.platformFee - orderDetails.discount - (useRewardPoints ? orderDetails.rewardDiscount : 0);

  const handlePay = async () => {
    setPaymentError('');
    if (method !== 'cod') {
      setPaymentError('Online payments are unavailable until a payment provider is configured. Choose Cash on Service to confirm a booking.');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await apiRequest<{ booking: { id: string } }>('/bookings', { method: 'POST', body: JSON.stringify({ serviceId: 'plumbing', paymentMethod: 'cod', address: '' }) });
      setBookingId(result.booking.id);
      setStep('success');
    } catch (error) { setPaymentError(error instanceof Error ? error.message : 'Could not create your booking'); }
    finally { setIsProcessing(false); }
  };

  const handleOTPComplete = async (_otp: string) => {
    await new Promise(r => setTimeout(r, 1000));
    setStep('success');
  };

  const formatCard = (val: string) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiry = (val: string) => {
    return val.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-background">
      <title>Payment – SevaSetu | Secure Checkout</title>      <meta name="description" content="Secure payment for SevaSetu services. Pay via UPI, card, net banking or wallet." />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border sticky top-16 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/tracker" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {lang === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payment'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-secondary" />
            <span className="text-xs text-secondary font-semibold">256-bit SSL</span>
            <button
              onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-primary ml-2"
            >
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>
          </div>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex border-t border-border">
            {(['method', 'details', 'otp'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`flex-1 py-1.5 text-center text-[10px] font-semibold transition-colors ${
                  step === s ? 'text-primary border-b-2 border-primary' :
                  ['method', 'details', 'otp'].indexOf(step) > i ? 'text-secondary' : 'text-muted-foreground'
                }`}
              >
                {i + 1}. {s === 'method' ? (lang === 'hi' ? 'विधि' : 'Method') : s === 'details' ? (lang === 'hi' ? 'विवरण' : 'Details') : 'OTP'}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <PhotoBanner src={imageSources.home} alt="Modern white home exterior with plants" caption="Modern white home exterior with plants" className="mb-5" />
        {paymentError && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{paymentError}</p>}
        <AnimatePresence mode="wait">

          {/* ── SUCCESS ─────────────────────────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle size={48} className="text-green-600" />
              </motion.div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {lang === 'hi' ? 'भुगतान सफल!' : 'Payment Successful!'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {lang === 'hi' ? 'आपकी बुकिंग की पुष्टि हो गई है' : 'Your booking has been confirmed'}
              </p>

              <div className="bg-card border border-border rounded-2xl p-5 text-left mb-5">
                {[
                  { label: lang === 'hi' ? 'बुकिंग ID' : 'Booking ID', value: `#${bookingId || orderDetails.bookingId}` },
                  { label: lang === 'hi' ? 'सेवा' : 'Service', value: lang === 'hi' ? orderDetails.serviceHi : orderDetails.service },
                  { label: lang === 'hi' ? 'प्रदाता' : 'Provider', value: orderDetails.provider },
                  { label: lang === 'hi' ? 'भुगतान' : 'Amount Paid', value: `₹${total}` },
                  { label: lang === 'hi' ? 'विधि' : 'Method', value: method.toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-primary/10 rounded-xl p-3 flex items-center justify-center gap-2 mb-5">
                <Zap size={16} className="text-primary" />
                <span className="text-primary font-bold text-sm">+50 SevaPoints {lang === 'hi' ? 'मिले!' : 'earned!'}</span>
              </div>

              <div className="flex gap-3">
                <Link to="/tracker" className="flex-1 py-3 rounded-full bg-primary text-white font-bold text-sm text-center hover:bg-primary/90 transition-all">
                  {lang === 'hi' ? 'ट्रैक करें' : 'Track Booking'}
                </Link>
                <Link to="/" className="flex-1 py-3 rounded-full border border-border text-foreground font-bold text-sm text-center hover:bg-muted transition-all">
                  {lang === 'hi' ? 'होम' : 'Home'}
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── OTP ─────────────────────────────────────────────────────── */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={28} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {lang === 'hi' ? 'OTP दर्ज करें' : 'Enter OTP'}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {lang === 'hi'
                    ? '+91 98765 ****10 पर OTP भेजा गया'
                    : 'OTP sent to +91 98765 ****10'}
                </p>
                <OTPInput onComplete={handleOTPComplete} />
                <p className="text-xs text-muted-foreground mt-4">
                  {lang === 'hi' ? 'OTP नहीं मिला?' : "Didn't receive OTP?"}{' '}
                  <button className="text-primary font-semibold hover:underline">
                    {lang === 'hi' ? 'पुनः भेजें' : 'Resend'}
                  </button>
                </p>
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock size={11} /> {lang === 'hi' ? 'सुरक्षित OTP सत्यापन' : 'Secure OTP verification'}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── METHOD + DETAILS ────────────────────────────────────────── */}
          {(step === 'method' || step === 'details') && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-5 gap-6"
            >
              {/* Left: Payment Methods */}
              <div className="lg:col-span-3 space-y-4">
                <h2 className="font-bold text-foreground text-lg">
                  {lang === 'hi' ? 'भुगतान विधि चुनें' : 'Choose Payment Method'}
                </h2>
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Online payments are not configured yet. Cash on Service is available.</p>

                {/* UPI */}
                <div className={`border-2 rounded-2xl overflow-hidden transition-all ${method === 'upi' ? 'border-primary' : 'border-border'}`}>
                  <button
                    disabled
                    title="Online payments are not configured"
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'upi' ? 'border-primary' : 'border-border'}`}>
                      {method === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <Smartphone size={18} className="text-primary" />
                    <span className="font-semibold text-foreground text-sm flex-1 text-left">
                      {lang === 'hi' ? 'UPI / QR कोड' : 'UPI / QR Code'}
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                      {lang === 'hi' ? 'अनुशंसित' : 'Recommended'}
                    </span>
                  </button>

                  {method === 'upi' && (
                    <div className="px-4 pb-4 border-t border-border">
                      <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
                        {upiApps.map(app => (
                          <button
                            key={app.id}
                            onClick={() => setSelectedUPI(app.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                              selectedUPI === app.id ? 'border-primary bg-primary/5' : `${app.color} border-transparent`
                            }`}
                          >
                            <span className="text-xl">{app.icon}</span>
                            <span className="text-[9px] font-semibold text-foreground">{app.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 border border-border focus-within:border-primary transition-colors">
                        <span className="text-xs text-muted-foreground font-medium">UPI ID:</span>
                        <input
                          type="text"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          placeholder="yourname@upi"
                          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit/Debit Card */}
                <div className={`border-2 rounded-2xl overflow-hidden transition-all ${method === 'card' ? 'border-primary' : 'border-border'}`}>
                  <button
                    disabled
                    title="Online payments are not configured"
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'card' ? 'border-primary' : 'border-border'}`}>
                      {method === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <CreditCard size={18} className="text-blue-500" />
                    <span className="font-semibold text-foreground text-sm flex-1 text-left">
                      {lang === 'hi' ? 'क्रेडिट / डेबिट कार्ड' : 'Credit / Debit Card'}
                    </span>
                    <div className="flex gap-1">
                      {['💳', '🏦'].map((e, i) => <span key={i} className="text-sm">{e}</span>)}
                    </div>
                  </button>

                  {method === 'card' && (
                    <div className="px-4 pb-4 border-t border-border space-y-3 mt-3">
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={e => setCardData(d => ({ ...d, number: formatCard(e.target.value) }))}
                        placeholder={lang === 'hi' ? 'कार्ड नंबर' : 'Card Number'}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 font-mono"
                      />
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={e => setCardData(d => ({ ...d, name: e.target.value }))}
                        placeholder={lang === 'hi' ? 'कार्डधारक का नाम' : 'Cardholder Name'}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={e => setCardData(d => ({ ...d, expiry: formatExpiry(e.target.value) }))}
                          placeholder="MM/YY"
                          className="bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 font-mono"
                        />
                        <div className="relative">
                          <input
                            type={showCVV ? 'text' : 'password'}
                            value={cardData.cvv}
                            onChange={e => setCardData(d => ({ ...d, cvv: e.target.value.slice(0, 3) }))}
                            placeholder="CVV"
                            className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 font-mono pr-9"
                          />
                          <button
                            onClick={() => setShowCVV(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showCVV ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Banking */}
                <div className={`border-2 rounded-2xl overflow-hidden transition-all ${method === 'netbanking' ? 'border-primary' : 'border-border'}`}>
                  <button
                    disabled
                    title="Online payments are not configured"
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'netbanking' ? 'border-primary' : 'border-border'}`}>
                      {method === 'netbanking' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <Building2 size={18} className="text-indigo-500" />
                    <span className="font-semibold text-foreground text-sm flex-1 text-left">
                      {lang === 'hi' ? 'नेट बैंकिंग' : 'Net Banking'}
                    </span>
                  </button>
                  {method === 'netbanking' && (
                    <div className="px-4 pb-4 border-t border-border mt-3">
                      <select
                        value={selectedBank}
                        onChange={e => setSelectedBank(e.target.value)}
                        className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary text-foreground"
                      >
                        <option value="">{lang === 'hi' ? 'बैंक चुनें' : 'Select Bank'}</option>
                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Wallet */}
                <div className={`border-2 rounded-2xl overflow-hidden transition-all ${method === 'wallet' ? 'border-primary' : 'border-border'}`}>
                  <button
                    disabled
                    title="Online payments are not configured"
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'wallet' ? 'border-primary' : 'border-border'}`}>
                      {method === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <Wallet size={18} className="text-pink-500" />
                    <span className="font-semibold text-foreground text-sm flex-1 text-left">
                      {lang === 'hi' ? 'वॉलेट' : 'Wallet'}
                    </span>
                  </button>
                  {method === 'wallet' && (
                    <div className="px-4 pb-4 border-t border-border mt-3 space-y-2">
                      {wallets.map(w => (
                        <div key={w.id} className="flex items-center justify-between p-2.5 bg-muted rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{w.icon}</span>
                            <span className="text-sm font-medium text-foreground">{w.name}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">{w.balance}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* COD */}
                <div className={`border-2 rounded-2xl transition-all ${method === 'cod' ? 'border-primary' : 'border-border'}`}>
                  <button
                    onClick={() => setMethod('cod')}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors rounded-2xl"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'cod' ? 'border-primary' : 'border-border'}`}>
                      {method === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-lg">💵</span>
                    <span className="font-semibold text-foreground text-sm flex-1 text-left">
                      {lang === 'hi' ? 'सेवा के बाद भुगतान' : 'Pay After Service (Cash)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-2xl p-5 sticky top-36">
                  <h3 className="font-bold text-foreground mb-4">
                    {lang === 'hi' ? 'ऑर्डर सारांश' : 'Order Summary'}
                  </h3>

                  {/* Service */}
                  <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Zap size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground text-sm">
                        {lang === 'hi' ? orderDetails.serviceHi : orderDetails.service}
                      </p>
                      <p className="text-xs text-muted-foreground">{orderDetails.provider}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'hi' ? orderDetails.dateHi : orderDetails.date}
                      </p>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2 mb-4">
                    {[
                      { label: lang === 'hi' ? 'सेवा शुल्क' : 'Service Fee', value: `₹${orderDetails.subtotal}`, color: 'text-foreground' },
                      { label: lang === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee', value: `₹${orderDetails.platformFee}`, color: 'text-foreground' },
                      { label: lang === 'hi' ? 'छूट (SEVA10)' : 'Discount (SEVA10)', value: `-₹${orderDetails.discount}`, color: 'text-green-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={`font-semibold ${color}`}>{value}</span>
                      </div>
                    ))}

                    {/* Reward points toggle */}
                    <div className="flex items-center justify-between py-2 bg-primary/5 rounded-xl px-3 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Gift size={13} className="text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          {lang === 'hi' ? '500 पॉइंट्स उपयोग करें' : 'Use 500 SevaPoints'}
                        </span>
                      </div>
                      <button
                        onClick={() => setUseRewardPoints(v => !v)}
                        className={`w-10 h-5 rounded-full transition-all relative ${useRewardPoints ? 'bg-primary' : 'bg-muted border border-border'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${useRewardPoints ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {useRewardPoints && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{lang === 'hi' ? 'पॉइंट्स छूट' : 'Points Discount'}</span>
                        <span className="font-semibold text-green-600">-₹{orderDetails.rewardDiscount}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-3 border-t border-border mb-4">
                    <span className="font-bold text-foreground">{lang === 'hi' ? 'कुल' : 'Total'}</span>
                    <span className="text-2xl font-black text-primary">₹{total}</span>
                  </div>

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                    {[
                      { icon: Shield, label: lang === 'hi' ? 'सुरक्षित' : 'Secure' },
                      { icon: Lock, label: '256-bit SSL' },
                      { icon: CheckCircle, label: lang === 'hi' ? 'RBI अनुमोदित' : 'RBI Approved' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Icon size={10} className="text-secondary" /> {label}
                      </div>
                    ))}
                  </div>

                  {/* Pay button */}
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-70 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {lang === 'hi' ? 'प्रोसेसिंग...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        {lang === 'hi' ? `₹${total} का भुगतान करें` : `Pay ₹${total} Securely`}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    {lang === 'hi' ? 'भुगतान करके आप हमारी शर्तों से सहमत हैं' : 'By paying you agree to our Terms of Service'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
