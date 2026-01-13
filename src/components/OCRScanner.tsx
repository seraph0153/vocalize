'use client';

import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Upload, Loader2, Check, X, Edit2, Save } from 'lucide-react';
import { useWordStore } from '@/store/useWordStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function OCRScanner({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'review'>('idle');
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scannedWords, setScannedWords] = useState<{ term: string; definition: string }[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const addWord = useWordStore((state) => state.addWord);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            processImage(file);
        }
    };

    const processImage = async (file: File) => {
        setStatus('processing');
        setProgress(0);

        try {
            const worker = await createWorker('eng+kor', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            // Better parsing: match words and meanings more flexibly
            const lines = text.split('\n').filter(line => line.trim().length > 2);
            const parsed = lines.map(line => {
                // Try various separators: -, :, =, | or just space between eng and kor
                const parts = line.split(/[-:=|]/);
                if (parts.length >= 2) {
                    return { term: parts[0].trim(), definition: parts[1].trim() };
                }

                // Fallback: split by first space if one side is English and other is Korean
                // (Simplified logic for now)
                const spaceMatch = line.match(/^([a-zA-Z\s]+)\s+(.+)$/);
                if (spaceMatch) {
                    return { term: spaceMatch[1].trim(), definition: spaceMatch[2].trim() };
                }

                return { term: line.trim(), definition: '???' };
            });

            setScannedWords(parsed);
            setStatus('review');
        } catch (error) {
            console.error('OCR Error:', error);
            setStatus('idle');
        }
    };

    const handleUpdateWord = (index: number, field: 'term' | 'definition', value: string) => {
        const next = [...scannedWords];
        next[index] = { ...next[index], [field]: value };
        setScannedWords(next);
    };

    const handleRemoveWord = (index: number) => {
        setScannedWords(scannedWords.filter((_, i) => i !== index));
    };

    const handleConfirm = () => {
        scannedWords.forEach(word => {
            if (word.term && word.definition && word.definition !== '???') {
                addWord(word.term, word.definition);
            }
        });
        onComplete();
    };

    return (
        <div className="kid-card border-purple-100 bg-purple-50/30 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4 text-purple-600 flex items-center gap-2">
                <span>📸</span> 매직 카메라 스캐너
            </h2>

            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-4 border-dashed border-purple-200 rounded-3xl p-12 text-center cursor-pointer hover:bg-purple-50 transition-colors"
                    >
                        <Upload className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                        <p className="text-purple-400 font-bold text-lg">단어장 사진을 올려주세요</p>
                        <p className="text-purple-300 text-sm mt-2">글씨가 선명할수록 잘 읽어요!</p>
                        <input
                            type="file" accept="image/*" className="hidden"
                            ref={fileInputRef} onChange={handleImageUpload}
                        />
                    </motion.div>
                )}

                {status === 'processing' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="py-16 text-center space-y-6"
                    >
                        <div className="relative w-24 h-24 mx-auto">
                            <Loader2 className="w-24 h-24 text-purple-500 animate-spin absolute inset-0" />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-purple-600">
                                {progress}%
                            </div>
                        </div>
                        <p className="text-purple-700 font-black text-xl animate-bounce-subtle">
                            AI가 마법을 부리고 있어요...
                        </p>
                    </motion.div>
                )}

                {status === 'review' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl text-sm text-purple-600 font-bold text-center">
                            인식된 글자를 확인하고 틀린 부분은 눌러서 고쳐주세요!
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-purple-200">
                            {scannedWords.map((word, i) => (
                                <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-purple-100 shadow-sm transition-all hover:shadow-md">
                                    <input
                                        className="flex-1 bg-transparent p-2 font-bold text-purple-700 outline-none focus:bg-purple-50 rounded-xl"
                                        value={word.term}
                                        onChange={(e) => handleUpdateWord(i, 'term', e.target.value)}
                                        placeholder="단어"
                                    />
                                    <div className="text-purple-200 font-light">|</div>
                                    <input
                                        className="flex-1 bg-transparent p-2 text-gray-600 outline-none focus:bg-purple-50 rounded-xl"
                                        value={word.definition}
                                        onChange={(e) => handleUpdateWord(i, 'definition', e.target.value)}
                                        placeholder="뜻"
                                    />
                                    <button
                                        onClick={() => handleRemoveWord(i)}
                                        className="p-2 text-gray-300 hover:text-red-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleConfirm}
                                className="kid-button btn-accent flex-1 flex items-center justify-center gap-2 text-lg py-5"
                            >
                                <Check className="w-6 h-6" /> {scannedWords.length}개 단어 완성!
                            </button>
                            <button
                                onClick={() => { setStatus('idle'); setScannedWords([]); }}
                                className="kid-button bg-gray-200 text-gray-500 hover:bg-gray-300 px-6"
                            >
                                다시 찍기
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
