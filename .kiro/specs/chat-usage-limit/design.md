# Design Document

## Introduction

이 문서는 채팅 사용량 제한(Chat Usage Limit) 기능의 프론트엔드 기술 설계를 정의한다. 기존 KDD-Web 프로젝트의 아키텍처 패턴(서비스 레이어, 타입 시스템, 컴포넌트 구조, mock 모드)을 준수하며, 12개 요구사항을 구현하기 위한 파일 구조, 데이터 흐름, 컴포넌트 설계를 기술한다.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Pages                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ chat/[id]    │  │ settings     │  │ admin/users           │ │
│  │  page.tsx    │  │  page.tsx    │  │  page.tsx             │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
├─────────┼──────────────────┼──────────────────────┼─────────────┤
│  Components                                                     │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────────┴───────────┐ │
│  │ UsageBubble  │  │ ChatUsage    │  │ UsersTab              │ │
│  │ ChatInput*   │  │ Section      │  │  ├─ UserTable         │ │
│  │ ChatHeader*  │  │              │  │  ├─ LimitEditModal    │ │
│  └──────┬───────┘  └──────┬───────┘  │  ├─ BulkLimitModal   │ │
│         │                  │          │  ├─ ResetDialog       │ │
│         │                  │          │  └─ DefaultLimitCard  │ │
│         │                  │          └───────────┬───────────┘ │
├─────────┼──────────────────┼──────────────────────┼─────────────┤
│  Hooks                                                          │
│  ┌──────┴──────────────────┴──────────────────────┘             │
│  │ useChatUsage (shared state hook)                             │
│  └──────┬───────────────────────────────────────────            │
├─────────┼───────────────────────────────────────────────────────┤
│  Services                                                       │
│  ┌──────┴───────┐  ┌──────────────┐                            │
│  │ usage.service│  │ admin.service│                             │
│  └──────┬───────┘  └──────┬───────┘                            │
├─────────┼──────────────────┼────────────────────────────────────┤
│  Types                                                          │
│  ┌──────┴──────────────────┴───────┐                            │
│  │ types/api/usage.ts              │                            │
│  │ types/api/admin.ts (확장)       │                            │
│  └─────────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## New Files

| 파일 경로 | 목적 |
|-----------|------|
| `types/api/usage.ts` | 채팅 사용량 API 요청/응답 타입 정의 |
| `lib/api/services/usage.service.ts` | GET /users/me/chat-usage 서비스 함수 |
| `constants/mock-usage.ts` | 사용량 mock 데이터 |
| `hooks/useChatUsage.ts` | 채팅 사용량 상태 관리 커스텀 훅 |
| `components/chat/UsageBubble.tsx` | 남은 횟수 버블 UI 컴포넌트 |
| `components/admin/UsersTab.tsx` | 관리자 사용자 관리 탭 메인 컴포넌트 |
| `components/admin/UserTable.tsx` | 사용자 목록 테이블 |
| `components/admin/LimitEditModal.tsx` | 개별 한도 변경 모달 |
| `components/admin/BulkLimitModal.tsx` | 일괄 한도 변경 모달 |
| `components/admin/ResetUsageDialog.tsx` | 사용량 초기화 확인 다이얼로그 |
| `components/admin/DefaultLimitCard.tsx` | 기본 한도 설정 카드 |
| `app/admin/users/page.tsx` | 관리자 사용자 관리 페이지 라우트 |
| `constants/mock-admin-users.ts` | 관리자 사용자 관리 mock 데이터 |

## Modified Files

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `types/api/admin.ts` | 관리자 사용자 관리 관련 타입 추가 |
| `lib/api/services/admin.service.ts` | 관리자 사용자/한도 관리 API 함수 추가 |
| `app/(main)/chat/[id]/page.tsx` | 404 에러 처리, UsageBubble 통합, 한도 초과 차단 로직 |
| `components/chat/ChatInput.tsx` | placeholder prop 추가, 한도 초과 시 비활성화 메시지 |
| `components/chat/ChatHeader.tsx` | UsageBubble 배치를 위한 슬롯 추가 |
| `app/(main)/settings/page.tsx` | 채팅 사용량 섹션 추가 |
| `app/admin/layout.tsx` | ADMIN_TABS에 사용자 관리 탭 추가 |
| `hooks/useSSEStream.ts` | done 이벤트의 remaining 필드 콜백 지원 |

## Type Definitions

### `types/api/usage.ts`

```typescript
/** GET /users/me/chat-usage 응답 */
export interface ChatUsageResponse {
  dailyLimit: number;       // 일일 한도
  usedToday: number;        // 오늘 사용 횟수
  remaining: number;        // 남은 횟수
  resetAt: string;          // ISO 8601 (다음 초기화 시각)
}
```

### `types/api/admin.ts` (추가 타입)

