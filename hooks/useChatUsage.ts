'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getChatUsage } from '@/lib/api/services/usage.service';

interface UseChatUsageReturn {
  remaining: number | null;
  dailyLimit: number | null;
  usedToday: number | null;
  isLoading: boolean;
  error: boolean;
  refresh: () => Promise<void>;
  setRemaining: (value: number) => void;
}

/**
 * 다음 자정(KST, UTC+9)까지 남은 밀리초를 계산한다.
 * 서버 리셋 시각이 매일 00:00 KST이므로, 해당 시각까지의 차이를 반환한다.
 */
function getMsUntilKSTMidnight(): number {
  const now = new Date();
  const nowUTC = now.getTime();
  // KST 기준 현재 시각을 구한다
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstNow = new Date(nowUTC + KST_OFFSET_MS);
  // KST 기준 다음 날 00:00:00을 구한다
  const kstMidnight = new Date(kstNow);
  kstMidnight.setUTCHours(0, 0, 0, 0);
  kstMidnight.setUTCDate(kstMidnight.getUTCDate() + 1);
  // UTC 기준으로 변환하여 차이를 계산한다
  const targetUTC = kstMidnight.getTime() - KST_OFFSET_MS;
  return Math.max(targetUTC - nowUTC, 0);
}

const RETRY_DELAY_MS = 30_000;

export function useChatUsage(): UseChatUsageReturn {
  const [remaining, setRemainingState] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [usedToday, setUsedToday] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // refresh: getChatUsage() 재호출, 에러 시 이전 값 유지
  const refresh = useCallback(async () => {
    try {
      const data = await getChatUsage();
      if (!mountedRef.current) return;
      setRemainingState(data.remaining);
      setDailyLimit(data.dailyChatLimit);
      setUsedToday(data.todayUsed);
      setError(false);
    } catch {
      if (!mountedRef.current) return;
      setError(true);
    }
  }, []);

  // setRemaining: SSE done 이벤트 또는 429 에러 시 remaining 직접 갱신
  const setRemaining = useCallback((value: number) => {
    setRemainingState(value);
  }, []);

  // Reset_Time 타이머: 다음 자정(KST) 도래 시 자동 refresh(), 실패 시 30초 후 재시도
  const scheduleResetTimer = useCallback(() => {
    // 기존 타이머 정리
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const msUntilMidnight = getMsUntilKSTMidnight();

    resetTimerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      try {
        const data = await getChatUsage();
        if (!mountedRef.current) return;
        setRemainingState(data.remaining);
        setDailyLimit(data.dailyChatLimit);
        setUsedToday(data.todayUsed);
        setError(false);
        // 성공 시 다음 자정 타이머 재설정
        scheduleResetTimer();
      } catch {
        if (!mountedRef.current) return;
        setError(true);
        // 실패 시 30초 후 재시도
        retryTimerRef.current = setTimeout(async () => {
          if (!mountedRef.current) return;
          try {
            const data = await getChatUsage();
            if (!mountedRef.current) return;
            setRemainingState(data.remaining);
            setDailyLimit(data.dailyChatLimit);
            setUsedToday(data.todayUsed);
            setError(false);
          } catch {
            if (!mountedRef.current) return;
            setError(true);
          }
          // 재시도 후 다음 자정 타이머 재설정
          scheduleResetTimer();
        }, RETRY_DELAY_MS);
      }
    }, msUntilMidnight);
  }, []);

  // 마운트 시 초기 데이터 로드 및 타이머 설정
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      setIsLoading(true);
      try {
        const data = await getChatUsage();
        if (!mountedRef.current) return;
        setRemainingState(data.remaining);
        setDailyLimit(data.dailyChatLimit);
        setUsedToday(data.todayUsed);
        setError(false);
      } catch {
        if (!mountedRef.current) return;
        setError(true);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    init();
    scheduleResetTimer();

    return () => {
      mountedRef.current = false;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [scheduleResetTimer]);

  return {
    remaining,
    dailyLimit,
    usedToday,
    isLoading,
    error,
    refresh,
    setRemaining,
  };
}
