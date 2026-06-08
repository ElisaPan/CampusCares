import { Picker } from "@react-native-picker/picker";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { addRider } from '../api';

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { User } from '../types';

interface CarpoolFormPopupProps {
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>,
  selectedRideId: string,
  currentUser: User,
  showPopup: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void,
  carpoolId: string
}

const CarpoolFormPopup: React.FC<CarpoolFormPopupProps> = ({
  setShowPopup,
  selectedRideId,
  currentUser,
  showPopup,
  carpoolId
}) => {
  const queryClient = useQueryClient();

  const [loc, setLoc] = useState("RPCC");
  const [otherLoc, setOtherLoc] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const locationOptions = ["RPCC", "Baker Flagpole", "CTB", "Other"];

  const onSubmit = async () => {
    if (loc === "Other" && !otherLoc.trim()) {
      setError("Please specify at what location you would like to be picked up");
      return;
    }

    const pickupLocation = loc === "Other" ? otherLoc : loc;

    try {
      await addRider({
        ride_id: selectedRideId,
        user_id: currentUser.id,
        pickup_location: pickupLocation,
        notes,
      });

      queryClient.invalidateQueries({
        queryKey: ["rides", carpoolId],
      });

      setShowPopup(false);

      showPopup(
        "Ride Joined!",
        "You have successfully joined a carpool ride! An email will be sent to you seven hours prior to the event with details about the ride.",
        "success"
      );
    } catch {
      setError("Failed to join ride, please try again.");
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Pressable
            style={styles.closeButton}
            onPress={() => setShowPopup(false)}
          >
            <MaterialDesignIcons name="close" size={24} color="#6B7280" />
          </Pressable>

          <Text style={styles.title}>Enter Pickup Information</Text>

          <View style={styles.formContent}>
            <View>
              <Text style={styles.formLabel}>
                Where would you like to be picked up from? *
              </Text>

              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={loc}
                  onValueChange={(value) => setLoc(value)}
                >
                  {locationOptions.map((choice) => (
                    <Picker.Item
                      key={choice}
                      label={choice}
                      value={choice}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {loc === "Other" && (
              <View>
                <Text style={styles.formLabel}>Please specify Other *</Text>

                <TextInput
                  value={otherLoc}
                  onChangeText={setOtherLoc}
                  style={styles.formField}
                />
              </View>
            )}

            <View>
              <Text style={styles.formLabel}>Any notes for the driver?</Text>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={styles.formField}
              />
            </View>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={styles.redButton} onPress={onSubmit}>
            <Text style={styles.redButtonText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default CarpoolFormPopup;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  modal: {
    width: "100%",
    maxWidth: 448,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    gap: 20,
  },

  closeButton: {
    alignSelf: "flex-end",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  formContent: {
    gap: 16,
  },

  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  formField: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
  },

  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },

  redButton: {
    backgroundColor: "#B31B1B",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  redButtonText: {
    color: "white",
    fontWeight: "700",
  },
});