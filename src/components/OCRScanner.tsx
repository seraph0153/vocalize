'use client';

import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Upload, Loader2, Check, X, Edit2, Save, Info } from 'lucide-react';
import { useWordStore } from '@/store/useWordStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function OCRScanner({ onComplete }: { onComplete: () => void }) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'review'>('idle');
    const [progress, setProgress] = useState(0);
    const [scannedWords, setScannedWords] = useState<{ term: string; definition: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const addWord = useWordStore((state) => state.addWord);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            preprocessAndProcess(file);
        }
    };

    const preprocessAndProcess = (file: File) => {
        setStatus('processing');
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Set canvas size to image size
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Preprocessing: Convert to Grayscale & Higher Contrast
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];

                    // Contrast enhancement
                    let contrast = 1.5; // Factor
                    let factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    let newVal = factor * (brightness - 128) + 128;

                    data[i] = data[i + 1] = data[i + 2] = newVal;
                }
                ctx.putImageData(imageData, 0, 0);

                // Process preprocessed image
                canvas.toBlob((blob) => {
                    if (blob) processImage(blob);
                });
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const processImage = async (blob: Blob) => {
        try {
            const worker = await createWorker('eng+kor', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const { data: { text } } = await worker.recognize(blob);
            await worker.terminate();

            const lines = text.split('\n').filter(line => line.trim().length > 2);
            const parsed = lines.map(line => {
                const parts = line.split(/[-:=|]/);
                if (parts.length >= 2) {
                    return { term: parts[0].trim(), definition: parts[1].trim() };
                }
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

            {/* Hidden processing canvas */}
            <canvas ref={canvasRef} className="hidden" />

            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-4 border-dashed border-purple-200 rounded-3xl p-12 text-center cursor-pointer hover:bg-purple-50 transition-colors"
                        >
                            <Upload className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                            <p className="text-purple-400 font-bold text-lg">단어장 사진을 올려주세요</p>
                            <p className="text-purple-300 text-sm mt-2">AI가 흑백 처리로 정확도를 높여 읽어드려요!</p>
                            <input
                                type="file" accept="image/*" className="hidden"
                                ref={fileInputRef} onChange={handleImageUpload}
                            />
                        </div>

                        <div className="bg-white/80 p-5 rounded-3xl border border-purple-100 flex gap-3 items-start">
                            <Info className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
                            <div className="text-sm text-purple-600 leading-relaxed">
                                <p className="font-bold mb-1">💡 인식률을 높이는 꿀팁!</p>
                                <ul className="list-disc list-inside space-y-1 opacity-80">
                                    <li>밝은 곳에서 그림자가 생기지 않게 찍어주세요.</li>
                                    <li>카메라를 수평으로 맞춰서 글자가 눕지 않게 해주세요.</li>
                                    <li>글자가 선명하게 보이도록 초점을 맞춰주세요.</li>
                                </ul>
                            </div>
                        </div>
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
                            선명하게 보정하고 읽는 중...
                        </p>
                    </motion.div>
                )}

                {status === 'review' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl text-sm text-purple-600 font-bold text-center">
                            보정된 단어들이에요! 틀린 부분은 직접 고쳐주세요.
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
