# Requirements Document

## Introduction

채팅 사용량 제한(Chat Usage Limit) 기능은 KDD-Web 프론트엔드에서 사용자별 일일 채팅 횟수를 관리하고 표시하는 시스템이다. 사용자에게 남은 채팅 횟수를 실시간으로 보여주고, 한도 초과 시 메시지 전송을 차단하며, 관리자가 사용자별 한도를 관리할 수 있는 UI를 제공한다. 또한 존재하지 않는 채팅방 접근 시 적절한 에러 처리를 포함한다.

## Glossary

- **Chat_Room_Page**: `/chat/[id]` 경로의 채팅 세션 상세 페이지 컴포넌트
- **Usage_Bubble**: 채팅방 상단 우측에 표시되는 남은 채팅 횟수 UI 요소
- **Chat_Input**: 사용자가 메시지를 입력하고 전송하는 하단 입력 컴포넌트
- **Settings_Page**: `/settings` 경로의 사용자 설정 페이지
- **Admin_Users_Page**: `/admin/users` 경로의 관리자 사용자 관리 페이지
- **Admin_Layout**: `/admin` 경로 하위의 관리자 레이아웃 컴포넌트
- **Usage_Service**: `lib/api/services/` 내 채팅 사용량 관련 API 호출 함수 모듈
- **Admin_Service**: `lib/api/services/admin.service.ts` 내 관리자 API 호출 함수 모듈
- **SSE_Stream_Hook**: `hooks/useSSEStream.ts`의 SSE 스트리밍 커스텀 훅
- **Daily_Limit**: 사용자별 일일 채팅 메시지 전송 허용 횟수
- **Remaining_Count**: 현재 남은 일일 채팅 가능 횟수
- **Reset_Time**: 일일 사용량이 초기화되는 시각 (매일 자정 KST, 00:00:00 KST)
- **Rate_Limit_Error**: HTTP 429 상태코드와 `RATE_LIMIT_EXCEEDED` 에러 코드를 포함하는 API 응답

## Requirements

### Requirement 1: 존재하지 않는 채팅방 접근 시 404 에러 표시

**User Story:** As a 사용자, I want 존재하지 않는 채팅방에 접근했을 때 명확한 에러 메시지를 보고 싶다, so that 잘못된 URL로 접근했음을 인지하고 올바른 페이지로 이동할 수 있다.

#### Acceptance Criteria

1. WHEN Chat_Room_Page가 세션 상세 조회 API(GET /chat/sessions/{sessionId})에서 404 SESSION_NOT_FOUND 응답을 수신하면, THE Chat_Room_Page SHALL 채팅 UI(메시지 목록, 입력창, 환영 메시지) 대신 "존재하지 않는 채팅방입니다" 에러 메시지와 채팅 목록 페이지(/chat)로 이동하는 링크를 표시한다
2. WHILE Chat_Room_Page가 404 에러 상태인 동안, THE Chat_Input SHALL 렌더링되지 않아 메시지 전송을 차단한다
3. IF Chat_Room_Page의 URL 경로 파라미터(id)가 양의 정수로 파싱할 수 없는 값(문자열, 음수, 소수, 0 포함)이면, THEN THE Chat_Room_Page SHALL API 호출 없이 동일한 404 에러 상태를 표시한다
4. IF Chat_Room_Page가 세션 상세 조회 API 호출 중 네트워크 오류 또는 5xx 응답을 수신하면, THEN THE Chat_Room_Page SHALL 에러가 발생했음을 나타내는 메시지와 재시도 버튼을 표시한다

### Requirement 2: 채팅방 내 남은 횟수 버블 표시

**User Story:** As a 사용자, I want 채팅방에서 남은 채팅 횟수를 실시간으로 확인하고 싶다, so that 한도를 초과하기 전에 남은 횟수를 인지할 수 있다.

#### Acceptance Criteria

1. WHEN Chat_Room_Page가 로드되면, THE Usage_Bubble SHALL GET /users/me/chat-usage API를 호출하여 응답의 remaining 값을 Remaining_Count로 채팅방 상단 우측 영역에 표시한다
2. WHEN SSE_Stream_Hook이 done 이벤트를 수신하면, THE Usage_Bubble SHALL done 이벤트의 remaining 필드 값으로 Remaining_Count를 즉시 갱신한다
3. IF done 이벤트에 remaining 필드가 존재하지 않으면, THEN THE Usage_Bubble SHALL 기존 Remaining_Count를 유지하고 별도의 갱신을 수행하지 않는다
4. WHILE Remaining_Count가 1 이상 5 이하인 동안, THE Usage_Bubble SHALL 경고 색상으로 시각적 강조를 표시한다
5. WHILE Remaining_Count가 0인 동안, THE Usage_Bubble SHALL 위험 색상으로 시각적 강조를 표시하고 한도 소진 상태임을 나타낸다
6. THE Usage_Bubble SHALL "남은 횟수: {Remaining_Count}회" 형식으로 텍스트를 표시한다
7. IF GET /users/me/chat-usage API 호출이 실패하면, THEN THE Usage_Bubble SHALL 이전에 표시된 Remaining_Count를 유지하며, 다음 done 이벤트 수신 시 갱신을 재시도한다

