# Release Notes — v1.0.0

**릴리즈일:** 2026-06-02
**대상:** kdd-web (국민대 소융대 AI RAG 에이전트 — 프론트엔드 웹)

국민대학교 소프트웨어융합대학 학사 규정·공지·FAQ 특화 RAG 기반 AI 에이전트의 첫 정식 릴리즈입니다. 학생용 대화형 AI와 자료실·FAQ, 관리자 대시보드를 포함한 핵심 사용자 여정 전체를 제공합니다.

---

## ✨ 주요 기능

### 대화형 AI 채팅
- SSE(Server-Sent Events) 기반 **실시간 토큰 스트리밍** 응답
- 답변 본문의 `{{N}}` **인용 마커** → 근거 문서·페이지 연결, 클릭 시 PDF 뷰어 점프
- 답변별 **신뢰도 표시** 및 근거 부족 시 **추천 질문 Fallback**
- 사용자별 **일일 채팅 한도** 관리 및 매일 자정(KST) 자동 초기화

### 자료실
- 계층형 **카테고리 트리** 탐색 (지연 로딩)
- 키워드 **검색**, 최신순·인기순 **정렬**, 페이지네이션
- **인기 문서** 추천
- `react-pdf` 기반 **인앱 PDF 뷰어**

### FAQ
- 9개 토픽 분류, 검색·정렬, 도움됨 투표
- FAQ 질문을 즉시 채팅 세션으로 이어가기

### 관리자 대시보드
- 통계(질문 수, 문서 수, 카테고리 분포 차트)
- 문서 관리(업로드, 상태 추적, 재처리, 삭제)
- FAQ 후보 검토·승인·반려 워크플로
- 사용자 채팅 한도 개별/일괄 변경, 사용량 초기화

### 공통
- 모바일 퍼스트 **반응형** 레이아웃
- JWT(메모리) + Refresh Token(HttpOnly Cookie) 인증, 자동 재발급
- `NEXT_PUBLIC_USE_MOCK` **목업 모드** — 백엔드 없이 전체 UI 동작

---

## 🛠️ 코드 품질 개선 (이번 릴리즈)

- **ESLint 경고·에러 0건** 달성
  - `react-hooks/refs` — 렌더 중 ref 접근 제거 (ChatInput 전송 가드를 state로 분리)
  - `react-hooks/set-state-in-effect` — 이펙트 내 동기 setState 제거
    - prop 변경 동기화는 React 권장 **렌더 중 상태 보정** 패턴으로 전환 (ChatInput, PDFViewer)
    - 데이터 페칭은 **async 함수 + cancellation 가드** 패턴으로 전환 (resources/[fileId], useFAQ)
  - `@typescript-eslint/no-unused-vars` — 미사용 import/변수 정리 및 `_` 접두사 컨벤션을 ESLint 설정에 반영
- **빌드 스크립트 마이그레이션** — Next.js 16에서 제거된 `next lint` → `eslint .` 로 교체, `lint:fix` 추가
- **에러 바운더리 추가** — `app/error.tsx`, `app/(main)/error.tsx`
- **AdminGuard 렌더 중 리다이렉트 제거** — `router.replace`를 이펙트로 이동해 "Cannot update a component while rendering" 경고 해소
- **Mock 데이터 보강** — 백엔드 없이도 전체 화면을 시연할 수 있도록 채팅 세션 상세·문서 상세·FAQ 후보·관리자 권한 mock을 실제 동작과 일치하도록 보강
- **JSDoc 보강** — `cn`, `useSSEStream`, `useChatUsage`, `useApiRequest`, `useDocuments` 등 핵심 유틸·훅 문서화

---

## ✅ 검증

| 항목 | 결과 |
|------|------|
| ESLint | 0 errors / 0 warnings |
| TypeScript (`tsc --noEmit`) | 통과 |
| 프로덕션 빌드 | 14개 라우트 정상 생성 |
| QA 헬스 스코어 | 88/100 (9개 페이지, 콘솔 에러 0) |

---

## 📌 알려진 제약

- **PDF 뷰어 실파일 로딩**은 백엔드 문서 스트리밍 API 연동 후 활성화됩니다. (목업 모드에서는 안내 문구 표시)
- **FAQ 투표 API**는 백엔드 미구현으로 현재 no-op 처리됩니다.
- 인기순 정렬은 백엔드 집계 필드 추가 전까지 최신순과 동일하게 동작할 수 있습니다.

---

## 🔭 다음 단계

- 백엔드 문서 파일 API 연동 → PDF 인용 하이라이트 활성화
- FAQ 투표 집계 연동
- 테스트 실행 환경 안정화 (Vitest `rolldown` 네이티브 바인딩)
