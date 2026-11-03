const ROUTES = {
  opp: '/OpportunityDetailPage',
  multiopp: '/MultiOppDetailPage',
} as const;

const WEB_TO_KIND = {
  opportunity: 'opp',
  multiopp: 'multiopp',
} as const;

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path, 'https://www.campuscares.us');
    const match = url.pathname.match(/^\/(opportunity|multiopp)\/([^/]+)/);

    if (match) {
      const kind = WEB_TO_KIND[match[1] as keyof typeof WEB_TO_KIND];
      return `${ROUTES[kind]}?id=${encodeURIComponent(match[2])}`;
    }
  } catch {}

  return path;
}