### Requirement 3: 한도 초과 시 메시지 전송 차단

**User Story:** As a 사용자, I want 한도를 초과했을 때 명확한 안내를 받고 싶다, so that 왜 메시지를 보낼 수 없는지 이해하고 언제 다시 사용할 수 있는지 알 수 있다.

#### Acceptance Criteria

1. WHILE Remaining_Count가 0인 동안, THE Chat_Input SHALL 입력 필드를 비활성화하고 전송 버튼을 비활성화한다
2. WHILE Remaining_Count가 0인 동안, THE Chat_Input SHALL "오늘의 채팅 횟수를 모두 사용했습니다. 내일 00:00(KST)에 초기화됩니다." 메시지를 입력 영역에 placeholder로 표시한다
3. WHEN 메시지 전송 API가 429 Rate_Limit_Error를 반환하면, THE Chat_Room_Page SHALL Remaining_Count를 0으로 갱신하고 입력 필드 비활성화 및 전송 버튼 비활성화와 차단 안내 메시지 표시를 동일 렌더 사이클 내에 적용한다
4. WHEN Reset_Time이 도래하면, THE Chat_Room_Page SHALL GET /users/me/chat-usage API를 재호출하여 Remaining_Count를 갱신하고, 갱신된 Remaining_Count가 1 이상이면 입력 필드와 전송 버튼을 활성화한다
5. IF Reset_Time 도래 시 GET /users/me/chat-usage API 호출이 실패하면, THEN THE Chat_Room_Page SHALL 차단 상태를 유지하고 30초 후 API를 재호출한다

### Requirement 4: 설정 페이지에 채팅 사용량 정보 표시

**User Story:** As a 사용자, I want 설정 페이지에서 나의 채팅 사용량 현황을 한눈에 확인하고 싶다, so that 일일 한도와 현재 사용량을 파악할 수 있다.

#### Acceptance Criteria

1. WHEN Settings_Page가 로드되면, THE Settings_Page SHALL GET /users/me/chat-usage API를 호출하여 채팅 사용량 섹션을 표시하되, API 응답을 수신하기 전까지 해당 섹션에 로딩 인디케이터를 표시한다
2. THE Settings_Page SHALL 일일 한도(Daily_Limit), 오늘 사용 횟수, Remaining_Count, 다음 Reset_Time을 각각 레이블과 값이 구분된 별도 필드로 표시한다
3. THE Settings_Page SHALL Reset_Time을 "매일 00:00 (KST)" 형식으로 표시한다
4. IF GET /users/me/chat-usage API 호출이 실패하면, THEN THE Settings_Page SHALL 해당 섹션에 사용량 정보를 불러올 수 없음을 나타내는 에러 메시지와 함께 재시도 버튼을 표시한다
5. WHEN 사용자가 재시도 버튼을 클릭하면, THE Settings_Page SHALL GET /users/me/chat-usage API를 다시 호출하여 사용량 정보 로드를 재시도한다
6. IF Remaining_Count가 0이면, THEN THE Settings_Page SHALL Remaining_Count 필드를 시각적으로 강조하여 한도 소진 상태임을 표시한다

### Requirement 5: 관리자 사용자 관리 페이지 — 사용자 목록 및 필터

**User Story:** As a 관리자, I want 전체 사용자 목록을 필터링하여 조회하고 싶다, so that 특정 사용자의 채팅 한도와 사용량을 빠르게 확인할 수 있다.

#### Acceptance Criteria

