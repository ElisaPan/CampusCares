import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { CloneOpportunityProvider } from "@/context/CloneOpportunityContext";
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
    <CloneOpportunityProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={styles.container}>
            <View style={styles.content}>
              <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="AboutUs" options={{ headerShown: false }} />
                <Stack.Screen name="MyOpportunitiesPage" options={{ headerShown: false }} />
                <Stack.Screen name="NotificationsPage" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="friends/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="LoginPage" options={{ headerShown: false }} />
                <Stack.Screen name="SignUpPage" options={{ headerShown: false }} />
                <Stack.Screen name="RegisterPage" options={{ headerShown: false }} />
                <Stack.Screen name="HomePage" options={{ headerShown: false }} />
              </Stack>
            </View>
          </View>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </CloneOpportunityProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // header: {
  //   paddingHorizontal: 16,
  //   backgroundColor: '#fff',
  //   zIndex: 1,

  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.2,
  //   shadowRadius: 4,
  //   elevation: 4,
  // },
  content: {
    flex: 1,
  },
});