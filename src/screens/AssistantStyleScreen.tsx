import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PERSONALITIES, RESPONSE_LENGTHS, assistantStylePreview } from '../assistantStyle';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { card, colors } from '../theme';
import { AssistantPersonality, ResponseLength } from '../types';

export function AssistantStyleScreen() {
  const { profile, setProfile } = useAuth();
  const [personality, setPersonality] = useState<AssistantPersonality>(profile?.assistantPersonality || 'friendly');
  const [responseLength, setResponseLength] = useState<ResponseLength>(profile?.responseLength || 'normal');
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const guest = (await AsyncStorage.getItem('session')) === 'guest';
      const updated = guest ? { ...profile, assistantPersonality: personality, responseLength } : await api.updateProfile({ assistantPersonality: personality, responseLength });
      if (guest) await AsyncStorage.setItem('guestProfile', JSON.stringify(updated));
      setProfile(updated);
      Alert.alert('Assistant style updated');
    } catch { Alert.alert('Could not update assistant style', 'Please try again.'); }
    finally { setSaving(false); }
  }
  return <ScrollView contentContainerStyle={s.page}>
    <Text style={s.intro}>Personality changes how your assistant communicates—not its facts, calculations, privacy, or safety standards.</Text>
    <Text style={s.heading}>Personality</Text>
    {PERSONALITIES.map(item => <Pressable accessibilityRole="radio" accessibilityState={{ selected: personality === item.value }} key={item.value} onPress={() => setPersonality(item.value)} style={[s.option, personality === item.value && s.selected]}><View style={s.optionText}><Text style={[s.label, personality === item.value && s.selectedText]}>{item.label}</Text><Text style={[s.description, personality === item.value && s.selectedText]}>{item.description}</Text></View><Text style={[s.radio, personality === item.value && s.selectedText]}>{personality === item.value ? '●' : '○'}</Text></Pressable>)}
    <Text style={s.heading}>Response length</Text>
    <View style={s.lengths}>{RESPONSE_LENGTHS.map(item => <Pressable accessibilityRole="radio" accessibilityState={{ selected: responseLength === item.value }} key={item.value} onPress={() => setResponseLength(item.value)} style={[s.length, responseLength === item.value && s.selected]}><Text style={[s.label, responseLength === item.value && s.selectedText]}>{item.label}</Text></Pressable>)}</View>
    <View style={s.preview}><Text style={s.previewEyebrow}>LIVE PREVIEW</Text><Text style={s.prompt}>“You have three tasks left today.”</Text><Text style={s.previewText}>{assistantStylePreview(personality)}</Text></View>
    <Pressable disabled={saving} onPress={save} style={({pressed})=>[s.save,(pressed||saving)&&{opacity:.6}]}><Text style={s.saveText}>{saving ? 'Saving…' : 'Save Assistant Style'}</Text></Pressable>
    <Text style={s.safety}>For financial, health, legal, safety, and other high-stakes topics, caution and uncertainty always take priority over personality.</Text>
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:20,gap:13},intro:{color:colors.muted,fontSize:16,lineHeight:23,marginBottom:5},heading:{color:colors.ink,fontSize:19,fontWeight:'800',marginTop:7},option:{...card,padding:15,flexDirection:'row',alignItems:'center',gap:12},selected:{backgroundColor:colors.green,borderColor:colors.green},optionText:{flex:1,gap:3},label:{color:colors.ink,fontWeight:'700',fontSize:16},description:{color:colors.muted,lineHeight:19},selectedText:{color:colors.white},radio:{fontSize:20,color:colors.muted},lengths:{flexDirection:'row',gap:8},length:{flex:1,backgroundColor:colors.white,borderWidth:1,borderColor:colors.border,borderRadius:14,paddingVertical:13,alignItems:'center'},preview:{...card,gap:9,marginTop:8},previewEyebrow:{color:colors.green,fontWeight:'800',fontSize:12,letterSpacing:1},prompt:{color:colors.muted,fontStyle:'italic'},previewText:{color:colors.ink,fontSize:17,lineHeight:24,fontWeight:'600'},save:{backgroundColor:colors.green,borderRadius:14,padding:16,alignItems:'center'},saveText:{color:colors.white,fontWeight:'800',fontSize:16},safety:{color:colors.muted,fontSize:13,lineHeight:19,textAlign:'center',paddingHorizontal:8}});
