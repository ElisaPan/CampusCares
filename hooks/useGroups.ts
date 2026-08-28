import * as api from '@/api';
import { useUserStore } from '@/hooks/useUserStore';
import { OrganizationType } from '@/types';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export function useGroups() {
  const { currentUser, organizations, setCurrentUser, setStudents, students } = useUserStore();
  
  const joinOrg = useCallback(async (orgId: number) => {
    console.log("JOIN BUTTON PRESSED:", orgId);
    if (orgId === 15 && !currentUser?.admin) {
      Alert.alert('Not allowed', 'CampusCares organization is only joinable to team members.');
      return;
    }
    if (!currentUser || ( currentUser.organizationIds && currentUser.organizationIds.includes(orgId) )) return;

    const org = organizations.find((o) => o.id === orgId);
    const orgName = org?.name || 'this organization';

    try {
      console.log(
        "BEFORE:",
        currentUser.organizationIds
      );
      
      await api.registerForOrg({ user_id: currentUser.id, organization_id: orgId });

      const updatedUser = await api.getUser(currentUser.id);
      console.log(
        "AFTER:",
        updatedUser.organizationIds
      );
      console.log("JOINED ORG:", orgId);
      console.log(
        "BACKEND RETURNED ORGANIZATIONS:",
        updatedUser.organizationIds
      );
      
      setCurrentUser(updatedUser);
      setStudents(students.map((s) => (s.id === currentUser.id ? updatedUser : s)));
      
      Alert.alert('Success', `Successfully joined ${orgName}!`);
    } catch (e: any) {
      Alert.alert('Error', `Error joining organization: ${e.message}`);
    }
  }, [currentUser, organizations, students, setCurrentUser, setStudents]);

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
  }, [currentUser, organizations, students, setCurrentUser, setStudents ]);

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

  const getOrgsForUser = useCallback(async (userId: number): Promise<Number[]> => {
      try {
        const orgs = await api.getUserOrgs(userId);
        return orgs;
      } catch (error) {
        console.error('Error fetching orgs for user:', error);
        return [];
      }
    }, []);

  return { joinOrg, leaveOrg, refreshOrganizations, createOrg, getOrgsForUser };
}