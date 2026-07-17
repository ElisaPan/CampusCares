import { MultiOpp, Opportunity } from '@/types';
import * as api from '../api';
import { useUserStore } from './useUserStore';

function isOpportunity(opp: Opportunity | MultiOpp): opp is Opportunity {
  return 'allow_carpool' in opp;
}

export function useSignupHandlers() {
  const { currentUser, signups, setSignups, allOpps, setAllOpps } = useUserStore();
  const opportunities = allOpps.filter(isOpportunity);

  const handleSignUp = async (opportunityId: number) => {
    if (!currentUser) return;

    setSignups([...signups, { userId: currentUser.id, opportunityId }]); // optimistic

    try {
      await api.registerForOpp({ user_id: currentUser.id, opportunity_id: opportunityId });

      // Refresh opportunities to get updated involved_users
      const updatedOpps = await api.getCurrentOpportunities(); // adjust name to match your api.ts
      const multiopps = allOpps.filter((o) => !isOpportunity(o));
      setAllOpps([...updatedOpps, ...multiopps]);
    } catch (e: any) {
      console.error('Error in handleSignUp:', e);
      setSignups(signups.filter((s) => !(s.userId === currentUser.id && s.opportunityId === opportunityId)));
      Alert.alert('Error signing up', e.message);
    }
  };

  const handleUnSignUp = async (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ): Promise<boolean> => {
    if (!currentUser) return false;

    const opportunity = opportunities.find((opp) => opp.id === opportunityId);
    const isAdminOrHost = currentUser.admin || (opportunity && opportunity.host_id === currentUser.id);

    const originalSignups = [...signups];
    setSignups(signups.filter((s) => !(s.userId === currentUser.id && s.opportunityId === opportunityId))); // optimistic

    try {
      await api.unregisterForOpp({
        user_id: currentUser.id,
        opportunity_id: opportunityId,
        opportunityDate,
        opportunityTime,
        isAdminOrHost,
      });

      const updatedOpps = await api.getCurrentOpportunities();
      const multiopps = allOpps.filter((o) => !isOpportunity(o));
      setAllOpps([...updatedOpps, ...multiopps]);

      return true;
    } catch (e: any) {
      console.error('Error in handleUnSignUp:', e);
      setSignups(originalSignups);
      Alert.alert('Error un-registering', e.message);
      return false;
    }
  };

  return { handleSignUp, handleUnSignUp };
}