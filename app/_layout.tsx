import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [students, setStudents] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
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
          </Stack>
        </View>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    backgroundColor: '#fff',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});