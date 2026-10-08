import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
  label?: string;
  textSize?: number;
  color?: string;
}

export function BackButton({ onPress, label="Back", textSize = 14, color = '#374151' }: BackButtonProps) {
  return (
    <Pressable
      style={styles.container}
      onPress={onPress ?? (() => router.back())}
      hitSlop={10}
    >
      <MaterialIcons name='chevron-left' size={textSize} color={color} />
      <Text style={[styles.label, { fontSize: textSize, color }]}>{label}</Text>
    </Pressable>
  )
}

export default BackButton


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
    gap: 4,
  },
  label: {
    fontWeight: '400',
  },
});