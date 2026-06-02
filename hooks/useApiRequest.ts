'use client';

import { useState, useCallback } from 'react';
import { ApiError, ERROR_MESSAGES } from '@/lib/api/errors';

interface UseApiRequestReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * 단발성 비동기 요청의 로딩·에러·데이터 상태를 표준화하는 훅.
 *
 * `execute`에 Promise 반환 함수를 넘기면 `isLoading`을 토글하고, 성공 시 `data`를 채우며,
 * 실패 시 `ApiError`의 코드에 대응하는 한국어 메시지(`ERROR_MESSAGES`)를 `error`에 담는다.
 * 컴포넌트마다 try/catch/로딩 보일러플레이트를 반복하지 않도록 한다.
 *
 * @typeParam T - 요청이 resolve하는 데이터 타입
 * @returns `data`, `isLoading`, `error`, 요청 실행기 `execute`(성공 시 결과, 실패 시 null 반환), `reset`
 *
 * @example
 * const { data, isLoading, error, execute } = useApiRequest<User>();
 * useEffect(() => { execute(() => getUser(id)); }, [id]);
 */
export function useApiRequest<T = unknown>(): UseApiRequestReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        const message = ERROR_MESSAGES[err.code] ?? err.message;
        setError(message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute, reset };
}
