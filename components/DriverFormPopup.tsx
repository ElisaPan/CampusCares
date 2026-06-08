import * as Theme from '@/constants/theme';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { createOrUpdateCar, createRide, getCar } from '../api';
import { User } from '../types';

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
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

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

  const onSubmit = async () => {
    if (!carSeats) {
      setError('Number of car seats cannot be empty');
      return;
    }
    if (licensePlate && licensePlate.length != 4) {
      setError('License plate value should only be the last 4 characters');
      return;
    }

    try {
      await createOrUpdateCar({
        seats: carSeats,
        user_id: currentUser.id,
        color: color,
        model: model,
        license_plate: licensePlate
      });
      await createRide({
        carpool_id: carpoolId,
        driver_id: currentUser.id,
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
      onRequestClose={() => setShowPopup(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Pressable
            style={styles.close}
            onPress={() => {
              setIsModalVisible(false);
              setShowPopup(false);
            }}
          >
            <MaterialDesignIcons
              name="close"
              size={24}
              color="#6B7280"
            />
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
      </View>
    </Modal>
  )
}

export default CarpoolFormPopup;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: 448,
    borderRadius: 12,
    padding: 24,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",

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
    fontSize: 18,
    fontWeight: '800',
    color: 'rgb(0,0,0)',
    paddingTop: 6,
  },
  msg: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgb(0,0,0)',
    textAlign: 'center',
  },
  actions: {
    marginTop: 4,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
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
    textAlign: "center",
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
  btnTxt: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  driverWarning: {
    textAlign: "center",
    fontSize: 12,
  },
})

