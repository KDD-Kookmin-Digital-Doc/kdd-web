# Tasks

## Task 1: API 타입 정의 및 서비스 레이어 구현

- [x] 1.1 `types/api/usage.ts` 파일 생성 — `ChatUsageResponse` 인터페이스 정의 (dailyLimit, usedToday, remaining, resetAt 필드)
- [x] 1.2 `types/api/admin.ts`에 관리자 사용자 관리 타입 추가 — `AdminUserListRequest`, `AdminUserItem`, `AdminUserListPageResponse`, `UpdateUserChatLimitRequest`, `UpdateUserChatLimitResponse`, `BulkUpdateChatLimitRequest`, `BulkUpdateChatLimitResponse`, `ResetUserUsageResponse`, `DefaultChatLimitResponse`, `UpdateDefaultChatLimitRequest`, `UpdateDefaultChatLimitResponse`
- [x] 1.3 `constants/mock-usage.ts` 파일 생성 — `MOCK_CHAT_USAGE` 데이터 (remaining=15 기본값)
- [x] 1.4 `constants/mock-admin-users.ts` 파일 생성 — 사용자 목록 mock 데이터 (student/staff 혼합, 다양한 한도/사용량)
- [x] 1.5 `lib/api/services/usage.service.ts` 파일 생성 — `getChatUsage()` 함수 구현 (USE_MOCK 분기, apiClient.get 사용, ApiError throw)
- [x] 1.6 `lib/api/services/admin.service.ts`에 관리자 사용자 관리 함수 추가 — `getAdminUsers`, `updateUserChatLimit`, `bulkUpdateChatLimit`, `resetUserUsage`, `getDefaultChatLimit`, `updateDefaultChatLimit` (각각 USE_MOCK 분기 포함)

Requirements: R11 (AC 1-6)

## Task 2: useChatUsage 커스텀 훅 구현

- [x] 2.1 `hooks/useChatUsage.ts` 파일 생성 — `useChatUsage()` 훅 구현: 마운트 시 getChatUsage() 호출, remaining/dailyLimit/usedToday/isLoading/error 상태 관리
- [x] 2.2 `setRemaining(value)` 함수 구현 — SSE done 이벤트 또는 429 에러 시 remaining 직접 갱신
- [x] 2.3 `refresh()` 함수 구현 — getChatUsage() 재호출, 에러 시 이전 값 유지
- [x] 2.4 Reset_Time 타이머 로직 구현 — 다음 자정(KST) 도래 시 자동 refresh(), 실패 시 30초 후 재시도

Requirements: R2 (AC 1, 7), R3 (AC 4, 5)

## Task 3: 채팅방 404 에러 처리

- [x] 3.1 `app/(main)/chat/[id]/page.tsx` 수정 — URL 파라미터 id 검증 로직 추가 (양의 정수가 아니면 notFound 상태, API 호출 없음)
- [x] 3.2 404 SESSION_NOT_FOUND 응답 처리 — getSessionDetail 호출 시 404 에러 감지하여 notFound 상태 설정
- [x] 3.3 5xx/네트워크 오류 처리 — serverError 상태 설정, 재시도 버튼 클릭 시 getSessionDetail 재호출
- [x] 3.4 notFound UI 렌더링 — "존재하지 않는 채팅방입니다" 메시지 + `/chat` 링크, ChatInput 미렌더링
- [x] 3.5 serverError UI 렌더링 — 에러 메시지 + 재시도 버튼, ChatInput 미렌더링

Requirements: R1 (AC 1-4)

## Task 4: UsageBubble 컴포넌트 및 ChatHeader 통합

- [x] 4.1 `components/chat/UsageBubble.tsx` 파일 생성 — remaining prop 기반 "남은 횟수: {N}회" 텍스트 표시, 색상 분기 (0=destructive, 1~5=amber, 6+=muted)
- [x] 4.2 `components/chat/ChatHeader.tsx` 수정 — 우측 영역에 UsageBubble 렌더링 슬롯 추가 (children 또는 prop)
- [x] 4.3 `app/(main)/chat/[id]/page.tsx`에서 useChatUsage 훅 연동 — ChatHeader에 remaining 전달, UsageBubble 표시

Requirements: R2 (AC 1, 4, 5, 6)

## Task 5: SSE done 이벤트 remaining 연동

- [x] 5.1 `hooks/useSSEStream.ts` 수정 — done 이벤트 수신 시 onDone 콜백 호출 지원 (remaining 필드 전달)
- [x] 5.2 `app/(main)/chat/[id]/page.tsx`에서 done 이벤트 처리 — done.remaining 존재 시 useChatUsage.setRemaining() 호출, 미존재 시 기존 값 유지

Requirements: R2 (AC 2, 3), R12 (AC 1-3)

## Task 6: 한도 초과 시 메시지 전송 차단

- [x] 6.1 `components/chat/ChatInput.tsx` 수정 — `placeholder` prop 추가, disabled 시 placeholder 텍스트 표시
- [x] 6.2 `app/(main)/chat/[id]/page.tsx`에서 remaining===0 처리 — ChatInput disabled=true, placeholder에 한도 초과 메시지 설정
- [x] 6.3 429 Rate_Limit_Error 처리 — SSE/메시지 전송 시 429 응답 감지, setRemaining(0) 호출로 즉시 차단 적용
- [x] 6.4 Reset_Time 도래 시 활성화 — refresh() 후 remaining >= 1이면 ChatInput 활성화

