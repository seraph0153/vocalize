'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Camera,
  Settings,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { useWordStore } from '@/store/useWordStore';
import Dashboard from '@/components/Dashboard';
import WordManager from '@/components/WordManager';
import OCRScanner from '@/components/OCRScanner';
import QuizView from '@/components/QuizView';
import { getDueWords } from '@/utils/srs';

export default function Home() {
  const { words, finishQuiz } = useWordStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'words' | 'ocr'>('dashboard');
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizFilter, setQuizFilter] = useState<'all' | 'review'>('all');

  const startQuiz = (filter: 'all' | 'review') => {
    setQuizFilter(filter);
    setIsQuizMode(true);
  };

  const dueWords = getDueWords(words);

  if (isQuizMode) {
    const quizWords = quizFilter === 'review' ? dueWords : words;
    return (
      <QuizView
        words={quizWords}
        onFinish={(updated) => {
          finishQuiz(updated);
          setIsQuizMode(false);
        }}
        onCancel={() => setIsQuizMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Side Navigation (Desktop) / Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-24 md:h-full md:border-r md:border-t-0">
        <div className="hidden md:block mb-8 mt-4 text-2xl font-black text-blue-600">V.</div>

        <NavButton
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          icon={LayoutDashboard}
          label="홈"
        />
        <NavButton
          active={activeTab === 'words'}
          onClick={() => setActiveTab('words')}
          icon={BookOpen}
          label="단어"
        />
        <NavButton
          active={activeTab === 'ocr'}
          onClick={() => setActiveTab('ocr')}
          icon={Camera}
          label="스캔"
        />

        <div className="hidden md:mt-auto md:flex md:flex-col gap-4 mb-4">
          <Settings className="w-6 h-6 text-gray-300 hover:text-gray-600 cursor-pointer" />
          <Cloud className="w-6 h-6 text-gray-300 hover:text-gray-600 cursor-pointer" />
        </div>
      </nav>

      <main className="pb-24 pt-8 px-6 md:pl-32 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">Daughter's AI Vocab Buddy</h1>
            <div className="text-4xl font-black text-gray-900">
              {activeTab === 'dashboard' && "안녕! 오늘도 같이 공부할까?"}
              {activeTab === 'words' && "나만의 똑똑한 단어장"}
              {activeTab === 'ocr' && "매직 카메라 스캐너"}
            </div>
          </div>
          <button
            disabled={words.length === 0}
            onClick={() => startQuiz('all')}
            className="hidden sm:flex kid-button btn-primary items-center gap-2"
          >
            퀴즈 시작 <ChevronRight className="w-5 h-5" />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'words' && <WordManager />}
            {activeTab === 'ocr' && <OCRScanner onComplete={() => setActiveTab('words')} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action for Quiz on Mobile */}
      <div className="fixed bottom-24 right-6 md:hidden">
        <button
          onClick={() => startQuiz('all')}
          disabled={words.length === 0}
          className={`w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform ${words.length === 0 ? 'opacity-50 grayscale' : ''}`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600 scale-110' : 'text-gray-300'}`}
    >
      <Icon className="w-7 h-7" />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

