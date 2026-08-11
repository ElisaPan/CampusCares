import * as api from '@/api';
import { useUserStore } from '@/hooks/useUserStore';
import { OrganizationType } from '@/types';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export function useGroups() {
  const { currentUser, organizations, setCurrentUser, setStudents, students } = useUserStore();

  const joinOrg = useCallback(async (orgId: number) => {
    if (orgId === 15 && !currentUser?.admin) {
      Alert.alert('Not allowed', 'CampusCares organization is only joinable to team members.');
      return;
    }
    if (!currentUser || ( currentUser.organizationIds && currentUser.organizationIds.includes(orgId) )) return;

    const org = organizations.find((o) => o.id === orgId);
    const orgName = org?.name || 'this organization';

    try {
      await api.registerForOrg({ user_id: currentUser.id, organization_id: orgId });

      const updatedUser = await api.getUser(currentUser.id);
      console.log('updatedUser.organizationIds:', updatedUser.organizationIds);
      
      setCurrentUser(updatedUser);
      setStudents(students.map((s) => (s.id === currentUser.id ? updatedUser : s)));
      
      Alert.alert('Success', `Successfully joined ${orgName}!`);
    } catch (e: any) {
      Alert.alert('Error', `Error joining organization: ${e.message}`);
    }
  }, [currentUser, organizations, students]);

  const leaveOrg = useCallback(async (orgId: number) => {
    if (!currentUser || !currentUser.organizationIds || !currentUser.organizationIds.includes(orgId)) return;

    const org = organizations.find((o) => o.id === orgId);
    const orgName = org?.name || 'this organization';

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Leave Organization',
        `Are you sure you want to leave ${orgName}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Leave', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    try {
      await api.unregisterFromOrg({ user_id: currentUser.id, organization_id: orgId });

      const updatedUser = await api.getUser(currentUser.id);
      setCurrentUser(updatedUser);
      setStudents(students.map((s) => (s.id === currentUser.id ? updatedUser : s)));

      Alert.alert('Success', `Successfully left ${orgName}.`);
    } catch (e: any) {
      Alert.alert('Error', `Error leaving organization: ${e.message}`);
    }
  }, [currentUser, organizations, students]);

  const refreshOrganizations = async () => {
    const orgs = await api.getOrgs();
    useUserStore.getState().setOrganizations(orgs);
  };

  const createOrg = async (orgName: string, type: OrganizationType, description?: string) => {
    if (!currentUser) return;
    try {
      const newOrg = await api.createOrg({
        name: orgName,
        type,
        description,
        host_user_id: currentUser.id,
        date_created: api.formatRegistrationDate(),
      });

      await refreshOrganizations(); 


      try {
        await joinOrg(newOrg.id);
      } catch {
        // not approved yet — ignore
      }
    } catch (e: any) {
      Alert.alert('Error', `Error creating organization: ${e.message}`);
    }
  };

  return { joinOrg, leaveOrg, refreshOrganizations, createOrg };
}