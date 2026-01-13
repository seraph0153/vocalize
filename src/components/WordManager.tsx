'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, Mic, Square, Play, Upload, List, Hash, Volume2, Save } from 'lucide-react';
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
            addWord(term.trim(), definition.trim(), recordedUrl || undefined);
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
                // Clean up stream
                stream.getTracks().forEach(track => track.stop());
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
            <div className="flex p-1 bg-gray-100 rounded-2xl w-fit mx-auto lg:mx-0">
                <button
                    onClick={() => setMode('manual')}
                    className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${mode === 'manual' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400'}`}
                >
                    직접 & 목소리 녹음
                </button>
                <button
                    onClick={() => setMode('bulk')}
                    className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${mode === 'bulk' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400'}`}
                >
                    대량 추가
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'manual' ? (
                    <motion.section
                        key="manual"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="kid-card border-blue-100 bg-white shadow-xl"
                    >
                        <form onSubmit={handleManualSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-400 ml-2">영단어 (English)</label>
                                    <input
                                        type="text"
                                        placeholder="예: Apple"
                                        className="w-full p-5 rounded-3xl border-4 border-gray-50 focus:border-blue-400 outline-none transition-all text-2xl font-black text-gray-800"
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-gray-400 ml-2">우리말 뜻 (Korean)</label>
                                    <input
                                        type="text"
                                        placeholder="예: 사과"
                                        className="w-full p-5 rounded-3xl border-4 border-gray-50 focus:border-pink-400 outline-none transition-all text-2xl font-black text-gray-800"
                                        value={definition}
                                        onChange={(e) => setDefinition(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative group">
                                <div className={`p-6 rounded-3xl border-4 border-dashed transition-all flex flex-col items-center justify-center gap-4 ${isRecording ? 'border-red-400 bg-red-50' : recordedUrl ? 'border-emerald-200 bg-emerald-50' : 'border-blue-50 bg-gray-50'}`}>
                                    {isRecording ? (
                                        <>
                                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-200">
                                                <Square className="w-6 h-6 text-white fill-current" />
                                            </div>
                                            <button type="button" onClick={stopRecording} className="text-red-500 font-black text-lg">녹음 중지하기</button>
                                        </>
                                    ) : recordedUrl ? (
                                        <>
                                            <div className="flex gap-4">
                                                <div onClick={() => new Audio(recordedUrl).play()} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-200 hover:scale-110 transition-transform">
                                                    <Volume2 className="w-8 h-8 text-white" />
                                                </div>
                                                <div onClick={startRecording} className="w-16 h-16 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-50 transition-colors">
                                                    <Mic className="w-6 h-6 text-emerald-500" />
                                                </div>
                                            </div>
                                            <p className="text-emerald-600 font-black">녹음이 완료되었어요! 들어볼까요?</p>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-110 transition-transform"
                                            >
                                                <Mic className="w-8 h-8 text-white" />
                                            </button>
                                            <p className="text-blue-400 font-black">이 단어의 발음을 내 목소리로 녹음해보세요</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="kid-button btn-primary w-full py-6 text-2xl flex items-center justify-center gap-3">
                                <Save className="w-8 h-8" /> 단어장에 쏙! 넣기
                            </button>
                        </form>
                    </motion.section>
                ) : (
                    <motion.section
                        key="bulk"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="kid-card border-emerald-100 bg-emerald-50/20"
                    >
                        <h2 className="text-2xl font-black mb-4 text-emerald-600 flex items-center gap-2">
                            <List className="w-6 h-6" /> 대량 추가하기
                        </h2>
                        <form onSubmit={handleBulkSubmit} className="space-y-4">
                            <textarea
                                placeholder="Apple - 사과&#10;Banana - 바나나"
                                className="w-full h-48 p-6 rounded-3xl border-4 border-white focus:border-emerald-400 outline-none transition-all text-xl font-bold bg-white/80"
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                            />
                            <button type="submit" className="kid-button btn-accent w-full py-5 text-xl">
                                모든 단어 한꺼번에 추가하기
                            </button>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* 목록 */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-700 flex items-center gap-2">
                        <Hash className="w-6 h-6 text-gray-400" /> 나의 단어 뭉치 <span className="text-blue-500">{words.length}</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {words.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 text-center space-y-4">
                                <div className="text-6xl text-gray-200">🛸</div>
                                <div className="text-xl font-black text-gray-300">첫 단어를 등록해보세요!</div>
                            </motion.div>
                        ) : (
                            words.map((word) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={word.id}
                                    className="kid-card bg-white hover:border-blue-200 group p-5 flex flex-col justify-between"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-2xl font-black text-blue-600 mb-1">{word.term}</div>
                                            <div className="text-lg font-bold text-gray-500">{word.definition}</div>
                                        </div>
                                        {word.audioUrl && (
                                            <button
                                                onClick={() => new Audio(word.audioUrl).play()}
                                                className="p-2 bg-blue-50 rounded-xl text-blue-500 hover:bg-blue-100"
                                            >
                                                <Volume2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex items-center gap-1">
                                            {[...Array(7)].map((_, i) => (
                                                <div key={i} className={`w-3 h-1.5 rounded-full ${i < word.level ? 'bg-orange-400' : 'bg-gray-100'}`} title={`Level ${word.level}`} />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => deleteWord(word.id)}
                                            className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
}
