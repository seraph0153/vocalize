'use client';

import { useState, useEffect } from 'react';
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

    const { speak, listen, stopListening, isListening } = useSpeech();
    const currentWord = words[currentIndex];

    // 효과음 미리 로드 (띵동~ 소리로 교체)
    const [ding] = useState(() => typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3') : null);

    // 컴포넌트 마운트 시 첫 번째 문제 자동 시작
    useEffect(() => {
        const timer = setTimeout(() => {
            handleStartVoice();
        }, 800);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    // 등급 계산 함수 (정확한 포함 관계 및 유사도 체크)
    const calculateGrade = (input: string, target: string): string => {
        const cleanInput = input.toLowerCase().trim();
        const cleanTarget = target.toLowerCase().trim();

        if (cleanInput === cleanTarget) return 'A+';
        if (cleanInput.includes(cleanTarget)) return 'A';

        let matches = 0;
        const targetChars = cleanTarget.split('');
        targetChars.forEach(char => {
            if (cleanInput.includes(char)) matches++;
        });

        const ratio = matches / cleanTarget.length;
        if (ratio > 0.8) return 'B+';
        if (ratio > 0.6) return 'B';
        if (ratio > 0.4) return 'C';
        return 'D';
    };

    const handleStartVoice = async () => {
        if (isProcessing || isListening) return;

        try {
            setIsProcessing(true);
            setGrade(null);

            // 1. 문제 출제 (자동 재생 시나리오)
            if (currentWord.audioUrl) {
                const audio = new Audio(currentWord.audioUrl);
                audio.onended = () => {
                    setTimeout(async () => {
                        await startListening();
                    }, 300);
                };
                audio.play();
            } else {
                speak(`${currentWord.definition}`, 'ko-KR', () => {
                    setTimeout(async () => {
                        await startListening();
                    }, 300);
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
        }
    }

    const checkAnswer = (input: string) => {
        const isCorrect = input.toLowerCase().includes(currentWord.term.toLowerCase());
        const resultGrade = calculateGrade(input, currentWord.term);
        setGrade(resultGrade);

        if (isCorrect) {
            setFeedback('correct');
            if (ding) {
                ding.currentTime = 0;
                ding.play();
            }

            const { nextLevel, nextReviewAt } = calculateNextReview(currentWord.level);
            updateWordStats(currentWord.id, nextLevel, nextReviewAt, false);

            // 등급을 보여주기 위해 1.2초 정도 여유를 두고 이동
            setTimeout(() => {
                moveToNext();
            }, 1200);
        } else {
            const remainingChances = chances - 1;
            setChances(remainingChances);

            if (remainingChances > 0) {
                setFeedback('retry');
                speak('Try again!', 'en-US', () => {
                    setTimeout(async () => {
                        setFeedback(null);
                        setGrade(null);
                        setUserInput('');
                        await startListening();
                    }, 300);
                });
            } else {
                setFeedback('wrong');
                speak(`It is ${currentWord.term}.`, 'en-US', () => {
                    setTimeout(() => {
                        moveToNext();
                    }, 2000);
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
            <nav className="w-full max-w-4xl flex justify-between items-center mb-12">
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

            <div className="w-full max-w-2xl flex-1 flex flex-col justify-center items-center gap-12">
                {/* Question Card */}
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full kid-card bg-white shadow-2xl py-20 text-center relative overflow-hidden"
                >
                    <div className="text-6xl font-black text-gray-800 mb-4">
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
                                    <div className="text-6xl font-black text-emerald-500 mb-2 drop-shadow-sm">
                                        {grade}
                                    </div>
                                    <CheckCircle2 className="w-24 h-24 text-emerald-500" />
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
                                <div className="flex flex-col items-center text-red-500">
                                    <XCircle className="w-32 h-32" />
                                    <div className="font-black text-4xl mt-4">{currentWord.term}</div>
                                    <div className="font-bold text-lg mt-2">The answer is {currentWord.term}</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Action Button & Visualizer */}
                <div className="h-48 flex items-center justify-center relative">
                    {isListening && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-24 h-24 bg-blue-400/30 rounded-full"
                            />
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.3 }}
                                animate={{ scale: [1, 2.5, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="w-24 h-24 bg-blue-300/20 rounded-full"
                            />
                        </div>
                    )}

                    {isListening ? (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                stopListening();
                                setIsProcessing(false);
                            }}
                            className="w-24 h-24 bg-red-500 rounded-full text-white shadow-xl shadow-red-200 flex items-center justify-center group z-10"
                        >
                            <Square className="w-10 h-10 fill-current group-hover:scale-110 transition-transform" />
                        </motion.button>
                    ) : (
                        <>
                            {!feedback && !isProcessing && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleStartVoice}
                                    className="w-24 h-24 bg-blue-600 rounded-full text-white shadow-xl shadow-blue-200 flex items-center justify-center group z-10"
                                >
                                    <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                </motion.button>
                            )}
                            {isProcessing && !feedback && (
                                <div className="flex flex-col items-center gap-4 z-10">
                                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                    <div className="text-blue-500 font-bold">Preparing...</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
