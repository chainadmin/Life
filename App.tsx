import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/context/AuthContext';
import { colors } from './src/theme';
import { RootStackParamList } from './src/types';
import { WelcomeScreen, LoginScreen, RegisterScreen, FirstSetupScreen } from './src/screens/AuthScreens';
import { MainTabs } from './src/navigation/MainTabs';
import { GuidedAssistantScreen } from './src/screens/GuidedAssistantScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ConnectedServicesScreen } from './src/screens/ConnectedServicesScreen';
import { CalendarAssistantScreen } from './src/screens/CalendarAssistantScreen';
import { EmailAssistantScreen } from './src/screens/EmailAssistantScreen';
import { TaskDetailScreen } from './src/screens/TaskDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function Splash() {
  return <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', gap: 16 }}><View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'white', fontSize: 34, fontWeight: '800' }}>M</Text></View><Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink }}>MyAssistant</Text><ActivityIndicator color={colors.green} /></View>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState<keyof RootStackParamList>('Welcome');
  useEffect(() => { AsyncStorage.getItem('session').then(s => { if (s) setInitial('Main'); }).finally(() => setTimeout(() => setReady(true), 650)); }, []);
  if (!ready) return <Splash />;
  return <AuthProvider><NavigationContainer><Stack.Navigator initialRouteName={initial} screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.cream }, headerTintColor: colors.ink, contentStyle: { backgroundColor: colors.cream } }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Welcome back' }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
    <Stack.Screen name="FirstSetup" component={FirstSetupScreen} options={{ title: 'A little about you' }} />
    <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Guided" component={GuidedAssistantScreen} options={({ route }) => ({ title: route.params.category })} />
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Your assistant' }} />
    <Stack.Screen name="ConnectedServices" component={ConnectedServicesScreen} options={{ title: 'Connected Services' }} />
    <Stack.Screen name="CalendarAssistant" component={CalendarAssistantScreen} options={{ title: 'Calendar' }} />
    <Stack.Screen name="EmailAssistant" component={EmailAssistantScreen} options={{ title: 'Email' }} />
    <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ title: 'Task' }} />
  </Stack.Navigator></NavigationContainer></AuthProvider>;
}
