// components/ShareBubble.tsx
import { Shareable, shareOpportunity } from '@/utils/shareOpportunity';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

type Props = {
  item: Shareable;
  size?: number;
};

export default function ShareOpportunity({ item, size = 30 }: Props) {
  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    shareOpportunity(item);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Share this opportunity"
      style={({ pressed }) => [
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && { opacity: 1, transform: [{ scale: 0.95 }] },
      ]}
    >
      <Ionicons name="share-outline" size={size * 0.55} color="#1B2430" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});