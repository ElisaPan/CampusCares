/*************
 * TODO:
 *  Severe:
 *    -
 *  High:
 *    -
 *  Low
 *    -
 */

import * as Theme from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [showRiderForm, setShowRiderForm] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState('');
  const [showWaiverPopup, setShowWaiverPopup] = useState<boolean>(!currentUser.carpool_waiver_signed);
  const [showTooltip, setShowTooltip] = useState(false);

  const queryClient = useQueryClient();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const opportunityId = id;
  
  const [showDriverPopup, setShowDriverPopup] = useState<boolean>(
    !!(currentUser?.carpool_waiver_signed && mode === 'driver')
  );

  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: ['opportunity', opportunityId],
    queryFn: () => getOpportunity(parseInt(opportunityId!)),
    enabled: !!opportunityId
  });

  const carpoolId = opportunity?.carpool_id;

  const { data: rides, isLoading: ridesLoading } = useQuery<Ride[]>({
    queryKey: ['rides', carpoolId],
    queryFn: () => getRides(parseInt(carpoolId!)),
    enabled: !!carpoolId,
    refetchInterval: 30000
  });


  const unregistrationCheck = useMemo(() => {
    if (!opportunity) return;
    return canUnregisterFromOpportunity(opportunity.date, opportunity.time);
  }, [opportunity?.date, opportunity?.time]);


  if (!opportunityId || !carpoolId) return null;

  if (isLoading || !opportunity || ridesLoading || !rides) return <p>Loading...</p>

  const canUnregister = unregistrationCheck?.canUnregister ?? true;
  const isDriver = rides.some(ride => ride.driver_id == currentUser.id.toString());
  const userRide = rides.find(ride => ride.riders.some(rider => rider.user_id == currentUser.id.toString()));
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
          user_id: currentUser.id,
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
        onPress={() => setShowTooltip(true)}
        style={styles.tooltip}
      >
        <MaterialDesignIcons name="information-outline" size={16} color='#666' />
      </Pressable>
      <Pressable
        onPress={() => router.push(`/opportunity/${opportunityId}`)}
        style={styles.backBtn}
      >
        <MaterialIcons name="arrow-back-ios" size={24} color="#000" />
        <Text>Back to Opportunity Details</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.h1}>Carpool for {opportunity.name}</Text>
        <View style={styles.mainDetails}>
          <Text>{displayTime} - {displayEndTime} | {displayDate}</Text>
        </View>
        {opportunity.address &&
          <View style={styles.location}>
            <MaterialIcons name="location-on" size={24} color="#000" />
            <p>{opportunity.address}</p>
          </View>
        }
        {!canUnregister &&
          <View style={styles.deadline}>
            <Text>⚠ Carpool rides are now closed</Text>
          </View>
        }
      </View>
      <View style={styles.content}>
        {rides.map(ride => {
          const seatsLeft = ride.driver_seats - ride.riders.length;
          const totalSlots = [...ride.riders, ...Array.from({ length: seatsLeft })];
          const shownSlots = totalSlots.slice(0, 6);
          const extraCount = totalSlots.length - shownSlots.length;
          
          return (
            <View key={ride.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.icon}>
                  <MaterialIcons name="directions-car-filled" size={18} color={Theme.cornellRed}/>
                </View>
                <View style={styles.text}>
                  <Text style={styles.h2}>{ride.driver_name}</Text>
                  <View style={styles.riders}>
                    <View style={styles.slots}>
                      {shownSlots.map((slot, i) => {
                        if (i < ride.riders.length) {
                          const rider = ride.riders[i];
                          return (
                            <Pressable
                              key={rider.id}
                              onPress={() => {
                                Alert.alert("Rider", rider.name);
                              }}
                              style={styles.slot}
                              >
                                <Image
                                  source={getProfilePictureSource(
                                    rider.profile_image,
                                    rider.photoURL
                                  )}
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
                    <Text>{seatsLeft} Seat{seatsLeft == 1 ? '' : 's'} Available</Text>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={() => onSelectRide(ride.id)}
                disabled={seatsLeft == 0 && (!isRider || (isRider && !(userRide.id == ride.id))) || isDriver || (isRider && !(userRide.id == ride.id)) || !canUnregister ? true : false}
                style={styles.redBtn}
              >
                <Text>{isRider && userRide.id == ride.id ? 'Ride Joined ✓' : 'Join Ride'}</Text>
              </Pressable>
            </View>
          )
        })}
        <View style={styles.add}>
          <Pressable
            onPress={onAddRide}
            disabled={!canUnregister || isDriver || isRider ? true : false}
            style={styles.orangeBtn}
          >
            <Text>+ Add Ride</Text>
          </Pressable>
        </View>
      </View>

      {showRiderForm &&
        <CarpoolFormPopup
          setShowPopup={setShowRiderForm}
          selectedRideId={selectedRideId}
          currentUser={currentUser}
          showPopup={showPopup}
          carpoolId={carpoolId}
        />
      }

      {showDriverPopup && opportunity.carpool_id &&
        <DriverFormPopup
          setShowPopup={setShowDriverPopup}
          currentUser={currentUser}
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
  },
  tooltip: {
    fontSize: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backBtn: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  h1: {
    fontSize: 40,
    fontWeight: '700',
    color: '#333',
    marginBlock: 8,
  },
  mainDetails: {
    fontSize: 20,
    fontWeight: '600',
    color: '#CF1C25',
    marginBottom: 15,
    justifyContent: 'center',
    gap: 10,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    fontSize: 14,
    color: '#555',
    backgroundColor: 'rgba(128, 128, 128, 0.241)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  content: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
  },
  deadline: {
    fontSize: 16,
    color: '#555',
    backgroundColor: 'rgba (128, 128, 128, 0.241)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'white',
    width: 400,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 60,
    height: 60,
  },
  text: {
    flexDirection: 'column',
    gap: 8,
  },
  h2: {
    fontWeight: '700',
  },
  riders: {
    flexDirection: 'row',
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
    width: 20,
    height: 20,
    borderColor: Theme.cornellRed,
    borderWidth: 24,
    backgroundColor: 'rgba(211, 211, 211, 0.45)',
  },
  more: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: '50%',
    width: 20,
    height: 20,
    borderColor: '#A9A9A9',
    borderWidth: 24,
  },
  moreTxt: {
    color: 'rgb(83, 83, 83)',
    fontSize: 8,
  },
  add: {
    borderRadius: 16,
    backgroundColor: 'white',
    width: 400,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 10,
    justifyContent: 'center',
  },
  redBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: Theme.cornellRed,
  },
  orangeBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '500',
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FF8C00',
    color: 'white',
  }
})