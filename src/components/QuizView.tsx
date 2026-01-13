'use client';

import { useState, useEffect } from 'react';
import { Word } from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { calculateNextReview, resetSRSLevel } from '@/utils/srs';
import { useWordStore } from '@/store/useWordStore';
import { CheckCircle2, XCircle, Mic, ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
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
    const [isProcessing, setIsProcessing] = useState(false);
    const [updatedWords, setUpdatedWords] = useState<Word[]>([...words]);
    const [chances, setChances] = useState(3);

    const { speak, listen, isListening } = useSpeech();
    const currentWord = words[currentIndex];

    // 효과음 미리 로드 (사용자님 요청: 띠링 하는 이벤트 음)
    const [ding] = useState(() => typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3') : null);

    const handleStartVoice = async () => {
        if (isProcessing || isListening) return;

        try {
            setIsProcessing(true);

            // 1. 시작 멘트 생략 (사용자님 요청)
            // 커스텀 녹음이 있다면 그걸 틀어주고, 없으면 바로 인식 모드로 진입하거나 뜻을 읽어줌
            if (currentWord.audioUrl) {
                const audio = new Audio(currentWord.audioUrl);
                audio.play();
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                // 뜻만 아주 짧게 읽어줌
                speak(`${currentWord.definition}`, 'ko-KR');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            try {
                const result = await listen();
                setUserInput(result);
                checkAnswer(result);
            } catch (err) {
                console.error('Speech recognition error:', err);
                setIsProcessing(false);
            }
        } catch (err) {
            setIsProcessing(false);
        }
    };

    const checkAnswer = (input: string) => {
        const isCorrect = input.toLowerCase().includes(currentWord.term.toLowerCase());

        if (isCorrect) {
            setFeedback('correct');
            if (ding) {
                ding.currentTime = 0;
                ding.play();
            }

            const { nextLevel, nextReviewAt } = calculateNextReview(currentWord.level);
            updateWordStats(currentWord.id, nextLevel, nextReviewAt, false);

            // 정답일 땐 아주 빠르게 다음으로 (딜레이 최소화 - 사용자님 요청)
            setTimeout(() => {
                moveToNext();
            }, 800);
        } else {
            const remainingChances = chances - 1;
            setChances(remainingChances);

            if (remainingChances > 0) {
                setFeedback('retry');
                speak('Try again!', 'en-US');
                setTimeout(() => {
                    setFeedback(null);
                    setUserInput('');
                    setIsProcessing(false);
                }, 1500);
            } else {
                // 3번 다 틀렸을 때
                setFeedback('wrong');
                speak(`It's okay. It is ${currentWord.term}.`, 'en-US');

                const { nextLevel, nextReviewAt } = resetSRSLevel();
                updateWordStats(currentWord.id, nextLevel, nextReviewAt, true);

                setTimeout(() => {
                    moveToNext();
                }, 2500);
            }
        }
    };

    const moveToNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(v => v + 1);
            setUserInput('');
            setFeedback(null);
            setIsProcessing(false);
            setChances(3); // 기회 초기화
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
                    onClick={onCancel}
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
                        {userInput || (isListening ? '듣고 있어요...' : '')}
                    </div>

                    <AnimatePresence>
                        {feedback === 'correct' && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[2px]"
                            >
                                <div className="flex flex-col items-center">
                                    <CheckCircle2 className="w-32 h-32 text-emerald-500" />
                                    <div className="text-emerald-600 font-black text-2xl mt-4">Great!</div>
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
                                    <div className="text-orange-600 font-black text-xl">다시 시도해보세요! ({chances}회 남음)</div>
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
                                    <div className="font-bold text-lg">오답 노트에 저장되었어요!</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Action Button */}
                <div className="h-40 flex items-center justify-center">
                    {!feedback && !isProcessing && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleStartVoice}
                            disabled={isListening}
                            className="w-24 h-24 bg-blue-600 rounded-full text-white shadow-xl shadow-blue-200 flex items-center justify-center group"
                        >
                            <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </motion.button>
                    )}
                    {isProcessing && !feedback && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <div className="text-blue-500 font-bold">인식 중...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
