import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeatureAccess, FeatureKey, planFeatures, UserPlan } from '../config/planFeatures';

const DEV_PLAN_KEY = 'development.monetization.plan';
let currentPlan: UserPlan = 'free';
const listeners = new Set<() => void>();

export const SubscriptionService = {
  async initialize(profilePlan?: UserPlan) {
    const override = __DEV__ ? await AsyncStorage.getItem(DEV_PLAN_KEY) as UserPlan | null : null;
    currentPlan = override || profilePlan || 'free'; listeners.forEach(listener => listener());
  },
  getCurrentPlan: (): UserPlan => currentPlan,
  isPlus: () => currentPlan === 'plus', isFree: () => currentPlan === 'free', isSchool: () => currentPlan === 'school',
  canShowAds: () => currentPlan === 'free',
  getFeatureAccess: (feature: FeatureKey): FeatureAccess => planFeatures[currentPlan][feature],
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  async setDevelopmentPlan(plan: UserPlan) { if (!__DEV__) return; currentPlan = plan; await AsyncStorage.setItem(DEV_PLAN_KEY, plan); listeners.forEach(listener => listener()); },
};
