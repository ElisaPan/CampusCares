/*************
 * TODO:
 *  Severe:
 *    -
 *  High:
 *    -
 *  Low
 *    Fix service journal link (See my opportunities)
 */

import { signOut } from '@/firebase-config';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import { getProfilePictureSource, updateUser } from '@/api';
import { FriendshipStatus, User } from '@/types';
import { useLocalSearchParams } from 'expo-router';

import { Header as MainHeader } from '@/components/HeaderComponent';
import * as Theme from '@/constants/theme';
import { mockOpportunities, mockOrganizations, mockSignups, mockUsers } from '@/data/initialData';
import { useFriendships } from '@/hooks/useFriendships';
import { useProfilePicture } from '@/hooks/useProfilePicture';
import { useUserStore } from '@/hooks/useUserStore';
import { isOpportunity } from '@/utils/isOpp';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

interface ProfilePageProps {
  staticId?: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ staticId }) => {
  const { friendshipsData, students, signups, organizations, currentUser, setCurrentUser, clearCurrentUser, updateCurrentUser, allOpps } = useUserStore();
  const { getFriendsForUser, handleAcceptFriendRequest, handleRejectFriendRequest, handleRemoveFriend, handleSendFriendRequest, checkFriendshipStatus, loadUserFriendships } = useFriendships();
  const { updateProfilePicture } = useProfilePicture();

  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 370;

  const USE_MOCKS = false;

  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = staticId ?? (rawId ? parseInt(rawId, 10) : null);

  const isLoading = !USE_MOCKS && !currentUser;
  const baseUser = parsedId !== null ? students?.find((s) => s.id === parsedId) : currentUser;
  const profileUser = USE_MOCKS ? mockUsers[0] : baseUser;

  const safeSignups = USE_MOCKS ? mockSignups : signups ?? [];
  const safeOrganizations = USE_MOCKS ? mockOrganizations : organizations ?? [];
  const opportunities = allOpps.filter(isOpportunity);
  const safeOpportunities = USE_MOCKS ? mockOpportunities : opportunities ?? [];

  const isCurrentUser = USE_MOCKS ? true : profileUser?.id === currentUser?.id;
  const userSignups = safeSignups.filter((s) => s.userId === profileUser?.id);
  const userOrgs = safeOrganizations.filter((g) => profileUser?.organizationIds?.includes(g.id));
  console.log("orgs: "+safeOrganizations)
  console.log("user orgs: "+userOrgs)
  console.log("org Ids: "+profileUser?.organizationIds)
  console.log('profileUser:', profileUser?.id, profileUser?.name, profileUser?.organizationIds);
  
  const key = `${profileUser?.id}-${profileUser?._lastUpdate ?? 'no-update'}`;

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

  const [selectedInterests, setSelectedInterests] = useState(profileUser?.interests);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('add');
  const [profileUserFriends, setProfileUserFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBio, setEditingBio] = useState(profileUser?.bio || '');
  const [focusedBio, setFocusedBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [localUser, setLocalUser] = useState(profileUser);

  // Update friends
  useEffect(() => {
    const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const friends = USE_MOCKS
        ? mockUsers.filter((u) => profileUser?.friendIds?.includes(u.id))
        : await getFriendsForUser(Number(profileUser?.id));
      setProfileUserFriends(friends);
    } catch (error) {
      setProfileUserFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };
    loadFriends();
  }, [profileUser?.id, friendshipsData]);

  // Update selectedInterests when user.interests changes
  useEffect(() => {
    setSelectedInterests(profileUser?.interests);
  }, [profileUser?.interests]);

  // Update editingBio when profileUser.bio changes
  useEffect(() => {
    setEditingBio(profileUser?.bio || '');
    setLocalUser(profileUser); // Update local user when user prop changes
  }, [profileUser]);

  // Check friendship status when component mounts or user changes
  useEffect(() => {
    if (!isCurrentUser && currentUser && profileUser?.id) {
      checkFriendshipStatus(profileUser.id).then(setFriendshipStatus);
    }
  }, [isCurrentUser, currentUser, profileUser?.id, friendshipsData]);

  // Load friendships when viewing another user's profile
  useEffect(() => {
    if (!isCurrentUser && currentUser?.id) {
      loadUserFriendships(currentUser.id);
    }
  }, [isCurrentUser, currentUser?.id]);

  // Load allTimeMyOpps when viewing the current user's own profile
  // useEffect(() => {
  //   if (!isCurrentUser || allTimeMyOpps.length > 0) return;
  //   getUserAllTimeOpps(currentUser.id)
  //     .then(setAllTimeMyOpps)
  //     .catch((err) => console.error('Error loading allTimeMyOpps:', err));
  // }, [isCurrentUser, currentUser?.id]);

  if (!profileUser || !localUser) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size='large' color={Theme.cornellRed} />
      </View>
    )
  }

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
        await updateProfilePicture(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    } finally {
      setUploadingProfilePic(false);
    }
  };


  // const handleInterestChange = (interest: string) => {
  //   if (!isCurrentUser) return;
  //   const newInterests = selectedInterests?.includes(interest)
  //     ? selectedInterests.filter((i) => i !== interest)
  //     : [...selectedInterests, interest];
  //   setSelectedInterests(newInterests);
  //   updateInterests(newInterests);
  // };

  const handleSubscriptionUpdate = async () => {
    if (!isCurrentUser || !localUser) return;
    try {
      const newValue = !localUser.subscribed;
      await updateUser(localUser.id, {
        subscribed: newValue,
      });
      setLocalUser({ ...localUser, subscribed: newValue });
      if (currentUser) setCurrentUser({ ...currentUser, subscribed: newValue });
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      clearCurrentUser();
      router.replace(`/HomePage`);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isFriend = friendshipStatus === 'friends';
  const requestPending = friendshipStatus === 'sent' || friendshipStatus === 'received';

  if (isLoading) { return <Text>Loading...</Text>; }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <MainHeader />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.page}>
          {/* User info */}
          <View style={styles.centerAlignCard}>
            <View style={styles.profilePicWrapper}>
              <Image
                style={styles.profilePic}
                source={getProfilePictureSource(profileUser.profile_image, profileUser.photoURL)}                alt={profileUser.name}
                resizeMode="cover"
                />
              {isCurrentUser && (
                <Pressable
                  onPress={handlePickProfilePhoto}
                  disabled={uploadingProfilePic}
                  style={[
                    styles.editPicBtn,
                    uploadingProfilePic && styles.editPicBtnDisabled,
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
              <Pressable onPress={() => router.push(`/FriendsPage?id=${profileUser.id}`)}>
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
            {!isCurrentUser && (
              <View style={styles.friendBtns}>
                {isFriend ? (
                  <View style={{ rowGap: 6}}>
                    <Text style={styles.friendTxt}>
                      Friends ✓
                    </Text>
                    <Pressable
                      onPress={() => handleRemoveFriend(profileUser.id)}
                      style={styles.removeFriendBtn}
                    >
                      <Text style={styles.removeFriendBtnTxt}>Remove Friend</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleSendFriendRequest(profileUser.id)}
                    disabled={requestPending || isFriend}
                    // className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${isFriend
                    //   ? 'bg-green-600 text-white cursor-default'
                    //   : requestPending
                    //     ? 'bg-red-300 text-white cursor-not-allowed'
                    //     : 'bg-cornell-red text-white hover:bg-red-800'
                    //   }`}
                    style={[
                      styles.requestFriendBtn,
                      (isFriend
                      ? { backgroundColor: '#16A34A' }
                      : requestPending
                        ? { backgroundColor: '#FCA5A5' }
                        : { backgroundColor: Theme.cornellRed }
                      )
                      ]}
                  >
                    <Text style={styles.requestFriendBtnTxt}>{isFriend ? 'Friends!' : requestPending ? 'Request Sent' : 'Add Friend'}</Text>
                  </Pressable>
                )}
              </View>
            )}
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
                    style={styles.editBtn}
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
                          if (currentUser) setCurrentUser({ ...currentUser, bio: editingBio });
                          setIsEditing(false);
                        } catch (error) {
                          console.error('Error saving bio:', error);
                          Alert.alert('Failed to save bio. Please try again.');
                        } finally {
                          setSavingBio(false);
                        }
                      }}
                      disabled={savingBio}
                      style={styles.editBtn}
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
          <View style={styles.leftAlignCard}>
            <Text
              style={styles.sectionHeader}
              numberOfLines={1}
            >
              {profileUser.name}'s Organizations
            </Text>
            {userOrgs.length > 0 ? (
              <View style={styles.orgList}>
                {userOrgs.map((org, i) => (
                  <View
                    key={org.id}
                    style={[
                      styles.orgBlock,
                      i !== userOrgs.length - 1 && { marginBottom: 4 }
                    ]}
                  >
                    <Text style={styles.orgBlockText}>{org.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.smallText}>No organizations added yet.</Text>
            )}
            {isCurrentUser && (
              <Pressable
                onPress={() => router.push(`/GroupsPage`)}
                style={styles.editBtn}
              >
                <Text style={styles.redBtnText}>Manage</Text>
              </Pressable>
            )}
          </View>

          {/* Footer */}
          {(isCurrentUser) && (
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
              {/* <Pressable
                onPress={() => router.push(`../ServiceJournal${profileUser.id}`)} //FIXXXXXX
                style={styles.footerBtn}
              >
                <Text style={styles.footerText}>See my opportunities</Text>
              </Pressable> */}
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
        <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
          <Text style={Theme.themes.termsFooter}>
            Click here to see our{" "}
            <Text
              style={{ textDecorationLine: 'underline', color: '#374151' }}
              onPress={() => Linking.openURL("https://www.campuscares.us/terms_of_service.pdf")}
            >
              Terms of Service and Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  header: {
    // paddingHorizontal: 16,
    backgroundColor: '#fff',
    zIndex: 1,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  container: {
    padding: 24,
    paddingBottom: 0,
  },
  loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
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
  editPicBtn: {
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
  editPicBtnDisabled: {
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
  friendBtns: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 8,
  },
  friendTxt: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#DCFCE7',
    textAlign: 'center',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  removeFriendBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  removeFriendBtnTxt: {
    fontSize: 14,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  requestFriendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 100,
    borderRadius: 8,
  },
  requestFriendBtnTxt: {
    color: 'white',
    fontWeight: '700',
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
    gap: 80,
    flexShrink: 1,
    flexWrap: 'wrap',
    display: 'flex',
    flexDirection: 'row',
    // marginBottom: 12,
  },
  smallText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  bioTextEditing: {
    fontSize: 13,
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
  editBtn: {
    backgroundColor: Theme.cornellRed,
    paddingVertical: 6,
    borderRadius: 8,
    width: 70,
    marginTop: 12,
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
    marginTop: 12,
  },
  orgList: {
    gap: 6,
    width: '100%',
  },
  orgBlock: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  orgBlockText: {
    color: '#1f2937',
    fontWeight: '500',
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
})