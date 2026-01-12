'use client';

import { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import { calculateNextReview, resetSRSLevel } from '../utils/srs';

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

    const { speak, listen, isListening } = useSpeech();
    const currentWord = words[currentIndex];

    const handleStartVoice = async () => {
        if (isProcessing || isListening) return;

        try {
            // 1. 단어 뜻을 먼저 보여주고 영단어를 말하도록 유도
            setIsProcessing(true);
            speak(`${currentWord.definition}. 영어로 말해보세요.`, 'ko-KR');

            // 말하기 대기 (약간의 지연)
            setTimeout(async () => {
                try {
                    const result = await listen();
                    setUserInput(result);
                    checkAnswer(result);
                } catch (err) {
                    console.error('Speech recognition error:', err);
                    setIsProcessing(false);
                }
            }, 2000);
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

        // 다음 단어로 이동
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
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
            <button
                onClick={onCancel}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="w-full max-w-lg text-center space-y-8">
                <div className="text-gray-400 font-medium">
                    문제 {currentIndex + 1} / {words.length}
                </div>

                <div className="kid-card border-blue-200 py-12">
                    <div className="text-5xl font-bold text-gray-800 mb-4">
                        {currentWord.definition}
                    </div>
                    <div className="text-xl text-blue-500 font-medium h-8">
                        {userInput || (isListening ? '듣고 있어요...' : '버튼을 누르고 말해주세요')}
                    </div>
                </div>

                <div className="flex justify-center h-24 items-center">
                    {feedback === 'correct' && (
                        <div className="text-6xl animate-bounce">OK! 🌟</div>
                    )}
                    {feedback === 'wrong' && (
                        <div className="text-6xl animate-shake">Try Again! ❤️</div>
                    )}
                    {!feedback && !isProcessing && (
                        <button
                            onClick={handleStartVoice}
                            disabled={isListening}
                            className={`kid-button btn-primary scale-125 ${isListening ? 'opacity-50' : ''}`}
                        >
                            🎤 정답 말하기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
