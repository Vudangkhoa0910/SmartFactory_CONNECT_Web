import { useState, useEffect, useCallback } from 'react';

interface UseSpeechToTextProps {
  onResult?: (transcript: string) => void;
  lang?: string;
}

export const useSpeechToText = ({ onResult, lang = 'vi-VN' }: UseSpeechToTextProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setIsSupported(true);
    }
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Browser does not support speech recognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      if (onResult) {
        onResult(text);
      }
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setIsListening(false);
    }
  }, [lang, onResult]);

  const stopListening = useCallback(() => {
    // Note: The API doesn't have a simple "stop and keep result" that works consistently across browsers 
    // without handling the instance, but for single-shot recognition, start() handles the lifecycle.
    // If we needed continuous, we'd keep the recognition instance in a ref.
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported
  };
};
