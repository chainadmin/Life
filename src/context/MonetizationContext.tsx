import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPlan } from '../config/planFeatures';
import { SubscriptionService } from '../services/SubscriptionService';

const Context = createContext({ plan: 'free' as UserPlan });
export function MonetizationProvider({ children }: React.PropsWithChildren) {
  const [plan, setPlan] = useState(SubscriptionService.getCurrentPlan());
  useEffect(() => { SubscriptionService.initialize(); return SubscriptionService.subscribe(() => setPlan(SubscriptionService.getCurrentPlan())); }, []);
  return <Context.Provider value={{ plan }}>{children}</Context.Provider>;
}
export const useMonetization = () => useContext(Context);
