'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeech() {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);
    const [volume, setVolume] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // iOS 대응을 위한 오디오 컨텍스트 초기화
    const initAudio = useCallback(async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
    }, []);

    const startVolumeAnalysis = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!audioContextRef.current || !analyserRef.current) return;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setVolume(average);
                animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
            return stream;
        } catch (err) {
            console.error('Volume analysis error:', err);
            return null;
        }
    }, []);

    const stopVolumeAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setVolume(0);
    }, []);

    const speak = useCallback((text: string, lang: 'ko-KR' | 'en-US' = 'en-US', onEnd?: () => void) => {
        if (typeof window === 'undefined') return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;

        if (onEnd) {
            utterance.onend = onEnd;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    const listen = useCallback((): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                reject('지원하지 않는 브라우저입니다.');
                return;
            }

            await initAudio();
            const stream = await startVolumeAnalysis();

            const rec = new SpeechRecognition();
            rec.lang = 'en-US';
            rec.continuous = false; // iOS 안정성을 위해 false 유지 후 재시작 로직 사용
            rec.interimResults = false;
            rec.maxAlternatives = 1;

            rec.onstart = () => {
                setIsListening(true);
                setError(null);
                console.log('Speech Recognition Started');
            };

            rec.onend = () => {
                setIsListening(false);
                setRecognition(null);
                stopVolumeAnalysis();
                if (stream) stream.getTracks().forEach(track => track.stop());
                console.log('Speech Recognition Ended');
            };

            rec.onerror = (event: any) => {
                console.error('Speech Recognition Error:', event.error);
                setError(event.error === 'not-allowed' ? '마이크 권한이 필요합니다.' : event.error);
                setIsListening(false);
                setRecognition(null);
                stopVolumeAnalysis();
                if (stream) stream.getTracks().forEach(track => track.stop());
                reject(event.error);
            };

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;
                console.log('Recognition Result:', transcript, 'Confidence:', confidence);
                resolve(transcript);
            };

            setRecognition(rec);
            rec.start();
        });
    }, [initAudio, startVolumeAnalysis, stopVolumeAnalysis]);

    const stopListening = useCallback(() => {
        if (recognition) {
            recognition.stop();
        }
        stopVolumeAnalysis();
    }, [recognition, stopVolumeAnalysis]);

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            stopVolumeAnalysis();
        };
    }, [stopVolumeAnalysis]);

    return { speak, listen, stopListening, isListening, error, volume };
}
