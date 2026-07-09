import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useNotificationObserver() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
const responseListener = useRef<Notifications.Subscription | null>(null);


  useEffect(() => {
    // App is foregrounded and notification arrives
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // User taps the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.route) router.push(data.route as any);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}