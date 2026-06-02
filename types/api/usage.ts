/** GET /users/me/chat-usage 응답 */
export interface ChatUsageResponse {
  dailyChatLimit: number; // 일일 한도
  todayUsed: number; // 오늘 사용 횟수
  remaining: number; // 남은 횟수
  resetsAt: string; // ISO 8601 (다음 초기화 시각)
}
