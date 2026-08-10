import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { getAssistantAvatar } from '../config/assistantAvatars';
import { colors } from '../theme';

export const assistantAvatarSizes = { tiny: 32, small: 48, medium: 72, large: 120 } as const;

type Props = {
  avatarId?: string | null;
  size: number | keyof typeof assistantAvatarSizes;
  borderRadius?: number;
  showBorder?: boolean;
  selected?: boolean;
};

export function AssistantAvatar({ avatarId, size, borderRadius, showBorder = false, selected = false }: Props) {
  const pixels = typeof size === 'number' ? size : assistantAvatarSizes[size];
  const radius = borderRadius ?? Math.round(pixels * .24);
  return <View style={[styles.frame, { width: pixels, height: pixels, borderRadius: radius }, (showBorder || selected) && styles.border, selected && styles.selected]}>
    <Image source={getAssistantAvatar(avatarId)} resizeMode="cover" fadeDuration={0} style={{ width: '100%', height: '100%', borderRadius: Math.max(0, radius - 2) }} />
  </View>;
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.border },
  border: { borderWidth: 2, borderColor: colors.border },
  selected: { borderColor: colors.green },
});
