import * as api from '@/api';
import { useUserStore } from '@/hooks/useUserStore';
import { FriendshipStatus, User } from '@/types';
import { useCallback } from 'react';
import { Alert } from 'react-native';

export function useFriendships() {
  const { currentUser, friendshipsData, setFriendshipsData, students } = useUserStore();

  // Send friend request
  const handleSendFriendRequest = async (friendId: number) => {
    if (!currentUser || friendId === currentUser.id) return;
    try {
      await api.sendFriendRequest(currentUser.id, friendId);
      Alert.alert(`Friend request sent to ${students.find((s) => s.id === friendId)?.name}!`);
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      Alert.alert(`Error sending friend request: ${e.message}`);
    }
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (otherUserId: number) => {
    if (!currentUser) return;
    try {
      const friendshipId = await api.getFriendshipId(currentUser.id, otherUserId);
      if (!friendshipId) {
        Alert.alert('Could not find friendship to accept');
        return;
      }
      await api.acceptFriendRequest(friendshipId);
      Alert.alert('Friend request accepted!');
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      Alert.alert(`Error accepting friend request: ${e.message}`);
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (otherUserId: number) => {
    if (!currentUser) return;
    try {
      const friendshipId = await api.getFriendshipId(currentUser.id, otherUserId);
      if (!friendshipId) {
        Alert.alert('Could not find friendship to delete');
        return;
      }
      await api.rejectFriendRequest(friendshipId);
      Alert.alert('Friend request deleted.');
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      Alert.alert(`Error deleting friend request: ${e.message}`);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: number) => {
    if (!currentUser) return;
    try {
      await api.removeFriend(currentUser.id, friendId);
      Alert.alert('Friend removed successfully.');
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      Alert.alert(`Error removing friend: ${e.message}`);
    }
  };

  const handleRequestResponse = (requestId: number, response: 'accepted' | 'declined') => {
    if (!currentUser) return;
    if (response === 'accepted') {
      handleAcceptFriendRequest(requestId);
    } else {
      handleRejectFriendRequest(requestId);
    }
  };

  const loadUserFriendships = async (userId: number) => {
    if (!currentUser) return;
    try {
      const response = await api.getUserFriendships(userId);
      setFriendshipsData(response);
    } catch (e: any) {
      console.error('Error loading friendships:', e.message);
      setFriendshipsData(null);
    }
  };

  // Get friends for any user (for viewing other profiles)
  const getFriendsForUser = useCallback(async (userId: number): Promise<User[]> => {
    try {
      const friends = await api.getAcceptedFriendships(userId);
      return friends;
    } catch (error) {
      console.error('Error fetching friends for user:', error);
      return [];
    }
  }, []);

  const checkFriendshipStatus = async (otherUserId: number): Promise<FriendshipStatus> => {
    if (!currentUser || !friendshipsData) return 'add';
    const userData = friendshipsData.users.find((user) => user.user_id === otherUserId);
    return userData ? userData.friendship_status : 'add';
  };

  const pendingRequestCount = friendshipsData && currentUser
    ? friendshipsData.users.filter((u) => u.friendship_status === 'received').length
    : 0;

  return { handleSendFriendRequest, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend, handleRequestResponse, loadUserFriendships, checkFriendshipStatus, getFriendsForUser, pendingRequestCount };
}