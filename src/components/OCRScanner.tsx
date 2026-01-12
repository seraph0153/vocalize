'use client';

import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Upload, Loader2, Check, X } from 'lucide-react';
import { useWordStore } from '@/store/useWordStore';

export default function OCRScanner({ onComplete }: { onComplete: () => void }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scannedWords, setScannedWords] = useState<{ term: string; definition: string }[]>([]);
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
        setIsProcessing(true);
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

            // Simple parsing: split by lines and then by common separators like -, :, =
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            const parsed = lines.map(line => {
                const parts = line.split(/[-:=]/);
                if (parts.length >= 2) {
                    return {
                        term: parts[0].trim(),
                        definition: parts[1].trim()
                    };
                }
                return null;
            }).filter(Boolean) as { term: string; definition: string }[];

            setScannedWords(parsed);
        } catch (error) {
            console.error('OCR Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        scannedWords.forEach(word => addWord(word.term, word.definition));
        onComplete();
    };

    return (
        <div className="kid-card border-purple-100 bg-purple-50/30">
            <h2 className="text-2xl font-bold mb-4 text-purple-600 flex items-center gap-2">
                <span>📸</span> 단어장 스캔하기
            </h2>

            {!previewUrl && !isProcessing && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-purple-200 rounded-3xl p-12 text-center cursor-pointer hover:bg-purple-50 transition-colors"
                >
                    <Upload className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                    <p className="text-purple-400 font-medium">이미지 업로드 또는 촬영</p>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                </div>
            )}

            {isProcessing && (
                <div className="py-12 text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
                    <p className="text-purple-600 font-bold">글씨를 읽고 있어요... {progress}%</p>
                    <div className="w-full bg-purple-100 rounded-full h-4 max-w-xs mx-auto overflow-hidden">
                        <div
                            className="bg-purple-500 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {scannedWords.length > 0 && !isProcessing && (
                <div className="space-y-4">
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                        {scannedWords.map((word, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-purple-100 shadow-sm">
                                <span className="font-bold text-purple-700">{word.term}</span>
                                <span className="text-gray-500">{word.definition}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleConfirm}
                            className="kid-button btn-accent flex-1 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" /> {scannedWords.length}개 단어 추가하기
                        </button>
                        <button
                            onClick={() => { setPreviewUrl(null); setScannedWords([]); }}
                            className="kid-button bg-gray-200 text-gray-500 hover:bg-gray-300 px-6"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
