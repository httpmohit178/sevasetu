import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic, MicOff, Send, Volume2, VolumeX, Globe, ArrowLeft,
  Star, MapPin, Shield, CheckCircle, Zap, ChevronRight,
  Clock, RefreshCw, X
} from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useAppLanguage } from '@/hooks/useAppLanguage';
import { getAIResponse, getRequestedServiceId, speakText, type AIMessage, type Provider, type Lang } from '@/lib/sevaAI';
import { apiRequest } from '@/lib/api-client';
import { PhotoBanner } from '../components/ui/photo-banner';

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Zap size={14} className="text-primary" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Provider Card ────────────────────────────────────────────────────────────
function ProviderCard({
  provider,
  lang,
  onBook,
}: {
  provider: Provider;
  lang: Lang;
  onBook: (p: Provider) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
        {provider.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-foreground truncate">{provider.name}</p>
          {provider.verified && (
            <Shield size={11} className="text-secondary shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {lang === 'hi' ? provider.skillHi : provider.skill}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5">
            {provider.rating > 0 ? <><Star size={10} className="text-yellow-500 fill-yellow-500" /><span className="text-[10px] font-semibold text-foreground">{provider.rating}</span><span className="text-[10px] text-muted-foreground">({provider.reviews})</span></> : <span className="text-[10px] text-muted-foreground">{lang === 'hi' ? 'अभी रेटिंग नहीं' : 'Not rated yet'}</span>}
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MapPin size={9} /> {provider.location}
          </span>
        </div>
      </div>

      {/* Price + Book */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-bold text-primary">{provider.price}</span>
        {provider.available ? (
          <button
            onClick={() => onBook(provider)}
            className="text-[10px] font-bold bg-primary text-white px-2.5 py-1 rounded-full hover:bg-primary/90 transition-colors"
          >
            {lang === 'hi' ? 'बुक करें' : 'Book'}
          </button>
        ) : (
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {lang === 'hi' ? 'अनुपलब्ध' : 'Unavailable'}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Booking Confirmation Card ────────────────────────────────────────────────
function BookingConfirmCard({ details, lang }: { details: NonNullable<AIMessage['bookingDetails']>; lang: Lang }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={16} className="text-green-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-green-800">
            {lang === 'hi' ? 'बुकिंग अनुरोध भेजा गया' : 'Booking request sent'}
          </p>
          <p className="text-[10px] text-green-600">#{details.bookingId}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[
          { label: lang === 'hi' ? 'प्रदाता' : 'Provider', value: details.provider.name },
          { label: lang === 'hi' ? 'सेवा' : 'Service', value: lang === 'hi' ? details.serviceHi : details.service },
          { label: lang === 'hi' ? 'स्थिति' : 'Status', value: details.time, icon: Clock },
          { label: lang === 'hi' ? 'मूल्य' : 'Price', value: details.price },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              {Icon && <Icon size={10} />} {label}
            </span>
            <span className="text-xs font-bold text-green-900">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-green-200 flex gap-2">
        <Link to="/tracker" className="flex-1 text-xs font-bold bg-green-600 text-white py-1.5 rounded-full hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
          <MapPin size={11} /> {lang === 'hi' ? 'ट्रैक करें' : 'Track'}
        </Link>
        <span className="flex-1 self-center text-center text-[10px] text-green-700">{lang === 'hi' ? 'सेवा प्रदाता की स्वीकृति बाकी' : 'Waiting for provider acceptance'}</span>
      </div>
    </motion.div>
  );
}

// ─── Scheme Card ──────────────────────────────────────────────────────────────
function SchemeCard({ scheme, lang }: { scheme: NonNullable<AIMessage['schemeCards']>[0]; lang: Lang }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-start gap-3 hover:border-primary/30 transition-colors">
      <span className="text-2xl">{scheme.icon}</span>
      <div className="flex-1">
        <p className="text-xs font-bold text-foreground">{lang === 'hi' ? scheme.nameHi : scheme.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{lang === 'hi' ? scheme.benefitHi : scheme.benefit}</p>
      </div>
      <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-0.5" />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  message,
  lang,
  onBook,
  ttsEnabled,
}: {
  message: AIMessage;
  lang: Lang;
  onBook: (p: Provider) => void;
  ttsEnabled: boolean;
}) {
  const isUser = message.role === 'user';
  const content = lang === 'hi' && message.contentHi ? message.contentHi : message.content;
  const translation = !isUser && message.contentHi ? (lang === 'hi' ? message.content : message.contentHi) : '';

  const handleSpeak = () => {
    if (ttsEnabled) speakText(content, lang);
  };

  // Format markdown-like bold text
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
          <Zap size={14} className="text-primary" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Main bubble */}
        {content && (
          <div
            className={`relative group rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isUser
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-card border border-border text-foreground rounded-tl-sm'
            }`}
          >
            <div className="whitespace-pre-line">{formatContent(content)}</div>

            {/* TTS button for assistant */}
            {!isUser && ttsEnabled && (
              <button
                onClick={handleSpeak}
                className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white hover:border-primary"
              >
                <Volume2 size={10} />
              </button>
            )}

            {/* Timestamp */}
            <p className={`text-[9px] mt-1 ${isUser ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
              {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
        {translation && translation !== content && <p className="max-w-full whitespace-pre-line rounded-xl border border-border/70 bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground"><span className="mb-1 block text-[9px] font-bold uppercase tracking-wide">{lang === 'hi' ? 'English' : 'हिंदी अनुवाद'}</span>{translation}</p>}

        {/* Provider cards */}
        {message.type === 'providers' && message.providers && (
          <div className="w-full space-y-2">
            {message.providers.map(p => (
              <ProviderCard key={p.id} provider={p} lang={lang} onBook={onBook} />
            ))}
          </div>
        )}

        {/* Scheme cards */}
        {message.type === 'schemes' && message.schemeCards && (
          <div className="w-full space-y-2">
            {message.schemeCards.map((s, i) => (
              <SchemeCard key={i} scheme={s} lang={lang} />
            ))}
          </div>
        )}

        {/* Booking confirmation */}
        {message.type === 'booking-confirm' && message.bookingDetails && (
          <div className="w-full">
            <BookingConfirmCard details={message.bookingDetails} lang={lang} />
          </div>
        )}

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.quickReplies.map((qr, i) => (
              <button
                key={i}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white transition-all"
                data-quick-reply={lang === 'hi' ? qr.hi : qr.en}
              >
                {lang === 'hi' ? qr.hi : qr.en}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const navigate = useNavigate();
  const [lang, setLang] = useAppLanguage();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [actionError, setActionError] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Voice Input ─────────────────────────────────────────────────────────
  const { voiceState, isSupported, startListening, stopListening, transcript } = useVoiceInput({
    lang,
    onError: setVoiceError,
    onResult: (text) => {
      setVoiceError('');
      setInputText(text);
      setTimeout(() => handleSend(text), 300);
    },
  });

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Sync voice transcript to input ──────────────────────────────────────
  useEffect(() => {
    if (transcript) setInputText(transcript);
  }, [transcript]);

  // ── Initial greeting ────────────────────────────────────────────────────
  useEffect(() => {
    const greeting = getAIResponse('hello', [], lang);
    setMessages([greeting]);
    if (ttsEnabled) speakText(greeting.content, lang);
  }, []);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText) return;

    const userMsg: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const response = getAIResponse(messageText, messages, lang, pendingProvider);
    try {
      if (response.type === 'providers' && response.serviceId) {
        try {
          const result = await apiRequest<{ providers: Provider[] }>(`/providers?serviceId=${encodeURIComponent(response.serviceId)}`);
          response.providers = result.providers;
          if (result.providers.length === 0) {
            response.type = 'text';
            response.content = 'No matching providers are online right now. Try again later, or join as a provider to offer this service.';
            response.contentHi = 'अभी इस सेवा के लिए कोई प्रदाता ऑनलाइन नहीं है। बाद में फिर कोशिश करें या सेवा प्रदाता बनकर यह सेवा दें।';
          }
        } catch {
          response.type = 'text';
          response.content = 'I could not reach the live provider list. Please check your connection and try again.';
          response.contentHi = 'लाइव सेवा प्रदाताओं की सूची नहीं मिल सकी। इंटरनेट कनेक्शन देखें और फिर कोशिश करें।';
        }
      } else {
        try {
          const result = await apiRequest<{ configured: boolean; answerEn?: string; answerHi?: string }>('/ai/reply', {
            method: 'POST', body: JSON.stringify({
              message: messageText,
              history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
            }),
          });
          if (result.configured && result.answerEn && result.answerHi) {
            response.content = result.answerEn;
            response.contentHi = result.answerHi;
          }
        } catch { /* Keep the built-in bilingual assistant available when the AI service is offline. */ }
      }
    } finally {
      setIsTyping(false);
    }
    setMessages(prev => [...prev, response]);

    // If providers shown, set first available as pending
    if (response.type === 'providers' && response.providers) {
      const firstAvailable = response.providers.find(p => p.available);
      if (firstAvailable) setPendingProvider(firstAvailable);
    }

    if (response.type === 'booking-confirm') {
      setPendingProvider(null);
    }

    if (ttsEnabled) {
      const content = lang === 'hi' && response.contentHi ? response.contentHi : response.content;
      speakText(content, lang);
    }
  }, [inputText, messages, lang, pendingProvider, ttsEnabled]);

  // ── Quick reply click ───────────────────────────────────────────────────
  const handleQuickReply = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  // ── Book provider ───────────────────────────────────────────────────────
  const handleBookProvider = useCallback((provider: Provider) => {
    const serviceId = getRequestedServiceId(provider.skill);
    if (!serviceId) { setActionError(lang === 'hi' ? 'इस सेवा की ऑनलाइन बुकिंग उपलब्ध नहीं है।' : 'Online booking is not available for this service.'); return; }
    if (!localStorage.getItem('sevasetu-token')) {
      navigate('/login');
      return;
    }
    setActionError('');
    setIsTyping(true);
    void apiRequest<{ booking: { id: string } }>('/bookings', {
      method: 'POST', body: JSON.stringify({ serviceId, providerId: provider.id, paymentMethod: 'cod' }),
    }).then(({ booking }) => {
      const message: AIMessage = {
        id: `booking_${booking.id}`, role: 'assistant',
        content: `Your booking request for ${provider.skill} was sent to ${provider.name}. It will appear in the tracker; the provider must accept it before service is confirmed.`,
        contentHi: `${provider.name} को ${provider.skillHi} की बुकिंग भेज दी गई है। यह ट्रैकर में दिखेगी; सेवा पक्की होने से पहले प्रदाता को इसे स्वीकार करना होगा।`,
        timestamp: new Date(), type: 'booking-confirm',
        bookingDetails: { provider, service: provider.skill, serviceHi: provider.skillHi, time: lang === 'hi' ? 'प्रदाता की स्वीकृति बाकी' : 'Awaiting provider acceptance', price: provider.price, bookingId: booking.id },
      };
      setMessages(prev => [...prev, message]); setPendingProvider(null);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message === 'Sign in to continue') { navigate('/login'); return; }
      setActionError(error instanceof Error ? error.message : (lang === 'hi' ? 'बुकिंग नहीं हो सकी। फिर कोशिश करें।' : 'Booking failed. Please try again.'));
    }).finally(() => setIsTyping(false));
  }, [lang, navigate]);

  // ── Clear chat ──────────────────────────────────────────────────────────
  const handleClearChat = useCallback(() => {
    setPendingProvider(null);
    const greeting = getAIResponse('hello', [], lang);
    setMessages([greeting]);
  }, [lang]);

  // ── Toggle language ─────────────────────────────────────────────────────
  const handleLangToggle = useCallback(() => {
    setLang(prev => prev === 'en' ? 'hi' : 'en');
  }, []);

  const handleTtsToggle = () => {
    if (ttsEnabled) {
      window.speechSynthesis?.cancel();
      setTtsEnabled(false);
      return;
    }
    setTtsEnabled(true);
    const latestReply = [...messages].reverse().find((message) => message.role === 'assistant' && message.content);
    if (latestReply) speakText(lang === 'hi' && latestReply.contentHi ? latestReply.contentHi : latestReply.content, lang);
  };

  // ── Handle quick reply delegation from DOM ──────────────────────────────
  const handleChatClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('[data-quick-reply]') as HTMLElement | null;
    if (btn) {
      const reply = btn.getAttribute('data-quick-reply');
      if (reply) handleQuickReply(reply);
    }
  }, [handleQuickReply]);

  const isVoiceActive = voiceState === 'listening';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <title>AI Seva Assistant – SevaSetu | Bilingual Service Booking</title>
      <meta name="description" content="Book services in Hindi or English using SevaSetu's AI assistant. Voice search, bilingual chat, and instant booking." />

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{lang === 'hi' ? 'वापस जाएं' : 'Back'}</span>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seva AI
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground">
                    {lang === 'hi' ? 'AI सहायक • हिंदी + English' : 'AI assistant • Hindi + English'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* TTS Toggle */}
            <button
              onClick={handleTtsToggle}
              title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                ttsEnabled ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10'
              }`}
            >
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={handleLangToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              <Globe size={12} />
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              title="Clear chat"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="container mx-auto w-full max-w-6xl px-4 pt-4">
        <PhotoBanner scene="voice" alt="Voice assistant" caption="Speak in Hindi or English" />
      </div>
      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6 max-w-6xl">

        {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          {/* Voice Status Card */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Mic size={14} className="text-primary" />
              {lang === 'hi' ? 'आवाज़ सहायक' : 'Voice Assistant'}
            </h3>

            <div className="flex justify-center mb-4">
              <motion.button
                onClick={isVoiceActive ? stopListening : startListening}
                disabled={!isSupported}
                animate={isVoiceActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isVoiceActive
                    ? 'bg-red-500 text-white shadow-red-200'
                    : isSupported
                    ? 'bg-primary text-white shadow-primary/30 hover:scale-105'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isVoiceActive ? <MicOff size={28} /> : <Mic size={28} />}
              </motion.button>
            </div>

            {/* Voice state rings */}
            {isVoiceActive && (
              <div className="flex justify-center mb-3">
                <div className="relative">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-red-400"
                      animate={{ scale: [1, 1 + i * 0.4], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      style={{ width: 80, height: 80, top: -40, left: -40 }}
                    />
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {!isSupported
                ? (lang === 'hi' ? 'आवाज़ समर्थित नहीं' : 'Voice not supported')
                : isVoiceActive
                ? (lang === 'hi' ? '🎤 सुन रहा हूं...' : '🎤 Listening...')
                : (lang === 'hi' ? 'बोलने के लिए दबाएं' : 'Tap to speak')}
            </p>

            {!isSupported && (
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                {lang === 'hi' ? 'Chrome या Edge ब्राउज़र उपयोग करें' : 'Use Chrome or Edge browser'}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-bold text-foreground text-sm mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {lang === 'hi' ? 'त्वरित क्रियाएं' : 'Quick Actions'}
            </h3>
            <div className="space-y-2">
              {[
                { en: 'Book a Plumber', hi: 'प्लंबर बुक करें', icon: '🔧' },
                { en: 'Find Electrician', hi: 'इलेक्ट्रीशियन खोजें', icon: '⚡' },
                { en: 'Home Cleaning', hi: 'घर की सफाई', icon: '🧹' },
                { en: 'Government Schemes', hi: 'सरकारी योजनाएं', icon: '🏛️' },
                { en: 'Emergency Service', hi: 'आपातकालीन सेवा', icon: '🚨' },
                { en: 'Find Home Tutor', hi: 'गृह शिक्षक खोजें', icon: '📚' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickReply(lang === 'hi' ? action.hi : action.en)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left hover:bg-muted transition-colors group"
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                    {lang === 'hi' ? action.hi : action.en}
                  </span>
                  <ChevronRight size={12} className="ml-auto text-muted-foreground group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
            <p className="text-xs font-bold text-primary mb-2">
              💡 {lang === 'hi' ? 'सुझाव' : 'Tips'}
            </p>
            <ul className="space-y-1.5">
              {(lang === 'hi' ? [
                'हिंदी या अंग्रेजी में बोलें',
                '"मुझे प्लंबर चाहिए" कहें',
                'सरकारी योजनाएं पूछें',
                'आपातकाल में "urgent" कहें',
              ] : [
                'Speak in Hindi or English',
                'Say "I need a plumber"',
                'Ask about govt schemes',
                'Say "urgent" for emergency',
              ]).map((tip, i) => (
                <li key={i} className="text-[11px] text-primary/80 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Chat Area ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm">

            {/* Chat header bar */}
            <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {['bg-red-400', 'bg-yellow-400', 'bg-green-400'].map((c, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-medium ml-1">
                  {lang === 'hi' ? 'सेवा AI चैट' : 'Seva AI Chat'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield size={10} className="text-secondary" />
                {lang === 'hi' ? 'सुरक्षित' : 'Secure'}
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ minHeight: 0, maxHeight: 'calc(100vh - 320px)' }}
              onClick={handleChatClick}
            >
              {actionError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">{actionError}</p>}
              {voiceError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{voiceError}</p>}
              <AnimatePresence>
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    lang={lang}
                    onBook={handleBookProvider}
                    ttsEnabled={ttsEnabled}
                  />
                ))}
              </AnimatePresence>

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-3 bg-background">
              {/* Pending provider banner */}
              {pendingProvider && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 mb-2"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {pendingProvider.avatar}
                  </div>
                  <p className="text-xs text-foreground flex-1">
                    <span className="font-semibold">{pendingProvider.name}</span>
                    {' '}{lang === 'hi' ? 'को बुक करने के लिए "हां" कहें' : '— say "yes" or "book" to confirm'}
                  </p>
                  <button onClick={() => setPendingProvider(null)} className="text-muted-foreground hover:text-foreground">
                    <X size={12} />
                  </button>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                {/* Voice button (mobile) */}
                <button
                  onClick={isVoiceActive ? stopListening : startListening}
                  disabled={!isSupported}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isVoiceActive
                      ? 'bg-red-500 text-white animate-pulse'
                      : isSupported
                      ? 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                  }`}
                >
                  {isVoiceActive ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={
                    isVoiceActive
                      ? (lang === 'hi' ? '🎤 सुन रहा हूं...' : '🎤 Listening...')
                      : (lang === 'hi' ? 'संदेश लिखें या बोलें...' : 'Type or speak your request...')
                  }
                  className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 transition-all"
                />

                {/* Send button */}
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() && !isTyping}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
                >
                  <Send size={15} />
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-2">
                {lang === 'hi'
                  ? 'हिंदी या अंग्रेजी में टाइप करें • आवाज़ से बोलें'
                  : 'Type in Hindi or English • Use voice to speak'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
