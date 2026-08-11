export type MonetizationEvent = 'banner_impression' | 'rewarded_ad_offered' | 'rewarded_ad_started' | 'rewarded_ad_completed' | 'rewarded_ad_failed' | 'reward_granted' | 'upgrade_screen_viewed' | 'upgrade_started' | 'upgrade_completed';
// Deliberately accepts no arbitrary payload, preventing private assistant data from entering ad analytics.
export const AnalyticsService = { track(event: MonetizationEvent) { if (__DEV__) console.info(`[monetization] ${event}`); } };