1. WHEN Admin_Users_Page가 로드되면, THE Admin_Users_Page SHALL GET /admin/users API를 page=0, size=20 기본 파라미터로 호출하여 사용자 목록을 테이블 형태로 표시하고, 응답의 totalCount, page, totalPages 정보를 기반으로 페이지네이션 컨트롤을 함께 표시한다
2. THE Admin_Users_Page SHALL 각 사용자 행에 이름, 이메일, 사용자 유형(student/staff), 역할(user/admin), Daily_Limit, 오늘 사용 횟수를 표시한다
3. THE Admin_Users_Page SHALL 사용자 유형(student/staff) 필터 드롭다운을 제공하며, 기본값은 전체(필터 미적용) 상태이다
4. THE Admin_Users_Page SHALL 역할(user/admin) 필터 드롭다운을 제공하며, 기본값은 전체(필터 미적용) 상태이다
5. THE Admin_Users_Page SHALL 이름 또는 이메일로 검색할 수 있는 검색 입력 필드를 제공하며, 사용자가 입력을 멈춘 후 300ms 경과 시 검색을 실행한다
6. WHEN 필터 또는 검색 조건이 변경되면, THE Admin_Users_Page SHALL 해당 조건을 쿼리 파라미터로 포함하고 page를 0으로 초기화하여 GET /admin/users API를 재호출하고 목록을 갱신한다
7. WHEN 페이지네이션 컨트롤에서 페이지를 변경하면, THE Admin_Users_Page SHALL 현재 필터/검색 조건을 유지한 채 해당 page 값으로 GET /admin/users API를 재호출하고 목록을 갱신한다
8. IF GET /admin/users API 호출이 에러를 반환하면, THEN THE Admin_Users_Page SHALL 테이블 영역에 에러 메시지와 재시도 버튼을 표시한다
9. WHEN 현재 필터/검색 조건에 일치하는 사용자가 0명이면, THE Admin_Users_Page SHALL 테이블 대신 결과 없음 안내 메시지를 표시한다

### Requirement 6: 관리자 사용자 관리 페이지 — 개별 한도 변경

**User Story:** As a 관리자, I want 특정 사용자의 일일 채팅 한도를 변경하고 싶다, so that 사용자별로 적절한 한도를 설정할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 사용자 행의 한도 변경 버튼을 클릭하면, THE Admin_Users_Page SHALL 새로운 한도 값을 입력할 수 있는 인라인 편집 UI 또는 모달을 표시한다
2. WHEN 관리자가 새로운 한도 값을 확인하면, THE Admin_Users_Page SHALL 확인 버튼을 비활성화하고 PATCH /admin/users/{id}/chat-limit API를 호출하여 해당 사용자의 한도를 변경한다
3. WHEN PATCH /admin/users/{id}/chat-limit API가 성공 응답을 반환하면, THE Admin_Users_Page SHALL 해당 사용자 행의 Daily_Limit 값을 응답 데이터 기준으로 1초 이내에 갱신하고 편집 UI를 닫는다
4. IF PATCH /admin/users/{id}/chat-limit API가 에러를 반환하면, THEN THE Admin_Users_Page SHALL 에러 원인을 나타내는 메시지를 토스트 또는 인라인으로 표시하고, 확인 버튼을 다시 활성화하여 재시도할 수 있도록 한다
5. THE Admin_Users_Page SHALL 한도 입력값이 0 이상 10000 이하의 정수인지 클라이언트 측에서 검증하고, 유효하지 않은 경우 확인 버튼을 비활성화한다
6. IF 한도 입력값이 유효 범위(0 이상 10000 이하의 정수)를 벗어나면, THEN THE Admin_Users_Page SHALL 입력 필드 하단에 유효 범위를 안내하는 검증 오류 메시지를 표시한다

### Requirement 7: 관리자 사용자 관리 페이지 — 일괄 한도 변경

**User Story:** As a 관리자, I want 여러 사용자의 한도를 한 번에 변경하고 싶다, so that 대량의 사용자 한도를 효율적으로 관리할 수 있다.

#### Acceptance Criteria

1. THE Admin_Users_Page SHALL 각 사용자 행에 체크박스를 제공하여 다중 선택을 지원한다
2. IF 1명 이상의 사용자가 선택된 상태이면, THEN THE Admin_Users_Page SHALL 일괄 한도 변경 버튼을 활성화하고, 선택된 사용자가 0명이면 버튼을 비활성화한다
3. WHEN 관리자가 일괄 한도 변경 버튼을 클릭하면, THE Admin_Users_Page SHALL 새로운 한도 값을 입력할 수 있는 모달을 표시하며, 입력 필드는 0 이상의 정수만 허용한다
4. IF 관리자가 모달에서 0 미만의 값 또는 정수가 아닌 값을 입력하면, THEN THE Admin_Users_Page SHALL 확인 버튼을 비활성화하고 입력값이 유효하지 않음을 표시한다
5. WHEN 관리자가 유효한 일괄 한도 값을 확인하면, THE Admin_Users_Page SHALL PATCH /admin/users/chat-limit/bulk API를 선택된 사용자 ID 목록(최대 500명)과 새 한도 값으로 호출한다
6. WHEN PATCH /admin/users/chat-limit/bulk API가 성공 응답을 반환하면, THE Admin_Users_Page SHALL 선택된 사용자들의 Daily_Limit 값을 응답의 dailyChatLimit 값으로 갱신하고, 체크박스 선택을 해제하고, 성공 메시지를 표시한다
7. IF PATCH /admin/users/chat-limit/bulk API가 에러를 반환하면, THEN THE Admin_Users_Page SHALL 에러 메시지를 5초간 표시하고, 기존 선택 상태와 한도 값을 유지한다
8. IF 선택된 사용자 수가 500명을 초과하면, THEN THE Admin_Users_Page SHALL 일괄 한도 변경 버튼을 비활성화하고 최대 선택 가능 인원 초과를 안내한다

