/*************
 * TODO:
 *  Severe:
 *    Fix links / router push
 *    PeopleIcon
 */

import { getProfilePictureSource, removeCarpoolUser } from '@/api';
import * as Theme from '@/constants/theme';
import { Opportunity, Organization, User } from '@/types';
import { calculateEndTime } from '@/utils/timeUtils';
import Octicons from '@expo/vector-icons/Octicons';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Calendar1, Clock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';


interface OpportunityCardProps {
  opportunity: Opportunity;
  signedUpStudents: User[];
  allOrgs: Organization[];
  currentUser: User | null;
  onSignUp?: (opportunityId: number) => void;
  onUnSignUp?: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  isUserSignedUp: boolean;
  onExternalSignup?: (opportunity: Opportunity) => void; // Add callback for external signup
  onExternalUnsignup?: (opportunity: Opportunity) => void; // Add callback for external unsignup
  showPopup?: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void
}

const PeopleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img src="/icons/points-icon.png" alt="Points" className={className || 'h-5 w-5'} />
);

const Avatar = ({ user }: { user: User }) => {
  const [error, setError] = useState(false);

  return (
    <Image
      source={getProfilePictureSource(user.profile_image, user.photoURL)}
      onError={() => setError(true)}
      resizeMode="cover"
      style={styles.avatar}
    />
  );
};

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  signedUpStudents,
  allOrgs,
  currentUser,
  onSignUp,
  onUnSignUp,
  isUserSignedUp,
  onExternalSignup,
  onExternalUnsignup,
  showPopup
}) => {

  // console.log('address:', opportunity.address);
  // console.log('opportunity:', opportunity);


  const queryClient = useQueryClient();
  const [pressedStudentId, setPressedStudentId] = useState<number | null>(null);

  // Add press handler for profile pictures
  const handleProfilePress = (studentId: number) => {
    if (!currentUser) setPressedStudentId(null);

    if (pressedStudentId === studentId) {
      setPressedStudentId(null); // Hide if already showing
    } else {
      setPressedStudentId(studentId); // Show name
    }
  };

  const availableSlots = opportunity.total_slots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;
  const eventStarted = new Date() >= new Date(`${opportunity.date}T${opportunity.time}`);
  const isUserHost = currentUser ? opportunity.host_id === currentUser.id : false;

  const handleButtonPress = async () => {
    if (!currentUser) router.push(`../sign-up`);

    if (currentUser && isUserSignedUp) {
      if (opportunity.allow_carpool) {
        try {
          const res = await removeCarpoolUser({
            user_id: currentUser.id,
            carpool_id: opportunity.carpool_id
          });

          if (!res.valid && showPopup) {
            showPopup(
              'Failed to unregister',
              'You have signed up to drive for this event and therefore cannot unregister.',
              'error'
            );
            return;
          }
          queryClient.invalidateQueries({ queryKey: ['rides', opportunity.carpool_id] });
        } catch (err) {
        }
      }
      // Check if this is an external opportunity and user is trying to unregister
      if (opportunity.redirect_url && onExternalUnsignup) {
        onExternalUnsignup(opportunity);
      } else {
        if (onUnSignUp) onUnSignUp(opportunity.id, opportunity.date, opportunity.time);
      }
    } else {
      // Check if this is an external signup opportunity
      if (opportunity.redirect_url && onExternalSignup) {
        onExternalSignup(opportunity);
      } else {
        if (onSignUp) onSignUp(opportunity.id);
      }
    }
  };
  
  const handleCardPress = () => {
    if (!currentUser) {
        router.push(`../sign-up`);
        return;
    }

    router.push(`/opportunity/${opportunity.id}`);
    };

  const topOrgs = useMemo(() => {
    const orgCounts: { [key: number]: number } = {};
    signedUpStudents.forEach((student) => {
      student.organizationIds.forEach((orgId) => {
        orgCounts[orgId] = (orgCounts[orgId] || 0) + 1;
      });
    });

    return Object.entries(orgCounts)
      .filter(([, count]) => count >= 2) // Only include organizations with at least 2 people
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([orgId]) => allOrgs.find((g) => g.id === parseInt(orgId)))
      .filter((g): g is Organization => !!g);
  }, [signedUpStudents, allOrgs]);

  const visibilityOrgs = useMemo(() => {
    if (!Array.isArray(opportunity.visibility) || opportunity.visibility.length === 0)
      return [] as Organization[];
    return allOrgs
      .filter((org) => opportunity.visibility.includes(org.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [opportunity.visibility, allOrgs]);

  const redirectUrl = opportunity.redirect_url;
  const buttonText = eventStarted
    ? 'Event Already Started'
    : isUserSignedUp
      ? 'Signed Up ✓'
      : canSignUp
        ? redirectUrl
          ? 'Sign Up Externally'
          : 'Sign Up'
        : 'No Slots Available';

  // Create a Date object and add 1 day
  const dateObj = new Date(opportunity.date);
  dateObj.setDate(dateObj.getDate() + 1);

  const displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);

  const img = opportunity.imageUrl;
	const oppPicSource =
		typeof img === 'string' && img.startsWith('http')
			? { uri: img }
			: require('@/assets/images/backup.jpeg');

  return (
    <Pressable
      onPress={handleCardPress}
      style={styles.card}
    >
      <View style={styles.oppPicWrapper}>
        <Image
          style={styles.oppPic}
          source={oppPicSource}
          alt={opportunity.name}
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
          <View style={styles.leftHeader}>
            <Text style={styles.orgName}>{opportunity.nonprofit || 'Community Organization'}</Text>
            <Text style={styles.oppName}>{opportunity.name}</Text>
          </View>
          <View style={styles.rightHeader}>
            <Text style={styles.oppPoints}>{opportunity.points} PTS</Text>
          </View>
        </View>
      </View>
      <View style={styles.content}>
        {/* <View style={styles.header}>
          <Text style={styles.orgName}>
            {opportunity.nonprofit || 'Community Organization'}
          </Text>
          <Text style={styles.oppPoints}>{opportunity.points} PTS</Text>
        </View>
        <View style={styles.oppNameWrapper}>
          <Text style={styles.oppName}>{opportunity.name}</Text>
          {isUserHost && (
            <Text style={styles.hostBadge}>Host</Text>
          )}
        </View> */}
        {/* <Text style={styles.oppDate}>{displayDate} &bull; {displayTime} - {displayEndTime}</Text> */}
        <View style={styles.dateTimeWrapper}>
          <Calendar1 size={14} color="#374151" style={{ marginTop: 1 }} />
          <Text style={styles.oppDate}>{displayDate}</Text>
          <Text style={[styles.oppDate, {color: '#b7b7b7' }]}> • </Text>
          <Clock size={14} color="#374151" style={{ marginTop: 1 }} />
          <Text style={styles.oppDate}>{displayTime} – {displayEndTime}</Text>
        </View>
        {/* {!!opportunity.address && (
          <View style={styles.locationWrapper}>
            <MaterialIcons name="location-pin" size={20} color={Theme.cornellRed}/>
            <Text style={styles.oppAddress}>{opportunity.address}</Text>
          </View>
        )} */}
        <View style={styles.slotsArea}>
          <View style={styles.slotsLabel}>
            {signedUpStudents.length > 0 ? (
              <View style={styles.participants}>
                {signedUpStudents.slice(0, 10).map((student, index) => {
                  return (
                    <View
                      key={student.id}
                      style={[
                        styles.avatarContainer,
                        { zIndex: 100 - index, marginLeft: index === 0 ? 0 : -10 },
                      ]}
                    >
                      <Pressable onPress={() => handleProfilePress(student.id)}>
                        <Avatar user={student} />
                      </Pressable>
                    </View>
                  );
                })}
                {signedUpStudents.length > 10 && (
                  <View style={styles.moreParticipants}>+{signedUpStudents.length - 10}</View>
                )}
                <Text style={{ color: '#374151', marginLeft: 8 }}>{signedUpStudents.length} / {opportunity.total_slots} signed up</Text>
              </View>
            ) : (
              <Text style={styles.firstSignup}>Be the first to sign up! +5 bonus points</Text>
            )}
          </View>
          <View style={ styles.slots }>
            <Text
              style={[
                styles.slotsText,
                (availableSlots > 0 || isUserSignedUp)
                  ? { color: '#16a34a' }
                  : { color: Theme.cornellRed },
                ]}>
              {availableSlots} slot{availableSlots === 1 ? '' : 's'} left
            </Text>
          </View>
        </View>
        {topOrgs.length > 0 && (
          <View style={styles.topOrgs}>
            <View style={styles.topOrgsHeader}>
              <Octicons name="trophy" size={20} />
              <Text>Top Organizations Attending</Text>
            </View>
            <View style={styles.orgList}>
              {topOrgs.map((org) => (
                <Pressable
                  key={org.id}
                  data-pressable-org="true"
                  onPress={() => router.push(`../group-detail/${org.id}`)}
                  style={styles.orgTag}
                >
                  <Text>{org.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {Array.isArray(opportunity.visibility) && opportunity.visibility.length > 0 && (
          <View style={styles.visibleTo}>
            <Text style={styles.visibleToText}>Visible to:</Text>
            <View style={styles.orgVisTagContainer}>
              {opportunity.visibility.map((orgId) => {
                const org = allOrgs.find((o) => o.id === orgId);
                if (!org) return null;
                return (
                  <View key={org.id} style={styles.orgVisTag}>
                    <Text style={styles.orgVisTagText}>{org.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <Pressable
          onPress={!eventStarted ? handleButtonPress : undefined}
          disabled={eventStarted || (!canSignUp && !isUserSignedUp)}
          style={({ pressed }) => [
            styles.signUpBtn,
            eventStarted && { backgroundColor: '#9ca3af' },
            !eventStarted && isUserSignedUp && { backgroundColor: '#16a34a' },
            !eventStarted && !isUserSignedUp && canSignUp && { backgroundColor: Theme.cornellRed },
            !eventStarted && !isUserSignedUp && !canSignUp && { backgroundColor: '#9ca3af' },
            pressed && !eventStarted && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.signUpText}>
            {buttonText}
          </Text>
        </Pressable>
        {/* {opportunity.tags?.length > 0 && (
          <View style={styles.tags}>
            {opportunity.tags.map((tag, index) => (
              <View key={index} style={styles.oppTag}>
                <Text style={styles.oppTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )} */}
      </View>
    </Pressable>
  );
};

export default OpportunityCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
},
  oppPicWrapper: {
    height: 100,
    overflow: "hidden",
  },
  oppPic: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
    marginTop: -15,
  },
  content: {
    padding: 16,
    paddingBottom: 14,
		flexDirection: 'column',
		flexGrow: 1,
    gap: 2,
  },
  dateTimeWrapper: {
    flexDirection: 'row',
    alignContent: 'center',
    gap: 7,
    marginBottom: 6,
  },
  // header: {
  //   justifyContent: 'space-between',
	// 	alignItems: 'flex-start',
	// 	marginBottom: 4,
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  // },
  headerTextWrapper: {
    position: 'absolute',
    padding: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: "100%",
  },
  leftHeader: {
    flexDirection: 'column',
    gap: 4,
    alignSelf: 'center',
  },
  rightHeader: {
    alignSelf: 'center',
  },
  headerText: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: 14,
    overflow: 'hidden',
    textOverflow: '...',
    color: Theme.cornellRed
  },
  hostBadge: {
    backgroundColor: '#dbeafe',
    width: 50,
    color: '#1e40af',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 6,
    borderRadius: 9999,
  },
  orgInfo: {
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgb(255, 255, 255, 0.95)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    overflow: 'hidden',
    textOverflow: '...',
  },
  oppPoints: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    textAlign: 'center',
    flexShrink: 0,
    backgroundColor: 'rgb(255, 255, 255, 0.3)',
  },
  oppNameWrapper: {
    flexDirection: 'row',
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  oppName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  oppDate: {
    color: '#374151',
    fontSize: 14,
  },
  locationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  oppAddress: {
    color: '#4b5563',
    fontSize: 14,
  },
  slotsArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 2,
  },
  slotsLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  slots: {
    backgroundColor: 'rgb(54, 188, 103, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  slotsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreParticipants: {
    height: 32,
    width: 32,
    borderRadius: 9999,
    backgroundColor: '#e5e7eb',
    color: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: '600',
    borderWidth: 2,
    borderColor: 'white',
  },
  firstSignup: {
    color: '#999fab',
    textAlign: 'center',
    height: 32,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 14,
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatar: {
    height: 32,
    width: 32,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'white',
  },
  topOrgs: {
    marginBottom: 16,
  },
  topOrgsHeader: {
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  orgList: {
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  orgTag: {
    fontSize: 12,
    backgroundColor: '#e5e7eb',
    color: '#1f2937',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  signUpBtn: {
    width: '100%',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  signUpBtnDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  signUpBtnPressed: {
    opacity: 0.85,
  },
  visibleTo: {
      marginTop: 'auto',
      marginBottom: 4
  },
  visibleToText: {
      alignItems: 'center',
      gap: 8,
      fontSize: 14,
      fontWeight: '500',
      color: '#4b5563',
      marginBottom: 8,
  },
  orgVisTagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
  },
  orgVisTag: {
      backgroundColor: '#f3f4f6',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: '#e5e7eb',
  },
  orgVisTagText: {
      fontSize: 12,
      color: '#374151',
  },
  tags: {
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    flexDirection: 'row',
    textAlign: 'center',
    gap: 4,
},
  oppTag: {
    backgroundColor: '#dbeafe',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
    fontWeight: '500',
  },
  oppTagText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
})