Requirements: R3 (AC 1-5), R12 (AC 5, 6)

## Task 7: 설정 페이지 채팅 사용량 섹션

- [x] 7.1 `app/(main)/settings/page.tsx` 수정 — 채팅 사용량 섹션 추가: 로딩 인디케이터, 일일 한도/사용 횟수/남은 횟수/초기화 시간 표시
- [x] 7.2 에러 처리 — API 실패 시 에러 메시지 + 재시도 버튼 표시
- [x] 7.3 한도 소진 강조 — remaining===0일 때 해당 필드 시각적 강조 (destructive 색상)
- [x] 7.4 Reset_Time 표시 — "매일 00:00 (KST)" 형식으로 고정 텍스트 표시

Requirements: R4 (AC 1-6)

## Task 8: 관리자 레이아웃 탭 추가

- [x] 8.1 `app/admin/layout.tsx` 수정 — ADMIN_TABS 배열에 `{ href: "/admin/users", label: "사용자 관리", icon: Users }` 추가 (lucide-react Users 아이콘)
- [x] 8.2 `app/admin/users/page.tsx` 파일 생성 — UsersTab 컴포넌트를 렌더링하는 페이지 라우트

Requirements: R10 (AC 1-3)

## Task 9: 관리자 사용자 목록 및 필터

- [x] 9.1 `components/admin/UsersTab.tsx` 파일 생성 — 메인 컨테이너: DefaultLimitCard + 필터/검색 + UserTable + 페이지네이션 조합
- [x] 9.2 `components/admin/UserTable.tsx` 파일 생성 — 테이블 컴포넌트: 체크박스, 이름, 이메일, 유형, 역할, 한도, 사용량, 액션 버튼 열
- [x] 9.3 필터 구현 — 사용자 유형(student/staff) 드롭다운, 역할(user/admin) 드롭다운, 기본값 전체
- [x] 9.4 검색 구현 — 이름/이메일 검색 입력 필드, 300ms 디바운스 적용
- [x] 9.5 페이지네이션 구현 — page/size 파라미터 관리, 필터/검색 변경 시 page=0 초기화
- [x] 9.6 에러/빈 상태 처리 — API 에러 시 에러 메시지 + 재시도 버튼, 결과 0건 시 안내 메시지

Requirements: R5 (AC 1-9)

## Task 10: 관리자 개별 한도 변경

- [x] 10.1 `components/admin/LimitEditModal.tsx` 파일 생성 — 한도 입력 모달: 숫자 입력, 0~10000 범위 검증, 확인/취소 버튼
- [x] 10.2 UserTable에서 한도 변경 버튼 연동 — 클릭 시 LimitEditModal 열기, 대상 사용자 정보 전달
- [x] 10.3 API 호출 및 결과 처리 — PATCH /admin/users/{id}/chat-limit 호출, 성공 시 테이블 갱신 + 모달 닫기, 실패 시 에러 메시지 + 버튼 재활성화
- [x] 10.4 입력 검증 UI — 유효 범위 벗어날 시 확인 버튼 비활성화 + 검증 오류 메시지 표시

Requirements: R6 (AC 1-6)

## Task 11: 관리자 일괄 한도 변경

- [x] 11.1 `components/admin/BulkLimitModal.tsx` 파일 생성 — 일괄 한도 입력 모달: 0 이상 정수 검증, 선택 인원 표시
- [x] 11.2 UserTable 체크박스 선택 로직 — 다중 선택 상태 관리, 전체 선택/해제
- [x] 11.3 일괄 한도 변경 버튼 상태 — 1명 이상 선택 시 활성화, 0명 또는 500명 초과 시 비활성화 + 안내
- [x] 11.4 API 호출 및 결과 처리 — PATCH /admin/users/chat-limit/bulk 호출, 성공 시 테이블 갱신 + 선택 해제 + 성공 메시지, 실패 시 에러 메시지 5초 표시

Requirements: R7 (AC 1-8)

## Task 12: 관리자 사용량 초기화

- [x] 12.1 `components/admin/ResetUsageDialog.tsx` 파일 생성 — 확인 다이얼로그: 대상 사용자 이름/이메일 표시, 확인/취소 버튼
- [x] 12.2 UserTable에서 초기화 버튼 연동 — 클릭 시 ResetUsageDialog 열기
- [x] 12.3 API 호출 및 결과 처리 — POST /admin/users/{id}/chat-usage/reset 호출, 성공 시 사용 횟수 0으로 갱신 + 다이얼로그 닫기, 실패 시 다이얼로그 닫기 + 토스트 에러 5초

Requirements: R8 (AC 1-5)

## Task 13: 관리자 기본 한도 설정

- [x] 13.1 `components/admin/DefaultLimitCard.tsx` 파일 생성 — 기본 한도 표시 카드: 현재 값 표시, 변경 버튼, 안내 문구
- [x] 13.2 기본 한도 변경 UI — 변경 버튼 클릭 시 인라인 숫자 입력 표시, 0 이상 정수 검증
- [x] 13.3 API 호출 및 결과 처리 — GET으로 초기 로드, PATCH로 변경, 성공 시 값 갱신, 실패 시 에러 메시지 + 기존 값 유지
- [x] 13.4 에러 상태 처리 — GET 실패 시 "기본 한도를 불러올 수 없음" 에러 메시지 표시

Requirements: R9 (AC 1-8)
