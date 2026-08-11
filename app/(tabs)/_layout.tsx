import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserStore } from '@/hooks/useUserStore';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { currentUser } = useUserStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarButton: HapticTab,
        tabBarStyle: currentUser ? { paddingTop: 10, height: 70 } : { display: 'none' },
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

      {currentUser &&
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
      }

      <Tabs.Screen
        name="OpportunityDetailPage"
        options={{
          href: null,
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="MultiOppDetailPage"
        options={{
          href: null,
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="UserProfile"
        options={{
          href: null,
          headerShown: false
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