import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AssistantAvatar } from '../components/AssistantAvatar';
import { AssistantAvatarPicker } from '../components/AssistantAvatarPicker';
import { Button, Field } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { card, colors } from '../theme';
import { Profile } from '../types';

async function savePreference(profile: Profile, changes: Partial<Profile>) {
  if ((await AsyncStorage.getItem('session')) === 'guest') {
    const updated = { ...profile, ...changes };
    await AsyncStorage.setItem('guestProfile', JSON.stringify(updated));
    return updated;
  }
  return api.updateProfile(changes);
}

export function MyAssistantScreen({ navigation }: any) {
  const { profile } = useAuth();
  if (!profile) return null;
  const personality = profile.assistantPersonality[0].toUpperCase() + profile.assistantPersonality.slice(1);
  const response = profile.responseLength === 'short' ? 'Short answers' : profile.responseLength === 'detailed' ? 'Detailed answers' : 'Normal answers';
  return <ScrollView contentContainerStyle={s.page}><View style={s.identity}><AssistantAvatar avatarId={profile.assistantAvatarId} size="large" showBorder /><Text style={s.name}>{profile.assistantName || 'My Assistant'}</Text><Text style={s.detail}>{personality} • {response}</Text></View><View style={s.group}><Row label="Change Picture" onPress={() => navigation.navigate('ChangeAssistantPicture')} /><Row label="Change Name" onPress={() => navigation.navigate('ChangeAssistantName')} /><Row label="Change Personality" onPress={() => navigation.navigate('AssistantStyle')} /><Row label="Change Response Style" onPress={() => navigation.navigate('AssistantStyle')} /></View></ScrollView>;
}

export function ChangeAssistantPictureScreen({ navigation }: any) {
  const { profile, setProfile } = useAuth(); const [value, setValue] = useState(profile?.assistantAvatarId); const [saving, setSaving] = useState(false);
  async function save() { if (!profile || !value) return; setSaving(true); try { setProfile(await savePreference(profile, { assistantAvatarId: value })); navigation.goBack(); } catch { Alert.alert('Could not change picture', 'Please try again.'); } finally { setSaving(false); } }
  return <ScrollView contentContainerStyle={s.page}><Text style={s.title}>Choose your assistant</Text><Text style={s.centerDetail}>Changing the picture won’t change your assistant’s name, personality, memory, or conversations.</Text><AssistantAvatarPicker value={value} onChange={setValue} /><Button title={saving ? 'Saving…' : 'Save Picture'} disabled={!value || saving} onPress={save} /></ScrollView>;
}

export function ChangeAssistantNameScreen({ navigation }: any) {
  const { profile, setProfile } = useAuth(); const [name, setName] = useState(profile?.assistantName || ''); const [saving, setSaving] = useState(false);
  async function save() { if (!profile || !name.trim()) return; setSaving(true); try { setProfile(await savePreference(profile, { assistantName: name.trim() })); navigation.goBack(); } catch { Alert.alert('Could not change name', 'Please try again.'); } finally { setSaving(false); } }
  return <ScrollView contentContainerStyle={s.page}>{profile && <View style={s.identity}><AssistantAvatar avatarId={profile.assistantAvatarId} size="large" /></View>}<Field label="Assistant Name" value={name} onChangeText={setName} autoCapitalize="words" /><Button title={saving ? 'Saving…' : 'Save Name'} disabled={!name.trim() || saving} onPress={save} /></ScrollView>;
}

function Row({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable accessibilityRole="button" style={s.row} onPress={onPress}><Text style={s.rowLabel}>{label}</Text><Text style={s.arrow}>›</Text></Pressable>; }
const s = StyleSheet.create({ page: { padding: 20, gap: 20 }, identity: { alignItems: 'center', gap: 7, paddingVertical: 12 }, name: { color: colors.ink, fontSize: 25, fontWeight: '800' }, detail: { color: colors.muted, fontSize: 15 }, centerDetail: { color: colors.muted, textAlign: 'center', lineHeight: 21 }, title: { color: colors.ink, fontSize: 28, fontWeight: '800', textAlign: 'center' }, group: { ...card, padding: 0, overflow: 'hidden' }, row: { minHeight: 60, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, rowLabel: { color: colors.ink, fontSize: 16 }, arrow: { color: colors.muted, fontSize: 24 } });
