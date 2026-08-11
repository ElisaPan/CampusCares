/*************
 * TODO:
 *  Severe:
 *    Update api call to delete ride
 *  High:
 *    -
 *  Low
 *    -
 */

import * as Theme from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from "expo-router";
import { Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { cancelRideNotificationRequest, checkWaitlistStatus, deleteRide, getOpportunity, getProfilePictureSource, getRides, removeRider, requestRideNotification } from '@/api';
import CarpoolFormPopup from '@/components/carpool/CarpoolFormPopup';
import DriverFormPopup from '@/components/carpool/DriverFormPopup';
import WaiverPopup from '@/components/carpool/WaiverPopup';
import { mockOpportunities, mockRides, mockUsers } from '@/data/initialData';
import { useUserStore } from '@/hooks/useUserStore';
import { Opportunity, Ride } from '@/types';
import { calculateEndTime, canUnregisterFromOpportunity } from '@/utils/timeUtils';

interface CarpoolPageProps {
  showPopup: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
) => void,
}

const CarpoolPage: React.FC<CarpoolPageProps> = ({ showPopup }) => {
  const { currentUser, setCurrentUser, updateCurrentUser, clearCurrentUser, students } = useUserStore();

  const USE_MOCKS = false;
  
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  const profileUser = USE_MOCKS ? mockUsers[0] : currentUser;
  
  const mockOpportunity = mockOpportunities.find((o) => o.id === parsedId);

  const [onWaitlist, setOnWaitlist] = useState(false);

  const [showRiderForm, setShowRiderForm] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState('');
  const [showWaiverPopup, setShowWaiverPopup] = useState<boolean>(!profileUser?.carpool_waiver_signed);

  const queryClient = useQueryClient();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const opportunityId = id;
  
  const [showDriverPopup, setShowDriverPopup] = useState<boolean>(
    !!(profileUser?.carpool_waiver_signed && mode === 'driver')
  );

  const { data: backendOpportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ['opportunity', opportunityId],
    queryFn: () => getOpportunity(parseInt(opportunityId!)),
    enabled: !USE_MOCKS && !!opportunityId,
  });
  const opportunity = USE_MOCKS ? mockOpportunity : backendOpportunity;

  const carpoolId = opportunity?.carpool_id;

  const { data: backendRides, isLoading: ridesLoading } = useQuery<Ride[]>({
    queryKey: ['rides', carpoolId],
    queryFn: () => getRides(parseInt(carpoolId!)),
    enabled: !USE_MOCKS && !!carpoolId,
    refetchInterval: 30000
  });
  const rides = USE_MOCKS ? mockRides : backendRides;


  const unregistrationCheck = useMemo(() => {
    if (!opportunity) return;
    return canUnregisterFromOpportunity(opportunity.date, opportunity.time);
  }, [opportunity?.date, opportunity?.time]);

  const canUnregister = unregistrationCheck?.canUnregister ?? true;
  const isDriver = rides?.some(ride => ride.driver_id == profileUser?.id.toString());
  const userRide = rides?.find(ride => ride.riders.some(rider => rider.user_id == profileUser?.id.toString()));
  const isRider = !!userRide;

  useEffect(() => {
    if (!currentUser || !carpoolId) return;

    checkWaitlistStatus(Number(carpoolId), currentUser.id)
      .then(setOnWaitlist)
      .catch(() => setOnWaitlist(false));
  }, [currentUser?.id, carpoolId, isDriver]);

  // Logic to get the time/date
  const dateObj = new Date(opportunity?.date ?? '');
  dateObj.setDate(dateObj.getDate() + 1);

  const displayDate = dateObj.toLocaleDateString('en-US', {
    // weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const displayTime = new Date(`1970-01-01T${opportunity?.time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const displayEndTime = calculateEndTime(String(opportunity?.date), String(opportunity?.time), Number(opportunity?.duration));

  const onSelectRide = async (id: string) => {
    if (isRider && userRide.id == id) {
      try {
        await removeRider({
          user_id: profileUser?.id,
          ride_id: id
        });
        queryClient.invalidateQueries({ queryKey: ['rides', carpoolId] });
      } catch (err) {
      }
    } else {
      setSelectedRideId(id);
      setShowRiderForm(true);
    }
  };

  const onAddRide = () => {
    setShowDriverPopup(true);
    setOnWaitlist(false);
  }

  const onRemoveRide = async (id: string) => {
    if (!currentUser) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Remove Ride',
        'Are you sure you want to remove this ride? Signed up riders will be notified.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    try {
      await deleteRide(Number(id), currentUser.id);
      queryClient.invalidateQueries({ queryKey: ['rides', carpoolId] });
    } catch (error: any) {
      Alert.alert('Error', `Failed to remove ride: ${error.message}`);
    }
  };

  const handleWaitlistPress = async () =>{
    if (!carpoolId || !currentUser) return;

    if (onWaitlist) {
      try {
        await cancelRideNotificationRequest(Number(carpoolId), currentUser.id);
        setOnWaitlist(false);
      } catch (e: any) {
        Alert.alert('Error', e.message);
      }
      return;
    }

    try {
      const rides = await getRides(Number(carpoolId))
      if (rides.length === 0) {
        Alert.alert(
          'No rides available',
          'There are no rides for this opportunity yet. Would you like to be notified when one is created?',
          [
            { text: 'No thanks', style: 'cancel' },
            {
              text: 'Notify me',
              onPress: async () => {
                try {
                  await requestRideNotification(Number(carpoolId), currentUser.id);
                  setOnWaitlist(true);
                } catch (e: any) {
                  Alert.alert('Error', e.message);
                }
              },
            },
          ]
        );
        return;
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to check for available rides.');
    }
  }

  const sendTextToSignedUpUsers = (phoneNumbers: string[]) => {
    const separator = Platform.OS === 'ios' ? ',' : ';';
    const numbers = phoneNumbers.join(separator);
    Linking.openURL(`sms:${numbers}`);
  };

  if (!USE_MOCKS && (isLoading || ridesLoading)) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size='large' color={Theme.cornellRed} />
      </View>
    )
  }

  if (!profileUser) return <Text>User not found</Text>;
  
  if (!opportunityId) return <Text>Missing opportunity ID</Text>;

  if (!opportunity) return <Text>Opportunity not found</Text>;

  if (!carpoolId) return <Text>No carpool available for this opportunity.</Text>;

  if (!rides) return <Text>No rides found.</Text>;

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backWrapper}
        onPress={() => router.push(`/OpportunityDetailPage?id=${opportunityId}`)}
      >
        <MaterialIcons name='chevron-left' size={18} color='#374151' />
        <Text style={styles.backTxt}>Back to {opportunity.name}</Text>
      </Pressable>
      <View style={styles.body}>
        <View style={styles.headerWrapper}>
          <Text style={styles.header}>Carpool for {opportunity.name}</Text>
          <View style={styles.mainDetailsWrapper}>
            <Text style={styles.mainDetails}>{displayTime} - {displayEndTime}  |  {displayDate}</Text>
          </View>
          {opportunity.address &&
            <View style={styles.locationWrapper}>
              <MaterialIcons name='location-on' size={24} color='#6B7280' />
              <Text style={[styles.location ]}>{opportunity.address}</Text>
            </View>
          }
          {!canUnregister &&
            <View style={styles.deadline}>
              <Text style={styles.deadlineTxt}>⚠ Carpool rides are now closed</Text>
            </View>
          }
        </View>
        <View style={styles.content}>
          {rides.map(ride => {
            const seatsLeft = ride.driver_seats - ride.riders.length;
            const totalSlots = [...ride.riders, ...Array.from({ length: seatsLeft })];
            const shownSlots = totalSlots.slice(0, 4);
            const extraCount = totalSlots.length - shownSlots.length;

            const disableJoinRide =
              isDriver ||
              !canUnregister ||
              (isRider && userRide?.id !== ride.id) ||
              (seatsLeft === 0 && userRide?.id !== ride.id);

            return (
              <View key={ride.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name='directions-car-filled' size={50} color='black'/>
                  <View style={styles.ride}>
                    <View style={styles.rideHeader}>
                      <Text style={styles.driverName}>{ride.driver_name}</Text>
                      {((Number(ride.driver_id) === Number(currentUser?.id)) || currentUser?.admin )&&
                        <Pressable onPress={() => onRemoveRide(ride.id)} style={{ paddingLeft: 4, marginRight: -16}}>
                          <Trash2 color='#d2d2d2'size={18}/>
                        </Pressable>
                      }
                    </View>
                    <View style={styles.riders}>
                      <View style={styles.slots}>
                        {shownSlots.map((slot, i) => {
                          if (i < ride.riders.length) {
                            const rider = ride.riders[i];
                            return (
                              <Pressable
                                key={rider.id}
                                onPress={() => { Alert.alert("Rider", rider.name) }}
                                style={styles.slot}
                                >
                                  <Image
                                    source={getProfilePictureSource( rider.profile_image, rider.photoURL )}
                                    alt={`${rider.name} pfp`}
                                    style={styles.riderAvatar}
                                  />
                                </Pressable>
                            )
                          } else {
                            return (
                              <View
                                key={`empty-${i}`}
                                style={[ styles.slot, { borderColor: '#d3d3d3' } ]}
                              />
                            );
                          }
                        })}
                        {extraCount > 0 && (
                          <View style={styles.more}>
                            <Text style={styles.moreTxt}>
                              +{extraCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: '#374151' }}>{seatsLeft} Available</Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  onPress={() => onSelectRide(ride.id)}
                  disabled={seatsLeft == 0 && (!isRider || (isRider && !(userRide.id == ride.id))) || isDriver || (isRider && !(userRide.id == ride.id)) || !canUnregister ? true : false}
                  style={[
                    styles.redBtn,
                    disableJoinRide && styles.disabledJoinBtn,
                  ]}
                >
                  <Text style={styles.boldWhite}>{isRider && userRide.id == ride.id ? 'Ride Joined ✓' : 'Join Ride'}</Text>
                </Pressable>
              </View>
            )
          })}
          <View style={styles.addCard}>
            <Pressable
              onPress={onAddRide}
              disabled={!canUnregister || isDriver || isRider ? true : false}
              style={[
                styles.orangeAddBtn,
                (!canUnregister || isDriver || isRider) && styles.disabledAddBtn,
              ]}
            >
              <Text style={styles.boldWhite}>+ Add Ride</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {(onWaitlist || rides.length === 0 ) && (
        <Pressable
          onPress={handleWaitlistPress}
          style={[styles.waitlistBtn, onWaitlist && {opacity: 0.7}]}
        >
          { onWaitlist ? (
            <Text style={styles.waitlistTxt}>Waitlisted — tap to cancel</Text>
          ) : (
            <Text style={styles.waitlistTxt}>Notify me when a ride is added</Text>
          )}
        </Pressable>
      )}

      {showRiderForm &&
        <CarpoolFormPopup
          setShowPopup={setShowRiderForm}
          selectedRideId={selectedRideId}
          currentUser={profileUser}
          showPopup={showPopup}
          carpoolId={carpoolId}
        />
      }

      {showDriverPopup && opportunity.carpool_id &&
        <DriverFormPopup
          setShowPopup={setShowDriverPopup}
          currentUser={profileUser}
          carpoolId={opportunity.carpool_id}
          showPopup={showPopup}
        />
      }

      {showWaiverPopup &&
        <WaiverPopup
          showWaiverPopup={showWaiverPopup}
          setShowWaiverPopup={setShowWaiverPopup}
          opportunityId={opportunityId}
        />
      }
    </View>
  )
};

