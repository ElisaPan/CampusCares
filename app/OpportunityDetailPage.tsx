/*************
 * TODO:
 *  Severe:
 *    On click outline with red
 *  High:
 *    Move edit buttons location
 *    Transfer host dropdown select menu
 *  Low
 *    Address warning "no virtualizedlists/flatlists inside scrollview w/ same orientation
 *       - can break windowing and other functionality, use another virtualized-backed container instead"
 *    Backend editForm option should be true/false. what is it rn?
 *    Show participants with two columns, filling out columnn first
 */

import * as Theme from '@/constants/theme';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Header as MainHeader } from '@/components/HeaderComponent';
import { useCloneOpportunity } from "@/context/CloneOpportunityContext";
import { mockOpportunities, mockOrganizations, mockSignups, mockUsers } from '@/data/initialData';
import {
  Opportunity,
  Organization,
  SignUp,
  User
} from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from "expo-clipboard";
import * as MailComposer from "expo-mail-composer";
import { router, useLocalSearchParams } from 'expo-router';

import { useQueryClient } from '@tanstack/react-query';
import {
  deleteOpporturnity,
  getCurrentOpportunities,
  getOpportunityAttendance,
  registerForOpp,
  unregisterForOpp,
  updateOpportunity,
  UploadFile,
  uploadProfilePicture,
} from '../api';
// import AttendanceManager from '../components/AttendanceManager';
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { calculateEndTime, formatDateTimeForBackend } from '../utils/timeUtils';

interface OpportunityDetailPageProps {
  opportunities: Opportunity[];
  students: User[];
  signups: SignUp[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ) => Promise<boolean>;
  allOrgs: Organization[];
  currentUserSignupsSet: Set<number>;
  allTimeMyOpps: Opportunity[];
}

