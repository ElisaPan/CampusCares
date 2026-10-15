// import { Picker } from '@react-native-picker/picker';
import * as Theme from '@/constants/theme';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, FlatList, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as api from '../api';
import { auth, signOut } from '../firebase-config';
import { useUserStore } from '../hooks/useUserStore';
import { registerForPushNotifications } from '../utils/registerForPushNotifications';

const HEARD_ABOUT_OPTIONS = [
  { label: 'Select an option (optional)', value: '' },
  { label: 'Friend', value: 'friend' },
  { label: 'Student Organization', value: 'organization' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Flyer / Poster', value: 'flyer' },
  { label: 'Campus Event', value: 'event' },
  { label: 'Other', value: 'other' },
];

const SHEET_OFFSET = Dimensions.get('window').height * 0.6;

export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser, setOrganizations, setStudents, setAllOpps } = useUserStore();

  const firebaseUser = auth.currentUser;
  const userEmail = firebaseUser?.email || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedOption = HEARD_ABOUT_OPTIONS.find(
    (o) => o.value === heardAbout && o.value !== ''
  );
  const slideAnim = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const [tosChecked, setTosChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isFormValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    phone.trim() !== '';
  const isDisabled = isLoading || !tosChecked || !isFormValid;
  const [error, setError] = useState<string | null>(null);

  const handleBackToLogin = async () => {
    await signOut();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/LoginPage');
  };
  
  const openPicker = () => {
    slideAnim.setValue(SHEET_OFFSET);
    setPickerOpen(true);
  };
  const closePicker = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_OFFSET,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setPickerOpen(false));
  };
  useEffect(() => {
    if (pickerOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [pickerOpen]);

  const validatePhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const handleRegisterSubmit = async () => {
    setError(null);

    if (!isFormValid) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (10+ digits).');
      return;
    }

    if (!tosChecked) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (!firebaseUser) {
      setError('Session expired. Please sign in again.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await firebaseUser.getIdToken();

      const newUser = await api.registerUser(
        {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: userEmail,
          phone: phone.trim(),
          profile_image: firebaseUser.photoURL || undefined,
          heard_about: heardAbout || undefined,
          subscribed: true,
          car_seats: 0,
          points: 0,
        },
        token
      );

      setCurrentUser(newUser);

      // Populate the rest of the app's data now that we have an authenticated user
      //const [orgs, opps, multiopps, students] = await Promise.all([
      const [opps, multiopps] = await Promise.all([
        // api.getOrgs(),
        api.getCurrentOpportunities(),
        api.getMultiOpps(),
        // api.getUsers(),
      ]);
      // setOrganizations(orgs);
      // setStudents(students);
      setAllOpps([...opps, ...multiopps]);

      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await api.savePushToken(pushToken, Number(newUser.id));
      }

      if (router.canDismiss()) router.dismissAll();
      router.replace('/(tabs)/OpportunitiesPage');

      api.getOrgs().then(setOrganizations).catch(() => {});
      api.getUsersMinimal().then(setStudents).catch(() => {});
    } catch (e: any) {
      console.error('Registration error:', e);
      setError(e.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CampusCares</Text>
      <Text style={styles.subtitle}>Complete your registration</Text>

      <Text style={styles.heading}>Create Account</Text>

      <View style={styles.emailBox}>
        <Text style={styles.emailLabel}>Signing up with:</Text>
        <Text style={styles.emailValue}>{userEmail}</Text>
      </View>

      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name *"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        autoCapitalize="words"
      />

      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name *"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        autoCapitalize="words"
      />

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone Number *"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>
        How did you hear about CampusCares? <Text style={styles.optional}>(optional)</Text>
      </Text>
      {/* <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={heardAbout}
          onValueChange={setHeardAbout}
          style={styles.picker}
        >
          {HEARD_ABOUT_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View> */}
      <Pressable
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        onPress={openPicker}
      >
        <Text style={[styles.fieldText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : HEARD_ABOUT_OPTIONS[0].label}
        </Text>
        <MaterialDesignIcons name='chevron-down' size={16} color='#9A9AA5' />
      </Pressable>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="none"
        onRequestClose={closePicker}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={closePicker} />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>How did you hear about us?</Text>

          <FlatList
            data={HEARD_ABOUT_OPTIONS}
            keyExtractor={(item) => item.value}
            bounces={false}
            renderItem={({ item }) => {
              const isDefault = item.value == '';
              const isSelected = item.value === heardAbout;
              return (
                <Pressable
                  onPress={() => {
                    setHeardAbout(item.value);
                    closePicker();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && !isDefault && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {isSelected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </Animated.View>
      </Modal>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setTosChecked(!tosChecked)}
      >
        <View style={[styles.checkbox, tosChecked && styles.checkboxChecked]}>
          {tosChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          By selecting "Complete Registration," I agree to the{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://www.campuscares.us/terms_of_service.pdf')}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://www.campuscares.us/privacy_policy.pdf')}
          >
            Privacy Policy
          </Text>
        </Text>
      </Pressable>

      <Pressable
        style={[styles.submitBtn, (isLoading || !tosChecked) && styles.submitBtnDisabled]}
        onPress={handleRegisterSubmit}
        disabled={isDisabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Complete Registration</Text>
        )}
      </Pressable>

      <View style={styles.backRow}>
        <Text style={styles.backText}>Already have an account? </Text>
        <Pressable onPress={handleBackToLogin}>
          <Text style={styles.backLink}>Sign In</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#C8102E',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  emailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  emailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
    marginBottom: 6,
  },
  optional: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldPressed: {
    backgroundColor: '#F5F5F8'
  },
  fieldText: {
    fontSize: 14,
    color: '#1A1A1F',
    flex: 1
  },
  placeholder: {
    color: '#9A9AA5'
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 51,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    maxHeight: '60%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9D9E0',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1F',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionPressed: {
    backgroundColor: '#F2F2F6'
  },
  optionSelected: {
    backgroundColor: '#EEF2FF'
  },
  optionText: {
    fontSize: 16,
    color: '#000000'
  },
  optionTextSelected: {
    color: Theme.iconColor,
    fontWeight: '600'
  },
  check: {
    fontSize: 14,
    color: Theme.iconColor,
    fontWeight: '700'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#C8102E',
    borderColor: '#C8102E',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#4B5563',
  },
  submitBtn: {
    backgroundColor: '#C8102E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  backText: {
    fontSize: 13,
    color: '#6B7280',
  },
  backLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C8102E',
  },
});