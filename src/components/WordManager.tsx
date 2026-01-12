'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, Mic, Square, Play, Upload, List, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Word } from '@/types';
import { useWordStore } from '@/store/useWordStore';

export default function WordManager() {
    const { words, addWord, deleteWord } = useWordStore();
    const [mode, setMode] = useState<'manual' | 'bulk'>('manual');

    // Manual Input State
    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Bulk Input State
    const [bulkText, setBulkText] = useState('');

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim() && definition.trim()) {
            addWord(term.trim(), definition.trim());
            // In a real app, we'd save the recordedUrl too.
            // For now, we focus on the core requirement logic.
            setTerm('');
            setDefinition('');
            setRecordedUrl(null);
        }
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lines = bulkText.split('\n');
        lines.forEach(line => {
            const parts = line.split(/[-:=]/);
            if (parts.length >= 2) {
                addWord(parts[0].trim(), parts[1].trim());
            }
        });
        setBulkText('');
        setMode('manual');
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
                const url = URL.createObjectURL(blob);
                setRecordedUrl(url);
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);
        } catch (err) {
            console.error('Recording error:', err);
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    return (
        <div className="space-y-8">
            {/* Mode Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-2xl w-fit">
                <button
                    onClick={() => setMode('manual')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                >
                    직접 입력
                </button>
                <button
                    onClick={() => setMode('bulk')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'bulk' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
                >
                    대량 추가
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'manual' ? (
                    <motion.section
                        key="manual"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="kid-card border-blue-100"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
                            <Plus className="w-6 h-6" /> 새 단어 추가하기
                        </h2>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="English Word (Apple)"
                                    className="flex-1 p-4 rounded-2xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors text-lg"
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="한국어 뜻 (사과)"
                                    className="flex-1 p-4 rounded-2xl border-2 border-gray-100 focus:border-blue-400 outline-none transition-colors text-lg"
                                    value={definition}
                                    onChange={(e) => setDefinition(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <div className="text-sm font-bold text-gray-400 flex-1">
                                    커스텀 발음 녹음 (선택)
                                </div>
                                {isRecording ? (
                                    <button type="button" onClick={stopRecording} className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                                        <Square className="w-5 h-5 fill-current" /> 정지
                                    </button>
                                ) : (
                                    <button type="button" onClick={startRecording} className="flex items-center gap-2 text-blue-500 font-bold">
                                        <Mic className="w-5 h-5" /> 녹음 시작
                                    </button>
                                )}
                                {recordedUrl && !isRecording && (
                                    <button type="button" onClick={() => new Audio(recordedUrl).play()} className="text-emerald-500">
                                        <Play className="w-5 h-5 fill-current" />
                                    </button>
                                )}
                            </div>

                            <button type="submit" className="kid-button btn-primary w-full">
                                단어장에 추가하기
                            </button>
                        </form>
                    </motion.section>
                ) : (
                    <motion.section
                        key="bulk"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="kid-card border-emerald-100 bg-emerald-50/20"
                    >
                        <h2 className="text-2xl font-bold mb-4 text-emerald-600 flex items-center gap-2">
                            <List className="w-6 h-6" /> 여러 단어 한꺼번에 넣기
                        </h2>
                        <p className="text-sm text-emerald-600/70 mb-4">"단어 - 뜻" 형식으로 줄바꿈하며 적어주세요.</p>
                        <form onSubmit={handleBulkSubmit} className="space-y-4">
                            <textarea
                                placeholder="Apple - 사과&#10;Banana - 바나나&#10;Cat - 고양이"
                                className="w-full h-40 p-4 rounded-3xl border-2 border-gray-100 focus:border-emerald-400 outline-none transition-colors text-lg"
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                            />
                            <button type="submit" className="kid-button btn-accent w-full">
                                모두 추가하기
                            </button>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* 목록 */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                    <Hash className="w-6 h-6 text-gray-400" /> 나의 단어장 ({words.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {words.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400">
                            아직 등록된 단어가 없어요.
                        </div>
                    ) : (
                        words.map((word) => (
                            <motion.div
                                layout
                                key={word.id}
                                className="kid-card flex justify-between items-center group relative overflow-hidden"
                            >
                                <div>
                                    <div className="text-xl font-bold text-blue-600">{word.term}</div>
                                    <div className="text-gray-500">{word.definition}</div>
                                    <div className="flex items-center gap-1 mt-2">
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className={`w-2 h-1 rounded-full ${i < word.level ? 'bg-orange-400' : 'bg-gray-100'}`} />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteWord(word.id)}
                                    className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
