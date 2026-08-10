import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ErrorText, Field } from '../components/ui';
import { AssistantAvatar } from '../components/AssistantAvatar';
import { AssistantAvatarPicker } from '../components/AssistantAvatarPicker';
import { preloadAssistantAvatars } from '../config/assistantAvatars';
import { api } from '../services/api';
import { colors } from '../theme';
import { AssistantPersonality, ResponseLength, RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { PERSONALITIES, RESPONSE_LENGTHS } from '../assistantStyle';

export function WelcomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Welcome'>) { return <View style={s.welcome}><View style={s.logo}><Text style={{ fontSize: 32, fontWeight: '800', color: 'white' }}>M</Text></View><Text style={s.hero}>Everyday help,{`\n`}made simple.</Text><Text style={s.sub}>A friendly assistant for writing, planning, shopping, work, and all the little things.</Text><View style={{ width: '100%', gap: 12 }}><Button title="Create Account" onPress={() => navigation.navigate('Register')} /><Button title="Sign In" secondary onPress={() => navigation.navigate('Login')} /><Pressable onPress={() => navigation.navigate('FirstSetup', { guest: true })}><Text style={s.guest}>Continue as Guest</Text></Pressable></View></View>; }

function AuthForm({ mode, navigation }: { mode: 'login' | 'register'; navigation: any }) { const { saveSession, setProfile } = useAuth(); const [firstName, setFirstName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); async function submit() { if (!email.trim() || !password) return setError('Please complete all required fields.'); if (mode === 'register' && password !== confirm) return setError('Passwords do not match.'); setLoading(true); setError(''); try { const result = mode === 'login' ? await api.login({ email, password }) : await api.register({ firstName, email, password }); await saveSession(result.token); const guestProfile = mode === 'register' ? await AsyncStorage.getItem('guestProfile') : null; if (guestProfile) { const syncedProfile = await api.updateProfile(JSON.parse(guestProfile)); setProfile(syncedProfile); await AsyncStorage.removeItem('guestProfile'); navigation.replace('Main'); } else if (mode === 'login') { setProfile(await api.getProfile()); navigation.replace('Main'); } else navigation.replace('FirstSetup', { firstName }); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to continue.'); } finally { setLoading(false); } } return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}><ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled"><Text style={s.title}>{mode === 'login' ? 'Good to see you' : 'Let’s get started'}</Text><Text style={s.sub}>{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Just the basics — you can add more later.'}</Text>{mode === 'register' && <Field label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />}<Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />{mode === 'register' && <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />}<ErrorText message={error} />{mode === 'login' && <Pressable><Text style={{ color: colors.green, fontWeight: '600' }}>Forgot password?</Text></Pressable>}<Button title={loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'} disabled={loading} onPress={submit} /></ScrollView></KeyboardAvoidingView>; }
export const LoginScreen = ({ navigation }: any) => <AuthForm mode="login" navigation={navigation} />;
export const RegisterScreen = ({ navigation }: any) => <AuthForm mode="register" navigation={navigation} />;

const categories = ['Daily life', 'Writing', 'Planning', 'Shopping', 'Work', 'Money'];
const nameSuggestions = ['Alex', 'Maya', 'Jordan', 'Sam', 'Charlie'];
export function FirstSetupScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, 'FirstSetup'>) {
  const { setProfile, saveSession } = useAuth();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(route.params?.firstName || '');
  const [country, setCountry] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [assistantName, setAssistantName] = useState('');
  const [personality, setPersonality] = useState<AssistantPersonality>('friendly');
  const [responseLength, setResponseLength] = useState<ResponseLength>('normal');
  const [category, setCategory] = useState('Daily life');
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { preloadAssistantAvatars(); }, []);
  async function finish() {
    if (!firstName.trim() || !country.trim() || !avatarId || !assistantName.trim()) return;
    setSaving(true);
    const profile = { firstName: firstName.trim(), country: country.trim(), assistantAvatarId: avatarId, assistantName: assistantName.trim(), assistantPersonality: personality, responseLength, primaryHelpCategory: category };
    try {
      if (route.params?.guest) { await AsyncStorage.setItem('guestProfile', JSON.stringify(profile)); await saveSession('guest'); }
      else await api.updateProfile(profile);
      setProfile(profile); setStep(5);
    } finally { setSaving(false); }
  }
  const next = () => setStep(value => value + 1);
  return <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
    {step < 5 && <Text style={s.progress}>STEP {step + 2} OF 7</Text>}
    {step === 0 && <><Text style={s.title}>Choose your assistant</Text><Text style={s.sub}>Pick the face you’d like to see when your assistant talks to you.</Text><AssistantAvatarPicker value={avatarId} onChange={setAvatarId} /><Button title="Continue" disabled={!avatarId} onPress={next} /></>}
    {step === 1 && <><AssistantAvatar avatarId={avatarId} size="large" /><Text style={s.title}>What would you like to call your assistant?</Text><Field label="Assistant Name" value={assistantName} onChangeText={setAssistantName} autoCapitalize="words" /><Text style={s.suggestionLabel}>Suggestions</Text><View style={s.chips}>{nameSuggestions.map(name => <Pressable key={name} onPress={() => setAssistantName(name)} style={s.chip}><Text style={s.chipText}>{name}</Text></Pressable>)}</View><Button title="Continue" disabled={!assistantName.trim()} onPress={next} /></>}
    {step === 2 && <><Text style={s.title}>Choose a personality</Text><Text style={s.sub}>The picture is visual only. Choose how you’d like your assistant to communicate.</Text>{PERSONALITIES.map(item => <Pressable accessibilityRole="radio" accessibilityState={{selected:personality===item.value}} key={item.value} onPress={()=>setPersonality(item.value)} style={[s.personality,personality===item.value&&s.personalitySelected]}><Text style={[s.personalityLabel,personality===item.value&&s.selectedText]}>{item.label}</Text><Text style={[s.personalityDescription,personality===item.value&&s.selectedText]}>{item.description}</Text></Pressable>)}<Button title="Continue" onPress={next} /></>}
    {step === 3 && <><Text style={s.title}>Choose response length</Text><Text style={s.sub}>You can change this whenever you like.</Text><Choice title="How much detail do you usually want?" values={RESPONSE_LENGTHS.map(x=>x.label)} selected={RESPONSE_LENGTHS.find(x=>x.value===responseLength)!.label} onSelect={label => setResponseLength(RESPONSE_LENGTHS.find(x=>x.label===label)!.value)} /><Button title="Continue" onPress={next} /></>}
    {step === 4 && <><Text style={s.title}>Tell your assistant about yourself</Text><Text style={s.sub}>Only a few helpful details. Nothing intrusive.</Text><Field label="What should I call you?" value={firstName} onChangeText={setFirstName} /><Field label="Country" value={country} onChangeText={setCountry} /><Choice title="What would you most like help with?" values={categories} selected={category} onSelect={setCategory} /><Button title={saving ? 'Saving…' : 'Continue'} disabled={!firstName.trim() || !country.trim() || saving} onPress={finish} /></>}
    {step === 5 && <View style={s.ready}><AssistantAvatar avatarId={avatarId} size="large" showBorder /><Text style={[s.title, { textAlign: 'center' }]}>Hi, {firstName.trim()}. I’m {assistantName.trim()}.</Text><Text style={s.sub}>I’m ready to help you stay on top of your day.</Text><Button title="Let’s Get Started" onPress={() => navigation.replace('Main')} /></View>}
  </ScrollView>;
}
function Choice({ title, values, selected, onSelect }: { title: string; values: string[]; selected: string; onSelect: (v: string) => void }) { return <View style={{ gap: 9 }}><Text style={{ fontWeight: '700', color: colors.ink, fontSize: 16 }}>{title}</Text><View style={s.chips}>{values.map(v => <Pressable key={v} onPress={() => onSelect(v)} style={[s.chip, selected === v && s.chipSelected]}><Text style={{ color: selected === v ? 'white' : colors.ink, fontWeight: '600' }}>{v}</Text></Pressable>)}</View></View>; }
const s = StyleSheet.create({ welcome: { flex: 1, padding: 28, paddingTop: 110, backgroundColor: colors.cream, alignItems: 'center', gap: 24 }, logo: { width: 70, height: 70, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }, hero: { fontSize: 36, lineHeight: 43, textAlign: 'center', color: colors.ink, fontWeight: '800' }, title: { fontSize: 28, lineHeight: 35, color: colors.ink, fontWeight: '800' }, sectionTitle: { fontWeight: '800', color: colors.ink, fontSize: 20, lineHeight: 27 }, sub: { color: colors.muted, fontSize: 17, lineHeight: 25, textAlign: 'center' }, guest: { color: colors.green, textAlign: 'center', padding: 10, fontSize: 16, fontWeight: '600' }, form: { flexGrow: 1, padding: 24, gap: 20, backgroundColor: colors.cream }, personality: { padding: 15, gap: 4, borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, personalitySelected: { backgroundColor: colors.green, borderColor: colors.green }, personalityLabel: { color: colors.ink, fontWeight: '800', fontSize: 15 }, personalityDescription: { color: colors.muted, lineHeight: 20 }, selectedText: { color: colors.white }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, chip: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, chipSelected: { backgroundColor: colors.green, borderColor: colors.green }, progress: { color: colors.green, fontWeight: '800', fontSize: 12, letterSpacing: 1 }, suggestionLabel: { color: colors.muted, fontWeight: '700' }, chipText: { color: colors.ink, fontWeight: '600' }, ready: { flex: 1, minHeight: 560, alignItems: 'center', justifyContent: 'center', gap: 24, width: '100%' } });
