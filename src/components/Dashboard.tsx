'use client';

import {
    Trophy,
    Flame,
    Target,
    BookOpen,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWordStore } from '@/store/useWordStore';
import { getDueWords } from '@/utils/srs';

export default function Dashboard() {
    const { words, dailyStreak, totalPoints } = useWordStore();
    const dueWords = getDueWords(words);
    const masteredCount = words.filter(w => w.level >= 7).length;

    const stats = [
        { label: '전체 단어', value: words.length, icon: BookOpen, color: 'bg-blue-500', textColor: 'text-blue-600' },
        { label: '복습 대기', value: dueWords.length, icon: Calendar, color: 'bg-pink-500', textColor: 'text-pink-600' },
        { label: '마스터함', value: masteredCount, icon: Trophy, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
        { label: '연속 학습', value: dailyStreak, icon: Flame, color: 'bg-orange-500', textColor: 'text-orange-600' },
    ];

    return (
        <div className="space-y-8">
            {/* 포인트 및 레벨 카드 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="kid-card bg-gradient-to-r from-blue-500 to-indigo-600 text-white relative overflow-hidden"
            >
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl opacity-90 font-medium mb-1">나의 학습 포인트</h2>
                        <div className="text-5xl font-black">{totalPoints.toLocaleString()} <span className="text-xl">pts</span></div>
                    </div>
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                        <Target className="w-12 h-12" />
                    </div>
                </div>
                {/* 장식용 원 */}
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full" />
            </motion.div>

            {/* 통계 그리드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="kid-card bg-white hover:scale-105 transition-transform cursor-pointer group"
                    >
                        <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white shadow-lg`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-2xl font-black text-gray-800">{stat.value}</div>
                        <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* 퀵 액션 */}
            {dueWords.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="kid-card border-pink-100 bg-pink-50/30 flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-pink-500 p-2 rounded-xl text-white">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-800">지금 복습할 단어가 {dueWords.length}개 있어요!</div>
                            <div className="text-sm text-pink-500">망각 곡선에 따라 지금 복습하면 더 잘 기억나요.</div>
                        </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-pink-400" />
                </motion.div>
            )}
        </div>
    );
}
