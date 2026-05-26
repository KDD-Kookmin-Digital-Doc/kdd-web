/**
 * API Client - fetch 래퍼
 *
 * 모든 HTTP 통신의 기반. 인증 헤더 자동 주입, 에러 변환,
 * 401 토큰 재발급/재시도, 네트워크 에러 처리를 담당한다.
 */

import { ApiError } from './errors';

// ── Interfaces ──────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  useMock: boolean;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  skipAuth?: boolean;
  /** true이면 401 시 자동 refresh/redirect를 건너뛰고 즉시 에러를 throw한다. */
  skipAutoRefresh?: boolean;
}

// ── ApiClient Class ─────────────────────────────────────────

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  // ── Public HTTP methods ─────────────────────────────────

  async get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  async postFormData<T>(path: string, formData: FormData, options?: ApiRequestOptions): Promise<T> {
    return this.requestFormData<T>(path, formData, options);
  }

  async postSSE(path: string, body: unknown, options?: ApiRequestOptions): Promise<Response> {
    return this.requestSSE(path, body, options);
  }

  // ── URL builder ─────────────────────────────────────────

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    // trailing slash 제거하여 이중 슬래시 방지
    const base = this.config.baseUrl.replace(/\/+$/, '');
    const url = `${base}${path}`;

    if (!params) return url;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }

    const qs = searchParams.toString();
    return qs ? `${url}?${qs}` : url;
  }

  // ── Response handler ────────────────────────────────────

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      // 204 No Content or empty body
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    }

    // Error responses: parse { error, message } body
    const body = await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다.',
    }));

    throw new ApiError(response.status, body.error, body.message);
  }

  // ── Core request method ─────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
    isRetry = false,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Auth header injection (lazy import to avoid circular dependency)
    if (options?.skipAuth !== true) {
      try {
        const { authManager } = await import('./auth');
        const token = authManager.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // auth module not yet available — skip
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
        signal: options?.signal,
      });

      // 401 → token refresh & retry (once)
      if (response.status === 401 && !isRetry && !options?.skipAutoRefresh) {
        try {
          const { authManager } = await import('./auth');
          await authManager.refreshAccessToken();
          return this.request<T>(method, path, body, options, true);
        } catch {
          // Refresh failed → clear token & redirect to login
          try {
            const { authManager } = await import('./auth');
            authManager.clearToken();
          } catch {
            // ignore
          }
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          // Still throw the original 401 error
          const errorBody = await response.json().catch(() => ({
            error: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          }));
          throw new ApiError(401, errorBody.error, errorBody.message);
        }
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      // Network error (TypeError from fetch)
      throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해주세요.');
    }
  }

  // ── FormData request (no Content-Type — browser sets boundary) ──

  private async requestFormData<T>(
    path: string,
    formData: FormData,
    options?: ApiRequestOptions,
    isRetry = false,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);

    const headers: Record<string, string> = {
      ...options?.headers,
    };

    if (options?.skipAuth !== true) {
      try {
        const { authManager } = await import('./auth');
        const token = authManager.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // auth module not yet available
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
        signal: options?.signal,
      });

      if (response.status === 401 && !isRetry) {
        try {
          const { authManager } = await import('./auth');
          await authManager.refreshAccessToken();
          return this.requestFormData<T>(path, formData, options, true);
        } catch {
          try {
            const { authManager } = await import('./auth');
            authManager.clearToken();
          } catch {
            // ignore
          }
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          const errorBody = await response.json().catch(() => ({
            error: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          }));
          throw new ApiError(401, errorBody.error, errorBody.message);
        }
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해주세요.');
    }
  }

  // ── SSE request (returns raw Response) ──────────────────

  private async requestSSE(
    path: string,
    body: unknown,
    options?: ApiRequestOptions,
    isRetry = false,
  ): Promise<Response> {
    const url = this.buildUrl(path, options?.params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...options?.headers,
    };

    if (options?.skipAuth !== true) {
      try {
        const { authManager } = await import('./auth');
        const token = authManager.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch {
        // auth module not yet available
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
        signal: options?.signal,
      });

      if (response.status === 401 && !isRetry) {
        try {
          const { authManager } = await import('./auth');
          await authManager.refreshAccessToken();
          return this.requestSSE(path, body, options, true);
        } catch {
          try {
            const { authManager } = await import('./auth');
            authManager.clearToken();
          } catch {
            // ignore
          }
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
          const errorBody = await response.json().catch(() => ({
            error: 'UNAUTHORIZED',
            message: '인증이 필요합니다.',
          }));
          throw new ApiError(401, errorBody.error, errorBody.message);
        }
      }

      // SSE: return raw Response (do NOT call handleResponse)
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          error: 'UNKNOWN_ERROR',
          message: '알 수 없는 오류가 발생했습니다.',
        }));
        throw new ApiError(response.status, errorBody.error, errorBody.message);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인해주세요.');
    }
  }
}

// ── Singleton instance ──────────────────────────────────────

export const apiClient = new ApiClient({
  baseUrl: '/api/backend',
  useMock: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
});
