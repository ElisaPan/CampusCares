/*************
 * TODO:
 *  Severe:
 *    On click outline with red
 *    Replace ALL time and date pickers with formatted text input (https://chatgpt.com/s/t_6a2f185e3ca0819189ba65044f91957f)
 *  High:
 *    -
 *  Low
 *    -
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import * as Theme from '@/constants/theme';
import { useCloneOpportunity } from "@/context/CloneOpportunityContext";
import * as api from '../api';
import { MultiOpp, Opportunity, Organization } from '../types';
import { formatDateTimeForBackend } from '../utils/timeUtils';

import { mockOpportunities, mockOrganizations, mockUsers } from '@/data/initialData';

// Helper function to transform opportunity from backend format to frontend format
const transformOpportunityFromBackend = (opp: any): Opportunity | MultiOpp => {
  // Detect if this is a recurring opportunity (MultiOpp)
  const isMultiOpp =
    opp.days_of_week !== undefined ||
    opp.week_frequency !== undefined ||
    opp.week_recurrences !== undefined;

  // ---------- COMMON: date/time parsing ----------
  let dateOnly = '';
  let timeOnly = '';

  if (opp.date) {
    const dateObj = new Date(opp.date);
    dateOnly = dateObj.toISOString().split('T')[0];

    if (opp.date.includes('GMT')) {
      // Backend sends GMT → convert to Eastern
      const gmtHours = dateObj.getUTCHours();
      const easternHours = (gmtHours - 4 + 24) % 24;
      const hours = easternHours.toString().padStart(2, '0');
      const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
      timeOnly = `${hours}:${minutes}:${seconds}`;
    } else {
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      timeOnly = `${hours}:${minutes}:${seconds}`;
    }
  }

  // Transform involved users if they exist
  const transformedInvolvedUsers = opp.involved_users ? opp.involved_users.map((involvedUser: any) => {
    const user = involvedUser.user || involvedUser;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      interests: user.interests || [],
      friendIds: user.friends || [],
      organizationIds: (user.organizations || []).map((org: any) => org.id) || [],
      admin: user.admin || false,
      gender: user.gender,
      graduationYear: user.graduation_year,
      academicLevel: user.academic_level,
      major: user.major,
      birthday: user.birthday,
      points: user.points || 0,
      registration_date: user.registration_date,
      phone: user.phone,
      car_seats: user.car_seats || 0,
      bio: user.bio,
      registered: involvedUser.registered || false,
      attended: involvedUser.attended || false,
      subscribed: involvedUser.subscribed,
      heard_about: involvedUser.heard_about || '',
    };
  }) : [];

  // ---------- COMMON: image URL ----------
  const resolvedImageUrl =
    opp.image_url || opp.image || opp.imageUrl || 'https://campus-cares.s3.us-east-2.amazonaws.com';

  // ---------- CASE 1: MultiOpp ----------
  if (isMultiOpp) {
    const firstOppDate = opp.opportunities && opp.opportunities.length > 0 ? opp.opportunities[0].date : null;
    const firstOppTime = firstOppDate ? new Date(firstOppDate) : null;
    return {
      id: opp.id,
      name: opp.name,
      date: firstOppDate ? firstOppDate.split('T')[0] : '',
      time: firstOppTime ? firstOppTime.toTimeString().split(' ')[0] : '',
      description: opp.description,
      causes: opp.causes ?? [],
      tags: opp.tags ?? [],
      address: opp.address ?? '',
      nonprofit: opp.nonprofit ?? '',
      image: resolvedImageUrl,
      approved: opp.approved ?? false,
      host_org_name: opp.host_org_name ?? null,
      qualifications: opp.qualifications ?? [],
      visibility: opp.visibility ?? [],
      host_org_id: opp.host_org_id ?? null,
      host_user_id: opp.host_user_id ?? null,
      days_of_week: opp.days_of_week ?? [],
      week_frequency: opp.week_frequency ?? 1,
      week_recurrences: opp.week_recurrences ?? 4,
      start_date: opp.start_date ?? null,
      opportunities: opp.opportunities ?? [],
      isMultiOpp: true,
    } as MultiOpp;
  }


  // ---------- CASE 2: Single Opportunity ----------
  return {
    id: opp.id,
    name: opp.name,
    nonprofit: opp.nonprofit || null,
    description: opp.description,
    date: dateOnly,
    time: timeOnly,
    duration: opp.duration,
    total_slots: opp.total_slots || 10,
    imageUrl: resolvedImageUrl,
    points: opp.duration || 0,
    causes: opp.causes !== undefined ? opp.causes : [],
    isPrivate: false,
    host_id: opp.host_user_id || opp.host_org_id,
    host_org_id: opp.host_org_id,
    host_org_name: opp.host_org_name,
    involved_users: transformedInvolvedUsers,
    address: opp.address || '',
    approved: opp.approved !== undefined ? opp.approved : true,
    attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
    visibility: opp.visibility !== undefined ? opp.visibility : [],
    comments: opp.comments !== undefined ? opp.comments : [],
    qualifications: opp.qualifications !== undefined ? opp.qualifications : [],
    tags: opp.tags !== undefined ? opp.tags : [],
    redirect_url: opp.redirect_url !== undefined ? opp.redirect_url : null,
  } as Opportunity;
};


interface CreateOpportunityPageProps {
  currentUser: any;
  organizations: Organization[];
  opportunities: Opportunity[];
  allOpps: (Opportunity | MultiOpp)[];
  setAllOpps: (allOpps: (Opportunity | MultiOpp)[] | ((prev: (Opportunity | MultiOpp)[]) => (Opportunity | MultiOpp)[])) => void;
  // setOpportunities: (
  //   opportunities: Opportunity[] | ((prev: Opportunity[]) => Opportunity[])
  // ) => void;
}

const CreateOpportunityPage: React.FC<CreateOpportunityPageProps> = ({
  currentUser,
  organizations,
  setAllOpps,
  allOpps,
  opportunities,
}) => {
  
  const USE_MOCKS = true;

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  const user = USE_MOCKS ? mockUsers[0] : currentUser;
  const sourceOrganizations = USE_MOCKS ? mockOrganizations : organizations ?? [];
  const sourceOpportunities =
    USE_MOCKS
    ? mockOpportunities
    : allOpps && allOpps.length > 0
      ? allOpps
      : opportunities ?? [];

  if (!sourceOrganizations) return <Text>Organizations not found</Text>;
  if (!user) return <Text>User not found</Text>;

  const queryClient = useQueryClient();
  const isSingleOpportunity = ( opp: Opportunity | MultiOpp ): opp is Opportunity => {
    return !("isMultiOpp" in opp && opp.isMultiOpp);
  };

  const { clonedOpportunityData, setClonedOpportunityData } = useCloneOpportunity();
  
  // Update the initial formData state to use cloned data
  const [formData, setFormData] = useState({
    name: clonedOpportunityData?.name || '',
    description: clonedOpportunityData?.description || '',
    cause: clonedOpportunityData?.causes || ([] as string[]),
    tags: clonedOpportunityData?.tags || ([] as string[]),
    date: clonedOpportunityData?.date || '',
    time: clonedOpportunityData?.time || '',
    duration: clonedOpportunityData?.duration || 60,
    total_slots: clonedOpportunityData?.total_slots || 10,
    nonprofit: clonedOpportunityData?.nonprofit || '',
    host_org_id: clonedOpportunityData?.host_org_id || '',
    address: clonedOpportunityData?.address || '',
    redirect_url: clonedOpportunityData?.redirect_url || '',
    imageUrl: clonedOpportunityData?.imageUrl || '',

    // New fields for private events and visibility (list of org ids)
    isPrivate: clonedOpportunityData?.isPrivate || false,
    visibility: clonedOpportunityData?.visibility || [] as number[],
    allow_carpool: clonedOpportunityData?.allow_carpool || false
  });

  // console.log("clonedOpportunityData", clonedOpportunityData);

  // set isPrivate and visibility if cloning a private event for form UI
  useEffect(() => {
    if ((clonedOpportunityData?.visibility?.length ?? 0) > 0) {
      setFormData((prev) => ({
        ...prev,
        isPrivate: true,
        visibility: clonedOpportunityData?.visibility ?? [],
      }));
    }
  }, [clonedOpportunityData]);

  // Select organization
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const selectedOrg = sourceOrganizations.find((org) => org.id === formData.host_org_id);

  // Add image preview state for cloned images
  const [imagePreview, setImagePreview] = useState<string | null>(clonedOpportunityData?.imageUrl || null);
  const [imageFile, setImageFile] = useState<api.UploadFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Repeating event controls
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<{ [key: string]: [string, number][] }[]>([]);
  const [weekFrequency, setWeekFrequency] = useState<number>(1);
  const [weekRecurrences, setWeekRecurrences] = useState<number>(4);
  const [startDate, setStartDate] = useState<string>('');

  const [activeTimeSlot, setActiveTimeSlot] = useState<{ day: string; idx: number } | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // For searchable org selector when event is private
  const [orgFilter, setOrgFilter] = useState<string>('');
  const [showOrgModal, setShowOrgModal] = useState(false);

  // Filtered + alphabetically sorted organizations for the checklist
  const filteredOrgs = sourceOrganizations
    .filter((org) => org.name.toLowerCase().includes(orgFilter.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleOrgSelection = (orgId: number) => {
    setFormData((prev) => {
      const current: number[] = Array.isArray(prev.visibility) ? prev.visibility : [];
      const exists = current.includes(orgId);
      const next = exists ? current.filter((id) => id !== orgId) : [...current, orgId];
      return { ...prev, visibility: next } as typeof prev;
    });
  };

  const isOrgSelected = (orgId: number) => {
    return Array.isArray(formData.visibility) && (formData.visibility as number[]).includes(orgId);
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCausesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCauses = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({
      ...prev,
      cause: selectedCauses,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTags = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({
      ...prev,
      tags: selectedTags,
    }));
  };

  const handleFileChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImageFile({
        uri: asset.uri,
        name: asset.fileName ?? "image.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
      setImagePreview(asset.uri);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Upload image first if selected
      let imageUrl = clonedOpportunityData?.imageUrl || '';

      // Upload image first if user selected a new one
      if (imageFile) {
        try {
          imageUrl = await api.uploadProfilePicture(imageFile);
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          setError(`Image upload failed: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      // formData.cause.forEach((cause: string) => { formDataToSend.append('causes', cause) });
      formData.tags.forEach((tag: string) => { formDataToSend.append('tags', tag) });
      formDataToSend.append('date', formatDateTimeForBackend(formData.date, formData.time));
      formDataToSend.append('duration', formData.duration.toString());
      formDataToSend.append('total_slots', formData.total_slots.toString());
      formDataToSend.append('nonprofit', formData.nonprofit);
      formDataToSend.append('host_org_id', String(formData.host_org_id));
      formDataToSend.append('host_user_id', user.id.toString());
      formDataToSend.append('address', formData.address);
      formDataToSend.append('allow_carpool', String(formData.allow_carpool))
      formDataToSend.append('points', formData.duration.toString());
      formDataToSend.append('approved', user.admin ? 'true' : 'false');

      // Add redirect URL if provided
      if (formData.redirect_url.trim()) {
        formDataToSend.append('redirect_url', formData.redirect_url.trim());
      }

      // Add image URL if uploaded
      if (imageUrl) {
        formDataToSend.append('image', imageUrl);
      } else {
      }
      if (isRecurring) {
        formDataToSend.append('start_date', startDate);
        formDataToSend.append('days_of_week', JSON.stringify(daysOfWeek));
        formDataToSend.append('week_frequency', weekFrequency.toString());
        formDataToSend.append('week_recurrences', weekRecurrences.toString());
      }


      // If private, append visibility org ids as a single JSON field (numbers)
      // This ensures the backend receives a JSON array of integers instead of
      // multiple string entries (FormData always serializes values as strings).

      if (formData.isPrivate && Array.isArray(formData.visibility)) {
        try {
          formDataToSend.append('visibility', JSON.stringify(formData.visibility));
        } catch (e) {
          console.error('Failed to serialize visibility array', e);
        }
      }

      // Make the API call
      const newOpp = isRecurring
        ? await api.createMultiOpportunity(formDataToSend)
        : await api.createOpportunity(formDataToSend);

      // Transform the opportunity to match the frontend format
      const rawOpp = isRecurring ? newOpp.multiopp : newOpp;
      const transformedOpp = transformOpportunityFromBackend(rawOpp);

      const isSingleOpp = !isRecurring;

      if (user.admin) {
        const approvedOpp = { ...transformedOpp, approved: true };

        if (isSingleOpp) {
          // setOpportunities((prev) => [approvedOpp as Opportunity, ...prev]);
        }

        setAllOpps((prev) => {
          const updated = [approvedOpp, ...prev];
          return updated;
        });
      } else if (isSingleOpp) {
        // setOpportunities((prev) => [transformedOpp as Opportunity, ...prev]);
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      }

      setSuccess(true);
      setClonedOpportunityData(null);
      setTimeout(() => {
        router.push(`/(tabs)/OpportunitiesPage`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDaySlot = (day: string) => {
    const updated = [...daysOfWeek];
    const existing = updated.find((d) => Object.keys(d)[0] === day);
    if (existing) {
      existing[day].push(['', 60]);
    } else {
      updated.push({ [day]: [['', 60]] });
    }
    setDaysOfWeek(updated);
  };

  const updateDaySlot = (day: string, index: number, field: 'time' | 'duration', value: string) => {
    const updated = [...daysOfWeek];
    const target = updated.find((d) => Object.keys(d)[0] === day);
    if (target) {
      const slots = target[day];
      if (field === 'time') slots[index][0] = value;
      else slots[index][1] = parseInt(value);
      target[day] = slots;
    }
    setDaysOfWeek(updated);
  };

  const removeDaySlot = (day: string, index: number) => {
    const updated = [...daysOfWeek];
    const target = updated.find((d) => Object.keys(d)[0] === day);
    if (target) {
      target[day].splice(index, 1);
      if (target[day].length === 0) {
        const filtered = updated.filter((d) => Object.keys(d)[0] !== day);
        setDaysOfWeek(filtered);
        return;
      }
    }
    setDaysOfWeek(updated);
  };


  return (
    <ScrollView style={styles.container}>
      <View>
        <Pressable
          onPress={() => router.push(`/(tabs)/OpportunitiesPage`)}
          style={styles.backWrapper}
        >
          <Text style={styles.back}>← Back to Opportunities</Text>
        </Pressable>
      </View>
      <View>
        <View style={styles.wrapper}>
          <Text style={styles.header}>Create Opportunity</Text>

          {success && (
            <View style={styles.success}>
              <Text style={styles.successMsg}>Opportunity created successfully! Redirecting...</Text>
            </View>
          )}
          {error && (
            <View style={styles.error}>
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          )}

          <View style={styles.grid}> 
            <View>
              <Text style={styles.inputHeader}>Opportunity Name *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                style={styles.input}
                placeholder='Enter opportunity name'
              />
            </View>
            <View>
              <Text style={styles.inputHeader}>Total Slots *</Text>
              <TextInput
                keyboardType="numeric"
                value={formData.total_slots.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text, 10);
                  setFormData((prev) => ({
                    ...prev,
                    total_slots: isNaN(value) ? 1 : Math.max(1, value),
                  }));
                }}
                style={styles.input}
                placeholder='Enter opportunity name'
              />
            </View>
            <View>
              <Text style={styles.inputHeader}>Nonprofit Name (Optional)</Text>
              <TextInput
                value={formData.nonprofit}
                onChangeText={(text) => handleInputChange("nonprofit", text)}
                style={styles.input}
                placeholder='Enter nonprofit name (optional)'
              />
            </View>
            <View>
              <Text style={styles.inputHeader}>Host Organization *</Text>
              <View>
                <Pressable
                  onPress={() => setShowOrgPicker(true)}
                  style={styles.input}
                >
                  <Text style={selectedOrg ? {color: '#000'} : {color: '#C7C7C9'}}>
                    {selectedOrg ? selectedOrg.name : "Select an organization"}
                  </Text>
                </Pressable>
                <Modal
                  visible={showOrgPicker}
                  transparent
                  animationType="fade"
                >
                  <Pressable
                    style={styles.orgModalBackdrop}
                    onPress={() => setShowOrgPicker(false)}
                  >
                    <Pressable
                      style={styles.orgModalPopup}
                      onPress={(e) => e.stopPropagation()}
                    >
                      <FlatList
                        data={sourceOrganizations}
                        keyExtractor={(org) => org.id.toString()}
                        renderItem={({ item: org }) => (
                          <Pressable
                            style={styles.orgRow}
                            onPress={() => {
                              setFormData((prev) => ({
                                ...prev,
                                host_org_id: org.id,
                              }));
                              setShowOrgPicker(false);
                            }}
                          >
                            <Text style={{ flex: 1 }}>{org.name}</Text>
                            {formData.host_org_id === org.id && (
                              <Text>✓</Text>
                            )}
                          </Pressable>
                        )}
                      />
                    </Pressable>
                  </Pressable>
                </Modal>
              </View>
            </View>
            <View>
              <Text style={styles.inputHeader}>Address/Location</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                style={styles.input}
                placeholder='Enter the location or address for this opportunity'
              />
            </View>
            <View>
              <Text style={styles.inputHeader}>Redirect Link (Optional)</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => handleInputChange("redirect_url", text)}
                style={styles.input}
                placeholder='https://example.com/register'
              />
              <Text style={styles.note}>
                If you would like this opportunity to redirect to an external registration, enter the link here.
                </Text>
            </View>
            <View>
              <Text style={styles.inputHeader}>Description *</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => handleInputChange("description", text)}
                style={styles.input}
                multiline
                numberOfLines={4}
                placeholder='Describe the opportunity...'
              />
            </View>

            {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <select
                  name="tags"
                  multiple
                  value={formData.tags}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                >
                  <option value="Rides Provided">Rides Provided</option>
                  <option value="Food Provided">Food Provided</option>
                  <option value="Fundraiser">Fundraiser</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
              </div> */}

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Causes</label>
              <select
                name="cause"
                multiple
                value={formData.cause}
                onChange={handleCausesChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
              >
                {allInterests.map((cause) => (
                  <option key={cause} value={cause}>
                    {cause}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple causes</p>
            </div> */}
            {(user.admin) && (
              <View style={styles.recurrWrapper}>
                <View>
                  <Text style={styles.inputHeader}>Recurring Event</Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    style={styles.inputSwitch}
                  />
                </View>

                {isRecurring && (
                  <View style={styles.recurring}>
                    {/* Days + Time Slots */}
                    <View>
                      <Text style={{ fontWeight: '600', marginBottom: 12 }}>Which days of the week does this occur on?</Text>
                      <View style={{ rowGap: 2 }}>
                        {days.map((day) => {
                          const existing = daysOfWeek.find((d) => Object.keys(d)[0] === day);
                          return (
                            <View key={day} style={styles.recurrDay}>
                              <View style={styles.recurrDays}>
                                <Text style={styles.addTimeHeader}>{day}</Text>
                                <Pressable
                                  onPress={() => addDaySlot(day)}
                                  style={styles.addTimeBtn}
                                >
                                  <Text style={styles.addTimeTxt}>+ Add time</Text>
                                </Pressable>
                              </View>

                              {existing?.[day]?.map(([time, duration], idx) => (
                                  <View key={idx} style={styles.addedTime}>
                                    <Pressable
                                      onPress={() => setActiveTimeSlot({ day, idx })}
                                      style={styles.selectTime}
                                    >
                                      <Text>{time || "Select time"}</Text>
                                    </Pressable>
                                    <TextInput
                                      value={duration.toString()}
                                      keyboardType="numeric"
                                      onChangeText={(text) =>
                                        updateDaySlot(
                                          day,
                                          idx,
                                          "duration",
                                          Math.max(15, Number(text) || 15).toString()
                                        )
                                      }
                                      style={styles.timeInput}
                                    />

                                    <Pressable onPress={() => removeDaySlot(day, idx)}>
                                      <Text style={styles.removeDay}>Remove</Text>
                                    </Pressable>
                                  </View>
                                ))}
                                {activeTimeSlot && (
                                  <>
                                    <DateTimePicker
                                      value={new Date()}
                                      mode="time"
                                      display="spinner"
                                      onChange={(event, selectedTime) => {
                                        if (selectedTime) {
                                          const hours = selectedTime.getHours().toString().padStart(2, "0");
                                          const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
                                          updateDaySlot(activeTimeSlot.day, activeTimeSlot.idx, "time", `${hours}:${minutes}`);
                                        }
                                      }}
                                      style={styles.timePicker}
                                    />
                                    <Pressable
                                      onPress={() => setActiveTimeSlot(null)}
                                      style={styles.doneBtn}
                                    >
                                      <Text style={styles.doneBtnTxt}>Done</Text>
                                    </Pressable>
                                  </>
                                )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Frequency */}
                    <View>
                      <Text style={styles.inputHeader}>How often does this repeat? (every X weeks)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={weekFrequency.toString()}
                        onChangeText={(text) =>
                          setWeekFrequency(
                            Math.max(1, parseInt(text, 10) || 1)
                          )
                        }
                        style={styles.input}
                      />
                    </View>
                    <View>
                      <Text style={styles.inputHeader}>When should this recurring event start?</Text>
                      <Pressable
                        onPress={() => setShowStartDatePicker(true)}
                        style={styles.input}
                      >
                        <Text>{startDate || "Select start date"}</Text>
                      </Pressable>

                      {showStartDatePicker && (
                        <>
                          <DateTimePicker
                            value={startDate ? new Date(startDate) : new Date()}
                            mode="date"
                            display="inline"
                            onChange={(event, selectedDate) => {
                              if (selectedDate) {
                                setStartDate(selectedDate.toISOString().split("T")[0]);
                              }
                            }}
                          />

                          <Pressable
                            onPress={() => setShowStartDatePicker(false)}
                          >
                            <Text>Done</Text>
                          </Pressable>
                        </>
                      )}
                    </View>

                    {/* Recurrence count */}
                    <View>
                      <Text style={styles.inputHeader}>For how many weeks should this pattern repeat?</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={weekRecurrences.toString()}
                        onChangeText={(text) =>
                          setWeekRecurrences(
                            Math.max(1, parseInt(text, 10) || 1)
                          )
                        }
                        style={styles.input}
                      />
                    </View>
                  </View>
                )}
              </View>)
            }

            {!isRecurring && (
              <>
                <View style={styles.dateTimeWrapper}>
                  <View style={styles.dateTimeComponent}>
                    <Text style={styles.inputHeader}>Date *</Text>
                    <DateTimePicker
                      value={ formData.date ? new Date(formData.date) : new Date() }
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        if (event.type === "dismissed") {
                          setShowDatePicker(false);
                          return;
                        }
                        if (selectedDate) {
                          setFormData((prev) => ({
                            ...prev,
                            date: selectedDate.toISOString().split("T")[0],
                          }));
                        }
                      }}
                      style={{ marginBottom: 4 }}
                    />
                  </View>
                  <View style={styles.dateTimeComponent}>
                    <Text style={styles.inputHeader}>Time *</Text>
                    <DateTimePicker
                      value={
                        formData.time
                          ? (() => {
                              const [hours, minutes] = formData.time.split(":").map(Number);
                              const date = new Date();
                              date.setHours(hours);
                              date.setMinutes(minutes);
                              date.setSeconds(0);
                              return date;
                            })()
                          : new Date()
                      }
                      mode="time"
                      display="default"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          const hours = selectedTime.getHours().toString().padStart(2, "0");
                          const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
                          setFormData((prev) => ({
                            ...prev,
                            time: `${hours}:${minutes}:00`,
                          }));
                        }
                      }}
                      style={{ marginBottom: 4 }}
                    />
                  </View>
                </View>
                <View>
                  <View>
                    <Text style={styles.inputHeader}>Duration (minutes) *</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={formData.duration.toString()}
                      onChangeText={(text) => {
                        handleInputChange(
                        "duration",
                        Math.max(15, parseInt(text, 10) || 15)
                      )
                      }}
                      style={styles.input}
                    />
                  </View>
                </View>
              </>
            )}

            <View>
              <Text style={styles.inputHeader}>Is this event private? (Only visible to selected organizations)</Text>
              <Switch
                value={formData.isPrivate}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPrivate: value,
                  }))
                }
                style={styles.inputSwitch}
              />
              <Text style={styles.note}>
                Private events are only visible to members of the host organization and any other
                selected organizations.
              </Text>

              {formData.isPrivate && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputHeader}>Select organizations allowed to see this event</Text>
                  <TextInput
                    value={orgFilter}
                    onChangeText={(text) => setOrgFilter(text)}
                    style={styles.input}
                    placeholder="Filter organizations..."
                  />
                  <Pressable
                    onPress={() => setShowOrgModal(true)}
                    style={styles.input}
                  >
                    <Text>
                      {formData.visibility.length > 0
                        ? `${formData.visibility.length} organization(s) selected`
                        : "Tap to select organizations"}
                    </Text>
                  </Pressable>

                  <Modal
                    visible={showOrgModal}
                    transparent
                    animationType="fade"
                  >
                    <View style={styles.visibilityModalBackdrop}>
                      <View style={styles.visibilityModalCard}>
                        <Text style={styles.visibilityModalHeader}>Select Organizations</Text>
                        <FlatList
                          data={filteredOrgs}
                          keyExtractor={(org) => org.id.toString()}
                          keyboardShouldPersistTaps="handled"
                          renderItem={({ item: org }) => {
                            const selected = isOrgSelected(org.id);
                            return (
                              <Pressable
                                onPress={() => toggleOrgSelection(org.id)}
                                style={styles.visibilityOrgRow}
                              >
                                <Text style={{ flex: 1 }}>
                                  {org.name}
                                </Text>

                                <Text>
                                  {selected ? "✓" : ""}
                                </Text>
                              </Pressable>
                            );
                          }}
                          ListEmptyComponent={
                            <Text>No organizations match your search.</Text>
                          }
                        />

                        <Pressable
                          onPress={() => setShowOrgModal(false)}
                          style={styles.doneBtn}
                        >
                          <Text style={styles.doneBtnTxt}>Done</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Modal>
                </View>
              )}
            </View>

            <View>
              <Text style={styles.inputHeader}>Enable carpooling for this event?</Text>
              <Switch
                value={formData.allow_carpool}
                onValueChange={(value) =>
                  handleInputChange("allow_carpool", value)
                }
                style={styles.inputSwitch}
              />
              <Text style={styles.note}>Volunteers can sign up to drive or request a ride through the system.</Text>
            </View>

            <View>
              <Text style={styles.inputHeader}>Opportunity Image</Text>
              <Pressable
                onPress={handleFileChange}
                style={styles.imageUploadBox}
              >
                {imageFile ? (
                  <View>
                    <Text style={{ fontWeight: '500', color: '#16A34A' }}>✓ {imageFile.name} selected</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Tap to change image</Text>
                  </View>
                ) : imagePreview ? (
                  <View>
                    <Image
                      source={{ uri: imagePreview }}
                      style={styles.previewImg}
                      resizeMode="contain"
                    />
                    <Text style={{ fontWeight: '500', color: '#2563EB' }}>✓ Using cloned image</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Tap to change image</Text>
                  </View>
                ) : (
                  <View>
                    <Text style={{ color: '#4B5563' }}>Tap to select an image</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Supports: JPG, PNG, GIF</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <View style={styles.endWrapper}>
              <Pressable
                onPress={() => router.push(`/(tabs)/OpportunitiesPage`)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnTxt}>{isSubmitting ? 'Creating...' : 'Create Opportunity'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default CreateOpportunityPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  wrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backWrapper: {
    alignSelf: 'flex-end',
    marginTop: 34,
    marginVertical: 8,
    paddingBottom: 4
  },
  back:{
    color: '#4B5563',
    fontSize: 16,
  },
  header: {
    color: '#1F2937',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    marginBottom: 6,
  },
  success: {
    marginBottom: 6,
    padding: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#4ADE80',
    borderRadius: 8,
  },
  successMsg: {
    color: '#15803D',
  },
  error: {
    marginBottom: 6,
    padding: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
  },
  errorMsg: {
    color: '#B91C1C',
  },
  grid: {
    flexDirection: 'column',
    gap: 6
  },
  inputHeader: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 2,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 4,
  },
  pickerContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  orgModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  orgModalPopup: {
    width: "75%",
    maxHeight: "65%",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  orgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  note: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
    marginBottom: 4,
  },
  recurrWrapper: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d8d8d8', 
    marginTop: 6,
  },
  recurrDays: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  recurrDay: {
    marginBottom: 6,
  },
  inputSwitch: {
    marginVertical: 6,
    marginLeft: 4,
  },
  recurring: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    rowGap: 8,
  },
  addTimeHeader: {
    fontSize: 14,
    color: '#1F2937',
  },
  addTimeBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addTimeTxt: {
    fontSize: 12,
    color: '#2563EB',
  },
  selectTime: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
  },
  addedTime: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    alignItems: 'center'
  },
  timeInput: {
    borderWidth: 1,
    borderColor:'#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
  },
  removeDay: {
    fontSize: 14,
    color: '#EF4444',
  },
  timePicker: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  removeBtn: {
    
  },
  doneBtn: {
    backgroundColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 60,
  },
  doneBtnTxt: {
    textAlign: 'center'
  },
  imageUploadBox: {
    height: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 6,
    paddingTop: 16,
    marginTop: 4,
    textAlign: 'center',
    alignItems: 'center',
  },
  previewImg: {
    maxHeight: 32,
    marginHorizontal: 'auto',
    marginBottom: 2,
    borderRadius: 8,
  },
  endWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  cancelBtnTxt: {
    color: '#374151',
    fontWeight: '400',
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Theme.cornellRed,
    borderRadius: 8,
  },
  submitBtnTxt: {
    color: 'white',
    fontWeight: '700',
  },
  dateTimeWrapper: {
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeComponent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  visibilityModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  visibilityModalCard: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  visibilityModalHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  visibilityOrgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

})