import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { enabledAssistantAvatars } from '../config/assistantAvatars';
import { AssistantAvatar } from './AssistantAvatar';
import { colors } from '../theme';

export function AssistantAvatarPicker({ value, onChange }: { value?: string; onChange: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const cardSize = Math.min(174, Math.floor((width - 64) / 2));
  return <View style={styles.grid}>{enabledAssistantAvatars.map((avatar, index) => <AvatarOption key={avatar.id} id={avatar.id} index={index} size={cardSize} selected={value === avatar.id} onPress={onChange} />)}</View>;
}

function AvatarOption({ id, index, size, selected, onPress }: { id: string; index: number; size: number; selected: boolean; onPress: (id: string) => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const select = () => { onPress(id); Animated.sequence([Animated.timing(scale, { toValue: .97, duration: 80, useNativeDriver: true }), Animated.spring(scale, { toValue: 1, useNativeDriver: true })]).start(); };
  return <Animated.View style={{ transform: [{ scale }] }}><Pressable accessibilityRole="radio" accessibilityLabel={`Assistant option ${index + 1}`} accessibilityState={{ selected }} onPress={select} style={[styles.card, { width: size, height: size }, selected && styles.selected]}>
    <AssistantAvatar avatarId={id} size={size - 6} borderRadius={15} />
    {selected && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
  </Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  card: { padding: 3, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  selected: { borderColor: colors.green },
  check: { position: 'absolute', right: 9, top: 9, width: 27, height: 27, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  checkText: { color: colors.white, fontWeight: '900' },
});
