# Chat API 명세서

백엔드 기준 URL prefix: `/chat`
프론트 프록시 경로: `/api/backend/chat/*`
모든 엔드포인트 인증 필요: `Authorization: Bearer <accessToken>`

---

## POST /chat/sessions — 채팅 세션 생성

### 요청
별도 Body 없음. 제목은 서버에서 날짜+시간 기반 자동 생성.

### 성공 응답 (201)
```json
{
  "sessionId": 1,
  "title": "2026-04-16 22:30",
  "sourceType": "normal",
  "createdAt": "2026-04-16T22:30:00"
}
```

### 에러 응답
| 코드 | error |
|------|-------|
| 401 | UNAUTHORIZED |
| 500 | INTERNAL_SERVER_ERROR |

---

## GET /chat/sessions — 채팅 세션 목록 조회

### 요청 (Query Parameters)
| 키 | 타입 | 필수 | 설명 |
|----|------|------|------|
| keyword | string | X | 제목 검색어 (부분 일치) |
| page | number | X | 페이지 번호 (기본: 0) |
| pageSize | number | X | 페이지 크기 (기본: 20) |

### 성공 응답 (200)
```json
{
  "data": [
    {
      "sessionId": 1,
      "title": "2026-04-16 22:30",
      "sourceType": "normal" | "faq",
      "createdAt": "2026-04-16T22:30:00"
    }
  ],
  "totalCount": 7,
  "page": 0,
  "pageSize": 20,
  "totalPages": 1
}
```

### 에러 응답
| 코드 | error |
|------|-------|
| 401 | UNAUTHORIZED |
| 403 | SESSION_FORBIDDEN |
| 500 | INTERNAL_SERVER_ERROR |

---

## GET /chat/sessions/{sessionId} — 채팅 세션 상세 조회

### 성공 응답 (200)
```json
{
  "sessionId": 1,
  "title": "2026-04-16 22:30",
  "sourceType": "normal" | "faq",
  "messages": [
    {
      "messageId": 1,
      "role": "user" | "assistant",
      "content": "string",
      "sources": [
        {
          "documentId": 123,
          "documentTitle": "2026_학사요람.pdf",
          "page": 45
        }
      ],
      "confidence": "high" | "medium" | "low" | null,
      "createdAt": "2026-04-16T22:30:00"
    }
  ]
}
```

### 에러 응답
| 코드 | error |
|------|-------|
| 401 | UNAUTHORIZED |
| 403 | SESSION_FORBIDDEN |
| 404 | SESSION_NOT_FOUND |
| 500 | INTERNAL_SERVER_ERROR |

---

## PATCH /chat/sessions/{sessionId} — 세션 제목 수정

### 요청
```json
{ "title": "string" }
```
- title: max 100자

### 성공 응답 (200)
```json
{ "sessionId": 1, "title": "수정된 제목" }
```

### 에러 응답
| 코드 | error |
|------|-------|
| 400 | INVALID_INPUT |
| 401 | UNAUTHORIZED |
| 403 | SESSION_FORBIDDEN |
| 404 | SESSION_NOT_FOUND |
| 500 | INTERNAL_SERVER_ERROR |

---

## DELETE /chat/sessions/{sessionId} — 세션 삭제

### 성공 응답 (200)
```json
{ "message": "채팅 세션이 삭제되었습니다." }
```

### 에러 응답
| 코드 | error |
|------|-------|
| 401 | UNAUTHORIZED |
| 403 | SESSION_FORBIDDEN |
| 404 | SESSION_NOT_FOUND |
| 500 | INTERNAL_SERVER_ERROR |

---

## POST /chat/sessions/{sessionId}/messages — 메시지 전송 (SSE 스트리밍)

**Content-Type**: `text/event-stream`

### 요청
```json
{ "content": "string" }
```
- content: max 2000자

### SSE 파싱 규격 (W3C Server-Sent Events 표준 준수)
응답 스트림은 W3C SSE 표준을 따른다. 프론트는 다음 규칙에 맞게 파싱해야 한다.

