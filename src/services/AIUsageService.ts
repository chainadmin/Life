import { api } from './api';
export type AIUsage = { userId?: string; date: string; messagesUsed: number; rewardedMessages: number; plan: 'free'|'plus'|'school'; limit: number|null; remaining: number|null; rewardedAdsUsed: number; maxRewardedAds: number };
// Display-only status. The authenticated API remains authoritative and enforces every message.
export const AIUsageService = { getUsage: () => api.aiUsage(), simulateLimitReached: () => __DEV__ ? api.simulateAiLimit() : Promise.resolve() };
