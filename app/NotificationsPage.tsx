import { useFriendships } from '@/hooks/useFriendships';
import { useUserStore } from '@/hooks/useUserStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from "expo-router";
import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const NotificationsPage: React.FC = () => {
  const { friendshipsData, currentUser, setCurrentUser, updateCurrentUser, clearCurrentUser, students: allUsers } = useUserStore();
  const { handleRequestResponse, loadUserFriendships } = useFriendships();

  useEffect(() => {
    if (currentUser) {
      loadUserFriendships(currentUser.id);
    }
  }, [currentUser]);

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
                  // index !== receivedRequests.length - 1 && styles.requestDivider,
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

                  <Text style={styles.requestName}>{user.name}</Text>
                </View>

                <View style={styles.buttonGroup}>
                  <Pressable
                    onPress={() => handleRequestResponse(user.user_id, 'accepted')}
                    style={({ pressed }) => [
                      styles.confirmButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRequestResponse(user.user_id, 'declined')}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
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
    padding: 16,
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
    paddingBottom: 4,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: 8,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 4,
  },
  // requestDivider: {
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#E5E7EB',
  // },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
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
  requestName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginRight: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6B7280',
    paddingBottom: 8,
    paddingHorizontal: 14,
  },
  pressed: {
    opacity: 0.8,
  },
});