import { apiClient } from '@/lib/api/client';
import { delay } from '@/lib/api/mock';
import type { ChatUsageResponse } from '@/types/api/usage';
import { MOCK_CHAT_USAGE } from '@/constants/mock-usage';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export async function getChatUsage(): Promise<ChatUsageResponse> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_CHAT_USAGE;
  }
  return apiClient.get<ChatUsageResponse>('/users/me/chat-usage');
}
