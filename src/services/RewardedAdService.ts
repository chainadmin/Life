import { adProvider, RewardedAdResult } from './AdProvider'; import { AnalyticsService } from './AnalyticsService'; import { SubscriptionService } from './SubscriptionService'; import { api } from './api';
export const RewardedAdService = {
  async isRewardAvailable() { if (!SubscriptionService.isFree()) return false; const usage = await api.aiUsage(); return usage.rewardedAdsUsed < usage.maxRewardedAds && await adProvider.loadRewarded(); },
  async showRewardedAd(): Promise<RewardedAdResult> { if (!SubscriptionService.isFree()) return { completed: false }; AnalyticsService.track('rewarded_ad_started'); const result = await adProvider.showRewarded(); result.completed ? AnalyticsService.track('rewarded_ad_completed') : AnalyticsService.track('rewarded_ad_failed'); return result; },
  async grantReward(providerReference: string) { const reward = await api.grantAdReward(providerReference); AnalyticsService.track('reward_granted'); return reward; },
  handleRewardFailure() { AnalyticsService.track('rewarded_ad_failed'); },
};
