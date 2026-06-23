/*************
 * TODO:
 *  Severe:
 *    Do GroupsPage via `Manage Orgs` button
 *  High:
 *    Fix friend profile link when click on friend card
 *    Fix terms and conditions link
 *    Fix service journal link
 *    Fix user sub/unsub function
 *  Low
 *    -
 */

import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { getProfilePictureSource, updateUser } from '@/api';
import { auth } from '@/firebase-config';
import {
  Badge,
  FriendshipStatus,
  FriendshipsResponse,
  Opportunity,
  Organization,
  SignUp,
  User
} from '@/types';
import { router, useLocalSearchParams } from 'expo-router';

import * as Theme from '@/constants/theme';
import { mockOpportunities, mockOrganizations, mockSignups, mockUsers } from '@/data/initialData';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

interface ProfilePageProps {
  students: User[];
  signups: SignUp[];
  organizations: Organization[];
  opportunities: Opportunity[];
  initialBadges: Badge[];
  currentUser: User;
  updateInterests: (interests: string[]) => void;
  updateProfilePicture: (file: File) => void;
  handleFriendRequest: (toUserId: number) => void;
  handleRemoveFriend: (friendId: number) => void;
  friendshipsData: FriendshipsResponse | null;
  checkFriendshipStatus: (otherUserId: number) => Promise<FriendshipStatus>;
  getFriendsForUser: (userId: number) => Promise<User[]>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  allTimeMyOpps: Opportunity[];
  setAllTimeMyOpps: React.Dispatch<React.SetStateAction<Opportunity[]>>;
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
  //const { id } = useLocalSearchParams<{ id: string }>();
  const {
    students,
    signups,
    organizations,
    opportunities,
    initialBadges,
    currentUser,
    updateInterests,
    updateProfilePicture,
    handleFriendRequest,
    handleRemoveFriend,
    friendshipsData,
    checkFriendshipStatus,
    getFriendsForUser,
    setCurrentUser,
    allTimeMyOpps,
    setAllTimeMyOpps,
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

  const baseUser =
    parsedId !== null
      ? students?.find((s) => s.id === parsedId)
      : currentUser;

  const profileUser = USE_MOCKS ? mockUsers[0] : baseUser;

  if (!profileUser) return <Text>User not found</Text>;

  const safeSignups = USE_MOCKS ? mockSignups : signups ?? [];
  const safeOrganizations = USE_MOCKS ? mockOrganizations : organizations ?? [];
  const safeOpportunities = USE_MOCKS ? mockOpportunities : opportunities ?? [];

  const isCurrentUser = USE_MOCKS ? true : profileUser.id === currentUser?.id;
  const userSignups = safeSignups.filter((s) => s.userId === profileUser.id);
  const userOrgs = safeOrganizations.filter((g) => profileUser.organizationIds?.includes(g.id));

  const key = `${profileUser.id}-${profileUser._lastUpdate ?? 'no-update'}`;
  
  // const user = id ? students.find((s) => s.id === parseInt(id!)) : currentUser;
  // const profileUser = USE_MOCKS ? mockUsers[0] : user;
  // if (!profileUser) return <Text>User not found</Text>;

  // const safeSignups = USE_MOCKS ? mockSignups : signups ?? [];
  // const safeOrganizations = USE_MOCKS ? organizations : mockOrganizations;
  
  // const key = `${profileUser.id}-${profileUser._lastUpdate || 'no-update'}`;
  // const isCurrentUser = !!currentUser && profileUser.id === currentUser.id;
  // const userSignups = safeSignups.filter((s) => s.userId === profileUser.id);
  // const userOrgs = safeOrganizations.filter((g) =>
  //   profileUser.organizationIds?.includes(g.id)
  // );

  const profileUserPoints = profileUser?.points || 0;
  const hoursVolunteered = userSignups.reduce((total, signup) => {
    const opportunity = safeOpportunities.find((o) => o.id === signup.opportunityId);
    return total + (opportunity?.duration || 0);
  }, 0);

  // const earnedBadges = initialBadges.filter((b) =>
  //   b.threshold({
  //     points: profileUserPoints ?? 0,
  //     signUpCount: userSignups?.length ?? 0,
  //     signups: safeSignups ?? [],
  //     opportunities: safeOpportunities ?? [],
  //     friendsCount: profileUser.friendIds?.length ?? 0,
  //   })
  // );

  // Note: getFriendsForUser is now async, so we'll need to handle this differently
  // For now, we'll pass an empty array and handle the async loading in ProfilePage

  const [selectedInterests, setSelectedInterests] = useState(profileUser.interests);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('add');
  const [profileUserFriends, setProfileUserFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBio, setEditingBio] = useState(profileUser.bio || '');
  const [focusedBio, setFocusedBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [localUser, setLocalUser] = useState(profileUser); // Add local user state

  const { width } = useWindowDimensions();
  const isSmallScreen = width < 370;

  React.useEffect(() => {
  }, [localUser]);

  // Update selectedInterests when user.interests changes
  React.useEffect(() => {
    setSelectedInterests(profileUser.interests);
  }, [profileUser.interests]);

  // Update editingBio when profileUser.bio changes
  React.useEffect(() => {
    setEditingBio(profileUser.bio || '');
    setLocalUser(profileUser); // Update local user when user prop changes
  }, [profileUser]);

  // Check friendship status when component mounts or user changes
  useEffect(() => {
    if (!isCurrentUser && currentUser) {
      checkFriendshipStatus(profileUser.id).then(setFriendshipStatus);
    }
  }, [isCurrentUser, currentUser, profileUser.id, checkFriendshipStatus, friendshipsData]);

  useEffect(() => { }, [currentUser]);

    // Load friends when user changes
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

  // Load allTimeMyOpps when viewing the current user's own profile
  // useEffect(() => {
  //   if (!isCurrentUser || allTimeMyOpps.length > 0) return;
  //   getUserAllTimeOpps(currentUser.id)
  //     .then(setAllTimeMyOpps)
  //     .catch((err) => console.error('Error loading allTimeMyOpps:', err));
  // }, [isCurrentUser, currentUser?.id]);

  const handlePickProfilePhoto = async () => {
    try {
      setUploadingProfilePic(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
      }
    } catch (err) {
      console.error('Error picking image:', err);
    } finally {
      setUploadingProfilePic(false);
    }
  };

  const handleInterestChange = (interest: string) => {
    if (!isCurrentUser) return;
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(newInterests);
    updateInterests(newInterests);
  };

  const handleSubscriptionUpdate = async () => {
    if (!isCurrentUser) return;
    try {
      const newValue = !localUser.subscribed;
      await updateUser(localUser.id, {
        subscribed: newValue
      });
      setLocalUser((prev) => ({
        ...prev,
        subscribed: newValue
      }));
      setCurrentUser((prev) =>
        prev ? { ...prev, subscribed: newValue } : prev
      );
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  };

  const handleProfilePicUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCurrentUser && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingProfilePic(true);
      try {
        await updateProfilePicture(file);
      } catch (error) {
        console.error('Error updating profile picture:', error);
      } finally {
        setUploadingProfilePic(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      sessionStorage.clear();
      localStorage.clear();
      router.push('../components/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isFriend = friendshipStatus === 'friends';
  const requestPending = friendshipStatus === 'sent' || friendshipStatus === 'received';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.page}>
        {/* User info */}
        <View style={styles.centerAlignCard}>
          <View style={styles.profilePicWrapper}>
            <Image
              style={styles.profilePic}
              source={getProfilePictureSource(profileUser.profile_image, profileUser.photoURL)}
              alt={profileUser.name}
              resizeMode="cover"
              />
            {isCurrentUser && (
              <Pressable
                onPress={handlePickProfilePhoto}
                disabled={uploadingProfilePic}
                style={[
                  styles.editButton,
                  uploadingProfilePic && styles.editButtonDisabled,
                ]}
              >
                {uploadingProfilePic ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialDesignIcons
                    name="square-edit-outline"
                    size={20}
                    color="white"/>
                )}
              </Pressable>
            )}
          </View>
          <Text style={styles.name} >{profileUser.name}</Text>
          <Text style={styles.email} >{profileUser.email}</Text>
          <View style={styles.info}>
            <Pressable onPress={() => router.push(`../friends/${profileUser.id}`)}>
              <Text style={styles.infoText}>
                {isSmallScreen
                ? `${loadingFriends ? '...' : profileUserFriends.length}\nFriend${profileUserFriends.length == 1 ? '' : 's'}`
                : `${loadingFriends ? '...' : profileUserFriends.length} Friend${profileUserFriends.length == 1 ? '' : 's'}`}
              </Text>
            </Pressable>
            <Text style={styles.infoText}>&bull;</Text>
            <Text style={styles.infoText}>
              {isSmallScreen
              ? `${profileUserPoints || 0}\nPoints`
              : `${profileUserPoints || 0} Points`}
            </Text>
            <Text style={styles.infoText}>&bull;</Text>
            <Text style={styles.infoText}>
              {isSmallScreen
              ? `${((profileUserPoints || 0) / 60).toFixed(1)}\nHours`
              : `${((profileUserPoints || 0) / 60).toFixed(1)} Hours`}
            </Text>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.leftAlignCard}>
          <Text style={styles.sectionHeader}>{profileUser.name}'s Bio</Text>
          <View style={styles.bioWrapper}>
            {isEditing ? (
              <TextInput
                value={editingBio}
                onChangeText={setEditingBio}
                onFocus={() => setFocusedBio(true)}
                onBlur={() => setFocusedBio(false)}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                selectionColor={Theme.cornellRed}
                underlineColorAndroid="transparent"
                style={[
                  styles.bioTextEditing,
                  { borderColor: focusedBio ? Theme.cornellRed : '#D1D5DB' },
                ]}
              />
            ) : (
              <Text style={styles.smallText}>{localUser.bio || 'No bio added yet.'}</Text>
            )}
          </View>
          {isCurrentUser && (
            <>
              {!isEditing ? (
                <Pressable
                  style={styles.editBioBtn}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.redBtnText}>{profileUser.bio ? 'Edit Bio' : 'Add Bio'}</Text>
                </Pressable>
              ) : (
                <View style={styles.bioBtns}>
                  <Pressable
                    onPress={async () => {
                      setSavingBio(true);
                      try {
                        const updatedprofileUser = await updateUser(profileUser.id, { bio: editingBio });
                        // Update local profileUser state
                        setLocalUser({ ...localUser, bio: editingBio });
                        setCurrentUser((prev) => ({ ...prev!, bio: editingBio }));
                        setIsEditing(false);
                      } catch (error) {
                        console.error('Error saving bio:', error);
                        alert('Failed to save bio. Please try again.');
                      } finally {
                        setSavingBio(false);
                      }
                    }}
                    disabled={savingBio}
                    style={styles.editBioBtn}
                  >
                    <Text style={styles.redBtnText}>{savingBio ? 'Saving...' : 'Save Bio'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setIsEditing(false);
                      setEditingBio(localUser.bio || '');
                    }}
                    disabled={savingBio}
                    style={styles.cancelEditBioBtn}
                  >
                    <Text style={styles.redBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>

        {/* Organizations */}
        <View style={styles.centerAlignCard}>
          <View style={styles.orgsHeaderWrapper}>
            <Text
              style={styles.sectionHeader}
              numberOfLines={1}
            >
              {profileUser.name}'s Organizations
            </Text>
            {isCurrentUser && (
              <Pressable
                onPress={() => router.push('/(tabs)/GroupsPage')}
                style={styles.manageOrgsBtn}
              >
                <Text style={styles.redBtnText}>Manage Orgs</Text>
              </Pressable>
            )}
          </View>
          {userOrgs.length > 0 ? (
          <View style={styles.orgList}>
            {userOrgs.map((org, i) => (
              <View
                key={org.id}
                style={[
                  styles.orgBlock,
                  i !== userOrgs.length - 1 && { marginBottom: 4 } // space-y-3 equivalent
                ]}
              >
                <Text style={styles.orgBlockText}>{org.name}</Text>
              </View>
            ))}
          </View>
          ) : (
            <Text style={styles.smallText}>{profileUser.name} hasn't joined any organizations yet.</Text>
          )}
        </View>

        {/* Friends */}
        {/* <View style={styles.leftAlignCard}>
          <Text style={styles.sectionHeader}>{profileUser.name}'s Friends ({profileUserFriends.length})</Text>
          {loadingFriends ? (
            <Text style={styles.smallText}>Loading friends...</Text>
            ) : profileUserFriends.length > 0 ? (
              <View style={styles.friendGrid}>
                {profileUserFriends.map((friend) => (
                  <Pressable
                    key={friend.id}
                    onPress={() => router.push('../(tabs)/ProfilePage/${friend.id}')}
                    style={styles.friendBlock}
                  >
                    <Image
                      source={getProfilePictureSource(friend.profile_image, friend.photoURL)}
                      alt={friend.name}
                      style={styles.friendProfilePic}
                    />
                    <Text style={styles.friendName}>{friend.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.smallText}>{profileUser.name} hasn't added any friends yet.</Text>
          )}
        </View> */}

        {/* Footer */}
        {(isCurrentUser || currentUser?.admin) && (
          <View style={styles.footerBlock}>
            {/* Email Subscription */}
            <View style={styles.emailCard}>
              <View>
                <View style={styles.leftEmailCard}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: '#1f2937' }}>Email newsletter</Text>
                  <Text style={{ fontSize: 14, color: "#767676", marginTop: 6 }}>Get notified about upcoming opportunities</Text>
                </View>
              </View>
              <View>
                <Pressable
                  onPress={handleSubscriptionUpdate}
                  style={[
                    styles.switchContainer,
                    {
                      backgroundColor: localUser.subscribed ? Theme.cornellRed : '#d9d9d9',
                      borderColor: localUser.subscribed ? Theme.cornellRed : '#757575',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.knob,
                      {
                        transform: [{ translateX: localUser.subscribed ? 16 : 0 }],
                        backgroundColor: localUser.subscribed ? '#ffffff' : '#757575',
                      },
                    ]}
                  />
                </Pressable>
              </View>
            </View>
            {/* See Opportunities */}
            <Pressable
              onPress={() => router.push(`../ServiceJournal${profileUser.id}`)} //FIXXXXXX
              style={styles.footerBtn}
            >
              <Text style={styles.footerText}>See my opportunities</Text>
            </Pressable>
            {/* Log Out */}
            <Pressable
              onPress={handleLogout}
              style={[styles.footerBtn, {backgroundColor: '#e5e7eb', paddingVertical: 8,}]} 
            >
              <Text style={styles.footerText}>Log out</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Terms */}
      <Text style={Theme.themes.termsFooter}>
        Click here to see our{" "}
        <Text
          style={{ textDecorationLine: 'underline', color: '#374151' }}
          onPress={() => Linking.openURL('/terms_of_service.pdf')} //FIXXXXXXX
        >
          Terms of Service and Privacy Policy
        </Text>
        .
      </Text>
    </ScrollView>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  page: { 
    flex: 1,
    flexDirection: 'column',
    gap: 16,
  },
  centerAlignCard: {
    width: '100%',
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  leftAlignCard: {
    width: '100%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profilePicWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: 128,
    height: 128,
  },
  profilePic: {
    borderWidth: 4,
    borderRadius: 9999,
    width: 128,
    height: 128,
    borderColor: Theme.cornellRed
  },
  editButton: {
    position: 'absolute',
    bottom: 8,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.cornellRed,
  },
  editButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  name: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    color: '#6B7280',
    marginTop: 2,
  },
  info: {
    gap: 12,
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  infoText: {
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  sectionHeader: {
    flex: 1,
    flexWrap: 'wrap',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 6,
  },
  bioWrapper: {
    gap: 12,
    flexWrap: 'wrap',
    display: 'flex',
    marginBottom: 12,
  },
  smallText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 20,
  },
  bioTextEditing: {
    fontSize: 12,
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
    textAlignVertical: 'top',
    resizeMode: 'none',
  },
  bioBtns: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editBioBtn: {
    backgroundColor: Theme.cornellRed,
    paddingVertical: 6,
    borderRadius: 8,
    width: 70,
  },
  redBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  cancelEditBioBtn: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 6,
    borderRadius: 8,
    width: 70,
  },
  orgsHeaderWrapper: {
    justifyContent: 'space-between',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 6,
  },
  orgList: {
    gap: 6,
    width: '100%',
  },
  orgBlock: {
    backgroundColor: 'rgb(245 245 245)',
    padding: 12,
    borderRadius: 8,
  },
  orgBlockText: {
    color: 'rgb(31 41 55)',
    fontWeight: '500',
  },
  manageOrgsBtn: {
    backgroundColor: Theme.cornellRed,
    paddingVertical: 6,
    borderRadius: 8,
    width: 100,
    marginLeft: 8,
  },
  friendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  friendBlock: {
    width: '48%',
    backgroundColor: 'rgb(245 245 245)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'column',
    display: 'flex'
  },
  friendProfilePic: {
    borderWidth: 2,
    borderRadius: 9999,
    width: 64,
    height: 64,
    borderColor: Theme.cornellRed
  },
  friendName: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 10,
  },
  footerBlock: {
    rowGap: 13,
  },
  emailCard: {
    display: 'flex',
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftEmailCard: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  switchContainer: {
    width: 44,
    height: 28,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    padding: 2,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  footerBtn: {
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  footerText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  termsFooter: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 24,
  },
})