```typescript
/** GET /admin/users 요청 파라미터 */
export interface AdminUserListRequest {
  page?: number;
  size?: number;
  userType?: 'student' | 'staff';
  role?: 'user' | 'admin';
  search?: string;
}

/** GET /admin/users 응답 내 사용자 항목 */
export interface AdminUserItem {
  userId: number;
  name: string;
  email: string;
  userType: 'student' | 'staff';
  role: 'user' | 'admin';
  dailyChatLimit: number;
  usedToday: number;
}

/** GET /admin/users 페이지 응답 */
export type AdminUserListPageResponse = PageResponse<AdminUserItem>;

/** PATCH /admin/users/{id}/chat-limit 요청 */
export interface UpdateUserChatLimitRequest {
  dailyChatLimit: number;
}

/** PATCH /admin/users/{id}/chat-limit 응답 */
export interface UpdateUserChatLimitResponse {
  userId: number;
  dailyChatLimit: number;
}

/** PATCH /admin/users/chat-limit/bulk 요청 */
export interface BulkUpdateChatLimitRequest {
  userIds: number[];
  dailyChatLimit: number;
}

/** PATCH /admin/users/chat-limit/bulk 응답 */
export interface BulkUpdateChatLimitResponse {
  updatedCount: number;
  dailyChatLimit: number;
}

/** POST /admin/users/{id}/chat-usage/reset 응답 */
export interface ResetUserUsageResponse {
  userId: number;
  usedToday: number;
}

/** GET /admin/settings/default-chat-limit 응답 */
export interface DefaultChatLimitResponse {
  defaultDailyChatLimit: number;
}

/** PATCH /admin/settings/default-chat-limit 요청 */
export interface UpdateDefaultChatLimitRequest {
  defaultDailyChatLimit: number;
}

/** PATCH /admin/settings/default-chat-limit 응답 */
export interface UpdateDefaultChatLimitResponse {
  defaultDailyChatLimit: number;
}
```

## Component Design

### UsageBubble

```
┌─────────────────────────────┐
│  남은 횟수: 15회            │  ← 기본 (remaining > 5)
└─────────────────────────────┘

┌─────────────────────────────┐
│  ⚠️ 남은 횟수: 3회          │  ← 경고 (1~5, amber 색상)
└─────────────────────────────┘

┌─────────────────────────────┐
│  🚫 남은 횟수: 0회          │  ← 위험 (0, red 색상)
└─────────────────────────────┘
```

- 위치: ChatHeader 우측 영역
- Props: `remaining: number`
- 색상 로직: `remaining === 0` → destructive, `remaining <= 5` → warning, else → muted

### ChatInput 변경

기존 `disabled` prop에 더해 `placeholder` prop을 활용:
- `remaining === 0`일 때: `disabled={true}`, `placeholder="오늘의 채팅 횟수를 모두 사용했습니다. 내일 00:00(KST)에 초기화됩니다."`

### Chat Room Page 404 처리

```
┌─────────────────────────────────────────┐
│  ChatHeader                             │
├─────────────────────────────────────────┤
│                                         │
│     ┌───────────────────────────┐       │
│     │  존재하지 않는 채팅방입니다  │       │
│     │                           │       │
│     │  [채팅 목록으로 이동]      │       │
│     └───────────────────────────┘       │
│                                         │
│  (ChatInput 렌더링 안 함)               │
└─────────────────────────────────────────┘
```

상태 분기:
- `notFound`: 404 또는 유효하지 않은 ID → 에러 UI + 목록 링크
- `serverError`: 5xx/네트워크 오류 → 에러 메시지 + 재시도 버튼
- `loaded`: 정상 → 기존 채팅 UI

### Admin Users Page 구조

```
┌─────────────────────────────────────────────────────────────┐
│  DefaultLimitCard                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 기본 한도: 30회/일  [변경]                           │   │
│  │ ※ 기본 한도 변경은 기존 사용자에게 영향을 주지 않습니다 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Filters & Search                                           │
│  [유형 ▼] [역할 ▼] [🔍 이름/이메일 검색...]               │
│                                                             │
│  [일괄 한도 변경] (선택 시 활성화)                           │
├─────────────────────────────────────────────────────────────┤
│  UserTable                                                  │
│  ┌───┬──────┬────────────┬──────┬──────┬──────┬──────┬───┐ │
│  │ ☐ │ 이름 │ 이메일     │ 유형 │ 역할 │ 한도 │ 사용 │ … │ │
│  ├───┼──────┼────────────┼──────┼──────┼──────┼──────┼───┤ │
│  │ ☐ │ 홍길동│hong@k.ac.kr│학생  │user │ 30  │  12  │ … │ │
│  └───┴──────┴────────────┴──────┴──────┴──────┴──────┴───┘ │
│                                                             │
│  Pagination: [< 1 2 3 ... 10 >]                            │
└─────────────────────────────────────────────────────────────┘
```

## Hook Design

### `useChatUsage`

```typescript
interface UseChatUsageReturn {
  remaining: number | null;
  dailyLimit: number | null;
  usedToday: number | null;
  isLoading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  setRemaining: (value: number) => void;
}

function useChatUsage(): UseChatUsageReturn;
```