### Requirement 8: 관리자 사용자 관리 페이지 — 사용량 초기화

**User Story:** As a 관리자, I want 특정 사용자의 오늘 사용량을 초기화하고 싶다, so that 특수한 상황에서 사용자가 추가로 채팅할 수 있도록 허용할 수 있다.

#### Acceptance Criteria

1. WHEN 관리자가 사용자 행의 사용량 초기화 버튼을 클릭하면, THE Admin_Users_Page SHALL 대상 사용자의 이름과 이메일을 포함한 확인 다이얼로그를 표시한다
2. WHEN 관리자가 확인 다이얼로그에서 취소를 선택하면, THE Admin_Users_Page SHALL 다이얼로그를 닫고 어떠한 API 호출도 수행하지 않는다
3. WHEN 관리자가 확인 다이얼로그에서 확인을 선택하면, THE Admin_Users_Page SHALL POST /admin/users/{id}/chat-usage/reset API를 호출하고, API 응답을 수신할 때까지 확인 버튼을 비활성화한다
4. WHEN POST /admin/users/{id}/chat-usage/reset API가 성공 응답을 반환하면, THE Admin_Users_Page SHALL 해당 사용자 행의 오늘 사용 횟수를 0으로 갱신하고 다이얼로그를 닫는다
5. IF POST /admin/users/{id}/chat-usage/reset API가 에러를 반환하면, THEN THE Admin_Users_Page SHALL 다이얼로그를 닫고 에러 원인을 나타내는 메시지를 토스트로 5초간 표시한다

### Requirement 9: 관리자 기본 한도 설정 관리

**User Story:** As a 관리자, I want 신규 사용자에게 적용되는 기본 일일 한도를 조회하고 변경하고 싶다, so that 새로 가입하는 사용자들의 초기 한도를 통제할 수 있다.

#### Acceptance Criteria

1. WHEN Admin_Users_Page가 로드되면, THE Admin_Users_Page SHALL GET /admin/settings/default-chat-limit API를 호출하여 현재 기본 한도 값을 페이지 상단에 표시한다
2. WHEN 관리자가 기본 한도 변경 버튼을 클릭하면, THE Admin_Users_Page SHALL 새로운 기본 한도 값을 입력할 수 있는 숫자 입력 필드를 표시한다
3. WHEN 관리자가 새로운 기본 한도 값을 확인하면, THE Admin_Users_Page SHALL 입력값이 0 이상의 정수인지 검증한 후 PATCH /admin/settings/default-chat-limit API를 호출한다
4. WHEN PATCH /admin/settings/default-chat-limit API가 성공 응답을 반환하면, THE Admin_Users_Page SHALL 표시된 기본 한도 값을 응답에 포함된 값으로 갱신한다
5. THE Admin_Users_Page SHALL 기본 한도 영역에 "기본 한도 변경은 기존 사용자에게 영향을 주지 않습니다" 안내 문구를 표시한다
6. IF PATCH /admin/settings/default-chat-limit API가 에러를 반환하면, THEN THE Admin_Users_Page SHALL 변경 실패를 나타내는 에러 메시지를 표시하고 기존 한도 값을 유지한다
7. IF 관리자가 0 미만의 값 또는 정수가 아닌 값을 입력하면, THEN THE Admin_Users_Page SHALL API를 호출하지 않고 입력값이 유효하지 않음을 나타내는 안내 메시지를 표시한다
8. IF GET /admin/settings/default-chat-limit API가 에러를 반환하면, THEN THE Admin_Users_Page SHALL 기본 한도를 불러올 수 없음을 나타내는 에러 메시지를 표시한다

### Requirement 10: 관리자 탭 네비게이션에 사용자 관리 추가

