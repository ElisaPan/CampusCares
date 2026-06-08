import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import Header from '@/components/header';
import UserContext from '@/components/user-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { User } from '@/types';


export const unstable_settings = {
  anchor: '(tabs)',
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [students, setStudents] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.container}>
          <UserContext.Provider value={{ students, currentUser }}>
            <View style={styles.header}>
              <Header />
            </View>
          </UserContext.Provider>
          <View style={styles.content}>
            <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="AboutUs" />
              <Stack.Screen name="MyOpportunitiesPage" />
              <Stack.Screen name="NotificationsPage" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="friends/[id]" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </View>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: '#fff',

    boxShadow: '0px 2px 4px rgba(0,0,0,0.12)',
    elevation: 4,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});