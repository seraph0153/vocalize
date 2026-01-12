import { Word } from '../types';

// 에빙하우스 망각 곡선에 기반한 복습 간격 (초 단위)
// 1단계: 10분 (600s)
// 2단계: 1시간 (3600s)
// 3단계: 1일 (86400s)
// 4단계: 3일 (259200s)
// 5단계: 7일 (604800s)
// 6단계: 14일 (1209600s)
// 7단계: 30일 (2592000s) - 완료!
const SRS_INTERVALS = [
    600,         // Level 1: 10 min
    3600,        // Level 2: 1 hour
    86400,       // Level 3: 1 day
    259200,      // Level 4: 3 days
    604800,      // Level 5: 7 days
    1209600,     // Level 6: 14 days
    2592000,     // Level 7: 30 days
];

/**
 * 정답을 맞췄을 때 다음 복습 시간을 계산합니다.
 */
export const calculateNextReview = (currentLevel: number): { nextLevel: number; nextReviewAt: number } => {
    const nextLevel = Math.min(currentLevel + 1, SRS_INTERVALS.length);
    const interval = SRS_INTERVALS[nextLevel - 1] || SRS_INTERVALS[SRS_INTERVALS.length - 1];
    const nextReviewAt = Date.now() + interval * 1000;

    return { nextLevel, nextReviewAt };
};

/**
 * 틀렸을 때 단계를 초기화하고 다음 복습 시간을 계산합니다. (10분 후 복습)
 */
export const resetSRSLevel = (): { nextLevel: number; nextReviewAt: number } => {
    return {
        nextLevel: 1,
        nextReviewAt: Date.now() + SRS_INTERVALS[0] * 1000,
    };
};

/**
 * 현재 복습이 필요한 단어들만 필터링합니다.
 */
export const getDueWords = (words: Word[]): Word[] => {
    const now = Date.now();
    return words.filter((word) => word.nextReviewAt <= now);
};