1. **이벤트 경계**: 빈 줄(`\n\n` 또는 `\r\n\r\n`)로 이벤트를 구분한다. 단일 `\n`으로 split 금지.
2. **멀티라인 data**: 한 이벤트에 `data:` 줄이 여러 개이면 각 `data:` 값을 `\n`으로 join한 뒤 JSON 파싱한다.
3. **CRLF 대응**: 각 줄은 `\r\n`으로 끝날 수 있으므로 `\r`을 제거한 후 처리한다.
4. **prefix 공백**: `data:` 뒤에 공백이 있을 수도(`data: {...}`) 없을 수도(`data:{...}`) 있다.
5. **silent catch 금지**: JSON 파싱 실패 시 에러를 삼키지 말고 로깅한다 (디버깅 필수).

### 응답: SSE 스트리밍

#### meta (첫 번째 이벤트 — 메타데이터)
```
data: {"type":"meta","subtype":"document","confidence":"high","sources":[{"documentId":123,"documentTitle":"2026_학사요람.pdf","page":45}]}
data: {"type":"meta","subtype":"cache","sources":[...]}
data: {"type":"meta","subtype":"chitchat"}
```

#### text (답변 텍스트 스트리밍)
```
data: {"type":"text","content":"답변 텍스트 청크..."}
```

#### fallback (검색 실패 시)
```
data: {"type":"fallback","message":"관련 학사규정을 찾지 못했습니다.","suggestedQuestions":["일반휴학 신청 기한이 언제인가요?"]}
```

#### done (스트리밍 완료)
```
data: {"type":"done","messageId":123,"remaining":14}
```

#### error (스트리밍 중 오류)
```
data: {"type":"error","message":"답변 생성 중 오류가 발생했습니다."}
```

### 에러 응답 (SSE 아닌 경우)
| 코드 | error | message |
|------|-------|---------|
| 400 | INVALID_INPUT | 입력값이 올바르지 않습니다. |
| 401 | UNAUTHORIZED | 인증이 필요합니다. |
| 403 | SESSION_FORBIDDEN | 다른 사용자의 채팅 세션은 접근할 수 없습니다. |
| 404 | SESSION_NOT_FOUND | 존재하지 않는 채팅 세션입니다. |
| 429 | RATE_LIMIT_EXCEEDED | 채팅 횟수 제한을 초과했습니다. |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류가 발생했습니다. |

429 응답 본문:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "채팅 횟수 제한을 초과했습니다.",
  "remaining": 0,
  "resetsAt": "2026-04-17T15:00:00Z"
}
```

### 내부 흐름
1. BE: 세션 유효성 확인 + 사용자 메시지 DB 저장
2. BE: 사용자 프로필에서 user_context 조합
3. BE: DB에서 최근 N개 대화 history 추출
4. BE: AI 서버에 POST /api/chat 호출
5. AI: 캐시 탐색 → 잡담 판별 → 벡터 검색 → RAG → SSE 스트리밍
6. BE: AI SSE를 받으며 프론트에 재전달
7. BE: done 수신 후 AI 답변 DB 저장
- FE가 SSE 연결을 중단해도 BE는 AI 답변을 끝까지 수신하여 DB에 저장

### BE → FE 변환 규칙
- confidence: AI가 영문 소문자로 반환 (변환 불필요)
- sources: AI의 doc_id → documentId, doc_name → documentTitle
- 전체 필드 snake_case → camelCase 변환
- done 이벤트: AI는 usage(토큰)를 반환하지만, BE는 답변을 DB 저장 후 생성된 messageId를 FE에 전달

---

## GET /chat/recommended-questions — 추천 질문 조회 (후순위)

### 성공 응답 (200)
```json
{
  "questions": [
    { "questionId": "string", "content": "string" }
  ]
}
```

---

## 백엔드 DTO (Java records)

```java
record ChatMessageRequest(String content) {} // max 2000
record ChatSessionCreateResponse(Long sessionId, String title, String sourceType, LocalDateTime createdAt) {}
record ChatSessionListResponse(Long sessionId, String title, String sourceType, LocalDateTime createdAt) {}
record ChatSessionDetailResponse(Long sessionId, String title, String sourceType, List<ChatMessageResponse> messages) {}
record ChatMessageResponse(Long messageId, String role, String content, List<ChatMessageSourceResponse> sources, String confidence, LocalDateTime createdAt) {}
record ChatMessageSourceResponse(Long documentId, String documentTitle, Integer page) {}
record ChatSessionUpdateRequest(String title) {} // max 100
record ChatSessionUpdateResponse(Long sessionId, String title) {}
```
