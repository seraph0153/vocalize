'use client';

import { useState, useCallback, useEffect } from 'react';

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Text-to-Speech (TTS)
    const speak = useCallback((text: string, lang = 'en-US') => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9; // 약간 천천히
        window.speechSynthesis.speak(utterance);
    }, []);

    // Speech-to-Text (STT)
    const listen = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
                reject('Not supported');
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                setError(event.error);
                reject(event.error);
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                resolve(transcript);
            };

            recognition.start();
        });
    }, []);

    return { speak, listen, isListening, error };
};
