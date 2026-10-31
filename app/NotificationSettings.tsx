import {
  NotificationPrefs,
  NotificationType,
  getNotificationPrefs,
  updateNotificationPref,
} from "@/api";
import BackButton from '@/components/BackButton';
import { TopFade } from '@/components/TopFade';

import * as Notifications from "expo-notifications";
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Item = { key: NotificationType; label: string; desc?: string };
type Section = { title: string; items: Item[] };

// UI grouping only. Leave out any type you put in ALWAYS_SEND on the backend.
const SECTIONS: Section[] = [
  {
    title: "Events you've joined",
    items: [
      { key: "event_reminders", label: "Reminders", desc: "Before an event you signed up for" },
      { key: "event_updates", label: "Event changes", desc: "Time, location, or cancellations" },
      { key: "event_announcements", label: "Announcements", desc: "Posts from organizers and participants" },
      { key: "attendance_confirmation", label: "Attendance confirmation", desc: "After an event" },
    ],
  },
  {
    title: "Rides",
    items: [
      { key: "ride_requests", label: "Ride reminders", desc: "When an event has no rides yet" },
    ],
  },
  {
    title: "Friends",
    items: [
      { key: "friend_request", label: "Friend requests" },
      { key: "friend_activity", label: "Friend activity", desc: "When a friend signs up for an event" },
    ],
  },
  {
    title: "Discover",
    items: [
      { key: "new_opp_my_orgs", label: "Your organizations", desc: "New opportunities from orgs you're in" },
      { key: "new_opp_suggested", label: "Suggested", desc: "New opportunities from orgs you've attended before" },
    ],
  },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [error, setError] = useState(false);
  const [osAllowed, setOsAllowed] = useState(true);

  const load = useCallback(async () => {
    try {
      setError(false);
      setPrefs(await getNotificationPrefs());
    } catch (err: any) {
      console.error("load prefs failed:", err?.message, err?.response?.status, err?.response?.data);
      setError(true);
    }
  }, []);

  const checkOsPermission = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setOsAllowed(status === "granted");
  }, []);

  useEffect(() => {
    load();
    checkOsPermission();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkOsPermission();
    });
    return () => sub.remove();
  }, [load, checkOsPermission]);

  const toggle = async (type: NotificationType, value: boolean) => {
    setPrefs((p) => (p ? { ...p, [type]: value } : p));
    try {
      setPrefs(await updateNotificationPref(type, value));
    } catch {
      setPrefs((p) => (p ? { ...p, [type]: !value } : p));
      Alert.alert("Couldn't save", "Please try again.");
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load your settings.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!prefs) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingBottom: 28 }}>
      <ScrollView style={styles.container}>
        <BackButton
          label={`Back to Profile`}
        />
        {!osAllowed && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Notifications are turned off for this app in your phone's settings,
              so you won't receive any of these.
            </Text>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.link}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item.key} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.label}>{item.label}</Text>
                  {!!item.desc && <Text style={styles.desc}>{item.desc}</Text>}
                </View>
                <Switch
                  value={prefs[item.key] ?? true}
                  onValueChange={(v) => toggle(item.key, v)}
                />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <TopFade />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  section: {
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderRadius: 12,
    backgroundColor: "#FFF",

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    paddingRight: 12
  },
  label: {
    fontSize: 16,
    color: "#111827"
  },
  desc: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2 },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fef3c7",

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 1,
  },
  bannerText: {
    color: "#92400e",
    marginBottom: 6
  },
  link: {
    color: "#B31B1B",
    fontWeight: "600"
  },
  errorText: {
    marginBottom: 8,
    color: "#111827"
  },
});