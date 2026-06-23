import { FriendshipStatus, FriendshipsResponse, User } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getProfilePictureSource } from '@/api';
import { mockUsers } from '@/data/initialData';
interface FriendsPageProps {
  students: User[];
  currentUser: User;
  handleFriendRequest: (toUserId: number) => void;
  handleRemoveFriend: (friendId: number) => void;
  friendshipsData: FriendshipsResponse | null;
  checkFriendshipStatus: (otherUserId: number) => Promise<FriendshipStatus>;
  getFriendsForUser: (userId: number) => Promise<User[]>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const FriendsPage: React.FC<FriendsPageProps> = (props) => {
  const {
    students,
    currentUser,
    handleFriendRequest,
    handleRemoveFriend,
    friendshipsData,
    checkFriendshipStatus,
    getFriendsForUser,
    setCurrentUser,
  } = props;

  const USE_MOCKS = false;
  
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  const isLoading = !USE_MOCKS && !currentUser;
  if (isLoading) {
    return (
      <View>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const sourceUsers = USE_MOCKS ? mockUsers : students;

  const profileUser =
    parsedId !== null
      ? sourceUsers.find((u) => u.id === parsedId)
      : currentUser;

  if (!profileUser) return <Text>User not found</Text>;

  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('add');
  const [profileUserFriends, setProfileUserFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
      const loadFriends = async () => {
      setLoadingFriends(true);
      try {
        const friends = USE_MOCKS
          ? mockUsers.filter((u) => profileUser.friendIds?.includes(u.id))
          : await getFriendsForUser(profileUser.id);
        setProfileUserFriends(friends);
      } catch (error) {
        setProfileUserFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    };
      loadFriends();
    }, [profileUser?.id]);

  const Friend = ({ user }: { user: User }) => (
    <Pressable
      style={styles.friendCard}
      onPress={() => router.push(`/profile/${user.id}`)}
    >
      {user.profile_image ? (
        <Image
          source={getProfilePictureSource(user.profile_image, user.photoURL)}
          style={styles.friendAvatar}
        />
      ) : (
        <View style={styles.friendAvatarFallback}>
          <Text style={styles.friendAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{user.name}</Text>
      </View>
      
      { isEditing && (
        <Pressable
          style={styles.followButton}
          onPress={() => handleRemoveFriend}
        >
          <Text style={styles.followButtonText}>Remove</Text>
        </Pressable>
      )}
    </Pressable>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.pageTop}>
        <Text style={styles.pageTitle}>Friends</Text>
        { !isEditing ? (
          <Pressable
            onPress={() => setIsEditing(true)}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnTxt}>Edit</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setIsEditing(false)}
            style={styles.cancelEditBtn}
          >
            <Text style={styles.cancelEditBtnTxt}>Done</Text>
          </Pressable>
        )}
      </View>
      
      {loadingFriends ? (
        <Text>Loading friends...</Text>
        ) : profileUserFriends.length > 0 ? (
          <FlatList
            data={profileUserFriends}
            keyExtractor={(friend) => friend.id.toString()}
            renderItem={({ item }) => (
              <Friend user={item} />
            )}
          />
        ) : (
          <Text>{profileUser.name} hasn't added any friends yet.</Text>
      )}
    </View>
  );
}

export default FriendsPage;

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  pageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  editBtn: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 34,
  },
  editBtnTxt: {
    color: 'white',
    fontWeight: '700',
    marginVertical: 'auto',
    marginHorizontal: 'auto'
  },
  cancelEditBtn: {
    backgroundColor: 'rgb(22, 163, 74)',
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 34,
  },
  cancelEditBtnTxt: {
    color: 'white',
    fontWeight: '700',
    marginVertical: 'auto',
    marginHorizontal: 'auto'
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginLeft: 4,
  },
  friendAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    marginLeft: 4,
  },
  friendAvatarText: {
    fontWeight: "700",
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
  },
  followButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  followButtonText: {
    fontWeight: "600",
    color: "#374151",
  },
});