/*************
 * TODO:
 *  Severe:
 *    Review (all chatgpt rn)
 *  High:
 *    -
 *  Low
 *    -
 */

import { router } from "expo-router";
import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface CarpoolPopupProps {
  opportunityId: number;
  setShowPopup: React.Dispatch<React.SetStateAction<number | null>>;
}

const CarpoolPopup: React.FC<CarpoolPopupProps> = ({
  setShowPopup,
  opportunityId,
}) => {
  const closePopup = () => setShowPopup(null);

  return (
    <Modal
      visible={opportunityId !== null}
      transparent
      animationType="fade"
      onRequestClose={closePopup}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Pressable style={styles.closeButton} onPress={closePopup}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <View style={styles.popupIconHeader}>
            <Image
              source={require("@/assets/icons/carpool_icon.png")}
              style={styles.carpoolIcon}
            />
          </View>

          <Text style={styles.title}>
            Carpool options are available for this opportunity!
          </Text>

          <View style={styles.modalActions}>
            <Pressable
              style={styles.redBtn}
              onPress={() => {
                closePopup();
                router.push({
                  pathname: "/carpool/[id]",
                  params: {
                    id: opportunityId.toString(),
                    mode: "rider",
                  },
                });
              }}
            >
              <Text style={styles.redBtnText}>
                <Text style={styles.bold}>GET</Text> a ride
              </Text>
            </Pressable>

            <Pressable
              style={styles.redBtn}
              onPress={() => {
                closePopup();
                router.push({
                  pathname: "/carpool/[id]",
                  params: {
                    id: opportunityId.toString(),
                    mode: "driver",
                  },
                });
              }}
            >
              <Text style={styles.redBtnText}>
                <Text style={styles.bold}>GIVE</Text> a ride
              </Text>
            </Pressable>

            <Pressable onPress={closePopup}>
              <Text style={styles.secondaryText}>
                I have my own means of transportation
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CarpoolPopup;

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
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    position: "relative",
  },

  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },

  closeText: {
    fontSize: 28,
    color: "#6B7280",
  },

  popupIconHeader: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  carpoolIcon: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },

  modalActions: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },

  redBtn: {
    width: "100%",
    backgroundColor: "#B31B1B",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  redBtnText: {
    color: "white",
    fontSize: 16,
  },

  bold: {
    fontWeight: "700",
  },

  secondaryText: {
    paddingTop: 10,
    color: "#6B7280",
    textAlign: "center",
  },
});