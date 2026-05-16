# Users API 명세서

백엔드 기준 URL prefix: `/users/me`
프론트 프록시 경로: `/api/backend/users/me`
모든 엔드포인트 인증 필요: `Authorization: Bearer <accessToken>`

---

## GET /users/me — 내 정보 조회

### 성공 응답 (200)
```json
{
  "userId": 1,
  "email": "user@kookmin.ac.kr",
  "name": "홍길동",
  "role": "user",
  "profileCompleted": true,
  "userType": "student",
  "studentId": "20201234",
  "department": "software",
  "grade": 3,
  "admissionYear": 2020,
  "academicStatus": "enrolled",
  "additionalInfo": null,
  "staffDepartment": null,
  "jobDescription": null
}
```

### 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| userId | number | 사용자 고유 ID |
| email | string | Google 계정 이메일 |
| name | string | 사용자 이름 |
| role | string \| null | "user" \| "admin" |
| profileCompleted | boolean | 프로필 입력 완료 여부 |
| userType | string \| null | "student" \| "staff" |
| studentId | string \| null | 학번 (학생만) |
| department | string \| null | "software" \| "ai" (학생만) |
| grade | number \| null | 학년 (학생만) |
| admissionYear | number \| null | 입학년도 (학생만) |
| academicStatus | string \| null | "enrolled" \| "on_leave" \| "returning" (학생만) |
| additionalInfo | string \| null | 추가 정보 (학생만) |
| staffDepartment | string \| null | 소속 부서 (교직원만) |
| jobDescription | string \| null | 담당 업무 (교직원만) |

### 에러 응답
| 코드 | error |
|------|-------|
| 401 | UNAUTHORIZED |
| 500 | INTERNAL_SERVER_ERROR |

---

## POST /users/me/profile — 최초 프로필 입력

### 요청 (학생)
```json
{
  "name": "string",
  "userType": "student",
  "studentId": "string",
  "department": "software" | "ai",
  "grade": 3,
  "admissionYear": 2023,
  "academicStatus": "enrolled" | "on_leave" | "returning",
  "additionalInfo": "string"
}
```

### 요청 (교직원)
```json
{
  "name": "string",
  "userType": "staff",
  "staffDepartment": "student_support" | "academic_affairs" | "admissions" | "industry_cooperation" | "international_office" | "general_affairs" | "other",
  "jobDescription": "string"
}
```

### 성공 응답 (201)
GET /users/me와 동일한 형태 (profileCompleted: true)

### 에러 응답
| 코드 | error | message |
|------|-------|---------|
| 400 | INVALID_INPUT | 입력값이 올바르지 않습니다. |
| 401 | UNAUTHORIZED | 인증이 필요합니다. |
| 409 | PROFILE_ALREADY_COMPLETED | 이미 프로필이 입력된 사용자입니다. |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류가 발생했습니다. |

---

## PATCH /users/me — 내 정보 수정

### 요청
변경할 필드만 포함 (PATCH 방식)
```json
{
  "name": "string",
  "studentId": "string",
  "department": "software" | "ai",
  "grade": 3,
  "admissionYear": 2023,
  "academicStatus": "enrolled" | "on_leave" | "returning",
  "additionalInfo": "string",
  "staffDepartment": "string",
  "jobDescription": "string"
}
```
- userType, email은 변경 불가
- 빈 문자열("")을 보내면 해당 필드를 null로 초기화

### 성공 응답 (200)
GET /users/me와 동일한 형태

### 에러 응답
| 코드 | error | message |
|------|-------|---------|
| 400 | INVALID_INPUT | 입력값이 올바르지 않습니다. |
| 400 | PROFILE_NOT_COMPLETED | 프로필 입력이 완료되지 않은 사용자입니다. |
| 401 | UNAUTHORIZED | 인증이 필요합니다. |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류가 발생했습니다. |

---

## 백엔드 DTO (Java records)

```java
// CreateProfileRequest
record CreateProfileRequest(
    String name, String userType,
    String studentId, String department, Short grade, Short admissionYear,
    String academicStatus, String additionalInfo,
    String staffDepartment, String jobDescription
) {}

// UpdateProfileRequest
record UpdateProfileRequest(
    String name,
    String studentId, String department, Short grade, Short admissionYear,
    String academicStatus, String additionalInfo,
    String staffDepartment, String jobDescription
) {}

// UserResponse
record UserResponse(
    Long userId, String email, String name, String role, boolean profileCompleted,
    String userType,
    String studentId, String department, Short grade, Short admissionYear,
    String academicStatus, String additionalInfo,
    String staffDepartment, String jobDescription
) {}
```

---

## GET /users/me/chat-usage — 내 채팅 사용량 조회

### 성공 응답 (200)
```json
{
  "dailyChatLimit": 30,
  "todayUsed": 15,
  "remaining": 15,
  "resetsAt": "2026-04-17T15:00:00Z"
}
```

### 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| dailyChatLimit | number | 일일 채팅 한도 |
| todayUsed | number | 오늘 사용 횟수 |
| remaining | number | 남은 횟수 |
| resetsAt | string | 다음 초기화 시각 (ISO 8601 UTC) |

### 에러 응답
| 코드 | error |
|------|-------|
| 401 | UNAUTHORIZED |
| 404 | USER_NOT_FOUND |
