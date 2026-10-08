import * as Linking from 'expo-linking';
import { Share } from 'react-native';

export type Shareable =
  | { kind: 'opp'; id: number; name: string }
  | { kind: 'multiopp'; id: number; name: string };

const ROUTES = {
  opp: '/OpportunityDetailPage',
  multiopp: '/MultiOppDetailPage',
} as const;

export async function shareOpportunity(item: Shareable) {
  const url = Linking.createURL(ROUTES[item.kind], {
    queryParams: { id: String(item.id) },
  });


  try {
    await Share.share({
      message: `Check out "${item.name}" on CampusCares! ${url}`,
    });
  } catch {}
}