**User Story:** As a 관리자, I want 관리자 대시보드에서 사용자 관리 탭으로 이동하고 싶다, so that 기존 관리 기능과 동일한 네비게이션 패턴으로 접근할 수 있다.

#### Acceptance Criteria

1. THE Admin_Layout SHALL 기존 탭(통계, 문서 관리, FAQ 관리) 다음 위치에 "사용자 관리" 탭을 추가하며, 기존 탭과 동일한 스타일(아이콘 + 레이블, border-b-2 활성 표시)을 적용한다
2. WHEN 관리자가 "사용자 관리" 탭을 클릭하면, THE Admin_Layout SHALL `/admin/users` 경로로 네비게이션한다
3. WHILE 현재 경로가 `/admin/users`로 시작하는 동안, THE Admin_Layout SHALL "사용자 관리" 탭을 활성 상태(border-primary, font-semibold, text-primary)로 표시한다

### Requirement 11: 채팅 사용량 API 서비스 통합

**User Story:** As a 개발자, I want 채팅 사용량 관련 API 호출을 일관된 패턴으로 구현하고 싶다, so that 기존 프로젝트 구조와 동일한 방식으로 유지보수할 수 있다.

#### Acceptance Criteria

1. THE Usage_Service SHALL `apiClient.get<T>()` 메서드를 사용하여 GET /users/me/chat-usage 엔드포인트를 호출하고 `types/api/`에 정의된 응답 타입으로 결과를 반환하는 함수를 제공한다
2. THE Admin_Service SHALL 다음 각 엔드포인트에 대해 개별 함수를 제공한다: GET /admin/users, PATCH /admin/users/{id}/chat-limit, PATCH /admin/users/chat-limit/bulk, POST /admin/users/{id}/chat-usage/reset, GET /admin/settings/default-chat-limit, PATCH /admin/settings/default-chat-limit
3. THE Usage_Service SHALL 기존 `apiClient` 인스턴스(baseUrl: `/api/backend`)를 사용하여 API를 호출하며, URL을 직접 조립하지 않는다
4. THE Usage_Service와 Admin_Service SHALL `types/api/` 디렉토리에 정의된 요청/응답 타입을 함수 시그니처에 사용하며, 인라인 타입 정의를 사용하지 않는다
5. IF `NEXT_PUBLIC_USE_MOCK` 환경변수가 `'true'`이면, THEN THE Usage_Service와 Admin_Service SHALL `delay()` 유틸리티를 사용하여 200~500ms 지연 후 응답 타입에 부합하는 mock 데이터를 반환한다
6. IF API 호출이 실패하면, THEN THE Usage_Service와 Admin_Service SHALL `ApiError`를 throw하며, 에러를 무시하거나 빈 catch 블록을 사용하지 않는다

### Requirement 12: 채팅 횟수 카운팅 규칙 적용

**User Story:** As a 사용자, I want 채팅 횟수가 공정하게 카운팅되길 원한다, so that 예측 가능한 방식으로 한도를 관리할 수 있다.

#### Acceptance Criteria

1. WHEN 사용자가 메시지를 전송하여 서버가 정상적으로 수신하면(SSE 스트리밍 시작), THE Chat_Room_Page SHALL 해당 메시지를 1회의 사용으로 카운팅한다 (응답 길이, 모델, 토큰 수와 무관)
2. WHEN 사용자가 첨부 파일과 함께 메시지를 전송하면, THE Chat_Room_Page SHALL 첨부 파일 수와 관계없이 1회의 사용으로 카운팅한다
3. WHEN 사용자가 멀티턴 후속 메시지를 전송하면, THE Chat_Room_Page SHALL 각 메시지를 독립적으로 1회의 사용으로 카운팅한다 (동일 세션 내 이전 메시지 수와 무관)
4. WHEN FAQ 기반 채팅에서 자동 생성된 초기 메시지(FAQ 질문 및 답변)가 세션에 포함되면, THE Chat_Room_Page SHALL 해당 초기 메시지를 사용 횟수에 포함하지 않는다
5. IF 메시지 전송 시 서버가 RATE_LIMIT_EXCEEDED(429) 에러를 반환하면, THEN THE Chat_Room_Page SHALL 메시지 전송을 차단하고 횟수 제한 초과를 알리는 에러 메시지를 표시한다
6. IF 메시지 전송이 네트워크 오류 또는 서버 오류로 실패하면, THEN THE Chat_Room_Page SHALL 해당 메시지를 사용 횟수에 카운팅하지 않으며 사용자에게 전송 실패를 알린다
