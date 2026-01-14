'use client';

import { useState } from 'react';
import { Word } from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { ArrowLeft, Volume2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudyViewProps {
    words: Word[];
    onCancel: () => void;
}

export default function StudyView({ words, onCancel }: StudyViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const { speak } = useSpeech();
    const currentWord = words[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    };

    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentWord) return;
        if (isFlipped) {
            speak(currentWord.term, 'en-US');
        } else {
            speak(currentWord.definition, 'ko-KR');
        }
    };

    // 만일 단어가 없을 경우의 조기 리턴 (모든 훅 호출 이후에 위치해야 함)
    if (!currentWord && words.length === 0) {
        return (
            <div className="fixed inset-0 bg-[#FDFCFB] z-[60] flex flex-col items-center justify-center p-6 text-center">
                <div className="text-8xl mb-10">📖</div>
                <div className="text-4xl font-black text-gray-800 mb-4">공부할 단어가 없어요!</div>
                <p className="text-gray-400 mb-12 text-xl font-bold">단어장에서 퀴즈에 나올 단어를<br />먼저 추가해 볼까요?</p>
                <button onClick={onCancel} className="kid-button btn-primary px-16 py-6 text-2xl shadow-xl shadow-blue-100">
                    단어장으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#FDFCFB] z-50 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
            <nav className="w-full max-w-4xl flex justify-between items-center mb-8">
                <button
                    onClick={onCancel}
                    className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest text-blue-500">
                    LEARNING MODE
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    {currentIndex + 1} / {words.length}
                </div>
            </nav>

            <div className="w-full max-w-2xl flex-1 flex flex-col justify-center items-center gap-10">
                {/* Flashcard */}
                <div
                    className="w-full aspect-[4/3] relative perspective-1000 cursor-pointer"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        initial={false}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        className="w-full h-full relative preserve-3d"
                    >
                        {/* Front: Definition (Korean) */}
                        <div className="absolute inset-0 backface-hidden bg-white kid-card shadow-2xl flex flex-col items-center justify-center p-12 text-center border-b-8 border-blue-100">
                            <div className="text-sm font-bold text-blue-400 uppercase mb-4">뜻이 무엇일까?</div>
                            <div className="text-7xl font-black text-gray-800 mb-8">{currentWord.definition}</div>
                            <button
                                onClick={handleSpeak}
                                className="p-6 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors shadow-inner"
                            >
                                <Volume2 className="w-10 h-10" />
                            </button>
                            <div className="absolute bottom-6 text-gray-300 text-sm font-medium animate-pulse">카드를 눌러보세요!</div>
                        </div>

                        {/* Back: Term (English) */}
                        <div
                            className="absolute inset-0 backface-hidden bg-blue-600 kid-card shadow-2xl flex flex-col items-center justify-center p-12 text-center rotate-y-180"
                        >
                            <div className="text-sm font-bold text-blue-200 uppercase mb-4">English Word</div>
                            <div className="text-7xl font-black text-white mb-8">{currentWord.term}</div>
                            <button
                                onClick={handleSpeak}
                                className="p-6 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors shadow-inner"
                            >
                                <Volume2 className="w-10 h-10" />
                            </button>
                            <div className="absolute bottom-6 text-blue-200 text-sm font-medium">다시 누르면 돌아가요</div>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-8">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        className="w-20 h-20 bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-500 flex items-center justify-center transition-all"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </motion.button>

                    <button
                        onClick={onCancel}
                        className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
                    >
                        퀴즈 시작하기!
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        className="w-20 h-20 bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-500 flex items-center justify-center transition-all"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </motion.button>
                </div>
            </div>

            <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .kid-card {
                    border-radius: 2.5rem;
                }
            `}</style>
        </div>
    );
}
