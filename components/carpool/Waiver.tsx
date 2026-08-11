/*************
 * TODO:
 *  Severe:
 *    check api createWaiver (uncomment lines 1177-1191)
 *  High:
 *    -
 *  Low
 *    -
 */
import * as Theme from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createWaiver } from '../../api';
import { useUserStore } from '../../hooks/useUserStore';

type WaiverType = 'carpool' | 'org';

const CARPOOL_WAIVER = `Waiver of Liability and Hold Harmless Transportation Agreement
    I understand that CampusCares LLC rules require that participants provide transportation of themselves to all opportunities listed on the CampusCares website. While CampusCares may facilitate the mechanisms that allow for carpooling agreements to take place between participants, all liability falls onto the individuals operating vehicles, who subject themselves to liability in the transportation of fellow participants. 
    In consideration for the executive team of CampusCares and the organization of CampusCares, I  acknowledge that during all current and subsequent travels to CampusCares, listed organizations that: 
    1. I hereby release, waive, discharge and covenant not to sue CampusCares and its individual members, officers, agents, servants, or employees (hereinafter referred to as releasees) from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or any of the property belonging to me, as result of, or in any way arising out of my traveling to listed organizations in a vehicle or vehicles not owned or operated by the CampusCares.
    I voluntarily assume full responsibility for any risks of loss.
    I further hereby agree to indemnify and hold harmless the releasees from any
    loss, liability, damage, or costs due to my child(ren) traveling to and or from a listed organization in a vehicle or vehicles not owned or operated by the District.
    4. I hereby further agree that this Waiver of Liability and Hold Harmless Agreement shall be construed and enforced in accordance with the laws of the state of New York.
    5. In signing this release, I acknowledge and represent that I have read the foregoing Waiver of Liability and Hold Harmless Agreement, understand it, and sign it voluntarily as my own free act and deed.`

interface WaiverProps {
  type: WaiverType;
  opportunityId?: string;
}

const Waiver: React.FC<WaiverProps> = ({ type, opportunityId }) => {
  const { currentUser, updateCurrentUser } = useUserStore()
  const params = useLocalSearchParams();

  const [name, setName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState("");
  // const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  // const opportunityId = rawId ? parseInt(rawId, 10) : null;

  
  const handleSubmit = async () => {
    if (!currentUser) return;
    if ( !name || name.replace(/\s+/g, '').toLowerCase() !== currentUser.name.replace(/\s+/g, '').toLowerCase()) {
      setError("You must enter your full name as registered on CampusCares");
      return;
    }
    if (!consentChecked) {
      setError("You must check the box above to consent to the terms of the waiver");
      return;
    }

    try {
      await createWaiver({
        typed_name: name,
        type,
        content: type == "carpool" ? CARPOOL_WAIVER : "",
        checked_consent: consentChecked,
        user_id: currentUser.id
      });

      updateCurrentUser({ carpool_waiver_signed: true });
      router.replace(`/carpool/${opportunityId}`);
    } catch (err) {
      setError("Failed to submit waiver, please try again.");
    }
  }

  if (!currentUser) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size='large' color={Theme.cornellRed} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Pressable
          onPress={() => router.replace(`/OpportunityDetailPage?id=${opportunityId}`)}
          style={styles.backWrapper}
        >
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </View>
      {type === "carpool" && (
        <View style={styles.waiverContent}>
          <Text style={styles.heading}>Waiver of Liability and Hold Harmless Transportation Agreement</Text>
          <Text style={styles.paragraph}>I understand that CampusCares LLC rules require that participants provide transportation of themselves to all opportunities listed on the CampusCares website. While CampusCares may facilitate the mechanisms that allow for carpooling agreements to take place between participants, all liability falls onto the individuals operating vehicles, who subject themselves to liability in the transportation of fellow participants.</Text>
          <Text style={styles.paragraph}>In consideration for the executive team of CampusCares and the organization of CampusCares, I  acknowledge that during all current and subsequent travels to CampusCares, listed organizations that: </Text>
          {[
            'I hereby release, waive, discharge and covenant not to sue CampusCares and its individual members, officers, agents, servants, or employees (hereinafter referred to as releasees) from any and all liability, claims, demands, actions, and causes of action whatsoever arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, or any of the property belonging to me, as result of, or in any way arising out of my traveling to listed organizations in a vehicle or vehicles not owned or operated by the CampusCares.',
            'I voluntarily assume full responsibility for any risks of loss.',
            'I further hereby agree to indemnify and hold harmless the releasees from any loss, liability, damage, or costs due to my child(ren) traveling to and or from a listed organization in a vehicle or vehicles not owned or operated by the District.',
            'I hereby further agree that this Waiver of Liability and Hold Harmless Agreement shall be construed and enforced in accordance with the laws of the state of New York.',
            'In signing this release, I acknowledge and represent that I have read the foregoing Waiver of Liability and Hold Harmless Agreement, understand it, and sign it voluntarily as my own free act and deed.'
            ].map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listNumber}>{i + 1}.</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Type your full name *</Text>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          style={styles.input}
          autoCapitalize="words"
        />
      </View>
      <Pressable
        style={styles.checkboxWrapper}
        onPress={() => setConsentChecked(!consentChecked)}
      >
        <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
          {consentChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I have read and agree to the terms of the waiver and understand that this constitutes my electronic signature. *
        </Text>
      </Pressable>
      {error !== '' && (
        <View style={styles.errorRow}>
          <MaterialIcons name='error-outline' size={18} color='#DC2626' />
           <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Pressable style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>Submit</Text>
      </Pressable>
    </ScrollView>
  )
}

export default Waiver;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 12,
    gap: 16,
    paddingBottom: 10,
  },
  loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
  },
  backWrapper: {
    marginTop: 34,
    marginBottom: -8,
  },
  back:{
    color: '#4B5563',
    fontSize: 14,
  },
  waiverContent: {
    gap: 12,
    marginBottom: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 8,
  },
  listNumber: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
    backgroundColor: Theme.cornellRed,
    borderColor: Theme.cornellRed,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
  },
  submitBtn: {
    backgroundColor: Theme.cornellRed,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
})