- 마운트 시 `getChatUsage()` 호출
- `setRemaining`: SSE done 이벤트 또는 429 에러 시 직접 갱신
- `refresh`: Reset_Time 도래 시 또는 수동 재조회
- 에러 시 이전 값 유지 (graceful degradation)

## Service Design

### `usage.service.ts`

```typescript
export async function getChatUsage(): Promise<ChatUsageResponse> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_CHAT_USAGE;
  }
  return apiClient.get<ChatUsageResponse>('/users/me/chat-usage');
}
```

### `admin.service.ts` (추가 함수)

```typescript
export async function getAdminUsers(params?: AdminUserListRequest): Promise<AdminUserListPageResponse>;
export async function updateUserChatLimit(userId: number, req: UpdateUserChatLimitRequest): Promise<UpdateUserChatLimitResponse>;
export async function bulkUpdateChatLimit(req: BulkUpdateChatLimitRequest): Promise<BulkUpdateChatLimitResponse>;
export async function resetUserUsage(userId: number): Promise<ResetUserUsageResponse>;
export async function getDefaultChatLimit(): Promise<DefaultChatLimitResponse>;
export async function updateDefaultChatLimit(req: UpdateDefaultChatLimitRequest): Promise<UpdateDefaultChatLimitResponse>;
```

## Data Flow

### 채팅방 사용량 갱신 흐름

```
1. 페이지 로드 → useChatUsage.refresh() → GET /users/me/chat-usage
2. 메시지 전송 → SSE 스트리밍 시작
3. SSE done 이벤트 수신 → done.remaining 존재 시 → setRemaining(done.remaining)
4. 429 에러 수신 → setRemaining(0) → 입력 비활성화
5. Reset_Time 도래 (타이머) → refresh() → 갱신된 remaining으로 UI 업데이트
```

### Reset_Time 타이머 로직

```typescript
// 다음 자정(KST) 까지 남은 ms 계산
const now = new Date();
const kstMidnight = new Date();
kstMidnight.setHours(24, 0, 0, 0); // 다음 날 00:00 로컬 시간
// 서버가 KST 기준이므로 클라이언트 로컬 시간 기준 자정 사용
const msUntilReset = kstMidnight.getTime() - now.getTime();

setTimeout(() => refresh(), msUntilReset);
```

### 404 에러 처리 흐름

```
1. URL 파라미터 id 파싱
2. 양의 정수가 아님 → notFound 상태 (API 호출 없음)
3. 양의 정수 → getSessionDetail(id) 호출
4. 404 응답 → notFound 상태
5. 5xx/네트워크 오류 → serverError 상태 (재시도 가능)
6. 200 → loaded 상태 (정상 채팅 UI)
```

## Error Handling Strategy

| 시나리오 | 처리 방식 |
|----------|-----------|
| GET /users/me/chat-usage 실패 | 이전 remaining 유지, 다음 done 이벤트에서 갱신 |
| 429 RATE_LIMIT_EXCEEDED | remaining=0 설정, 입력 비활성화, placeholder 메시지 |
| GET /chat/sessions/{id} 404 | notFound UI 표시, ChatInput 미렌더링 |
| GET /chat/sessions/{id} 5xx | serverError UI + 재시도 버튼 |
| 유효하지 않은 세션 ID | API 호출 없이 notFound UI |
| Reset_Time 갱신 실패 | 차단 유지, 30초 후 재시도 |
| Admin API 에러 | 인라인 에러 메시지 또는 토스트 (5초) |

## Validation Rules

### 개별 한도 변경
- 0 이상 10000 이하의 정수
- 클라이언트 검증: `Number.isInteger(value) && value >= 0 && value <= 10000`
- 유효하지 않으면 확인 버튼 비활성화 + 안내 메시지

### 일괄 한도 변경
- 한도 값: 0 이상의 정수
- 선택 인원: 1명 이상 500명 이하
- 500명 초과 시 버튼 비활성화 + 안내 메시지

### 기본 한도 변경
- 0 이상의 정수
- 유효하지 않으면 API 호출 차단 + 안내 메시지

### 세션 ID 검증
- `Number.isInteger(Number(id)) && Number(id) > 0`
- 문자열, 음수, 소수, 0 → 유효하지 않음

## Styling Conventions

기존 프로젝트 패턴 준수:
- Tailwind CSS utility classes
- `cn()` 유틸리티로 조건부 클래스 결합
- 색상: `text-primary`, `text-destructive`, `text-amber-600` (경고)
- 배지: `bg-destructive/10 text-destructive` (위험), `bg-amber-50 text-amber-700` (경고)
- 테이블: `components/ui/table.tsx` 기반
- 모달: `components/ui/dialog.tsx` 기반
- 버튼: `components/ui/button.tsx` 기반
- 입력: `components/ui/input.tsx` 기반

## Testing Considerations

- Mock 모드에서 모든 UI 상태 확인 가능하도록 mock 데이터 구성
- remaining=0, remaining=3, remaining=30 등 다양한 시나리오 mock 제공
- 429 에러 시뮬레이션을 위한 mock 분기 고려
