'use client';

import { useState, useEffect, useRef } from 'react';
import { Word } from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { calculateNextReview, resetSRSLevel } from '@/utils/srs';
import { useWordStore } from '@/store/useWordStore';
import { CheckCircle2, XCircle, Mic, ArrowLeft, Loader2, RotateCcw, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizViewProps {
    words: Word[];
    onFinish: (updatedWords: Word[]) => void;
    onCancel: () => void;
}

export default function QuizView({ words, onFinish, onCancel }: QuizViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'retry' | null>(null);
    const [grade, setGrade] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [updatedWords, setUpdatedWords] = useState<Word[]>([...words]);
    const [chances, setChances] = useState(3);

    const { speak, listen, stopListening, isListening, volume } = useSpeech();
    const currentWord = words[currentIndex];

    // 효과음 미리 로드 (사용자 요청 Pixabay 사운드)
    const [ding] = useState(() => typeof Audio !== 'undefined' ? new Audio('https://cdn.pixabay.com/audio/2024/09/24/audio_32e8b233e8.mp3') : null); // Doorbell
    const [errorSound] = useState(() => typeof Audio !== 'undefined' ? new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c030ef563b.mp3') : null); // Error 08

    // 컴포넌트 마운트 시 첫 번째 문제 자동 시작
    useEffect(() => {
        const timer = setTimeout(() => {
            handleStartVoice();
        }, 1200);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    // 어린이용 너그러운 등급 계산 함수 (Fuzzy Matching 유사도)
    const calculateGrade = (input: string, target: string): string => {
        const cleanInput = input.toLowerCase().trim();
        const cleanTarget = target.toLowerCase().trim();

        // 1. 완벽 일치
        if (cleanInput === cleanTarget) return 'A+';

        // 2. 포함 관계 (어린이 성취감을 위해 A 부여)
        if (cleanInput.includes(cleanTarget) || cleanTarget.includes(cleanInput)) return 'A';

        // 3. 편집 거리(Levenshtein)와 유사한 글자 일치율 계산
        let matches = 0;
        const targetChars = cleanTarget.split('');
        const inputChars = cleanInput.split('');

        targetChars.forEach(char => {
            if (cleanInput.includes(char)) matches++;
        });

        const ratio = matches / cleanTarget.length;

        // 임계값을 낮추어 아이들이 더 좋은 점수를 받게 함
        if (ratio > 0.7) return 'B+';
        if (ratio > 0.5) return 'B';
        if (ratio > 0.3) return 'C';
        return 'D';
    };

    const handleStartVoice = async () => {
        if (isProcessing || isListening) return;

        try {
            setIsProcessing(true);
            setGrade(null);

            // 1. 문제 출제
            if (currentWord.audioUrl) {
                const audio = new Audio(currentWord.audioUrl);
                audio.onended = () => {
                    setTimeout(async () => {
                        await startListening();
                    }, 800);
                };
                audio.play();
            } else {
                speak(`${currentWord.definition}`, 'ko-KR', () => {
                    setTimeout(async () => {
                        await startListening();
                    }, 800);
                });
            }
        } catch (err) {
            setIsProcessing(false);
        }
    };

    const startListening = async () => {
        try {
            const result = await listen();
            setUserInput(result);
            checkAnswer(result);
        } catch (err) {
            console.error('Speech recognition error:', err);
            setIsProcessing(false);
            setFeedback(null);
        }
    }

    const checkAnswer = (input: string) => {
        const isCorrect = input.toLowerCase().includes(currentWord.term.toLowerCase()) ||
            currentWord.term.toLowerCase().includes(input.toLowerCase());
        const resultGrade = calculateGrade(input, currentWord.term);

        if (isCorrect) {
            setGrade(resultGrade);
            setFeedback('correct');
            if (ding) {
                ding.currentTime = 0;
                ding.play();
            }

            const { nextLevel, nextReviewAt } = calculateNextReview(currentWord.level);
            updateWordStats(currentWord.id, nextLevel, nextReviewAt, false);

            setTimeout(() => {
                moveToNext();
            }, 1500);
        } else {
            const remainingChances = chances - 1;
            setChances(remainingChances);

            if (errorSound) {
                errorSound.currentTime = 0;
                errorSound.play();
            }

            if (remainingChances > 0) {
                setFeedback('retry');
                speak('Try again!', 'en-US', () => {
                    setTimeout(async () => {
                        setFeedback(null);
                        setGrade(null);
                        setUserInput('');
                        await startListening();
                    }, 800);
                });
            } else {
                setFeedback('wrong');
                speak(`It is ${currentWord.term}.`, 'en-US', () => {
                    setTimeout(() => {
                        moveToNext();
                    }, 2500);
                });

                const { nextLevel, nextReviewAt } = resetSRSLevel();
                updateWordStats(currentWord.id, nextLevel, nextReviewAt, true);
            }
        }
    };

    const moveToNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(v => v + 1);
            setUserInput('');
            setFeedback(null);
            setGrade(null);
            setIsProcessing(false);
            setChances(3);
        } else {
            onFinish(updatedWords);
        }
    };

    const updateWordStats = (id: string, level: number, nextReviewAt: number, isWrong: boolean) => {
        setUpdatedWords(prev => prev.map(w => {
            if (w.id === id) {
                return {
                    ...w,
                    level,
                    nextReviewAt,
                    lastReviewedAt: Date.now(),
                    wrongCount: isWrong ? w.wrongCount + 1 : w.wrongCount
                };
            }
            return w;
        }));
    };

    return (
        <div className="fixed inset-0 bg-[#FDFCFB] z-50 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
            <nav className="w-full max-w-4xl flex justify-between items-center mb-8">
                <button
                    onClick={() => {
                        stopListening();
                        onCancel();
                    }}
                    className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col items-center">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        QUIZ {currentIndex + 1} / {words.length}
                    </div>
                    <div className="flex gap-1 mt-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < chances ? 'bg-orange-400' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                </div>
                <div className="w-12" />
            </nav>

            <div className="w-full max-w-2xl flex-1 flex flex-col justify-center items-center gap-10">
                {/* Question Card */}
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full kid-card bg-white shadow-2xl py-14 text-center relative overflow-hidden"
                >
                    <div className="text-7xl font-black text-gray-800 mb-4 px-4">
                        {currentWord.definition}
                    </div>
                    <div className="text-xl text-blue-500 font-bold h-8">
                        {userInput || (isListening ? 'Listening...' : '')}
                    </div>

                    <AnimatePresence>
                        {feedback === 'correct' && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[2px]"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="text-8xl font-black text-emerald-500 mb-2 drop-shadow-md">
                                        {grade}
                                    </div>
                                    <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                                    <div className="text-emerald-600 font-black text-2xl mt-4">Great Job!</div>
                                </div>
                            </motion.div>
                        )}
                        {feedback === 'retry' && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-orange-500/10 flex items-center justify-center"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <RotateCcw className="w-20 h-20 text-orange-500 animate-spin-slow" />
                                    <div className="text-orange-600 font-black text-xl">Try again! ({chances} left)</div>
                                </div>
                            </motion.div>
                        )}
                        {feedback === 'wrong' && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[2px]"
                            >
                                <div className="flex flex-col items-center text-red-500 px-4">
                                    <XCircle className="w-24 h-24" />
                                    <div className="font-black text-5xl mt-4 break-all">{currentWord.term}</div>
                                    <div className="font-bold text-lg mt-2 underline">The answer is {currentWord.term}</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Technical Waveform Visualizer & Action Area */}
                <div className="w-full flex flex-col items-center gap-6">
                    <div className="w-full h-32 relative bg-gray-50 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                        {isListening ? (
                            <WaveformCanvas volume={volume} />
                        ) : (
                            <div className="text-gray-300 font-medium flex items-center gap-2">
                                {isProcessing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <div className="animate-bounce">Tap the mic to speak</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        {isListening ? (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    stopListening();
                                    setIsProcessing(false);
                                }}
                                className="w-24 h-24 bg-red-500 rounded-full text-white shadow-xl shadow-red-200 flex items-center justify-center z-10"
                            >
                                <Square className="w-10 h-10 fill-current" />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleStartVoice}
                                className={`w-24 h-24 rounded-full text-white shadow-xl transition-all flex items-center justify-center group z-10 ${isProcessing ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-blue-600 shadow-blue-200'
                                    }`}
                                disabled={isProcessing}
                            >
                                <Mic className={`w-10 h-10 transition-transform ${!isProcessing && 'group-hover:scale-110'}`} />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 실시간 파형을 그리는 캔버스 컴포넌트
function WaveformCanvas({ volume }: { volume: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const bars = 40;
        const barWidth = 4;
        const gap = 3;

        const render = () => {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < bars; i++) {
                const distance = Math.abs(i - bars / 2);
                const baseHeight = 10 + Math.random() * 5;
                const dynamicHeight = (volume * 1.5) * (1 - distance / (bars / 2));
                const height = Math.max(baseHeight, dynamicHeight);

                ctx.fillStyle = i % 2 === 0 ? '#3B82F6' : '#60A5FA';
                const x = (i * (barWidth + gap)) + (centerX - (bars * (barWidth + gap)) / 2);

                const radius = barWidth / 2;
                ctx.beginPath();
                ctx.roundRect(x, centerY - height / 2, barWidth, height, radius);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [volume]);

    return <canvas ref={canvasRef} width={400} height={120} className="w-full h-full" />;
}
// Forced deployment trigger-Wed Jan 14 09:28:40 KST 2026
