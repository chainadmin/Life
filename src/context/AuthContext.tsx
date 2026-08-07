import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types';
const Context = createContext<{ profile: Profile | null; setProfile: (p: Profile) => void; saveSession: (token: string) => Promise<void>; signOut: () => Promise<void> }>({ profile: null, setProfile: () => {}, saveSession: async () => {}, signOut: async () => {} });
export function AuthProvider({ children }: React.PropsWithChildren) { const [profile, setProfile] = useState<Profile | null>(null); return <Context.Provider value={{ profile, setProfile, saveSession: t => AsyncStorage.setItem('session', t), signOut: async () => { await AsyncStorage.multiRemove(['session', 'guestProfile']); setProfile(null); } }}>{children}</Context.Provider>; }
export const useAuth = () => useContext(Context);
