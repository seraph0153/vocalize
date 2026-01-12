# Vocalize (보컬라이즈) ✨

내 아이를 위한 맞춤형 영어 단어 암기 웹 앱입니다. 음성 인식(STT)과 음성 합성(TTS), 그리고 에빙하우스 망각 곡선 이론(Spaced Repetition)을 결합하여 효과적인 학습을 도와줍니다.

## 🚀 주요 기능

1. **단어 관리**: 학습할 단어와 뜻을 쉽고 빠르게 등록/삭제할 수 있습니다.
2. **음성 퀴즈**: 앱이 단어의 뜻을 말해주면, 아이가 영어로 답을 말합니다.
3. **망각 곡선 학습 (SRS)**: 틀린 단어는 10분 후에 다시 나오고, 맞춘 단어는 복습 주기가 점점 길어집니다 (최대 30일).
4. **학습 데이터 저장**: 브라우저의 `LocalStorage`를 사용하여 별도의 로그인 없이도 학습 기록이 유지됩니다.
5. **친근한 디자인**: 아이들이 좋아할 만한 팝 컬러와 부드러운 애니메이션이 적용되었습니다.

## 🛠 기술 스택

- **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
- **Voice API**: Web Speech API (SpeechSynthesis, SpeechRecognition)
- **Deployment**: Vercel (추천), GitHub Pages

## 📦 설치 및 실행 방법

1. **저장소 클론**:
   ```bash
   git clone <your-repository-url>
   cd vocalize
   ```

2. **의존성 설치**:
   ```bash
   npm install
   ```

3. **로컬 서버 실행**:
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:3000`에 접속합니다.

## 🌐 GitHub에 업로드 및 배포하기 (Vercel 추천)

1. **GitHub 저장소 만들기**: GitHub 사이트에서 새로운 public 저장소를 생성합니다.
2. **코드 푸시**:
   ```bash
   git add .
   git commit -m "Initialize project"
   git remote add origin <your-repository-url>
   git push -u origin main
   ```
3. **Vercel 배포**:
   - [Vercel](https://vercel.com)에 로그인합니다.
   - `Add New` -> `Project` 클릭 후 GitHub 저장소를 연결합니다.
   - `Deploy` 버튼을 누르면 끝! (자동으로 HTTPS 주소가 생성됩니다.)

> [!IMPORTANT]
> **음성 기능 주의사항**: 음성 인식 기능은 **Google Chrome** 브라우저에서 가장 잘 작동합니다. 또한, 반드시 **HTTPS** 환경에서 접속해야 마이크 권한이 정상적으로 작동합니다.

## 💡 초보자를 위한 코드 가이드

- `src/types/index.ts`: 앱에서 사용하는 데이터의 구조(단어, 퀴즈 상태)를 정의합니다.
- `src/utils/srs.ts`: 망각 곡선에 따른 복습 주기를 계산하는 핵심 로직이 들어있습니다.
- `src/hooks/useSpeech.ts`: 브라우저의 음성 기능을 쉽게 쓸 수 있게 만든 커스텀 도구입니다.
- `src/app/page.tsx`: 화면의 전체적인 모습과 상태를 관리하는 메인 파일입니다.

---
아이의 더 즐거운 영어 공부를 응원합니다! 🎈

<!-- Trigger Build -->
