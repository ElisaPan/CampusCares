import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from "expo-router";
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FriendshipsResponse, User } from '../types';

interface NotificationsPageProps {
  friendshipsData: FriendshipsResponse | null;
  allUsers: User[];
  handleRequestResponse: (requestId: number, response: 'accepted' | 'declined') => void;
  currentUser: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({
  friendshipsData,
  allUsers,
  handleRequestResponse,
  currentUser,
}) => {
  const receivedRequests =
    friendshipsData?.users.filter((user) => user.friendship_status === 'received') ?? [];

  return (
    <ScrollView style={styles.container}>
      <Pressable
        style={styles.backWrapper}
        onPress={() => router.back()}
      >
        <MaterialIcons name='chevron-left' size={18} color='#374151' />
        <Text style={styles.backTxt}>Back</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Notifications</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Friend Requests</Text>

        {receivedRequests.length > 0 ? (
          <View>
            {receivedRequests.map((user, index) => (
              <View
                key={user.user_id}
                style={[
                  styles.requestRow,
                  index !== receivedRequests.length - 1 && styles.requestDivider,
                ]}
              >
                <View style={styles.leftSection}>
                  {user.profile_image ? (
                    <Image
                      source={{ uri: user.profile_image }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.requestText}>
                    <Text style={styles.requestName}>{user.name}</Text> wants to be your friend.
                  </Text>
                </View>

                <View style={styles.buttonGroup}>
                  <Pressable
                    onPress={() => handleRequestResponse(user.user_id, 'accepted')}
                    style={({ pressed }) => [
                      styles.acceptButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRequestResponse(user.user_id, 'declined')}
                    style={({ pressed }) => [
                      styles.declineButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No new friend requests.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default NotificationsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  backWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
    gap: 4,
  },
  backTxt: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '400',
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginRight: 12,
  },
  requestDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarFallbackText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
  requestText: {
    color: '#111827',
    flexShrink: 1,
  },
  requestName: {
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginRight: 8,
  },
  acceptButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  declineButtonText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  emptyText: {
    color: '#6B7280',
  },
  pressed: {
    opacity: 0.8,
  },
});