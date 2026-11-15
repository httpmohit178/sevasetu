import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

interface UseVoiceInputOptions {
  lang?: 'en' | 'hi';
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  voiceState: VoiceState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  clearTranscript: () => void;
}

// Extend Window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function useVoiceInput({ lang = 'en', onResult, onError }: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const getLangCode = useCallback((l: 'en' | 'hi') => {
    return l === 'hi' ? 'hi-IN' : 'en-IN';
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      onError?.('Voice input not supported in this browser');
      setVoiceState('error');
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    // Ask for mic access explicitly so denied permissions produce a useful message
    // instead of a silent no-op from the browser speech service.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setVoiceState('error');
        onError?.('Microphone access was denied. Allow microphone access in your browser and try again.');
        return;
      }
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = getLangCode(lang);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceState('listening');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const current = finalTranscript || interimTranscript;
      setTranscript(current);

      if (finalTranscript) {
        setVoiceState('processing');
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setVoiceState('error');
      onError?.(event.error);
      setTimeout(() => setVoiceState('idle'), 2000);
    };

    recognition.onend = () => {
      setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, getLangCode, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState('idle');
  }, []);

  const clearTranscript = useCallback(() => setTranscript(''), []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { voiceState, isSupported, startListening, stopListening, transcript, clearTranscript };
}
