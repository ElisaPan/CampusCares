import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="EventsPage"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="calendar"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="GroupsPage"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="groups"
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="LeaderboardPage"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="leaderboard"
              size={28}
              color={color}
            />
          ),
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
        }}
      />

      <Tabs.Screen
        name="AdminPage"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="admin-panel-settings"
              size={28}
              color={color}
            />
          ),
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