'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy,
    Flame,
    Target,
    TrendingUp,
    CloudLightning,
    Loader2,
    BookX,
    Play
} from 'lucide-react';
import { useWordStore } from '@/store/useWordStore';
import { syncToGas } from '@/utils/gasSync';

interface DashboardProps {
    onStartQuiz: (mode: 'all' | 'review' | 'wrong') => void;
}

export default function Dashboard({ onStartQuiz }: DashboardProps) {
    const { words, dailyStreak, totalPoints, gasUrl, setGasUrl } = useWordStore();
    const [isSyncing, setIsSyncing] = useState(false);
    const [showGasInput, setShowGasInput] = useState(false);
    const [tempUrl, setTempUrl] = useState(gasUrl || '');

    const masteredCount = words.filter(w => w.level >= 5).length;
    const learningCount = words.filter(w => w.level > 0 && w.level < 5).length;
    const newCount = words.filter(w => w.level === 0).length;
    const wrongWordsCount = words.filter(w => w.wrongCount > 0).length;

    const handleSync = async () => {
        if (!gasUrl) {
            setShowGasInput(true);
            return;
        }

        setIsSyncing(true);
        try {
            await syncToGas(gasUrl, words);
            alert('구글 시트와 동기화되었습니다!');
        } catch (err) {
            alert('동기화 실패: URL을 확인해주세요.');
        } finally {
            setIsSyncing(false);
        }
    };

    const saveUrl = () => {
        setGasUrl(tempUrl);
        setShowGasInput(false);
    };

    return (
        <div className="space-y-8">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Flame}
                    label="오늘의 스트릭"
                    value={`${dailyStreak}일`}
                    color="text-orange-500"
                    bg="bg-orange-50"
                />
                <StatCard
                    icon={Trophy}
                    label="학습 포인트"
                    value={`${totalPoints}P`}
                    color="text-yellow-600"
                    bg="bg-yellow-50"
                />
                <StatCard
                    icon={Target}
                    label="완성한 단어"
                    value={`${masteredCount}개`}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Progress Section */}
                <section className="kid-card bg-white shadow-xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-7 h-7 text-blue-500" /> 나의 학습 성장도
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowGasInput(!showGasInput)}
                                className="text-sm font-bold text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                {gasUrl ? '설정 수정' : '연동 설정'}
                            </button>
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 px-4 py-2 rounded-xl"
                            >
                                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudLightning className="w-4 h-4" />}
                                동기화
                            </button>
                        </div>
                    </div>

                    {showGasInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            className="mb-8 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-4"
                        >
                            <p className="text-blue-600 font-bold">Google Apps Script Web App URL:</p>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 p-3 rounded-xl border-2 border-white outline-none focus:border-blue-300 text-sm"
                                    placeholder="https://script.google.com/macros/s/..."
                                    value={tempUrl}
                                    onChange={(e) => setTempUrl(e.target.value)}
                                />
                                <button onClick={saveUrl} className="bg-blue-500 text-white px-6 rounded-xl font-bold">저장</button>
                            </div>
                            {gasUrl && (
                                <p className="text-[10px] text-blue-300 truncate">현재: {gasUrl}</p>
                            )}
                        </motion.div>
                    )}

                    <div className="space-y-6">
                        <ProgressBar label="마스터 (Lv.5+)" count={masteredCount} total={words.length} color="bg-emerald-400" />
                        <ProgressBar label="학습 중 (Lv.1~4)" count={learningCount} total={words.length} color="bg-blue-400" />
                        <ProgressBar label="새로운 단어" count={newCount} total={words.length} color="bg-gray-200" />
                    </div>
                </section>

                {/* Wrong Answer Note Section */}
                <section className="kid-card border-red-100 bg-red-50/20 p-8 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <BookX className="w-8 h-8" />
                            <h2 className="text-2xl font-black">비밀 오답 노트 🤫</h2>
                        </div>
                        <p className="text-gray-500 font-bold text-lg">
                            자주 깜빡하는 단어 <span className="text-red-500 font-black">{wrongWordsCount}개</span>가 기록되어 있어요.
                            다시 한번 복습하면 완벽하게 외울 수 있어요!
                        </p>
                    </div>
                    <button
                        onClick={() => onStartQuiz('wrong')}
                        disabled={wrongWordsCount === 0}
                        className="mt-8 kid-button bg-red-500 text-white shadow-lg shadow-red-200 py-6 text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        <Play className="w-6 h-6 fill-current" /> 오답들만 모아서 공부하기
                    </button>
                </section>
            </div>

            {/* Quick Action */}
            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-blue-200">
                <div className="space-y-2 text-center md:text-left">
                    <div className="text-3xl font-black">오늘의 단어 퀴즈!</div>
                    <div className="text-blue-100 font-bold">아직 복습하지 않은 단어 {words.filter(w => w.nextReviewAt <= Date.now()).length}개가 기다리고 있어요.</div>
                </div>
                <button
                    onClick={() => onStartQuiz('review')}
                    className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all"
                >
                    복습 시작하기
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`kid-card ${bg} border-transparent p-6 flex items-center gap-6`}
        >
            <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm`}>
                <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-tight">{label}</div>
                <div className={`text-3xl font-black ${color}`}>{value}</div>
            </div>
        </motion.div>
    );
}

function ProgressBar({ label, count, total, color }: any) {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="font-bold text-gray-600">{label}</span>
                <span className="text-sm font-black text-gray-400">{count} / {total}</span>
            </div>
            <div className="h-4 bg-gray-50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
}
