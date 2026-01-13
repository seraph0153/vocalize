import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Word, QuizState } from '@/types';
import { calculateNextReview, resetSRSLevel } from '@/utils/srs';

interface AppState {
    words: Word[];
    dailyStreak: number;
    lastStudyDate: string | null;
    totalPoints: number;
    gasUrl: string | null;

    // Actions
    addWord: (term: string, definition: string, audioUrl?: string) => void;
    bulkAddWords: (newWords: { term: string; definition: string }[]) => void;
    deleteWord: (id: string) => void;
    editWord: (id: string, term: string, definition: string) => void;
    updateWord: (id: string, updates: Partial<Word>) => void;
    setGasUrl: (url: string | null) => void;
    finishQuiz: (updatedWords: Word[]) => void;
    updateStreak: () => void;
}

export const useWordStore = create<AppState>()(
    persist(
        (set, get) => ({
            words: [],
            dailyStreak: 0,
            lastStudyDate: null,
            totalPoints: 0,
            gasUrl: null,

            addWord: (term, definition, audioUrl) => {
                const newWord: Word = {
                    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                    term,
                    definition,
                    level: 0,
                    nextReviewAt: Date.now(),
                    lastReviewedAt: 0,
                    wrongCount: 0,
                    addedAt: Date.now(),
                    audioUrl,
                };
                set((state) => ({ words: [...state.words, newWord] }));
            },

            bulkAddWords: (newWordsList) => {
                const currentWords = get().words;
                const filteredNewWords = newWordsList
                    .filter(nw => !currentWords.some(cw => cw.term.toLowerCase() === nw.term.toLowerCase()))
                    .map(nw => ({
                        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                        term: nw.term,
                        definition: nw.definition,
                        level: 0,
                        nextReviewAt: Date.now(),
                        lastReviewedAt: 0,
                        wrongCount: 0,
                        addedAt: Date.now(),
                    }));

                if (filteredNewWords.length > 0) {
                    set((state) => ({ words: [...state.words, ...filteredNewWords] }));
                }
            },

            deleteWord: (id) => {
                set((state) => ({ words: state.words.filter((w) => w.id !== id) }));
            },

            editWord: (id, term, definition) => {
                set((state) => ({
                    words: state.words.map((w) => (w.id === id ? { ...w, term, definition } : w)),
                }));
            },

            setGasUrl: (url) => set({ gasUrl: url }),

            updateWord: (id, updates) => {
                set((state) => ({
                    words: state.words.map((w) => (w.id === id ? { ...w, ...updates } : w)),
                }));
            },

            finishQuiz: (updatedWords) => {
                set((state) => {
                    const newWords = state.words.map((origin) => {
                        const updated = updatedWords.find((u) => u.id === origin.id);
                        return updated || origin;
                    });

                    // Calculate points (e.g., 10 points per quiz session)
                    const newPoints = state.totalPoints + 10;

                    return { words: newWords, totalPoints: newPoints };
                });
                get().updateStreak();
            },

            updateStreak: () => {
                const today = new Date().toISOString().split('T')[0];
                const lastDate = get().lastStudyDate;

                if (lastDate === today) return;

                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                set((state) => ({
                    lastStudyDate: today,
                    dailyStreak: lastDate === yesterdayStr ? state.dailyStreak + 1 : 1,
                }));
            },
        }),
        {
            name: 'vocalize-storage',
        }
    )
);
