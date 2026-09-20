import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
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

export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser, setOrganizations, setStudents, setAllOpps } = useUserStore();

  const firebaseUser = auth.currentUser;
  const userEmail = firebaseUser?.email || '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [heardAbout, setHeardAbout] = useState('');
  const [tosChecked, setTosChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackToLogin = async () => {
    await signOut();
    router.replace('/LoginPage');
  };

  const validatePhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const handleRegisterSubmit = async () => {
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
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
      const [orgs, opps, multiopps, students] = await Promise.all([
        api.getOrgs(),
        api.getCurrentOpportunities(),
        api.getMultiOpps(),
        api.getUsers(),
      ]);
      setOrganizations(orgs);
      setStudents(students);
      setAllOpps([...opps, ...multiopps]);

      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await api.savePushToken(pushToken, Number(newUser.id));
      }

      router.replace('/(tabs)/OpportunitiesPage');
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
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={heardAbout}
          onValueChange={setHeardAbout}
          style={styles.picker}
        >
          {HEARD_ABOUT_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

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
        disabled={isLoading || !tosChecked}
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
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#374151',
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