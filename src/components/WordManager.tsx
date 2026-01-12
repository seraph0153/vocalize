'use client';

import { useState } from 'react';
import { Word } from '../types';

interface WordManagerProps {
    words: Word[];
    onAddWord: (term: string, definition: string) => void;
    onDeleteWord: (id: string) => void;
}

export default function WordManager({ words, onAddWord, onDeleteWord }: WordManagerProps) {
    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim() && definition.trim()) {
            onAddWord(term.trim(), definition.trim());
            setTerm('');
            setDefinition('');
        }
    };

    return (
        <div className="space-y-8">
            {/* 등록 폼 */}
            <section className="kid-card border-blue-100">
                <h2 className="text-2xl font-bold mb-4 text-blue-600 flex items-center gap-2">
                    <span>📝</span> 새 단어 추가하기
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="English Word (예: Apple)"
                        className="flex-1 p-4 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors text-lg"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="한국어 뜻 (예: 사과)"
                        className="flex-1 p-4 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors text-lg"
                        value={definition}
                        onChange={(e) => setDefinition(e.target.value)}
                    />
                    <button type="submit" className="kid-button btn-primary whitespace-nowrap">
                        추가하기
                    </button>
                </form>
            </section>

            {/* 목록 */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                    <span>📚</span> 나의 단어장 ({words.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {words.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            아직 등록된 단어가 없어요. 새로운 단어를 추가해보세요!
                        </div>
                    ) : (
                        words.map((word) => (
                            <div key={word.id} className="kid-card flex justify-between items-center group">
                                <div>
                                    <div className="text-xl font-bold text-blue-600">{word.term}</div>
                                    <div className="text-gray-500">{word.definition}</div>
                                    <div className="text-xs mt-2 text-gray-400">
                                        레벨: {word.level} |
                                        복습: {new Date(word.nextReviewAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDeleteWord(word.id)}
                                    className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                                    aria-label="삭제"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
