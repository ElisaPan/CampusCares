import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

interface TopFadeProps {
  height?: number;
  color?: string;
}

export function TopFade({ height = 70, color = '255,255,255' }: TopFadeProps) {
  return (
    <LinearGradient
      colors={[`rgba(${color},1)`, `rgba(${color},0)`]}
      style={[styles.fade, { height }]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});