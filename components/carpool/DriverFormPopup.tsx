import { createOrUpdateCar, createRide, getCar, updateUser } from '@/api';
import * as Theme from '@/constants/theme';
import { useUserStore } from '@/hooks/useUserStore';
import { User } from '@/types';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface CarpoolFormPopupProps {
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>,
  currentUser: User,
  carpoolId: string,
  showPopup: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void,
}

const CarpoolFormPopup: React.FC<CarpoolFormPopupProps> = ({
  setShowPopup,
  currentUser,
  carpoolId,
  showPopup
}) => {
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [carSeats, setCarSeats] = useState(0);
  const [color, setColor] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const queryClient = useQueryClient();

  const { updateCurrentUser } = useUserStore();

  const { data: carData, isLoading } = useQuery({
    queryKey: ['car', currentUser.id],
    queryFn: () => getCar(currentUser.id!.toString()),
    enabled: !!currentUser.id
  });

  useEffect(() => {
    if (!carData) return;

    if (carData.exists) {
      const car = carData.car;
      setCarSeats(car.seats ? car.seats : 0)
      setColor(car.color ? car.color : '');
      setModel(car.model ? car.model : '');
      setLicensePlate(car.license_plate ? car.license_plate : '');
    }
  }, [carData])

  if (isLoading || !carData) return;

  const closePopup = () => setShowPopup(false);

  const onSubmit = async () => {
    if (!carSeats) {
      setError('Number of car seats cannot be empty');
      return;
    }
    if (licensePlate && licensePlate.length != 4) {
      setError('License plate value should only be the last 4 characters');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setPhoneError('A valid phone number is required to offer a ride.');
      return;
    }

    try {
      if (currentUser && currentUser.phone !== phone) {
        await updateUser(currentUser.id, { phone });
        updateCurrentUser({ phone });
      }
      await createOrUpdateCar({
        seats: carSeats,
        user_id: currentUser.id,
        color: color,
        model: model,
        license_plate: licensePlate,
        driver_phone: phone
      });
      await createRide({
        carpool_id: carpoolId,
        driver_id: currentUser.id,
        driver_phone: phone
      });

      queryClient.invalidateQueries({ queryKey: ['rides', carpoolId] });
      setShowPopup(false);
      showPopup(
        'Ride Added!',
        'Thank you for signing up to drive! An email will be sent to you seven hours prior to the event with details about the carpool ride (including pickup locations, riders, etc.).',
        'success'
      );
    } catch (err) {
      setError('Failed to add ride, please try again');
    }
  }

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closePopup}
    >
      <Pressable
        style={styles.modalBackdrop}
        onPress={closePopup}
      >
        <View style={styles.modalBox}>
          <Pressable
            style={styles.close}
            onPress={() => {
              setIsModalVisible(false);
              setShowPopup(false);
            }}
          >
            <MaterialDesignIcons name='close' size={24} color='#a8abb2' />
          </Pressable>
          <Text style={styles.header}>Add a Ride</Text>
          <Text style={styles.msg}>
            {carData.exists
              ? "Please enter the details of your car"
              : "Please confirm and adjust the details accordingly"}
          </Text>
          <View style={styles.content}>
            <View>
              <Text style={styles.label}>Number of car seats *</Text>
              <TextInput
                value={carSeats === 0 ? "" : carSeats.toString()}
                keyboardType="numeric"
                style={styles.field}
                onChangeText={(text) => {
                  if (text === "") {
                    setCarSeats(0);
                    return;
                  }
                  const value = parseInt(text, 10);
                  if (!isNaN(value) && value >= 1 && value <= 15) {
                    setCarSeats(value);
                  }
                }}
              />
            </View>
            <View>
              <Text style={styles.label}>Car color</Text>
              <TextInput
                value={color}
                style={styles.field}
                onChangeText={setColor}
              />
            </View>
            <View>
              <Text style={styles.label}>Car model</Text>
              <TextInput
                value={model}
                style={styles.field}
                onChangeText={setModel}
              />
            </View>
            <View>
              <Text style={styles.label}>Last 4 characters of license plate</Text>
              <TextInput
                value={licensePlate}
                style={styles.field}
                onChangeText={setLicensePlate}
              />
            </View>
            <View>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setPhoneError('');
                }}
                keyboardType="phone-pad"
                placeholder="e.g. 607-555-0123"
                style={styles.field}
              />
              {phoneError !== '' && <Text style={styles.error}>{phoneError}</Text>}
            </View>
          </View>
          {!!error && (
            <Text style={styles.error}>{error}</Text>
          )}
          <Text style={styles.driverWarning}>
            By signing up to drive, you’re committing to
            follow through. Please only continue if you’re
            sure you can drive.
          </Text>
          <Pressable
            style={styles.redBtn}
            onPress={onSubmit}
          >
            <Text style={styles.btnTxt}>Add Ride</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

export default CarpoolFormPopup;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  close: {
    alignSelf: "flex-end",
  },
  icon: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  msg: {
    fontSize: 16,
    color: 'rgb(0,0,0)',
    textAlign: 'center',
    marginBottom: 12,
  },
  content: {
    gap: 8,
  },
  label: {
    color: '#6b6b6b',
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  field: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: {
    color: "#DC2626",
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  redBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: Theme.cornellRed,
  },
  btnTxt: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  driverWarning: {
    color: '#575757',
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
})

