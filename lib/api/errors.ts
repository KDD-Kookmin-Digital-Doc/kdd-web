/**
 * API 에러 처리 인프라
 *
 * - ApiError: 구조화된 API 에러 클래스
 * - ERROR_CODES: 백엔드 ErrorCode enum과 1:1 대응하는 상수
 * - ERROR_MESSAGES: 에러 코드별 한국어 사용자 표시 메시지
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 백엔드 ErrorCode와 1:1 대응 */
export const ERROR_CODES = {
  // Auth
  INVALID_AUTH_CODE: 'INVALID_AUTH_CODE',
  UNAUTHORIZED_DOMAIN: 'UNAUTHORIZED_DOMAIN',
  UNVERIFIED_EMAIL: 'UNVERIFIED_EMAIL',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',

  // Token
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',

  // Document
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  PARENT_CATEGORY_NOT_ALLOWED: 'PARENT_CATEGORY_NOT_ALLOWED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  DOCUMENT_ALREADY_PROCESSING: 'DOCUMENT_ALREADY_PROCESSING',

  // User
  PROFILE_ALREADY_COMPLETED: 'PROFILE_ALREADY_COMPLETED',
  PROFILE_NOT_COMPLETED: 'PROFILE_NOT_COMPLETED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Chat
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_FORBIDDEN: 'SESSION_FORBIDDEN',

  // Common
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_INPUT: 'INVALID_INPUT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  // Rate Limit
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/** 에러 코드별 사용자 표시 메시지 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Common
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',

  // Auth
  [ERROR_CODES.INVALID_AUTH_CODE]: '유효하지 않은 인증 코드입니다.',
  [ERROR_CODES.UNAUTHORIZED_DOMAIN]: '허용되지 않은 이메일 도메인입니다. 다른 계정으로 로그인했다면 Google 계정 선택 화면에서 다시 시도해 주세요.',
  [ERROR_CODES.UNVERIFIED_EMAIL]: '이메일 인증이 완료되지 않았습니다.',
  [ERROR_CODES.ACCOUNT_DEACTIVATED]: '비활성화된 계정입니다.',

  // Token
  [ERROR_CODES.INVALID_TOKEN]: '인증이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_CODES.EXPIRED_TOKEN]: '인증이 만료되었습니다. 다시 로그인해주세요.',
  [ERROR_CODES.INVALID_REFRESH_TOKEN]: '인증이 만료되었습니다. 다시 로그인해주세요.',

  // Document
  [ERROR_CODES.DOCUMENT_NOT_FOUND]: '존재하지 않는 문서입니다.',
  [ERROR_CODES.CATEGORY_NOT_FOUND]: '존재하지 않는 카테고리입니다.',
  [ERROR_CODES.PARENT_CATEGORY_NOT_ALLOWED]: '하위 카테고리를 선택해주세요.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'PDF 파일만 업로드 가능합니다.',
  [ERROR_CODES.DOCUMENT_ALREADY_PROCESSING]: '문서가 이미 처리 중입니다.',

  // User
  [ERROR_CODES.PROFILE_ALREADY_COMPLETED]: '이미 프로필이 입력되었습니다.',
  [ERROR_CODES.PROFILE_NOT_COMPLETED]: '프로필 입력이 필요합니다.',
  [ERROR_CODES.USER_NOT_FOUND]: '존재하지 않는 사용자입니다.',

  // Chat
  [ERROR_CODES.SESSION_NOT_FOUND]: '존재하지 않는 채팅 세션입니다.',
  [ERROR_CODES.SESSION_FORBIDDEN]: '접근 권한이 없는 채팅 세션입니다.',

  // Access Control
  [ERROR_CODES.UNAUTHORIZED]: '인증이 필요합니다. 다시 로그인해주세요.',
  [ERROR_CODES.FORBIDDEN]: '관리자 권한이 필요합니다.',

  // Rate Limit
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '채팅 횟수 제한을 초과했습니다.',
};
