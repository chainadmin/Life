export type RewardedAdResult = { completed: boolean; providerReference?: string };
export interface AdProvider { initialize(): Promise<void>; loadBanner(): Promise<void>; loadRewarded(): Promise<boolean>; showRewarded(): Promise<RewardedAdResult>; destroy(): void; }

export class MockAdProvider implements AdProvider {
  private nextResult: 'success' | 'failure' = 'success';
  async initialize() {} async loadBanner() {} async loadRewarded() { return true; }
  async showRewarded() { await new Promise(resolve => setTimeout(resolve, 350)); return this.nextResult === 'success' ? { completed: true, providerReference: `mock-${Date.now()}` } : { completed: false }; }
  destroy() {} setNextResult(result: 'success' | 'failure') { this.nextResult = result; }
}
// A native implementation can be injected by EAS builds without importing native SDKs in Expo Go.
export const adProvider = new MockAdProvider();
