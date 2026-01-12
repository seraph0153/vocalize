'use client';

import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Word } from '@/types';
import { getDueWords } from '@/utils/srs';
import WordManager from '@/components/WordManager';
import QuizView from '@/components/QuizView';

export default function Home() {
  const [words, setWords] = useLocalStorage<Word[]>('vocalize-words', []);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'review'>('all');

  const dueWords = useMemo(() => getDueWords(words), [words]);

  const addWord = (term: string, definition: string) => {
    const newWord: Word = {
      id: crypto.randomUUID(),
      term,
      definition,
      level: 0,
      nextReviewAt: Date.now(),
      lastReviewedAt: 0,
      wrongCount: 0,
      addedAt: Date.now(),
    };
    setWords([...words, newWord]);
  };

  const deleteWord = (id: string) => {
    setWords(words.filter(w => w.id !== id));
  };

  const finishQuiz = (updatedWords: Word[]) => {
    // 퀴즈 중에 업데이트된 단어 정보를 전체 목록에 반영
    const newWords = words.map(origin => {
      const updated = updatedWords.find(u => u.id === origin.id);
      return updated || origin;
    });
    setWords(newWords);
    setIsQuizMode(false);
  };

  if (isQuizMode) {
    return (
      <QuizView
        words={activeTab === 'review' ? dueWords : words}
        onFinish={finishQuiz}
        onCancel={() => setIsQuizMode(false)}
      />
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-black text-blue-600 tracking-tight">
            Vocalize <span className="text-pink-400">✨</span>
          </h1>
          <button
            disabled={words.length === 0}
            onClick={() => setIsQuizMode(true)}
            className="kid-button btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 퀴즈 시작!
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="kid-card bg-blue-50 border-blue-100 text-center">
            <div className="text-3xl font-bold text-blue-600">{words.length}</div>
            <div className="text-sm text-blue-400">전체 단어</div>
          </div>
          <div className="kid-card bg-pink-50 border-pink-100 text-center">
            <div className="text-3xl font-bold text-pink-600">{dueWords.length}</div>
            <div className="text-sm text-pink-400">복습 필요</div>
          </div>
          <div className="kid-card bg-emerald-50 border-emerald-100 text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {words.filter(w => w.level >= 7).length}
            </div>
            <div className="text-sm text-emerald-400">마스터 함</div>
          </div>
          <div className="kid-card bg-amber-50 border-amber-100 text-center">
            <div className="text-3xl font-bold text-amber-600">
              {words.reduce((acc, w) => acc + w.wrongCount, 0)}
            </div>
            <div className="text-sm text-amber-400">틀린 횟수</div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
              }`}
          >
            전체 보기
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'review' ? 'bg-pink-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
              }`}
          >
            복습해야 할 단어
          </button>
        </div>

        {/* Word List / Manager */}
        <WordManager
          words={activeTab === 'all' ? words : dueWords}
          onAddWord={addWord}
          onDeleteWord={deleteWord}
        />
      </div>
    </main>
  );
}