const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({
  opportunities,
  students,
  signups,
  currentUser,
  handleSignUp,
  handleUnSignUp,
  allOrgs,
  currentUserSignupsSet,
  allTimeMyOpps,
}) => {

  const USE_MOCKS = true;

  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const sourceStudents = USE_MOCKS ? mockUsers : students ?? [];
  const sourceSignups = USE_MOCKS ? mockSignups : signups ?? [];
  const sourceOrganizations = USE_MOCKS ? mockOrganizations : allOrgs ?? [];
  const activeCurrentUser = USE_MOCKS ? mockUsers[0] : currentUser;
  const activeCurrentUserSignupsSet = USE_MOCKS
    ? new Set( mockSignups
          .filter((s) => s.userId === mockUsers[0].id)
          .map((s) => s.opportunityId)
      )
    : currentUserSignupsSet ?? new Set();

  if (!activeCurrentUser) {
    return <Text>Loading...</Text>;
  }

  const sourceOpportunities =
    USE_MOCKS
    ? mockOpportunities
    : allTimeMyOpps && allTimeMyOpps.length > 0
      ? allTimeMyOpps
      : opportunities ?? [];

  const opportunity = sourceOpportunities.find(
    (o) => o.id === parseInt(id, 10)
  );

  if (!opportunity || !activeCurrentUser) {
    return <Text>Loading...</Text>;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: opportunity.name,
    description: opportunity.description,
    address: opportunity.address,
    date: opportunity.date,
    time: opportunity.time,
    duration: opportunity.duration,
    nonprofit: opportunity.nonprofit || '',
    redirect_url: opportunity.redirect_url || '',
    allow_carpool: opportunity.allow_carpool || false
  });
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const initAllowCarpool = opportunity.allow_carpool;
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadFile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHeight, setImageHeight] = useState(200);

  const [showAnnouncements, setShowAnnouncements] = useState(false);

  // Slot limit management state
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  const [newSlotLimit, setNewSlotLimit] = useState(opportunity.total_slots);
  const [isUpdatingSlots, setIsUpdatingSlots] = useState(false);

  // Comment/announcement state
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [userLookupName, setUserLookupName] = useState('');
  const [userLookupResults, setUserLookupResults] = useState<User[]>([]);
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);

  // Transfer host state
  const [showTransferHost, setShowTransferHost] = useState(false);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState<number | ''>('');
  const [isTransferringHost, setIsTransferringHost] = useState(false);

  const signedUpStudents = opportunity.involved_users
    ? opportunity.involved_users.filter((user) => user.registered === true)
    : sourceStudents.filter((student) => {
      const signupUserIds = sourceSignups
        .filter((s) => s.opportunityId === opportunity.id)
        .map((s) => s.userId);
      return signupUserIds.includes(student.id);
    });
  // signedUpStudents.forEach(s => {
  //     console.log(s.email);
  //   });

  const isUserSignedUp = opportunity.involved_users
    ? opportunity.involved_users.some(
      (user) => user.id === activeCurrentUser.id && user.registered === true
    )
    : activeCurrentUserSignupsSet.has(opportunity.id);

  const isUserHost = opportunity.host_id === activeCurrentUser.id;
  const canManageOpportunity = isUserHost || activeCurrentUser.admin;

  const eligibleHostUsers = sourceStudents.filter(
    (user) =>
      user.admin === true ||
      (opportunity.host_org_id !== undefined && user.organizationIds.includes(opportunity.host_org_id))
  );
  const availableSlots = opportunity.total_slots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;
  const allowCarpool = opportunity.allow_carpool;
  const hasComment = newComment.trim().length > 0;

  // Parse date components manually to avoid timezone issues
  const [year, month, day] = opportunity.date.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Parse time correctly for display (already in Eastern Time from backend conversion)
  const [hours, minutes] = opportunity.time.split(':');
  const displayTime = new Date(2024, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate and format end time (no adjustment needed - time is already Eastern)
  const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);

  // Organizations that can see this opportunity (visibility list)
  const visibilityOrgs = (sourceOrganizations || [])
    .filter(
      (org) => Array.isArray(opportunity.visibility) && opportunity.visibility.includes(org.id)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleButtonClick = async () => {
    try {
      // If user is already signed up, confirm unregistration
      if (isUserSignedUp) {
        if (opportunity.redirect_url) {
          alert(
            "You are registered for this opportunity via an external site. To un-register, please visit that site as well."
          );
        }

        const unregistered = await handleUnSignUp(
          opportunity.id,
          opportunity.date,
          opportunity.time
        );
        if (unregistered) {
          alert("You have been unregistered successfully.");
        }
        return; // stop here after un-sign-up
      }

      // Otherwise, handle sign up
      if (opportunity.redirect_url) {
        // External registration link flow
        const confirmed = window.confirm(
          "This opportunity requires registration on an external site.\n\nClick OK to open the registration link in a new tab."
        );
        if (confirmed) {
          window.open(opportunity.redirect_url, "_blank");
          await handleSignUp(opportunity.id);
          alert("You are now registered and redirected to the external site!");
        }
        return;
      }

      // Normal sign up
      await handleSignUp(opportunity.id);
      alert("You have successfully signed up!");
    } catch (error) {
      console.error("Error during sign up / un-sign up:", error);
      alert("Something went wrong. Please try again.");
    }
  };


  const handleAttendanceSubmitted = async () => {
    try {
      // Fetch updated attendance data from the API
      const attendanceData = await getOpportunityAttendance(opportunity.id);

      // Update the opportunity's involved_users with the attendance data
      if (attendanceData.users && opportunity.involved_users) {
        const updatedInvolvedUsers = opportunity.involved_users.map((user) => {
          const attendanceUser = attendanceData.users.find((au: any) => au.user_id === user.id);
          if (attendanceUser) {
            return {
              ...user,
              attended: attendanceUser.attended,
            };
          }
          return user;
        });

        // Update the opportunity object
        const updatedOpportunity = {
          ...opportunity,
          involved_users: updatedInvolvedUsers,
          attendance_marked: true,
        };

        // Update the opportunities in the parent component
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      }

      alert('Attendance submitted successfully!');
    } catch (error: any) {
      console.error('Error updating attendance data:', error);
      alert('Attendance submitted, but failed to update display. Please refresh the page.');
    }
  };

  // Admin functions for user management
  const handleUserLookup = () => {
    if (!userLookupName.trim()) {
      setUserLookupResults([]);
      return;
    }

    // Filter students by name (case-insensitive partial match) in real-time
    const matchingUsers = sourceStudents.filter((student) =>
      student.name.toLowerCase().includes(userLookupName.toLowerCase().trim())
    );

    setUserLookupResults(matchingUsers);
  };

  const handleRegisterUser = async (userId: number) => {
    if (signedUpStudents.length >= opportunity.total_slots) {
      alert('This event has reached its maximum capacity.');
      return;
    }

    setIsRegisteringUser(true);
    try {
      await registerForOpp({ user_id: userId, opportunity_id: opportunity.id });
      // Refresh opportunities data to get updated involved_users
      const updatedOpps = await getCurrentOpportunities();
      // setOpportunities(updatedOpps);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      // alert('User registered successfully!');
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register user. They may already be registered.');
    } finally {
      setIsRegisteringUser(false);
    }
  };

  const handleUnregisterUser = async (userId: number) => {
    try {
      await unregisterForOpp({
        user_id: userId,
        opportunity_id: opportunity.id,
        opportunityDate: opportunity.date,
        opportunityTime: opportunity.time,
        isAdminOrHost: activeCurrentUser.admin || opportunity.host_id === activeCurrentUser.id,
      });
      // Refresh opportunities data to get updated involved_users
      const updatedOpps = await getCurrentOpportunities();
      // setOpportunities(updatedOpps);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      alert('User unregistered successfully!');
    } catch (error) {
      console.error('Error unregistering user:', error);
      alert('Failed to unregister user.');
    }
  };

  const handleTransferHost = async () => {
    if (!selectedTransferUserId) return;
    const newHost = eligibleHostUsers.find((u) => u.id === selectedTransferUserId);
    if (!newHost) return;
    const confirmed = window.confirm(`Transfer host to ${newHost.name}?`);
    if (!confirmed) return;
    setIsTransferringHost(true);
    try {
      await updateOpportunity(opportunity.id, { host_user_id: selectedTransferUserId });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setShowTransferHost(false);
      setSelectedTransferUserId('');
      alert(`Host transferred to ${newHost.name}.`);
    } catch (error) {
      console.error('Error transferring host:', error);
      alert('Failed to transfer host.');
    } finally {
      setIsTransferringHost(false);
    }
  };

  const handleUnapproveOpportunity = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to unapprove the opportunity "${opportunity.name}"? This will hide it from all users.`
    );
    if (!confirmed) return;

    try {
      await updateOpportunity(opportunity.id, { approved: false });

      // Update the local opportunity object to reflect changes
      opportunity.approved = false;
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });

      alert('Opportunity has been unapproved successfully!');
    } catch (error: any) {
      alert(`Error unapproving opportunity: ${error.message}`);
    }
  };

  const handleDeleteOpportunity = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the opportunity "${opportunity.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteOpporturnity(opportunity.id);

      // Remove the opportunity from the state
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });

      alert('Opportunity has been deleted successfully!');
      // Navigate back to opportunities page
      router.push(`/(tabs)/OpportunitiesPage`);
    } catch (error: any) {
      alert(`Error deleting opportunity: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Format the date and time correctly using the utility function
      const formattedDateTime = formatDateTimeForBackend(editForm.date, editForm.time);

      const updateData = {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        date: formattedDateTime,
        duration: editForm.duration,
        nonprofit: editForm.nonprofit,
        redirect_url: editForm.redirect_url.trim() || null,
        allow_carpool: editForm.allow_carpool
      };

      await updateOpportunity(opportunity.id, updateData);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });

      // Update the local opportunity object to reflect changes
      Object.assign(opportunity, {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        date: editForm.date,
        time: editForm.time,
        duration: editForm.duration,
        redirect_url: editForm.redirect_url.trim() || null,
        allow_carpool: editForm.allow_carpool
      });

      alert('Opportunity details updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      alert(`Error updating opportunity: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: opportunity.name,
      description: opportunity.description,
      address: opportunity.address,
      date: opportunity.date,
      time: opportunity.time,
      duration: opportunity.duration,
      redirect_url: opportunity.redirect_url || '',
      nonprofit: opportunity.nonprofit || '',
      allow_carpool: opportunity.allow_carpool || false
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsEditing(false);
  };

  // Slot limit management functions
  const handleUpdateSlotLimit = async () => {
    if (newSlotLimit < signedUpStudents.length) {
      alert(
        `Cannot set slot limit lower than current number of participants (${signedUpStudents.length}).`
      );
      return;
    }

    if (newSlotLimit === opportunity.total_slots) {
      setIsEditingSlots(false);
      return;
    }

    setIsUpdatingSlots(true);
    try {
      await updateOpportunity(opportunity.id, { total_slots: newSlotLimit });
      alert(`Slot limit updated successfully to ${newSlotLimit}!`);

      // Update the local opportunity object
      opportunity.total_slots = newSlotLimit;
      setIsEditingSlots(false);
    } catch (error: any) {
      alert(`Error updating slot limit: ${error.message}`);
    } finally {
      setIsUpdatingSlots(false);
    }
  };

  const handleCancelSlotEdit = () => {
    setNewSlotLimit(opportunity.total_slots);
    setIsEditingSlots(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const currentComments = opportunity.comments || [];
      const updatedComments = [...currentComments, newComment.trim()];

      await updateOpportunity(opportunity.id, { comments: updatedComments });

      // Update the local opportunity object to reflect changes
      opportunity.comments = updatedComments;

      // Clear the input and show success message
      setNewComment('');
      alert('Announcement added successfully!');

      // Force a re-render by updating the opportunity object
      router.push({
        pathname: `../OpportunityDetailPage`,
        params: { id: opportunity.id.toString() },
      });
    } catch (error: any) {
      alert(`Error adding announcement: ${error.message}`);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleStartSlotEdit = () => {
    setNewSlotLimit(opportunity.total_slots);
    setIsEditingSlots(true);
  };

  // Handle image selection
  const handleImageSelect = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("Permission required");
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

      // Update the opportunity with the new image URL
      await updateOpportunity(opportunity.id, { image: imageUrl });

      // Update local state
      opportunity.imageUrl = imageUrl;
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });

      // Clear the selected image and preview
      setSelectedImage(null);
      setImagePreview(null);

      alert('Image updated successfully!');
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!userLookupName.trim()) {
      setUserLookupResults([]);
      return;
    }

    // Filter students by name (case-insensitive partial match) in real-time
    const matchingUsers = sourceStudents.filter((student) =>
      student.name.toLowerCase().includes(userLookupName.toLowerCase().trim())
    );

    setUserLookupResults(matchingUsers);
  }, [userLookupName, sourceStudents]);

  useEffect(() => {
    const uri = imagePreview || opportunity.imageUrl;

    if (!uri) return;

    Image.getSize(uri, (width, height) => {
      const displayWidth = Dimensions.get("window").width - 48; // adjust for padding
      setImageHeight(displayWidth * height / width);
    });
  }, [imagePreview, opportunity.imageUrl]);

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

  const { setClonedOpportunityData } = useCloneOpportunity();

  const handleCloneEvent = () => {
    setClonedOpportunityData({
      name: opportunity.name,
      description: opportunity.description,
      address: opportunity.address,
      date: opportunity.date,
      time: opportunity.time,
      duration: opportunity.duration,
      total_slots: opportunity.total_slots,
      nonprofit: opportunity.nonprofit || "",
      host_org_id: opportunity.host_org_id,
      causes: opportunity.causes || [],
      tags: opportunity.tags || [],
      redirect_url: opportunity.redirect_url || "",
      imageUrl: opportunity.imageUrl || "",
      visibility: opportunity.visibility || [],
      isPrivate: opportunity.isPrivate || false,
      allow_carpool: opportunity.allow_carpool || false,
    });

    router.push("/CreateOpportunityPage");
  };

  const img = opportunity.imageUrl;
	const oppPicSource =
		typeof img === 'string' && img.startsWith('http')
			? { uri: img }
			: require('@/assets/images/backup.jpeg');

  return (
    <ScrollView
      style={styles.container}
      // StickyHeaderComponent={MainHeader}
      stickyHeaderIndices={[0]}
    >
      <View style={styles.mainHeader}>
        <MainHeader />
      </View>
      <View style={styles.page}>
        <View style={styles.headerShadow}>
          <View style={styles.header}>
            <Image
              source={oppPicSource}
              alt={opportunity.name}
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
              <Text style={styles.headerName}>{opportunity.name}</Text>
              {opportunity.nonprofit && (
                <Text style={styles.headerNonprof}>{opportunity.nonprofit}</Text>
              )}
              {opportunity.host_org_name && (
                <Text style={styles.headerHost}>Hosted by {opportunity.host_org_name}</Text>
              )}
              {isUserHost && (
                <View>
                  <Text style={styles.headerAreHost}>You are the host</Text>
                </View>
              )}
              {activeCurrentUser.admin && !isUserHost && (
                <View>
                  <Text style={styles.headerAdminView}>Admin View</Text>
                </View>
              )}
              <Pressable
                onPress={handleButtonClick}
                disabled={(!isUserSignedUp && !canSignUp)}
                style={[styles.headerSignUp,
                  isUserSignedUp
                    ? { backgroundColor: "#10B981", }
                    : canSignUp
                      ? { backgroundColor: Theme.cornellRed }
                      : { backgroundColor: "rgba(107,114,128,0.7)" }
                ]}
              >
                <Text style={styles.headerSignUpText}>{isUserSignedUp ? 'Signed Up ✓' : canSignUp ? 'Sign Up Now' : 'Event Full'}</Text>
              </Pressable>
              
            </View>
          </View>
        </View>
        <View style={styles.content}>

          {/* Announcements Section */}
          <View style={styles.announceSection}>
            <Pressable
              onPress={() => setShowAnnouncements((prev) => !prev)}
              style={styles.collapsibleHeader}
            >
              <Text style={styles.sectionHeader}>Announcements</Text>
              <Text style={{ marginBottom: 8 }}>{showAnnouncements ? "▲" : "▼"}</Text>
            </Pressable>
            
            {showAnnouncements && (
              <View style={styles.collapsibleContent}>
                {/* Host can add new announcements */}
                {canManageOpportunity && (
                  <View style={styles.newAnnounce}>
                    <Text style={styles.addNewHeader}>Add New Announcement</Text>
                    <View style={{ rowGap: 12 }}>
                      <TextInput
                        value={newComment}
                        onChangeText={setNewComment}
                        placeholder="Enter your announcement here..."
                        placeholderTextColor='#9E9E9E'
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                      <View style={styles.flexGap}>
                        <Pressable
                          onPress={handleAddComment}
                          disabled={!hasComment || isAddingComment}
                          style={[
                            styles.newCommentBtn,
                            (!hasComment || isAddingComment) && styles.disabledBtn,
                          ]}
                        >
                          <Text style={styles.boldWhite}>{isAddingComment ? 'Adding...' : 'Post Announcement'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setNewComment('')}
                          disabled={!hasComment}
                          style={[
                            styles.newCommentArea,
                            !hasComment && styles.disabledBtn,
                          ]}
                        >
                          <Text style={styles.semiboldWhite}>Clear</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}

                {/* Display existing announcements */}
                {opportunity.comments && opportunity.comments.length > 0 ? (
                  <FlatList
                    data={opportunity.comments}
                    keyExtractor={(_, index) => index.toString()}
                    scrollEnabled={false}
                    renderItem={({ item:comment }) => (
                      <View style={styles.announceDisplay}>
                        <Text style={styles.commentTxt}>{comment}</Text>
                        <Text style={styles.commentLabel}>Host</Text>
                      </View>
                    )}
                  />
                ) : (
                  <View style={styles.noComments}>
                    <Text style={styles.noCommentsTxt}>{canManageOpportunity ? 'No announcements yet. Add one above!' : 'No announcements yet.'}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Key Info */}
          <View style={styles.contentTop}>
            <View style={styles.keyInfo}>
              <Text style={styles.infoHeader}>Event Details</Text>
              {!isEditing && (
                <View style={{ gap: 8 }} >
                  <View style={styles.userViewIcons}>
                    <MaterialDesignIcons name="calendar" size={20} color="#374151" />
                    <Text style={{ color: "#374151" }}>{displayDate}</Text>
                  </View>
                  <View style={styles.userViewIcons}>
                    <MaterialDesignIcons name="clock" size={20} color="#374151" />
                    <Text style={{ color: "#374151" }}>{displayTime} - {displayEndTime}</Text>
                  </View>
                  {opportunity.address && (
                    <View style={styles.userViewIcons}>
                      <MaterialIcons name="location-pin" size={20} color='#374151'/>
                      <Text style={{ color: "#374151" }}>{opportunity.address}</Text>
                    </View>
                  )}
                  <View style={styles.userViewIcons}>
                    <MaterialDesignIcons name="account-group-outline" size={20} color="#374151" />
                    <Text style={{ color: "#374151" }}>{availableSlots} of {opportunity.total_slots} slots remaining</Text>
                  </View>
                  <View style={styles.userViewIcons}>
                    <MaterialDesignIcons name="star-outline" size={20} color="#374151" />
                    <Text style={{ color: "#374151" }}>{opportunity.points} points</Text>
                  </View>
                </View>
              )}
              {canManageOpportunity && (
                <View style={styles.hostEditBtns}>
                  {!isEditing ? (
                    <>
                      <Pressable
                        onPress={() => setIsEditing(true)}
                        style={styles.editDetailsBtn}
                      >
                        <Text style={[styles.boldWhite, { textAlign: 'center' }]}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCloneEvent}
                        style={styles.cloneOppBtn}
                      >
                        <Text style={[styles.boldWhite, { textAlign: 'center' }]}>Clone</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleDeleteOpportunity}
                        style={styles.deleteOppBtn}
                      >
                        <Text style={[styles.boldWhite, { textAlign: 'center' }]}>Delete</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.editBtnsWrapper}>
                      <Pressable
                        onPress={handleSaveChanges}
                        disabled={isSaving}
                        style={styles.savingBtn}
                      >
                        <Text style={styles.boldWhite}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCancelEdit}
                        style={styles.cancelEditBtn}
                      >
                        <Text style={styles.semiboldWhite}>Cancel</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>
            {isEditing ? (
              <View style={{ rowGap: 12 }}>
                {/* Image Upload Section */}
                <View>
                  <Text style={styles.imgUploadTxt}>Event Image</Text>
                  <View style={{ rowGap: 16 }}>
                    <View> 
                      <Image
                        source={
                          imagePreview
                            ? { uri: imagePreview }
                            : opportunity.imageUrl
                              ? { uri: opportunity.imageUrl }
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
                  <View>
                    <Text style={styles.smallGray700}>Date</Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      style={styles.editInput}
                    >
                      <Text>
                        {date.toLocaleDateString()}
                      </Text>
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="inline"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) { setDate(selectedDate) }
                        }}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={styles.smallGray700}>Time</Text>
                    <Pressable
                      onPress={() => setShowTimePicker(true)}
                      style={styles.editInput}
                    >
                      <Text>
                        {time.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Pressable>
                    {showTimePicker && (
                      <DateTimePicker
                        value={time}
                        mode="time"
                        display="spinner"
                        onChange={(event, selectedTime) => {
                          setShowTimePicker(false);
                          if (selectedTime) { setTime(selectedTime) }
                        }}
                      />
                    )}
                  </View>
                </View>
                <View>
                  <Text style={styles.smallGray700}>Duration (minutes)</Text>
                  <TextInput
                    keyboardType="numeric"
                    value={editForm.duration?.toString() ?? ""}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      setEditForm((prev) => ({ ...prev, duration: parseInt(text) }))}}
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
            ) : (
              <View style={styles.desc}>
                <Text>{formatDescription(opportunity.description)}</Text>
              </View>
            )}

            <Pressable
              onPress={handleButtonClick}
              disabled={!canSignUp && !isUserSignedUp}
              style={[
                styles.signupBtn,
                { backgroundColor: isUserSignedUp
                  ? "#16A34A"
                  : canSignUp
                    ? Theme.cornellRed
                    : "#9CA3AF" }
              ]}
            >
              <Text style={styles.signupBtnText}>{isUserSignedUp ? 'Signed Up ✓' : canSignUp ? 'Sign Up Now' : 'Event Full'}</Text>
            </Pressable>

            <View style={styles.slots}>
              <View style={styles.participants}>
                <Text style={styles.participantsTxt}>Participants ({signedUpStudents.length}/{opportunity.total_slots})</Text>
                <View>
                  <Text style={[styles.smallGray600, { textAlign: "right"}]}>Available</Text>
                  <Text style={[
                      styles.slotsLeft,
                      { color: availableSlots > 0 ? "#16A34A" : "#DC2626" }
                    ]}
                  >
                    {availableSlots}
                  </Text>
                </View>
              </View>
              {signedUpStudents.length > 0 ? (
                <View style={styles.signUpStudents}>
                  {signedUpStudents.map(student => (
                    <View
                      key={`${student.id}-${student._lastUpdate || 'no-update'}`}
                      style={styles.students}
                    >
                      <Pressable onPress={() => router.push(`/profile/${student.id}`)}>
                        <Text style={styles.studentName}>{student.name}</Text> 
                      </Pressable>
                      {activeCurrentUser.admin && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleUnregisterUser(student.id);
                          }}
                          style={styles.unregBtn}
                        >
                          <Text style={[styles.boldWhite, { textAlign: 'center' }]}>Unregister</Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.firstNote}>
                  <Text style={styles.firstNoteText}>Be the first to sign up! +5 bonus points</Text>
                </View>
              )}

              {/* Admin User Registration Section */}
              {activeCurrentUser.admin && (
                <View style={styles.adminSection}>
                  <Text style={styles.adminHeader}>Admin: Register Users</Text>
                  {!showUserLookup ? (
                    <Pressable
                      onPress={() => setShowUserLookup(true)}
                      style={styles.registerBtn}
                    >
                      <Text style={styles.boldWhite}>Register User by Name</Text>
                    </Pressable>
                  ) : (
                    <View style={{ rowGap: 16 }}>
                      <View style={styles.flexGap}>
                        <TextInput
                          placeholder="Type user name to search..."
                          value={userLookupName}
                          onChangeText={setUserLookupName}
                          autoFocus
                          style={styles.lookupInput}
                        />
                        <Pressable
                          onPress={() => {
                            setShowUserLookup(false);
                            setUserLookupName('');
                            setUserLookupResults([]);
                          }}
                          style={styles.lookupBtn}
                        >
                          <Text style={styles.semiboldWhite}>Cancel</Text>
                        </Pressable>
                      </View>

                      {/* Show results as you type */}
                      {userLookupName.trim() && (
                        <View style={styles.results}>
                          {userLookupResults.length > 0 ? (
                            <>
                              <FlatList
                              data={userLookupResults}
                              keyExtractor={(user) => user.id.toString()}
                              nestedScrollEnabled
                              keyboardShouldPersistTaps="handled"
                              renderItem={({ item: user }) => {
                                const isAlreadyRegistered = signedUpStudents.some(s => s.id === user.id);
                                return(
                                  <View style={styles.lookupOneResult}>
                                    <View>
                                      <Text style={styles.resultName}>{user.name}</Text>
                                      <Text style={styles.smallGray600}>{user.email}</Text>
                                    </View>
                                    <Pressable
                                      onPress={() => handleRegisterUser(user.id)}
                                      disabled={isRegisteringUser || isAlreadyRegistered}
                                      style={styles.resultBtn}
                                    >
                                      <Text style={styles.boldWhite}>{isRegisteringUser ? 'Registering...' : isAlreadyRegistered ? 'Already Registered' : 'Register'}</Text>
                                    </Pressable>
                                  </View>
                                )
                              }}
                              />
                            </>
                          ) : (
                            <Text style={styles.lookupNote}>
                              No users found matching "{userLookupName}"  
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Show hint when input is empty */}
                      {!userLookupName.trim() && (
                        <Text style={styles.lookupHint}>Start typing a name to search for users...</Text>
                      )}
                    </View>
                  )}
                </View>
              )}
              {/* Slot limit warning for hosts */}
              {canManageOpportunity && availableSlots <= 0 && (
                <View style={styles.warningSection}>
                  <Text style={styles.warningTxt}>⚠️ This event has reached its maximum capacity. Consider increasing the slot limit if you want to allow more participants.</Text>
                </View>
              )}
            </View>
            
            {allowCarpool && (isUserSignedUp || activeCurrentUser.admin) &&
              <Pressable
                onPress={() => {router.push(`/carpool/${opportunity.id}`)}}
                style={styles.viewCarpools}
              >
                <Text style={styles.viewCarpoolsTxt}>View Carpool Rides</Text>
              </Pressable>
            }
          </View>

          <View style={styles.manageSection}>
            {canManageOpportunity ? (
              <View style={{ rowGap: 24 }}>
                {/* <AttendanceManager
                  opportunity={opportunity}
                  participants={signedUpStudents}
                  onAttendanceSubmitted={handleAttendanceSubmitted}
                /> */}

                {/* Slot Limit Management */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>Slot Management</Text>
                  <View style={{ rowGap: 16 }}>
                    <View style={styles.currentSlots}>
                      <View>
                        <Text style={styles.smallGray600}>Current Slot Limit</Text>
                        <Text style={styles.totalSlots}>{opportunity.total_slots}</Text>
                      </View>
                      <View>
                        <Text style={[styles.smallGray600, { textAlign: "right" }]}>Available Slots</Text>
                        <Text
                          style={[
                            styles.availableSlots,
                            { color: availableSlots > 0 ? "#16A34A" : "#DC2626"}
                          ]}
                        >
                          {availableSlots}
                        </Text>
                      </View>
                    </View>

                    {!isEditingSlots ? (
                      <Pressable
                        onPress={handleStartSlotEdit}
                        style={styles.updateSlotLimit}
                      >
                        <Text style={styles.boldWhite}>Update Slot Limit</Text>
                      </Pressable>
                    ) : (
                      <View style={{ rowGap: 12 }}>
                        <View>
                          <Text style={styles.smallGray700}>New Slot Limit</Text> 
                          <TextInput
                            keyboardType='numeric'
                            value={newSlotLimit?.toString() ?? ""}
                            onChangeText={(text) => {
                              if (text === '') {
                                setNewSlotLimit(0);
                              } else {
                                const numValue = parseInt(text, 10);
                                if (!isNaN(numValue) && numValue >= 1) {
                                  setNewSlotLimit(numValue);
                                }
                              }
                            }}
                            onBlur={() => {
                              if (isNaN(newSlotLimit) || newSlotLimit < signedUpStudents.length) {
                                setNewSlotLimit(signedUpStudents.length);
                              }
                            }}
                            placeholder={`Minimum: ${signedUpStudents.length}`}
                            style={styles.newSlotsNum}
                          />
                          <Text style={styles.minSlots}>Minimum: {signedUpStudents.length} (current participants)</Text>
                        </View>
                        <View style={styles.flexGap}>
                          <Pressable
                            onPress={handleUpdateSlotLimit}
                            disabled={isUpdatingSlots || newSlotLimit < signedUpStudents.length}
                            style={styles.saveUpdateBtn}
                          >
                            <Text style={styles.boldWhite}>{isUpdatingSlots ? 'Updating...' : 'Save Changes'}</Text>
                          </Pressable>
                          <Pressable
                            onPress={handleCancelSlotEdit}
                            disabled={isUpdatingSlots}
                            style={styles.cancelUpdateBtn}
                          >
                            <Text style={styles.semiboldWhite}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                {/* Transfer Host */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>Transfer Host</Text>
                  {!showTransferHost ? (
                    <Pressable
                      onPress={() => setShowTransferHost(true)}
                      style={styles.transferHostBtn}
                    >
                    <Text style={styles.boldWhite}>Transfer Host</Text>
                    </Pressable>
                  ) : (
                    <View style={{ rowGap: 12 }}>
                      <View>
                        <Picker
                          selectedValue={selectedTransferUserId}
                          onValueChange={(value) =>
                            setSelectedTransferUserId(
                              value === "" ? "" : Number(value)
                            )
                          }
                          style={styles.hostTransferOptions}
                          itemStyle={{ fontSize: 16 }}
                        >
                          <Picker.Item
                            label="Select new host..."
                            value=""
                          />
                          {eligibleHostUsers
                            .filter((u) => u.id !== opportunity.host_id)
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((u) => (
                              <Picker.Item
                                key={u.id}
                                label={`${u.name}${u.admin ? " (admin)" : ""}`}
                                value={u.id}
                              />
                            ))}
                        </Picker>
                      </View>
                      <View style={styles.flexGap}>
                        <Pressable
                          onPress={handleTransferHost}
                          disabled={!selectedTransferUserId || isTransferringHost}
                          style={styles.confirmTransferBtn}
                        >
                          <Text style={styles.boldWhite}>{isTransferringHost ? 'Transferring...' : 'Confirm'}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => { setShowTransferHost(false); setSelectedTransferUserId(''); }}
                          style={styles.cancelTransferBtn}
                        >
                          <Text style={styles.semiboldWhite}>Cancel</Text>
                        </Pressable>  
                      </View>
                    </View>
                  )}
                </View>

                {/* Admin Unapprove Button - Now visible to admins and hosts */}
                {activeCurrentUser.admin && opportunity.approved !== false && (
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Admin Actions</Text>
                    <Pressable
                      onPress={handleUnapproveOpportunity}
                      style={styles.unapproveBtn}
                    >
                      <Text style={styles.boldWhite}>Unapprove Opportunity</Text>
                    </Pressable>
                  </View>
                )}

                {/* Send Email to All Participants Button */}
                {signedUpStudents.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Communication</Text>
                    <Pressable
                      onPress={async () => {
                        const participantEmails = signedUpStudents
                          .map(student => student.email)
                          .filter((email): email is string =>
                            typeof email === "string" && email.trim().length > 0
                          )
                        if (!participantEmails) {
                          alert("No participant emails available.");
                          return;
                        }
                        const available = await MailComposer.isAvailableAsync();
                        if (!available) {
                          alert("Email is not available on this device.");
                          return;
                        }
                        await MailComposer.composeAsync({
                          recipients: participantEmails,
                          subject: `Update for ${opportunity.name}`,
                          body:
                            `Hi everyone,\n\n` +
                            `This is an update regarding ${opportunity.name}.\n\n` +
                            `Best regards,\n${activeCurrentUser.name}`,
                        });
                      }}
                      style={styles.emailBtn}
                    >
                      <MaterialDesignIcons name='email-outline' size={20} color='white'/>
                      <Text style={styles.boldWhite}>Send Email to All Participants</Text>
                    </Pressable>
                    <Text style={styles.emailNote}>Opens Gmail draft with all participant emails</Text>

                    {/* Participant Phone Numbers Button */}
                    <Pressable
                    onPress={async () => {
                        const participantPhones = signedUpStudents
                          .map((student) => student.phone)
                          .filter((phone): phone is string =>
                            typeof phone === "string" && phone.trim().length > 0
                          )
                          .map((phone) => phone.trim())
                          .join("\n");
                        if (!participantPhones) {
                          alert("No participant phone numbers available.");
                          return;
                        }
                        await Clipboard.setStringAsync(participantPhones);
                        alert("Participant phone numbers copied to clipboard!");
                      }}
                      style={styles.phoneBtn}
                    >
                      <MaterialDesignIcons name='phone-outline' size={20} color='white' />
                      <Text style={styles.boldWhite}>Participant Phone Numbers</Text>
                    </Pressable>
                    <Text style={styles.phoneNote}>Copies participant phone numbers to clipboard</Text>
                  </View>
                )}
              </View>
            ) : (
              <>
                {/* Slot limit enforcement message */}
                {!isUserSignedUp && availableSlots <= 0 && (
                  <View style={styles.maxCapacity}>
                    <Text style={styles.maxCapacityTxt}>
                      This event has reached its maximum capacity of {opportunity.total_slots} participants.
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {/* Causes and Tags Section */}
            {/* {(opportunity.causes && opportunity.causes.length > 0) || (opportunity.tags && opportunity.tags.length > 0) ? (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Categories & Tags</Text>
                <View style={{ rowGap: 12 }}>
                  {opportunity.causes && Array.isArray(opportunity.causes) && opportunity.causes.length > 0 && (
                    <View>
                      <Text style={styles.smallGray700}>Causes</Text>
                      <View style={styles.causes}>
                        {opportunity.causes.map((cause, index) => (
                          <View key={index} style={styles.cause} >
                            <Text>{cause}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {opportunity.tags && Array.isArray(opportunity.tags) && opportunity.tags.length > 0 && (
                    <View>
                      <Text style={styles.smallGray700}>Tags</Text> 
                      <View style={styles.tags}>
                        {opportunity.tags.map((tag, index) => (
                          <View key={index} style={styles.tag} > 
                            <Text>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ) : null} */}

            {/* Contact Host Section - Available to all users */}
            {opportunity.host_id && (
              <View style={styles.section}> 
                <Text style={styles.sectionHeader}>Contact Host</Text>
                {(() => {
                  const hostUser = sourceStudents.find(student => student.id === opportunity.host_id);
                  if (hostUser) {
                    return (
                      <View style={{ rowGap: 12 }}>
                        <Pressable
                          onPress={() => router.push(`/profile/${hostUser.id}`)}
                          style={styles.contactBtn}
                        >
                          <View style={styles.contactSymbol}>
                            <MaterialDesignIcons name="account-outline" size={20} color="white" />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={{ fontWeight: "600", color: "#1F2937" }}>{hostUser.name}</Text>
                            <Text style={{ fontSize: 12, color: "#6B7280" }}>Event Host</Text>
                          </View>
                          <MaterialDesignIcons name="chevron-right" size={18} color="#9CA3AF"/>
                        </Pressable>

                        {/* Host Organization Information */}
                        {opportunity.host_org_name && (
                          <View style={styles.hostInfo}>
                            <MaterialDesignIcons name="office-building-outline" size={20} color={Theme.cornellRed}/>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.smallGray600}>Host Organization</Text>
                              <Text style={styles.orgName}>{opportunity.host_org_name}</Text>
                            </View>
                          </View>
                        )}

                        {hostUser.email && (
                          <View style={styles.hostInfo}>
                            <MaterialDesignIcons name="email-outline" size={20} color={Theme.cornellRed}/>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.smallGray600}>Email</Text>
                              <Text
                                style={styles.hostLink}
                                onPress={() => Linking.openURL(`mailto:${hostUser.email}`)}
                              >
                                {hostUser.email}
                              </Text>
                            </View>
                          </View>
                        )}

                        {hostUser.phone && isUserSignedUp && (
                          <View style={styles.hostInfo}>
                            <MaterialDesignIcons name="phone-outline" size={20} color={Theme.cornellRed}/>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.smallGray600}>Phone</Text>
                              <Text
                                style={styles.hostLink}
                                onPress={() => Linking.openURL(`tel:${hostUser.phone}`)}
                              >
                                {hostUser.phone}
                              </Text>
                            </View>
                          </View>
                        )}

                        {!hostUser.email && !hostUser.phone && (
                          <View style={styles.noInfo}>
                            <Text style={styles.noInfoTxt}>No contact information available for the host.</Text>
                          </View>
                        )}
                      </View>
                    );
                  }
                  return (
                    <View style={styles.noInfo}>
                      <Text style={styles.noInfoTxt}>Host information not available.</Text>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainHeader: {
    paddingHorizontal: 16,
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
    color: 'rgb(255, 255, 255, 0.9)',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',

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
  headerAreHost: {
    color: 'rgb(255,255,255)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',

    width: 140,
    marginTop: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.8)',
    paddingVertical: 4,
    borderRadius: 9999,
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
  headerSignUp: {
    width: 140,
    marginTop: 18,
    alignItems: 'center',
    verticalAlign: 'middle',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerSignUpText: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    flexDirection: 'column',
    gap: 20,
  },
  contentTop: {
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 32,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  keyInfo: {
    // justifyContent: 'space-between',
    // alignItems: 'center',
    marginBottom: 12,
  },
  infoHeader: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  eventTime: {
    color: 'rgb(55, 65, 81)',
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 12,
    gap: 4,
  },
  hostEditBtns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  flexGap: {
    flexDirection: 'row',
    gap: 8,
  },
  editDetailsBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,

    width: "30%",
  },
  cloneOppBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(37, 99, 235)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,

    width: "30%",
  },
  deleteOppBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(220, 38, 38)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,

    width: "30%",
  },
  editBtnsWrapper: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  savingBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(22, 163, 74)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelEditBtn: {
    color: 'rgb(255, 255, 255)',
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  imgUploadTxt: {
    color: '#616161',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
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
  smallGray700: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
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
  desc: {
    color: '#616161',
    fontSize: 18,
    lineHeight: 28,
    flexShrink: 1,
    marginBottom: 4,
  },
  descWrapper: {
    marginBottom: 8,
    lineHeight: 22,
    flexShrink: 1,
  },
  slots: {
    marginTop: 20,
  },
  participants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantsTxt: {
    fontSize: 23,
    lineHeight: 32,
    fontWeight: '700',
  },
  slotsLeft: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'right',
  },
  signUpStudents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 20,
  },
  students: {
    marginLeft: 24,
  },
  studentName: {
    color: '#424242',
    fontWeight: '700',
  },
  unregBtn: {
    color: 'rgb(255, 255, 255)',
    width: 100,
    fontSize: 12,
    lineHeight: 16,
    backgroundColor: 'rgb(220, 38, 38)',
    borderRadius: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  firstNote: {
    borderRadius: 8,
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#D3D3D3',
  },
  firstNoteText: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 28,
    textAlign: 'center',
  },
  adminSection: {
    borderRadius: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  adminHeader: {
    color: '#6B21A8',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  registerBtn: {
    color: 'rgb(255, 255, 255)',
    borderRadius: 8,
    backgroundColor: '#9333EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lookupInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  lookupBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#9E9E9E',
    borderRadius: 8,
  },
  results: {
    maxHeight: 240,
  },
  lookupOneResult: {
    backgroundColor: 'rgb(255, 255, 255)',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E9D5FF',
    padding: 12,
    gap: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultName: {
    fontWeight: '600',
  },
  smallGray600: {
    fontSize: 14,
    lineHeight: 20,
    color: '#757575',
  },
  resultBtn: {
    color: 'rgb(255, 255, 255)',
    borderRadius: 10,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  lookupNote: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 16,
  },
  lookupHint: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 8,
  },
  warningSection: {
    borderRadius: 8,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  warningTxt: {
    color: '#FBC02D',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  announceSection: {
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 20,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleContent: {
    //
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  newAnnounce: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 8,
    padding: 12,
  },
  addNewHeader: {
    color: '#1E40AF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  newCommentBtn: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  newCommentArea: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    backgroundColor: '#9E9E9E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  disabledBtn: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  boldWhite: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '800',
  },
  semiboldWhite: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '500',
  },
  announceDisplay: {
    backgroundColor: '#f9fafb',
    borderColor: '#EEEEEE',
    borderRadius: 8,
    gap: 12,
    padding: 16,
    paddingVertical: 12,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentTxt: {
    color: '#424242',
    width: '85%',
    // lineHeight: 24,
  },
  commentLabel: {
    color: '#9E9E9E',
    fontSize: 12,
    // lineHeight: 16,
  },
  noComments: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 4,
    padding: 12,
  },
  noCommentsTxt: {
    color: '#666666',
    textAlign: 'center',
  },
  viewCarpools: {
    width: '100%',
    backgroundColor: '#e63434',
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewCarpoolsTxt: {
    color: 'rgb(255, 255, 255)',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  availableSlots: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
  },
  manageSection: {
    gap: 18,
  },
  section: {
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 16,
    borderRadius: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  currentSlots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalSlots: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#424242'
  },
  updateSlotLimit: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    backgroundColor: Theme.cornellRed,
    width: '100%',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  newSlotsNum: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  minSlots: {
    color: '#9E9E9E',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  saveUpdateBtn: {
    color: 'rgb(255, 255, 255)',
    flex: 1,
    fontWeight: '700',
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelUpdateBtn: {
    color: 'rgb(255, 255, 255)',
    flex: 1,
    fontWeight: '700',
    backgroundColor: '#9E9E9E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  transferHostBtn: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  hostTransferOptions: {
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginBottom: 8,
  },
  confirmTransferBtn: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelTransferBtn: {
    fontWeight: '700',
    color: 'rgb(255, 255, 255)',
    flex: 1,
    backgroundColor: '#9E9E9E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unapproveBtn: {
    color: 'rgb(255, 255, 255)',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    width: '100%',
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emailBtn: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    gap: 8,
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailNote: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  phoneBtn: {
    color: 'rgb(255, 255, 255)',
    fontWeight: '700',
    backgroundColor: '#16A34A',
    borderRadius: 8,
    gap: 8,
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneNote: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  userViewIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  signupBtn: {
    borderRadius: 8,
    width: '100%',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signupBtnText: {
    color: 'rgb(255, 255, 255)',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
  },
  maxCapacity: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    // marginTop: 12,
    padding: 12
  },
  maxCapacityTxt: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  oppAddressHeader: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  causes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cause: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    color: '#1D4ED8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    backgroundColor: '#DBEAFE',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  contactSymbol: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: Theme.cornellRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 12,
    padding: 12,
    textAlign: 'center'
  },
  orgName: {
    color: '#424242',
    fontWeight: '600',
  },
  hostLink: {
    color: Theme.cornellRed,
    fontWeight: '500'
  },
  noInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  noInfoTxt: {
    color: '#9E9E9E',
    fontSize: 14,
    lineHeight: 20,
  },
})

export default OpportunityDetailPage;
