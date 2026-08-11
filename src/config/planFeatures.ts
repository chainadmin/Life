export type UserPlan = 'free' | 'plus' | 'school';
export type PlanStatus = 'active' | 'expired' | 'cancelled' | 'trial';
export type FeatureKey = 'ai_messages' | 'daily_brief' | 'tasks' | 'manual_budget' | 'calendar' | 'gmail' | 'widgets' | 'bank_connection' | 'premium_avatars' | 'advanced_daily_brief' | 'school_tools';

export type FeatureAccess = boolean | { enabled: boolean; dailyLimit?: number };
const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const monetizationConfig = {
  freeDailyAiMessages: numberFromEnv(process.env.EXPO_PUBLIC_FREE_DAILY_AI_MESSAGES, 20),
  rewardedAiMessages: numberFromEnv(process.env.EXPO_PUBLIC_REWARDED_AI_MESSAGES, 5),
  plusDailyAiMessages: numberFromEnv(process.env.EXPO_PUBLIC_PLUS_DAILY_AI_MESSAGES, 200),
  maxRewardedAdsPerDay: numberFromEnv(process.env.EXPO_PUBLIC_MAX_REWARDED_ADS_PER_DAY, 3),
};

const common = { daily_brief: true, tasks: true, manual_budget: true, widgets: true } as const;
export const planFeatures: Record<UserPlan, Record<FeatureKey, FeatureAccess>> = {
  free: { ...common, ai_messages: { enabled: true, dailyLimit: monetizationConfig.freeDailyAiMessages }, calendar: false, gmail: false, bank_connection: false, premium_avatars: false, advanced_daily_brief: false, school_tools: false },
  plus: { ...common, ai_messages: { enabled: true, dailyLimit: monetizationConfig.plusDailyAiMessages }, calendar: true, gmail: true, bank_connection: true, premium_avatars: true, advanced_daily_brief: true, school_tools: false },
  school: { ...common, ai_messages: { enabled: true }, calendar: true, gmail: true, bank_connection: false, premium_avatars: false, advanced_daily_brief: true, school_tools: true },
};
