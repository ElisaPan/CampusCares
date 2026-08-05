/*************
 * TODO:
 *  Severe:
 *    On click outline with red
 *  High:
 *    -
 *  Low
 *    -
 */

import {
  UploadFile,
  deleteOpportunity,
  getCurrentOpportunities,
  getOpportunity,
  getProfilePictureSource,
  updateMultiOpp,
  uploadProfilePicture
} from '@/api';
import { Header as MainHeader } from '@/components/HeaderComponent';
import * as Theme from '@/constants/theme';
import { mockUsers } from '@/data/initialData';
import { useSignupHandlers } from '@/hooks/useSignupHandlers';
import { useUserStore } from '@/hooks/useUserStore';
import { Opportunity as OppType, User } from '@/types';
import { isMultiOpp, isOpportunity } from '@/utils/isOpp';
import { formatMiniOppTime } from '@/utils/timeUtils';

import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

interface MultiOppDetailPageProps {
  staticId?: number;
}

const MultiOppDetailPage: React.FC<MultiOppDetailPageProps> = ({
  staticId,
}) => {
  const { setAllOpps, students, organizations: allOrgs, allOpps, currentUser, setCurrentUser, updateCurrentUser, clearCurrentUser } = useUserStore();
  const { handleSignUp: onSignUp, handleUnSignUp: onUnSignUp } = useSignupHandlers();
  
  const USE_MOCKS = false;

  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  // const sourceOpportunities = USE_MOCKS ? mockOpportunities : opportunities ?? [];
  const sourceStudents = useMemo(
    () => (USE_MOCKS ? mockUsers : students ?? []),
    [students]
  );
  
  const activeCurrentUser = USE_MOCKS ? mockUsers[0] : currentUser;
  
  const multioppId = staticId ?? parsedId;

  const opportunities = useMemo(() => allOpps.filter(isOpportunity), [allOpps]);
  const multiopps = useMemo(() => allOpps.filter(isMultiOpp), [allOpps]);
  const multiopp = useMemo(
    () => multiopps.find((m) => m.id === multioppId),
    [multiopps, multioppId]
  );
  
  const [participantsByOppId, setParticipantsByOppId] = useState<Record<number, User[]>>({});
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OppType | null>(null);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const isUserHost = multiopp?.host_user_id === activeCurrentUser?.id;
  const canManageOpportunity = isUserHost || activeCurrentUser?.admin;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadFile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHeight, setImageHeight] = useState(200);
  const initAllowCarpool = multiopp?.opportunities.every(opp => opp.allow_carpool)
  const [editForm, setEditForm] = useState({
    name: multiopp?.name,
    description: multiopp?.description || '',
    address: multiopp?.address,
    nonprofit: multiopp?.nonprofit || '',
    redirect_url: multiopp?.redirect_url || '',
    allow_carpool: initAllowCarpool
  });

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const upcomingOpps = useMemo(() => {
    if (!multiopp?.opportunities) return [];
    return [...multiopp.opportunities]
      .filter((opp) => new Date(opp.date) >= startOfToday)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [multiopp, startOfToday]);

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const d = new Date(dateString);
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
  };

  const formatEventTimeRange = (gmtString: string, duration: number) => {
    const start = new Date(gmtString);
    const end = new Date(start.getTime() + duration * 60000);
    const format = { hour: 'numeric', minute: '2-digit', hour12: true } as const;
    return `${start.toLocaleTimeString('en-US', format)} – ${end.toLocaleTimeString('en-US', format)}`;
  };

  // Handle image selection
  const handleImageSelect = async () => {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if (!permissionResult.granted) {
        Alert.alert("Permission required");
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled) {
        const asset = result.assets[0];
  
        const uploadFile = {
          uri: asset.uri,
          name: asset.fileName ?? "image.jpg",
          type: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize,
        };
  
        setSelectedImage(uploadFile);
        setImagePreview(asset.uri);
      }
    };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setIsUploadingImage(true);
    try {
      const uploadResult = await uploadProfilePicture(selectedImage);
      const imageUrl = uploadResult;

      if (!multiopp) {
        return (
          <View style={styles.loadingView}>
            <ActivityIndicator size='large' color={Theme.cornellRed} />
          </View>
        )
      }

      // Update the opportunity with the new image URL
      await updateMultiOpp(multiopp.id, { image: imageUrl });

      // Update local state
      multiopp.image = imageUrl;
      queryClient.invalidateQueries({ queryKey: ['multiopps'] });

      // Clear the selected image and preview
      setSelectedImage(null);
      setImagePreview(null);

      Alert.alert('Image updated successfully!');
    } catch (error: any) {
      Alert.alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Function to format description text with newlines and links
  const formatDescription = (text: string) => {
    const lines = text.split(/\r?\n/);

    return lines.map((line, lineIndex) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);

      return (
        <Text key={lineIndex} style={styles.descWrapper}>
          {parts.map((part, partIndex) => {
            if (urlRegex.test(part)) {
              return (
                <Text
                  key={partIndex}
                  style={{ color: "#B31B1B", textDecorationLine: "underline" }}
                  onPress={() => Linking.openURL(part)}
                >
                  {part}
                </Text>
              );
            }
            return (
              <Text key={partIndex}>{part}</Text>
            );
          })}
        </Text>
      );
    });
  };

  useEffect(() => {
    let cancelled = false;
    const loadParticipants = async () => {
      console.log('loadParticipants called');
      if (!upcomingOpps.length) {
        setParticipantsByOppId({});
        return;
      }
      setLoadingParticipants(true);
      console.log('setLoadingParticipants(true) called');
      try {
        const map: Record<number, User[]> = {};
        for (const opp of upcomingOpps) {
          try {
            const full = opportunities.find((o) => o.id === opp.id);
            const participants =
              full?.involved_users
                ?.map((u: { id: number }) => sourceStudents.find((s) => s.id === u.id))
                .filter(Boolean) ?? [];
            map[opp.id] = participants as User[];
          } catch {
            map[opp.id] = [];
          }
        }
        if (!cancelled) {
          setParticipantsByOppId(map);}
      } finally {
        if (!cancelled) setLoadingParticipants(false);
      }
    };
    loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [upcomingOpps, opportunities, sourceStudents]);

  const handleOppClick = async (opp: OppType) => {
    console.log('handleOppClick called for opp:', opp.id, new Date(opp.date));
    const d = new Date(opp.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return;

    try {
      let full = opportunities.find((o) => o.id === opp.id);
      console.log('found locally:', !!full);
      if (!full) {
        try {
          full = await getOpportunity(opp.id);
          console.log('fetched remotely:', !!full);
        } catch (err) {
          console.error("Failed to fetch remote opportunity:", err);
        }
        if (!full) {
          console.warn(`Opportunity ${opp.id} not found locally or remotely.`);
          return;
        }
      }

      const isUserSignedUp = full.involved_users?.some(
        (u: { id: number; registered?: boolean }) =>
          u.id === activeCurrentUser?.id && (u.registered ?? true)
      );

      console.log('redirect_url:', full.redirect_url, 'isUserSignedUp:', isUserSignedUp);

      if (full.redirect_url && !isUserSignedUp) {
        setSelectedOpportunity(full);
        setShowExternalSignupModal(true);
      } else {
        console.log('navigating to:', opp.id);
        router.push(`/OpportunityDetailPage?id=${opp.id}`);
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      router.push(`/OpportunityDetailPage?id=${opp.id}`);
    }
  };

  const [pressedStudentId, setPressedStudentId] = useState<number | null>(null);
  const handleProfilePress = (studentId: number) => {
    if (!currentUser) setPressedStudentId(null);

    if (pressedStudentId === studentId) {
      setPressedStudentId(null);
    } else {
      setPressedStudentId(studentId);
    }
  };

  const handleExternalSignupConfirm = async () => {
    if (!selectedOpportunity) return;
    if (!activeCurrentUser) {
      router.push(`/LoginPage`);
      return;
    }
    if (selectedOpportunity.redirect_url) {
      await Linking.openURL(selectedOpportunity.redirect_url);
    }
    try {
      if (onSignUp) await onSignUp(selectedOpportunity.id);
    } catch (err) {
      console.error('Local signup failed:', err);
    }
    setShowExternalSignupModal(false);
    router.push(`/OpportunityDetailPage?id=${selectedOpportunity.id}`)
    setSelectedOpportunity(null);
  };

  const handleExternalSignupCancel = () => {
    setShowExternalSignupModal(false);
    setSelectedOpportunity(null);
  };

  const handleExternalUnsignupCancel = () => {
    setShowExternalUnsignupModal(false);
    setSelectedOpportunity(null);
  };

  const handleDeleteOpportunity = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Delete Opportunity',
        `Are you sure you want to delete "${multiopp?.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    try {
      if (!multiopp) return <Text>Loading...</Text>
      await deleteOpportunity(multiopp.id);

      // Refresh opportunities in store
      const updatedOpps = await getCurrentOpportunities();
      const multiopps = allOpps.filter((o) => !isOpportunity(o));
      setAllOpps([...updatedOpps, ...multiopps]);

      router.replace('/(tabs)/OpportunitiesPage');
      Alert.alert('Success', 'Opportunity has been deleted successfully!');
    } catch (error: any) {
      Alert.alert('Error', `Error deleting opportunity: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {

      const updateData = {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        nonprofit: editForm.nonprofit,
        redirect_url: editForm.redirect_url.trim() || null,
        allow_carpool: editForm.allow_carpool,
      };

      if (!multiopp) return <Text>Loading...</Text>

      await updateMultiOpp(multiopp.id, updateData);
      queryClient.invalidateQueries({ queryKey: ['multiopps'] });

      // Update the local opportunity object to reflect changes
      Object.assign(multiopp, {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        nonprofit: editForm.nonprofit,
        redirect_url: editForm.redirect_url.trim() || null,
        allow_carpool: editForm.allow_carpool,
      });

      Alert.alert('Opportunity details updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert(`Error updating opportunity: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
  }

  useEffect(() => {
      const uri = imagePreview || multiopp?.image;
  
      if (!uri) return;
  
      Image.getSize(uri, (width, height) => {
        const displayWidth = Dimensions.get("window").width - 48; // adjust for padding
        setImageHeight(displayWidth * height / width);
      });
    }, [imagePreview, multiopp?.image]);

  const img = multiopp?.image;
	const oppPicSource =
		typeof img === 'string' && img.startsWith('http')
			? { uri: img }
			: require('@/assets/images/backup.jpeg');

  if (!activeCurrentUser) {
    return <Text>Loading...</Text>;
  }

  if (!multiopp) return <Text style={{ textAlign: 'center', color: '#9e9e9e', marginTop: 40 }}>Recurring opportunity not found.</Text>;


  return (
    <ScrollView
      style={styles.container}
      stickyHeaderIndices={[0]}
    >
      <View style={styles.mainHeader}>
        <MainHeader />
      </View>
      {/* Header */}
      <View style={styles.page}>
        <View style={styles.headerShadow}>
          <View style={styles.header}>
            <Image
              source={oppPicSource}
              alt={multiopp.name}
              style={styles.headerImg}
            />
            <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
              <LinearGradient
                colors={[ "rgba(0,0,0,0.6)", "transparent" ]}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.headerName}>{multiopp.name}</Text>
              {multiopp.nonprofit && (
                <Text style={styles.headerNonprof}>{multiopp.nonprofit}</Text>
              )}
              {multiopp.host_org_name && (
                <Text style={styles.headerHost}>Hosted by {multiopp.host_org_name}</Text>
              )}
              {activeCurrentUser?.admin && !isUserHost && (
                <View>
                  <Text style={styles.headerAdminView}>Admin View</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Details */}
        <View style={styles.content}>
          <View style={styles.contentTop}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.infoHeader}>Event Details</Text>
              <View>
                {canManageOpportunity && (
                  <View style={styles.flexGap}>
                    {!isEditing ? (
                      <>
                        <Pressable
                          onPress={() => setIsEditing(true)}
                          style={styles.editDetailsBtn}
                        >
                          <Text style={styles.boldWhite}>Edit</Text>
                        </Pressable>
                      </>
                    ) : (
                      <View style={styles.editBtnsWrapper}>
                        <Pressable
                          onPress={handleSaveChanges}
                          disabled={isSaving}
                          style={styles.savingBtn}
                        >
                          <Text style={[styles.boldWhite, { textAlign: 'center' }]}>{isSaving ? 'Saving...' : 'Save'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleCancelEdit}
                          style={styles.cancelEditBtn}
                        >
                          <Text style={[styles.semiboldWhite, { textAlign: 'center' }]}>Cancel</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View>
              <Text style={styles.smallGray600}>{multiopp.description || 'No description provided.'}</Text>
                {multiopp.address && (
                  <View style={styles.addressWrapper}>
                    <MaterialIcons name="location-pin" size={18} color={Theme.cornellRed}/>
                    <Pressable
                      onPress={() => {
                        if (!multiopp.address) return;
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(multiopp.address)}`);
                      }}
                    >
                      <Text style={styles.address}>{multiopp.address}</Text>
                    </Pressable>
                  </View>
                )}
            </View>
            {isEditing && (
              <View style={{ rowGap: 12 }}>
                {/* Image Upload Section */}
                <View>
                  <Text style={styles.imgUploadTxt}>Event Image</Text>
                  <View style={{ rowGap: 16 }}>
                    {/* Current Image Preview */}
                    <View>
                      <Image
                        source={
                          imagePreview
                            ? { uri: imagePreview }
                            : multiopp.image
                              ? { uri: multiopp.image }
                              : require("@/assets/images/backup.jpeg")
                        }
                        alt="Event preview"
                        style={[styles.imgPreviewImg, { height: imageHeight }]}
                      />
                      {imagePreview && (
                        <View style={styles.imgPreviewLabel}>
                          <Text style={styles.imgPreviewLabelTxt}>New Image Selected</Text>
                        </View>
                      )}
                    </View>

                    {/* File Input */}
                    <View style={styles.fileInputSection}>
                      <Pressable
                        onPress={handleImageSelect}
                        style={styles.imgSelectBtn}
                      >
                        <Text>
                          {selectedImage ? "Image Selected" : "Choose Image"}
                        </Text>
                      </Pressable>
                      {selectedImage && (
                        <Pressable
                          onPress={handleImageUpload}
                          disabled={isUploadingImage}
                          style={styles.uploadImg}
                        >
                          <Text>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</Text>
                        </Pressable>
                      )}
                    </View>
                    {selectedImage && (
                      <Text style={styles.smallGray600}>
                        Selected: {selectedImage.name} (
                          {selectedImage.size
                            ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`
                            : "Unknown size"}
                        )
                      </Text>
                    )}
                  </View>
                </View>
                <View>
                  <Text style={styles.smallGray700}>Event Name</Text>
                  <TextInput
                    value={editForm.name}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                    style={styles.editInput}
                  />
                </View>
                <View>
                  <Text style={styles.smallGray700}>Event Description</Text>
                  <TextInput
                    value={editForm.description}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, description: text }))}
                    style={styles.editInput}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                <View>
                  <Text style={styles.smallGray700}>Nonprofit</Text>
                  <TextInput
                    value={editForm.nonprofit}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, nonprofit: text }))}
                    style={styles.editInput}
                  />
                </View>
                <View>
                  <Text style={styles.smallGray700}>Location</Text>
                  <TextInput
                    value={editForm.address}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, address: text }))}
                    style={styles.editInput}
                  />
                </View>

                <View>
                  <Text style={styles.smallGray700}>Redirect Link (Optional)</Text>
                  <TextInput
                    keyboardType="url"
                    value={editForm.redirect_url}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, website: text }))}
                    placeholder="https://example.com/register"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.editInput}
                  />
                  <Text style={styles.note}>If you would like this opportunity to redirect to an external registration, enter the link here.</Text>
                </View>

                <View>
                  <Text style={styles.smallGray700}>Enable carpooling for this event?</Text>
                  <Switch
                    disabled={!initAllowCarpool}
                    value={editForm.allow_carpool}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, allow_carpool: value }))}
                  />
                  <Text style={styles.note}>Volunteers can sign up to drive or request a ride through the system (this feature cannot be undone once enabled).</Text>
                </View>
              </View>
            )}

            {/* Upcoming Dates */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.datesHeader}>Upcoming Dates</Text>
              {upcomingOpps.length > 0 ? (
                <View style={styles.opps}>
                  {upcomingOpps.map((opp) => {
                    const thisWeek = isThisWeek(opp.date);
                    const participants = participantsByOppId[opp.id] || [];
                    return (
                      <Pressable
                        key={opp.id}
                        onPress={() => handleOppClick(opp)}
                        style={[
                          styles.oppCard,
                          thisWeek ? styles.oppCardThisWeek : styles.oppCardDefault,
                        ]}
                        unstable_pressDelay={50}
                      >
                        <View>
                          <Text style={styles.oppDate}>
                            {new Date(opp.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                          <Text style={styles.smallGray600}>{formatEventTimeRange(opp.date, opp.duration)}</Text>
                        </View>
                        
                        <View style={styles.participantsWrapper}>
                          <Text style={styles.participantsHeader}>Participants:</Text>
                          {loadingParticipants ? (
                            <Text style={styles.loading}>Loading</Text>
                          ) : participants.length > 0 ? (
                            <View style={styles.participants}>
                              {participants.slice(0, 4).map((u, index) => (
                                <View
                                  key={u.id}
                                  style={[
                                    styles.avatarContainer,
                                    (index !== 4 && index !== participants.length-1) && { marginRight: -8 },
                                  ]}
                                  >
                                  <Pressable key={u.id} onPress={() => handleProfilePress(u.id)}>
                                    <Image
                                      source={getProfilePictureSource(u.profile_image, u.photoURL)}
                                      style={styles.avatar}
                                    />
                                  </Pressable>
                                </View>
                              ))}
                              {participants.length > 4 && (
                                <View style={styles.moreParticipants}>
                                  <Text style={styles.moreParticipantsTxt}>+{participants.length - 4}</Text>
                                </View>
                              )}
                            </View>
                          ) : (
                            <Text style={styles.noUsers}>No Users Yet</Text>
                          )}
                        </View>
                        {opp.redirect_url && (
                          <Text style={styles.extReg}>External Registration Required →</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={{ color: '#9E9E9E' }}>No upcoming opportunities.</Text>
              )}
            </View>
          </View>

          {/* Sidebar */}
          <View style={styles.sidebar}>
            <Text style={styles.sectionHeader}>Recurring Schedule</Text>
              {multiopp.days_of_week?.length ? (
                <View>
                  {multiopp.days_of_week.map((dayObj, idx) => {
                    const day = Object.keys(dayObj)[0];
                    const slots = dayObj[day];
                    return (
                      <Text key={idx} style={styles.dayText}>
                        <Text style={styles.dayName}>{day}</Text>
                        {" — "}
                        {slots
                          .map(([time, duration]) => formatMiniOppTime(time, duration))
                          .join(", ")}
                      </Text>
                    );
                  })}
                </View>
              ) : (
                <p className="text-gray-500">Flexible or varies by week.</p>
              )}
          </View>
        </View>

        {/* External Signup Modal */}
        <Modal
          visible={showExternalSignupModal && !!selectedOpportunity}
          transparent
          animationType="fade"
          onRequestClose={handleExternalSignupCancel}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.extRegText}>External Registration Required</Text>
              <Text style={{ color: '#4B5563', marginBottom: 8 }}>
                Please register externally by clicking the button below.
              </Text>
              <Text style={[styles.smallGray500, { marginBottom: 18 } ]}>
                After registering externally, you'll still be registered locally in our system.
              </Text>
              <View style={{ gap: 6 }}>
                <Pressable onPress={handleExternalSignupConfirm} style={styles.extSignupBtn}>
                  <Text style={styles.extSignupBtnTxt}>Open Link & Register Locally</Text>
                </Pressable>
                <Pressable onPress={handleExternalSignupCancel} style={styles.extCancelBtn}>
                  <Text style={styles.extCancelBtnTxt}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      {/* Terms */}
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
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
  );
};

export default MultiOppDetailPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
  },
  mainHeader: {
    // paddingHorizontal: 16,
    backgroundColor: '#fff',
    zIndex: 1,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  page: { 
    gap: 16,
    padding: 12,
  },
  header: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  headerImg: {
    width: '100%',
    height: 256,
    resizeMode: 'cover',
  },
  headerTextWrapper: {
    position: 'absolute',
    bottom: 0,
    padding: 32,
  },
  headerName: {
    color: 'rgb(255, 255, 255)',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  headerNonprof: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: 'rgb(255, 255, 255, 0.9)',

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  headerHost: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: 'rgb(255, 255, 255, 0.8)',

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  headerAdminView: {
    color: 'rgb(255, 255, 255)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
    
    width: 110,
    marginTop: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    paddingVertical: 4,
    borderRadius: 9999,
  },
  content: {
    flexDirection: 'column',
    gap: 20,
  },
  contentTop: {
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 32,
    borderRadius: 16,
    // flexDirection: 'row',
    // justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  keyInfo: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeader: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  addressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  address: {
    color: Theme.cornellRed,
    textDecorationLine: "underline",
    fontSize: 14,
  },
  editDetailsBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnsWrapper: {
    flexDirection: 'row',
    gap: 6
  },
  savingBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(22, 163, 74)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelEditBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  datesHeader: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  imgUploadTxt: {
    color: '#616161',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  imgPreviewImg: {
    width: '100%',
    // resizeMode: 'contain',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  imgPreviewLabel: {
    backgroundColor: 'rgb(34, 197, 94)',
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imgPreviewLabelTxt: {
    color: 'rgb(255, 255, 255)',
    fontSize: 12,
    lineHeight: 16,
  },
  uploadImg: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(34, 197, 94)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fileInputSection: {
    flexDirection: 'row',
    gap: 12,
  },
  imgSelectBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    justifyContent: 'center',
  },
  editInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  note: {
    color: '#9E9E9E',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  opps: {
    gap: 6,
  },
  oppCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "center",
  },
  oppCardThisWeek: {
    borderColor: Theme.cornellRed,
    backgroundColor: "rgba(254, 242, 242, 0.5)",
  },
  oppCardDefault: {
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  oppDate: {
    fontWeight: '600',
    color: '#1F2937',
  },
  participantsWrapper: {
    flexDirection: 'column',
    gap: 4,
    alignItems: "center",
  },
  participantsHeader: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-end',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
	avatarContainer: {
		width: 28,
  	height: 28,
		// marginRight: -8,
	},
	avatar: {
		width: 28,
		height: 28,
		borderWidth: 1.5,
		borderRadius: 9999,
    // borderColor: '#d4d4d4',
    borderColor: 'white',
		objectFit: 'cover',
	},
	moreParticipants: {
		width: 26,
		height: 26,
    borderRadius: 9999,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    // borderColor: '#d4d4d4',
    borderColor: 'white',
	},
	moreParticipantsTxt: {
		color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
	},
  loading: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
  participantsImgWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noUsers: {
    color: '#9CA3AF',
    fontSize: 12,
    // lineHeight: 16,
    fontStyle: 'italic',
  },
  extReg: {
    color: '#1D4ED8',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '300',
    marginTop: 12,
  },
  sidebar: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    gap: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  dayText: {
    color: "#374151",
    marginBottom: 4,
  },
  dayName: {
    fontWeight: "600",
  },
  desc: {
    color: '#616161',
    fontSize: 18,
    lineHeight: 28,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  descWrapper: {
    marginBottom: 8,
    lineHeight: 22,
    flexShrink: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  extRegText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  extSignupBtn: {
    backgroundColor: Theme.cornellRed,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  extSignupBtnTxt: {
    color: 'white',
    fontWeight: '600',
  },
  extCancelBtn: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  extCancelBtnTxt: {
    color: 'white',
    fontWeight: '500',
  },
  smallGray500: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9E9E9E',
    marginBottom: 24
  },
  smallGray600: {
    fontSize: 14,
    lineHeight: 20,
    color: '#757575',
  },
  smallGray700: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  boldWhite: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '800',
  },
  semiboldWhite: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '700',
  },
  flexGap: {
    flexDirection: 'row',
    gap: 8,
  },
})