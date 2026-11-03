import { Share } from 'react-native';

export type Shareable =
  | { kind: 'opp'; id: number; name: string }
  | { kind: 'multiopp'; id: number; name: string };

const ROUTES = {
  opp: '/OpportunityDetailPage',
  multiopp: '/MultiOppDetailPage',
} as const;

const WEB_BASE = 'https://www.campuscares.us';

const WEB_PATHS = {
  opp: 'opportunity',
  multiopp: 'multiopp',
} as const;

export async function shareOpportunity(item: Shareable) {
  const url = `${WEB_BASE}/${WEB_PATHS[item.kind]}/${encodeURIComponent(String(item.id))}`;
  // const url = Linking.createURL(ROUTES[item.kind], {
  //   queryParams: { id: String(item.id) },
  // });

  try {
        await Share.share({ message: `${item.name}\nVolunteer with me on CampusCares!\n\n${url}` });
  } catch {}
}