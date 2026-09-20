import { FeedItem, FeedOrderItem, MultiOpp, Opportunity, User } from '../types';

export interface BuildFeedItemsArgs {
  opportunities: Opportunity[];
  multiopps: MultiOpp[];
  currentUser: User | null;
  feedOrder?: FeedOrderItem[] | null;
  invisibleMultioppIds?: number[] | null;
  now?: Date;
}

const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const parseLocalDateTime = (dateStr: string, timeStr?: string | null): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh = 0, mm = 0] = (timeStr ?? '').split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
};

/**
 * Builds the ordered opportunity/multiopp feed shared by the Opportunities and
 * Explore pages: approved and upcoming standalone opps plus visible multiopps,
 * sorted by the admin feed order and then chronologically.
 */
export const buildFeedItems = ({
  opportunities,
  multiopps,
  currentUser,
  feedOrder,
  invisibleMultioppIds,
  now = new Date(),
}: BuildFeedItemsArgs): FeedItem[] => {
  const isLoggedOut = !currentUser;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Filter standalone opps (approved, upcoming, visible, not part of a multiopp)
  const standaloneOpps = opportunities
    .map((opp) => {
      const localDate = parseLocalDate(opp.date);
      const fullDateTime = parseLocalDateTime(opp.date, opp.time);
      return { ...opp, localDate, fullDateTime };
    })
    .filter((opp) => {
      if (!opp.approved) return false;
      if (opp.multiopp) return false;
      if (opp.localDate < today) return false;
      if (!opp.visibility || opp.visibility.length === 0) return true;
      if (isLoggedOut) return false;
      if (currentUser.admin) return true;
      const userOrgIds = currentUser.organizationIds ?? [];
      return opp.visibility.some((id) => userOrgIds.includes(id));
    });

  // Filter visible multiopps (excluding invisible ones set by admin)
  const invisibleSet = new Set(invisibleMultioppIds ?? []);
  const visibleMultiOpps = invisibleMultioppIds === null ? [] : multiopps
    .filter((m) => {
      if (!m.approved) return false;
      if (invisibleSet.has(m.id)) return false;
      const hasUpcoming = (m.opportunities ?? []).some(
          (o) => parseLocalDate(o.date) >= today
        );
      if (!hasUpcoming) return false;
      if (!m.visibility || m.visibility.length === 0) return true;
      if (!currentUser) return false;
      if (currentUser.admin) return true;
      const userOrgIds = currentUser.organizationIds || [];
      return m.visibility.some((orgId) => userOrgIds.includes(orgId));
    });

  // Build position lookup from feedOrder — key: `${is_multiopp}-${id}`
  const positionMap = new Map<string, number>(
    (feedOrder ?? []).map((item, i) => [`${item.is_multiopp}-${item.id}`, i])
  );

  const oppItems: FeedItem[] = standaloneOpps.map((opp) => ({ kind: 'opp', data: opp }));
  const multiItems: FeedItem[] = visibleMultiOpps.map((m) => ({ kind: 'multiopp', data: m }));

  const sortTime = (item: FeedItem) =>
    item.kind === 'opp'
      ? (item.data as (typeof standaloneOpps)[0]).fullDateTime.getTime()
      : parseLocalDate(item.data.date).getTime();
    
  return [...oppItems, ...multiItems].sort((a, b) => {
    const posA = positionMap.get(`${a.kind === 'multiopp'}-${a.data.id}`) ?? Infinity;
    const posB = positionMap.get(`${b.kind === 'multiopp'}-${b.data.id}`) ?? Infinity;
    if (posA !== posB) return posA - posB;
    return sortTime(a) - sortTime(b);
  });
};
