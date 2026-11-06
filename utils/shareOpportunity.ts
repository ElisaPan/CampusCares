import { Alert, Share } from 'react-native';

// export type Shareable =
//   | { kind: 'opp'; id: number; name: string }
//   | { kind: 'multiopp'; id: number; name: string };
export type Shareable = {
  kind: 'opp' | 'multiopp';
  id: number;
  name: string;
  visibility?: number[] | null;
};

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

  const send = () =>
    Share.share({
      message: `${item.name}\nVolunteer with me on CampusCares!\n\n${url}`
    }).catch(() => {});

  if (!item.visibility?.length) {
    send();
    return;
  }

  Alert.alert(
    'Private event',
    `This is a private event. Users not in the selected groups will not be able to access the opportunity.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share anyway', onPress: send },
    ]
  );
}