export default CarpoolPage;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexDirection: 'column',
  },
  loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
  },
  backWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
    gap: 4,
  },
  backTxt: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '400',
  },
  body: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  headerWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  mainDetailsWrapper: {
    marginTop: 14,
    marginBottom: 8,
    gap: 8,
  },
  mainDetails: {
    fontSize: 16,
    fontWeight: '500',
    color: '#CF1C25',
    textAlign: 'center',
  },
  locationWrapper: {
    gap: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  location: {
    fontSize: 14,
    color: '#5f6771',
  },
  detail: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: 'rgba(128, 128, 128, 0.25)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  deadline: {
    backgroundColor: 'rgba (128, 128, 128, 0.241)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  deadlineTxt: {
    fontSize: 16,
    color: '#4B5563',
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'white',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 6,

    borderBottomWidth: 0.6,
    borderBottomColor: '#abb1bd',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ride: {
    width: '75%',
    flexDirection: 'column',
    gap: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
  },
  riders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slot: {
    borderRadius: '50%',
    overflow: 'hidden',
    width: 24,
    height: 24,
    // borderColor: Theme.cornellRed,
    borderWidth: 1.5,
    backgroundColor: 'rgba(211, 211, 211, 0.45)',
  },
  riderAvatar: {
    height: 24,
    width: 24,
  },
  more: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: '50%',
    width: 24,
    height: 24,
    borderColor: '#D3D3D3',
    borderWidth: 1.5,
  },
  moreTxt: {
    color: 'rgb(83, 83, 83)',
    fontSize: 8,
  },
  addCard: {
    borderRadius: 16,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
  },
  redBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 2,
    backgroundColor: Theme.cornellRed,
  },
  disabledJoinBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F7A8A8',
  },
  orangeAddBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '500',
    borderRadius: 8,
    backgroundColor: '#FF8C00',
    color: 'white',
  },
  disabledAddBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFD8A8',
  },
  boldWhite: {
    color: 'white',
    fontWeight: '800',
    textAlign: 'center'
  },
  waitlistBtn: {
    backgroundColor: 'rgb(37, 99, 235)',
    marginTop: 16,
    marginHorizontal: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  waitlistTxt: {
    color: 'rgb(255,255,255)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  }
})