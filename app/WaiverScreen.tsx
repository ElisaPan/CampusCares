// app/WaiverScreen.tsx (or Waiver.tsx if renamed)
import { TopFade } from '@/components/TopFade';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Waiver from '../components/carpool/Waiver';

export default function WaiverScreen() {
  const { type, opportunityId } = useLocalSearchParams<{
    type: 'carpool' | 'org';
    opportunityId: string;
  }>();

  return (
    <View style={{ flex: 1 }}>
      <Waiver
        type={type ?? 'carpool'}
        opportunityId={opportunityId}
      />
      <TopFade />
    </View>
  );
}