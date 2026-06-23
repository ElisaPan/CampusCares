/*************
 * TODO:
 *  Severe:
 *    After connecting backend:
 *      -  Fix CarpoolPopup UI
 *      -  Fix DriverFormPopup UI
 *  High:
 *    -
 *  Low
 *    -
 */

import * as Theme from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { mockOpportunities, mockRides, mockUsers } from '@/data/initialData';
import { getOpportunity, getProfilePictureSource, getRides, removeRider } from '../api';
import CarpoolFormPopup from '../components/CarpoolFormPopup';
import DriverFormPopup from '../components/DriverFormPopup';
import WaiverPopup from '../components/WaiverPopup';
import { Opportunity, Ride, User } from '../types';
import { calculateEndTime, canUnregisterFromOpportunity } from '../utils/timeUtils';

interface CarpoolPageProps {
  currentUser: User;
  showPopup: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
) => void,
}

const CarpoolPage: React.FC<CarpoolPageProps> = ({ currentUser, showPopup }) => {

  const USE_MOCKS = false;
  
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  const profileUser = USE_MOCKS ? mockUsers[0] : currentUser;

  if (!profileUser) return <Text>User not found</Text>;
  
  const mockOpportunity = mockOpportunities.find((o) => o.id === parsedId);


  const [showRiderForm, setShowRiderForm] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState('');
  const [showWaiverPopup, setShowWaiverPopup] = useState<boolean>(!profileUser.carpool_waiver_signed);

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


  if (!opportunityId) return <Text>Missing opportunity ID</Text>;

  if (!opportunity) return <Text>Opportunity not found</Text>;

  if (!carpoolId) return <Text>No carpool available for this opportunity.</Text>;

  if (!rides) return <Text>No rides found.</Text>;

  if (!USE_MOCKS && (isLoading || ridesLoading || !rides)) {
    return <Text>Loading...</Text>;
  }

  const canUnregister = unregistrationCheck?.canUnregister ?? true;
  const isDriver = rides.some(ride => ride.driver_id == profileUser.id.toString());
  const userRide = rides.find(ride => ride.riders.some(rider => rider.user_id == profileUser.id.toString()));
  const isRider = !!userRide;


  // Logic to get the time/date
  const dateObj = new Date(opportunity.date);
  dateObj.setDate(dateObj.getDate() + 1);

  const displayDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
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

  const onSelectRide = async (id: string) => {
    if (isRider && userRide.id == id) {
      try {
        await removeRider({
          user_id: profileUser.id,
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
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push(`/opportunity/${opportunityId}`)}
        style={styles.backBtn}
      >
        <MaterialIcons name='arrow-back-ios' size={16} color='#374151' />
        <Text style={{ color: '#374151', fontSize: 16 }}>Back to Opportunity Details</Text>
      </Pressable>
      <View style={styles.headerWrapper}>
        <Text style={styles.header}>Carpool for {opportunity.name}</Text>
        <View style={styles.mainDetailsWrapper}>
          <Text style={styles.mainDetails}>{displayTime} - {displayEndTime}  |  {displayDate}</Text>
        </View>
        {opportunity.address &&
          <View style={styles.locationWrapper}>
            <MaterialIcons name='location-on' size={24} color='#6B7280' />
            <Text style={styles.location}>{opportunity.address}</Text>
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
                <MaterialIcons name='directions-car-filled' size={60} color='black'/>
                <View style={styles.ride}>
                  <Text style={styles.driverName}>{ride.driver_name}</Text>
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
  backBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  headerWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 40,
    lineHeight: 54,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  mainDetailsWrapper: {
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
  },
  mainDetails: {
    fontSize: 20,
    fontWeight: '700',
    color: '#CF1C25',
    textAlign: 'center',
  },
  locationWrapper: {
    gap: 4,
    marginBottom: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  location: {
    fontSize: 16,
    color: '#4B5563',
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
    gap: 15,
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ride: {
    flexDirection: 'column',
    gap: 4,
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
    borderColor: Theme.cornellRed,
    borderWidth: 1.5,
    backgroundColor: 'rgba(211, 211, 211, 0.45)',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
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
})