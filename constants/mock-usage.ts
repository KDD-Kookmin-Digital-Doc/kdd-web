import type { ChatUsageResponse } from '@/types/api/usage';

export const MOCK_CHAT_USAGE: ChatUsageResponse = {
  dailyChatLimit: 30,
  todayUsed: 15,
  remaining: 15,
  resetsAt: '2026-04-17T00:00:00+09:00',
};
