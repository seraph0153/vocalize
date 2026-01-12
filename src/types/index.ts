export interface Word {
  id: string;
  term: string; // 영어 단어
  definition: string; // 한글 뜻
  level: number; // SRS 단계 (0-7)
  nextReviewAt: number; // 다음 복습 시간 (Unix timestamp)
  lastReviewedAt: number; // 마지막 복습 시간
  wrongCount: number; // 틀린 횟수
  addedAt: number; // 추가된 시간
  audioUrl?: string; // 커스텀 발음 녹음 URL
}

export interface QuizState {
  isStarted: boolean;
  currentWordIndex: number;
  score: number;
  wrongWords: string[]; // 틀린 단어 ID 목록
}
