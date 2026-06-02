# API 연동 전체 구조

## 아키텍처

```
Browser → Next.js (localhost:3000)
              ↓ rewrites (/api/backend/*)
         Spring Boot (localhost:8000)
              ↓
         AI Server (43.201.194.211:8000)
```

## 프록시 설정 (next.config.ts)

```typescript
// /api/backend/* → NEXT_PUBLIC_API_BASE_URL/*
rewrites: [{ source: "/api/backend/:path*", destination: "${API_BASE_URL}/:path*" }]
```

apiClient의 baseUrl은 `/api/backend`로 설정. 브라우저 → Next.js → Spring Boot 순으로 프록시.
프로덕션에서는 `NEXT_PUBLIC_API_BASE_URL`만 변경하면 됨.

## 요청 경로 작성 규칙 (반드시 준수)

- 백엔드 기준 URL: `/{domain}/{...}` (Spring Controller의 `@RequestMapping`)
- 프론트 실제 호출 경로: `/api/backend/{domain}/{...}`
- **항상 `apiClient`(`lib/api/client.ts`) 또는 도메인 서비스(`lib/api/services/*.ts`)를 통해 호출**한다. URL을 수동으로 조립하지 않는다.
- 직접 `fetch`를 써야 하는 예외(SSE 등)도 `/api/backend` prefix 또는 `NEXT_PUBLIC_API_BASE_URL`을 사용한다.

### 자주 발생하는 경로 실수

- ❌ `fetch('/api/documents/123')` — Next.js API route로 해석되어 404
- ❌ `fetch('/documents/123')` — Next.js가 정적 경로로 처리하려 하고 백엔드에 도달하지 않음
- ✅ `apiClient.get('/documents/123')` → 실제 요청은 `/api/backend/documents/123`
- ✅ PDF 파일 URL 등 "백엔드가 내려주는 URL"은 **응답의 `fileUrl` 필드 값 그대로 사용**. 프론트가 경로를 조합하지 않는다.

## 인증 흐름

### Access Token
- 메모리 저장 (authManager.setToken)
- JWT, 30분 만료
- 모든 API 호출에 `Authorization: Bearer <token>` 헤더로 포함

### Refresh Token
- HttpOnly Cookie (백엔드 Set-Cookie)
- **Path=/auth** → `/api/backend/auth/*` 요청 시에만 자동 포함
- 14일 만료
- Refresh Token Rotation 적용

### 미들웨어용 쿠키
- `user_role`, `profile_completed`: document.cookie로 설정 (Non-HttpOnly)
- proxy.ts에서 라우팅 가드에 사용

## 에러 응답 형식

모든 API 에러:
```json
{ "error": "ERROR_CODE", "message": "한국어 메시지" }
```

프론트 처리: `ApiError` 클래스 + `ERROR_MESSAGES` 맵

## Mock 모드

`NEXT_PUBLIC_USE_MOCK=true`일 때 모든 서비스 함수가 mock 데이터 반환.
`false`면 실제 API 호출.

## 백엔드 구현 상태 요약

| 도메인 | API | 상태 |
|--------|-----|------|
| Auth | POST /auth/google | 완료 |
| Auth | POST /auth/refresh | 완료 |
| Auth | POST /auth/logout | 완료 |
| Users | GET /users/me | 완료 |
| Users | POST /users/me/profile | 완료 |
| Users | PATCH /users/me | 완료 |
| Chat | POST /chat/sessions | 완료 |
| Chat | GET /chat/sessions | 완료 |
| Chat | GET /chat/sessions/{id} | 완료 |
| Chat | PATCH /chat/sessions/{id} | 완료 |
| Chat | DELETE /chat/sessions/{id} | 완료 |
| Chat | POST /chat/sessions/{id}/messages (SSE) | 완료 |
| Documents | GET /documents/categories | 완료 |
| Documents | GET /documents/by-category | 완료 |
| Documents | GET /documents | 완료 |
| Documents | GET /documents/{id} | 완료 |
| Documents | GET /documents/popular | 완료 |
| Admin | GET /admin/documents | 완료 |
| Admin | POST /admin/documents | 완료 |
| Admin | GET /admin/documents/{id}/status | 완료 |
| Admin | POST /admin/documents/{id}/reprocess | 완료 |
| Admin | PATCH /admin/documents/{id}/category | 완료 |
| Admin | DELETE /admin/documents/{id} | 완료 |
| Users | GET /users/me/chat-usage | 완료 |
| Admin | GET /admin/users | 완료 |
| Admin | PATCH /admin/users/{id}/chat-limit | 완료 |
| Admin | PATCH /admin/users/chat-limit/bulk | 완료 |
| Admin | POST /admin/users/{id}/chat-usage/reset | 완료 |
| Admin | GET /admin/settings/default-chat-limit | 완료 |
| Admin | PATCH /admin/settings/default-chat-limit | 완료 |
| FAQ | GET /faqs (목록) | 완료 |
| Admin | /admin/faqs CRUD | 완료 |
| Admin | GET /admin/statistics | 시작 전 |
| Chat | GET /chat/recommended-questions | 시작 전 (후순위) |
| Chat | 파일 업로드 | 시작 전 (후순위) |

## 프론트 타입 ↔ 백엔드 DTO 불일치 사항

1. **UserResponse.role**: `"user"` / `"admin"` (소문자 리터럴, Role enum 값)
2. **admin 문서 목록 페이지 파라미터**: 백엔드는 `size` (not `pageSize`)
3. **문서 상세 조회**: 명세서 응답과 백엔드 DTO 구조 차이 (사용자용 vs 관리자용이 다를 수 있음)
4. **refreshToken 쿠키 Path=/auth**: 프록시 경로 `/api/backend/auth/*`를 통해야 쿠키 전송됨
