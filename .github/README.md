<div align="center">

# 🐶 KDD Web · 프론트엔드 웹 클라이언트

**국민대학교 소프트웨어융합대학 학사 규정·공지·FAQ 특화 RAG 기반 AI 에이전트 — 프론트엔드**

근거 문서를 인용하며 답변하는 대화형 AI를, 출처 추적·신뢰도 표시·실시간 스트리밍과 함께 제공합니다.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Version](https://img.shields.io/badge/release-v1.0.0-004F9F?style=flat-square)

</div>

---

## 📖 개요

이 저장소는 **KDD(Kookmin Digital Dog)** 서비스의 **프론트엔드 웹 클라이언트**입니다. KDD는 국민대학교 소프트웨어융합대학 학생들이 학사 규정·공지사항·FAQ를 자연어로 검색하고 답변받을 수 있는 **RAG(Retrieval-Augmented Generation) 기반 AI 에이전트**입니다.

일반 챗봇과 달리, 모든 답변은 **실제 학사 문서를 근거로 인용**하고 답변의 **신뢰도를 함께 표시**합니다. 사용자는 답변 속 인용 마커를 눌러 근거가 된 PDF 문서의 해당 페이지를 바로 확인할 수 있습니다.

> 🔗 KDD 서비스 전체 소개는 [조직 프로필](https://github.com/KDD-Kookmin-Digital-Doc)을 참고하세요. 이 저장소는 그중 **웹 프론트엔드**를 담당합니다.

> 🎨 브랜드 컬러는 국민대학교 상징색인 **KMU Blue (`#004F9F`)** 를 기반으로 디자인했습니다.

---

## ✨ 주요 기능

### 💬 대화형 AI 채팅
- **실시간 스트리밍 응답** — Server-Sent Events(SSE) 기반 토큰 단위 스트리밍
- **출처 인용** — 답변 본문의 `{{N}}` 마커를 근거 문서·페이지로 연결, 클릭 시 PDF 뷰어로 이동
- **신뢰도 표시** — 답변별 신뢰도(높음/낮음) 인디케이터
- **Fallback 처리** — 답변 근거가 부족할 때 추천 질문 제시
- **일일 사용 한도** — 사용자별 채팅 횟수 관리, 매일 자정(KST) 자동 초기화

### 📚 자료실
- **카테고리 트리 탐색** — 계층형 카테고리에서 문서 지연 로딩
- **전체 목록 / 검색 / 정렬** — 키워드 검색, 최신순·인기순 정렬, 페이지네이션
- **인기 문서** — 조회수 기반 추천
- **PDF 인앱 뷰어** — `react-pdf` 기반, 인용 페이지로 바로 점프

### ❓ FAQ
- 9개 토픽 분류, 검색·정렬, 도움됨 투표
- FAQ 질문을 즉시 채팅 세션으로 이어가기

### 🛠️ 관리자 대시보드
- **통계** — 총 질문 수, 문서 수, 카테고리별 질문 분포 차트
- **문서 관리** — 업로드, 상태 추적(처리 중/완료/실패), 재처리, 삭제
- **FAQ 관리** — 생성된 FAQ 후보 검토·승인·반려 워크플로
- **사용자 관리** — 채팅 한도 개별/일괄 변경, 사용량 초기화

### 📱 반응형 · 접근성
- 모바일 퍼스트 레이아웃, 사이드바 오버레이
- 키보드 내비게이션, ARIA 레이블, `0` 콘솔 에러 (QA 검증)

---

## 🖼️ 스크린샷

> 아래 이미지는 목업(mock) 데이터 모드(`NEXT_PUBLIC_USE_MOCK=true`)에서 브라우저로 캡처한 화면입니다.

### 로그인 & 온보딩

| 로그인 (온보딩) | 프로필 입력 | 채팅 시작 화면 |
|:---:|:---:|:---:|
| ![로그인](screenshots/01-login.png) | ![프로필 입력](screenshots/01b-login-profile.png) | ![채팅 시작](screenshots/02-chat-welcome.png) |

### 대화형 AI 채팅

| 채팅 세션 (신뢰도·출처) | 출처 인용 펼침 | 채팅 검색 모달 |
|:---:|:---:|:---:|
| ![채팅 세션](screenshots/03-chat-session.png) | ![출처 인용](screenshots/04-chat-sources.png) | ![검색 모달](screenshots/05-search-modal.png) |

| 인라인 출처 클릭 → PDF 뷰어 (근거 페이지로 점프) |
|:---:|
| ![PDF 뷰어](screenshots/04b-pdf-viewer.png) |

### 자료실 & FAQ

| FAQ 목록 | FAQ 답변 펼침 |
|:---:|:---:|
| ![FAQ](screenshots/06-faq.png) | ![FAQ 펼침](screenshots/07-faq-expanded.png) |

| 자료실 | 문서 상세 |
|:---:|:---:|
| ![자료실](screenshots/08-resources.png) | ![문서 상세](screenshots/09-resource-detail.png) |

### 관리자 대시보드

| 통계 | 문서 관리 |
|:---:|:---:|
| ![관리자 통계](screenshots/10-admin-dashboard.png) | ![문서 관리](screenshots/11-admin-documents.png) |

| FAQ 후보 관리 | 사용자 관리 |
|:---:|:---:|
| ![FAQ 관리](screenshots/12-admin-faq.png) | ![사용자 관리](screenshots/12b-admin-users.png) |

### 모바일 반응형

| 채팅 | 사이드바 | FAQ | 자료실 |
|:---:|:---:|:---:|:---:|
| ![모바일 채팅](screenshots/13-mobile-chat.png) | ![모바일 사이드바](screenshots/14-mobile-sidebar.png) | ![모바일 FAQ](screenshots/15-mobile-faq.png) | ![모바일 자료실](screenshots/16-mobile-resources.png) |

<!--
📌 발표 자료(PPT)용 추가 이미지 자리 — 아래는 직접 채워 넣으면 좋은 항목입니다:
  • [필요] 시스템 아키텍처 다이어그램 (Web ↔ Spring Boot ↔ FastAPI/RAG ↔ Vector DB)
  • [필요] RAG 파이프라인 플로우차트 (질문 → 임베딩 → 검색 → LLM → 인용 답변)
  • [필요] 실제 백엔드 연동 데모 GIF (SSE 스트리밍 + 출처 클릭 → PDF 점프) — 백엔드 기동 필요
  • [필요] PDF 뷰어 인용 하이라이트 화면 — 실제 문서 파일 API 연동 후 캡처 가능
  • [선택] 데스크톱 사이드바 전체 펼친 와이드 샷
  • [선택] 다크모드(추가 시) 비교 샷
-->

---

## 🧰 기술 스택

| 영역 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (App Router, React Server Components) |
| **UI 라이브러리** | React 19 |
| **언어** | TypeScript 5 (strict mode) |
| **스타일링** | Tailwind CSS 4 (`@import "tailwindcss"`), shadcn/ui (new-york) |
| **애니메이션** | motion (`motion/react`) |
| **유효성 검증** | Zod 4 |
| **아이콘** | lucide-react |
| **PDF 렌더링** | react-pdf + pdfjs-dist |
| **테스트** | Vitest + Testing Library + fast-check(PBT) + MSW |
| **패키지 매니저** | npm |

---

## 🏗️ 아키텍처

KDD 서비스는 세 개의 독립적인 서버로 구성되며, 이 저장소는 그중 **웹 프론트엔드**입니다.

```text
┌──────────────┐      /api/backend/*      ┌──────────────────┐        ┌───────────────────┐
│   kdd-web    │ ──── (Next rewrites) ──▶ │   Spring Boot    │ ─────▶ │  FastAPI (RAG/AI)  │
│  (이 저장소)  │                          │   (백엔드 API)    │        │   + Vector DB      │
│  Next.js 16  │ ◀───── SSE 스트리밍 ───── │                  │ ◀───── │                    │
└──────────────┘                          └──────────────────┘        └───────────────────┘
```

- **API 프록시**: `next.config.ts`의 `rewrites`가 `/api/backend/*` → 백엔드로 포워딩. 인증 쿠키(`Path=/auth`) 전송을 위해 `/auth/*` 경로는 별도 매핑.
- **인증**: JWT Access Token(메모리 보관) + Refresh Token(HttpOnly Cookie). 만료 5분 전 자동 재발급, 401 시 1회 자동 재시도.
- **스트리밍**: `EventSource`가 POST·헤더를 지원하지 않으므로 `fetch` + `ReadableStream`으로 SSE를 직접 파싱.
- **Mock 모드**: `NEXT_PUBLIC_USE_MOCK=true`이면 백엔드 없이 목업 데이터로 전체 UI 동작 (이 README 스크린샷이 그 예).

### 디렉토리 구조

```text
app/
├─ (auth)/login/        로그인 / 프로필 설정
├─ (main)/              사이드바 레이아웃 (chat, resources, faq, settings)
│  ├─ chat/             채팅 시작 + [id] 세션
│  ├─ resources/        자료실 + [fileId] 문서 상세
│  └─ faq/              FAQ
├─ admin/               관리자 (통계, 문서, FAQ, 사용자)
└─ auth/callback/       OAuth 콜백

components/             기능별 컴포넌트 (chat/, sidebar/, admin/, resources/, ...)
components/ui/          shadcn/ui (CLI 전용 — 직접 수정 금지)
hooks/                  커스텀 훅 (useSSEStream, useChatUsage, useDocuments, ...)
lib/api/                API 클라이언트, 인증, 에러, 도메인별 서비스
lib/                    유틸 (cn, parseCitations), 유효성 검증
constants/              상수 및 mock 데이터
types/                  TypeScript 타입 정의
```

경로 별칭: `@/*` → 프로젝트 루트

---

## 💡 구현 하이라이트

포트폴리오 관점에서 기술적으로 까다로웠던 부분들입니다.

### 1. 견고한 SSE 스트리밍 파서 (`hooks/useSSEStream.ts`)
- `fetch` + `ReadableStream`으로 `text/event-stream`을 직접 디코딩
- **멀티바이트 경계 처리** — 한국어(3바이트) 글자가 청크 경계에서 잘려도 `TextDecoder({ stream: true })` + tail flush로 손실 방지
- **부분 JSON 프레임 방어** — 빈 줄(`\n\n`) 기준으로 프레임을 분리하고, 불완전 프레임은 다음 청크까지 버퍼링
- **terminal 이벤트 race 제거** — `done`/`error`/`fallback` 수신 시 `setEvents`와 `setIsStreaming(false)`를 같은 동기 블록에서 커밋해 마지막 토큰 유실 방지

### 2. 인용 마커 파싱 (`lib/parseCitations.ts`)
- 답변 본문의 `{{N}}` 패턴을 텍스트/마커 세그먼트로 분해
- 스트리밍 중 미완성 마커(`{{`, `{{1`)는 텍스트로 유지, 완료 후 정리
- 범위 밖 인용은 안전하게 무시

### 3. 토큰 수명 관리 (`lib/api/auth.ts`)
- Access Token은 메모리에만 보관 (XSS 노출면 최소화)
- JWT `exp` 디코딩 후 만료 5분 전 자동 재발급 스케줄링
- 동시 다발 401 요청에 대해 단일 refresh Promise 공유로 중복 호출 방지

### 4. 일일 사용 한도 (`hooks/useChatUsage.ts`)
- 다음 자정(KST, UTC+9)까지 정확히 계산해 자동 초기화
- 초기화 실패 시 30초 후 1회 재시도 → 다음 자정 타이머 재설정

---

## 🚀 시작하기

### 사전 요구사항
- Node.js 20+
- npm

### 설치 & 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 값을 채웁니다. (백엔드 없이 둘러보려면 NEXT_PUBLIC_USE_MOCK=true)

# 3. 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 백엔드 없이 둘러보기 (Mock 모드)

```dotenv
# .env
NEXT_PUBLIC_USE_MOCK=true
```

목업 데이터로 모든 화면과 인터랙션(채팅 스트리밍 포함)을 체험할 수 있습니다.

---

## 📜 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint 검사 |
| `npm run lint:fix` | ESLint 자동 수정 |
| `npm run test` | Vitest 테스트 (PBT 포함) |

---

## ✅ 품질

- **TypeScript strict mode** — `any` 금지, 타입 에러 0
- **ESLint** — 경고·에러 0 (`react-hooks`, `next/core-web-vitals`, `typescript` 룰셋)
- **프로덕션 빌드** — 14개 라우트 정상 생성
- **QA 헬스 스코어 88/100** — 9개 페이지, 콘솔 에러 0, 모바일 3개 페이지 검증
- **Property-Based Testing** — fast-check 기반 핵심 로직 검증

---

## 📄 라이선스

이 프로젝트는 [MIT License](../LICENSE) 를 따릅니다.

<div align="center">
<br />
Made with 💙 by <b>KDD (Kookmin Digital Dog)</b>
</div>
