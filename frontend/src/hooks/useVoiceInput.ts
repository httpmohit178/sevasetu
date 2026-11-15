import { useCallback, useEffect, useRef, useState } from 'react';

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
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

function readableVoiceError(code: string, secure: boolean): string {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'Allow microphone and speech recognition access in your browser, then try again.';
  if (code === 'audio-capture') return 'No microphone was found. Connect or enable a microphone and try again.';
  if (code === 'no-speech') return 'I did not hear speech. Move closer to the microphone and try again.';
  if (code === 'network') return 'The browser speech service could not connect. Check your internet and try again.';
  if (code === 'language-not-supported') return 'Speech recognition for this language is unavailable in this browser.';
  if (code === 'insecure-context' || !secure) return 'Microphone access requires HTTPS or localhost.';
  return 'Voice input stopped unexpectedly. Check your microphone permission and try again.';
}

export function useVoiceInput({ lang = 'en', onResult, onError }: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const hadErrorRef = useRef(false);
  const disposedRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  onResultRef.current = onResult;
  onErrorRef.current = onError;

  const isSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      const message = 'Voice input is not supported in this browser. Use a current version of Chrome or Edge.';
      setVoiceState('error');
      onErrorRef.current?.(message);
      return;
    }
    if (window.isSecureContext === false) {
      const message = readableVoiceError('insecure-context', false);
      setVoiceState('error');
      onErrorRef.current?.(message);
      return;
    }

    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    finalTranscriptRef.current = '';
    hadErrorRef.current = false;
    disposedRef.current = false;
    setTranscript('');
    setVoiceState('listening');

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setVoiceState('listening');
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript || '';
        if (result.isFinal) finalText += `${text} `;
        else interimText += `${text} `;
      }
      finalTranscriptRef.current = finalText.trim();
      setTranscript([finalText.trim(), interimText.trim()].filter(Boolean).join(' '));
    };
    recognition.onerror = (event) => {
      if (disposedRef.current || event.error === 'aborted') return;
      hadErrorRef.current = true;
      setVoiceState('error');
      onErrorRef.current?.(readableVoiceError(event.error, window.isSecureContext));
      idleTimerRef.current = window.setTimeout(() => setVoiceState('idle'), 4500);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (disposedRef.current || hadErrorRef.current) return;
      const completedTranscript = finalTranscriptRef.current.trim();
      if (completedTranscript) {
        setTranscript(completedTranscript);
        setVoiceState('processing');
        onResultRef.current?.(completedTranscript);
        idleTimerRef.current = window.setTimeout(() => setVoiceState('idle'), 350);
      } else {
        setVoiceState('idle');
      }
    };
    recognitionRef.current = recognition;
    try {
      // Start synchronously from the button gesture so browser permission prompts are reliable.
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      hadErrorRef.current = true;
      setVoiceState('error');
      const code = error instanceof DOMException && error.name === 'InvalidStateError' ? 'already-started' : 'start-failed';
      onErrorRef.current?.(readableVoiceError(code, window.isSecureContext));
      idleTimerRef.current = window.setTimeout(() => setVoiceState('idle'), 4500);
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) { setVoiceState('idle'); return; }
    try { recognition.stop(); }
    catch { recognitionRef.current = null; setVoiceState('idle'); }
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  useEffect(() => () => {
    disposedRef.current = true;
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  return { voiceState, isSupported, startListening, stopListening, transcript, clearTranscript };
}
