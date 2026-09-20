import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';


import { getCurrentOpportunities, getMultiOpps } from '@/api';
import PopupMessage from '@/components/PopupMessage';
import { CloneOpportunityProvider } from "@/context/CloneOpportunityContext";
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserStore } from '@/hooks/useUserStore';
import * as Notifications from 'expo-notifications';
import { useNotificationObserver } from '../hooks/useNotificationObserver';

// export const unstable_settings = {
//   anchor: '(tabs)',
// };

const queryClient = new QueryClient();

// controls how notifications appear while app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useNotificationObserver();
  const colorScheme = useColorScheme();
  const { popup, closePopup } = useUserStore();
  const { refreshOppsData, currentUser, setAllOpps } = useUserStore();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshOppsData();
      }
    });
    return () => subscription.remove();
  }, [currentUser?.id]);

  // const refreshOppsData = async () => {
  //   try {
  //     if (currentUser) {
  //       const [orgs, opps, multiopps, students] = await Promise.all([
  //         getOrgs(),
  //         getCurrentOpportunities(),
  //         getMultiOpps(),
  //         getUsers(),
  //       ]);
  //       setOrganizations(orgs);
  //       setStudents(students);
  //       setAllOpps([...opps, ...multiopps]);
  //     } else {
  //       const opps = await getCurrentOpportunities();
  //       const multiopps = await getMultiOpps();
  //       setAllOpps([...opps, ...multiopps]);
  //     }
  //   } catch (e) {
  //     console.error('Failed to refresh app data:', e);
  //   }
  // };

  useEffect(() => {
    Promise.all([getCurrentOpportunities(), getMultiOpps()])
      .then(([opps, multiopps]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingOpps = opps.filter((o) => new Date(o.date) >= today);
        setAllOpps([...upcomingOpps, ...multiopps]);
      })
      .catch((err) => {
        console.error('Failed to fetch current opportunities:', err.message, err);
      })
    } , []);

  const handlePopupClose = useCallback(() => {
    popup.onClose?.();
    closePopup();
  }, [popup.onClose, closePopup]);
  
  return (
    <CloneOpportunityProvider>
      <QueryClientProvider client={queryClient}>
        {/* <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> */}
          <View style={styles.container}>
            <View style={styles.content}>
              <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="AboutUs" options={{ headerShown: false }} />
                <Stack.Screen name="GroupsPage" options={{ headerShown: false }} />
                <Stack.Screen name="MyOpportunitiesPage" options={{ headerShown: false }} />
                <Stack.Screen name="NotificationsPage" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="friends/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="LoginPage" options={{ headerShown: false }} />
                <Stack.Screen name="SignUpPage" options={{ headerShown: false }} />
                <Stack.Screen name="RegisterPage" options={{ headerShown: false }} />
                <Stack.Screen name="HomePage" options={{ headerShown: false }} />
                <Stack.Screen name="WaiverScreen" options={{ headerShown: false }} />
              </Stack>
              <PopupMessage
                isOpen={popup.isOpen}
                title={popup.title}
                message={popup.message}
                type={popup.type}
                opportunityId={popup.opportunityId}
                onClose={handlePopupClose}
              />
            </View>
          </View>
          <StatusBar style="auto" />
        {/* </ThemeProvider> */}
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