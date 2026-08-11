import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types';
import { SubscriptionService } from '../services/SubscriptionService';
const Context = createContext<{ profile: Profile | null; setProfile: (p: Profile) => void; saveSession: (token: string) => Promise<void>; signOut: () => Promise<void> }>({ profile: null, setProfile: () => {}, saveSession: async () => {}, signOut: async () => {} });
export function AuthProvider({ children }: React.PropsWithChildren) { const [profile, setProfileState] = useState<Profile | null>(null); const setProfile=(value:Profile)=>{setProfileState(value);SubscriptionService.initialize(value.plan);}; return <Context.Provider value={{ profile, setProfile, saveSession: t => AsyncStorage.setItem('session', t), signOut: async () => { await AsyncStorage.multiRemove(['session', 'guestProfile']); setProfileState(null); await SubscriptionService.initialize('free'); } }}>{children}</Context.Provider>; }
export const useAuth = () => useContext(Context);
