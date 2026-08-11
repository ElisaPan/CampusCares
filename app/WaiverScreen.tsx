// app/WaiverScreen.tsx (or Waiver.tsx if renamed)
import { useLocalSearchParams } from 'expo-router';
import Waiver from '../components/carpool/Waiver';

export default function WaiverScreen() {
  const { type, opportunityId } = useLocalSearchParams<{
    type: 'carpool' | 'org';
    opportunityId: string;
  }>();

  return (
    <Waiver
      type={type ?? 'carpool'}
      opportunityId={opportunityId}
    />
  );
}