'use client';

import { useState } from 'react';
import { Word } from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { calculateNextReview, resetSRSLevel } from '@/utils/srs';
import { useWordStore } from '@/store/useWordStore';
import { CheckCircle2, XCircle, Mic, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizViewProps {
    words: Word[];
    onFinish: (updatedWords: Word[]) => void;
    onCancel: () => void;
}

export default function QuizView({ words, onFinish, onCancel }: QuizViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [updatedWords, setUpdatedWords] = useState<Word[]>([...words]);

    if (words.length === 0) {
        return (
            <div className="fixed inset-0 bg-[#FDFCFB] z-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <div className="text-6xl">🐣</div>
                    <div className="text-xl font-bold text-gray-400">학습할 단어가 없어요!</div>
                    <button onClick={onCancel} className="kid-button btn-primary">돌아가기</button>
                </div>
            </div>
        );
    }

    const { speak, listen, isListening } = useSpeech();
    const currentWord = words[currentIndex];

    const handleStartVoice = async () => {
        if (isProcessing || isListening) return;

        try {
            setIsProcessing(true);

            // 1. 커스텀 녹음이 있다면 그걸 먼저 틀어주고, 없으면 로봇(TTS) 목소리가 나옵니다.
            if (currentWord.audioUrl) {
                const audio = new Audio(currentWord.audioUrl);
                audio.play();
                // 오디오 재생 시간을 고려해 약간 대기
                await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
                speak(`${currentWord.definition}. 영어로 말해보세요.`, 'ko-KR');
                await new Promise(resolve => setTimeout(resolve, 2000));
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
            speak('Perfect! Great job.', 'en-US');

            const { nextLevel, nextReviewAt } = calculateNextReview(currentWord.level);
            updateWordStats(currentWord.id, nextLevel, nextReviewAt, false);
        } else {
            setFeedback('wrong');
            speak(`Oh no. It is ${currentWord.term}.`, 'en-US');

            const { nextLevel, nextReviewAt } = resetSRSLevel();
            updateWordStats(currentWord.id, nextLevel, nextReviewAt, true);
        }

        setTimeout(() => {
            if (currentIndex < words.length - 1) {
                setCurrentIndex(v => v + 1);
                setUserInput('');
                setFeedback(null);
                setIsProcessing(false);
            } else {
                onFinish(updatedWords);
            }
        }, 3000);
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
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    QUIZ {currentIndex + 1} / {words.length}
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
                                className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-32 h-32 text-emerald-500" />
                            </motion.div>
                        )}
                        {feedback === 'wrong' && (
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute inset-0 bg-red-500/10 flex items-center justify-center"
                            >
                                <XCircle className="w-32 h-32 text-red-500" />
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
