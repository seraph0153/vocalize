'use client';

import { useState, useCallback, useEffect } from 'react';

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Text-to-Speech (TTS)
    const speak = useCallback((text: string, lang = 'en-US', onEnd?: () => void) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0; // 속도를 조금 더 빠르게 (0.9 -> 1.0)

        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    const [recognition, setRecognition] = useState<any>(null);

    // Speech-to-Text (STT)
    const listen = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
                reject('Not supported');
                return;
            }

            const rec = new SpeechRecognition();
            rec.lang = 'en-US';
            rec.interimResults = false;
            rec.maxAlternatives = 1;

            rec.onstart = () => setIsListening(true);
            rec.onend = () => {
                setIsListening(false);
                setRecognition(null);
            };
            rec.onerror = (event: any) => {
                setError(event.error);
                setRecognition(null);
                reject(event.error);
            };

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };

            setRecognition(rec);
            rec.start();
        });
    }, []);

    const stopListening = useCallback(() => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
            setRecognition(null);
        }
    }, [recognition]);

    return { speak, listen, stopListening, isListening, error };
};
