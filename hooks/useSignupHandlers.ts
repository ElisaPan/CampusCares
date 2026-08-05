import * as api from '@/api';
import { useUserStore } from '@/hooks/useUserStore';
import { isOpportunity } from '@/utils/isOpp';
import { canUnregisterFromOpportunity, formatTimeUntilEvent } from '@/utils/timeUtils';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export function useSignupHandlers(
  setShowCarpoolPopup?: (id: number | null) => void,
) {
  const { currentUser, signups, setSignups, allOpps, setAllOpps, showPopup } = useUserStore();
  const opportunities = allOpps.filter(isOpportunity);

  const handleSignUp = useCallback(async (opportunityId: number) => {
    if (!currentUser) return;

    try {
      const availabilityCheck = await api.checkOpportunityAvailability(opportunityId);

      if (availabilityCheck.is_full) {
        showPopup?.(
          'Opportunity Full',
          'This opportunity has recently filled up. We apologize for the inconvenience. Please check back later or look for other opportunities to get involved!',
          'warning'
        );
        const updatedOpps = await api.getCurrentOpportunities();
        const multiopps = allOpps.filter((o) => !isOpportunity(o));
        setAllOpps([...updatedOpps, ...multiopps]);
        return;
      }

      // Optimistic update
      setSignups([...signups, { userId: currentUser.id, opportunityId }]);

      await api.registerForOpp({ user_id: currentUser.id, opportunity_id: opportunityId });

      // Refresh opportunities
      const updatedOpps = await api.getCurrentOpportunities();
      const multiopps = allOpps.filter((o) => !isOpportunity(o));
      setAllOpps([...updatedOpps, ...multiopps]);

      const opportunity = await api.getOpportunity(opportunityId);
      if (opportunity.allow_carpool) {
        setShowCarpoolPopup?.(opportunity.id);
      } else {
        showPopup?.(
          'Thank you for signing up!',
          'Thank you for signing up for this opportunity. The event host may reach out to you with further details. Please arrive at the listed address at the designated time. Thank you for serving!\n\nInvite friends to serve with you!',
          'success',
          opportunityId
        );
      }
    } catch (e: any) {
      console.error('Error in handleSignUp:', e);
      setSignups(signups.filter((s) => !(s.userId === currentUser.id && s.opportunityId === opportunityId)));
      Alert.alert('Error signing up', e.message);
    }
  }, [currentUser, signups, allOpps]);

  const handleUnSignUp = useCallback(async (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ): Promise<boolean> => {
    if (!currentUser) return false;

    const opportunity = opportunities.find((opp) => opp.id === opportunityId);
    const isAdminOrHost = currentUser.admin || (opportunity && opportunity.host_id === currentUser.id);

    let confirmMessage = 'Are you sure you want to unregister from this opportunity? If you unregister within 7 hours of the event, an email will be sent to the event organizer.';

    if (opportunityDate && opportunityTime && !isAdminOrHost) {
      const { canUnregister, hoursUntilEvent } = canUnregisterFromOpportunity(
        opportunityDate,
        opportunityTime
      );
      if (!canUnregister) {
        confirmMessage += `\n\nYou are within 7 hours of the scheduled start (${formatTimeUntilEvent(hoursUntilEvent)}). If this was a mistake, contact the event organizer after canceling.`;
      }
    }

    // Replace requestUnregisterConfirm with RN Alert
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Unregister from this opportunity?',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Unregister', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return false;

    const originalSignups = [...signups];
    setSignups(signups.filter((s) => !(s.userId === currentUser.id && s.opportunityId === opportunityId)));

    try {
      await api.unregisterForOpp({
        user_id: currentUser.id,
        opportunity_id: opportunityId,
        opportunityDate,
        opportunityTime,
        isAdminOrHost,
      });

      // Refresh opportunities
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
  }, [currentUser, opportunities, signups, allOpps]);

  return { handleSignUp, handleUnSignUp };
}