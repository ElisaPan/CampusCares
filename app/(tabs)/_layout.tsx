import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { getOrgs } from '@/api';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserStore } from '@/hooks/useUserStore';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { setOrganizations } = useUserStore();
  useEffect(() => {
    getOrgs().then(setOrganizations).catch(console.error);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 12,
          // height: 0,
        },
      }}
    >
      <Tabs.Screen
        name="OpportunitiesPage"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="calendar"
              size={28}
              color={color}
            />
          ),
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="GroupsPage"
        options={{
          // title: 'Groups',
          // tabBarIcon: ({ color }) => (
          //   <MaterialIcons
          //     name="groups"
          //     size={28}
          //     color={color}
          //   />
          // ),
          // headerShown: false
          href: null
        }}
      />

      <Tabs.Screen
        name="LeaderboardPage"
        options={{
          // title: 'Leaderboard',
          // tabBarIcon: ({ color }) => (
          //   <MaterialIcons
          //     name="leaderboard"
          //     size={28}
          //     color={color}
          //   />
          // ),
          // headerShown: false
          href: null
        }}
      />

      <Tabs.Screen
        name="ProfilePage"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="person"
              size={28}
              color={color}
            />
          ),
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="AdminPage"
        options={{
          // title: 'Admin',
          // tabBarIcon: ({ color }) => (
          //   <MaterialIcons
          //     name="admin-panel-settings"
          //     size={28}
          //     color={color}
          //   />
          // ),
          // headerShown: false
          href: null
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}