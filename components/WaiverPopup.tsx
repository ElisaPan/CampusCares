/*************
 * TODO:
 *  Severe:
 *    router.push(`/sign-waiver`)
 *  High:
 *    -
 *  Low
 *    -
 */

import * as Theme from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";


interface WaiverPopupProps {
  showWaiverPopup: boolean,
  setShowWaiverPopup: React.Dispatch<React.SetStateAction<boolean>>,
  opportunityId: string
}

const WaiverPopup: React.FC<WaiverPopupProps> = ({
  showWaiverPopup,
  setShowWaiverPopup,
  opportunityId,
}) => {
  return(
    <Modal
      visible={showWaiverPopup}
      transparent
      animationType='fade'
      onRequestClose={() => setShowWaiverPopup(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.icon}>
            <MaterialIcons name="directions-car-filled" size={32} color={Theme.cornellRed}/>
          </View>
          <Text style={styles.header}>Carpool Liability Waiver</Text>
          <Text style={styles.msg}>
            For everyone’s safety, we need all participants to review and
            sign our Carpool Liability Waiver before joining a ride or
            driving others to events.
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={styles.redBtn}
              onPress={() => {
                setShowWaiverPopup(false);
                router.push({
                  pathname: "../sign-waiver",
                  params: { opportunityId },
                });
              }}
            >
              <Text style={styles.btnTxt}>Sign Waiver</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowWaiverPopup(false);
                router.push(`/(tabs)/OpportunitiesPage`);
              }}
            >
              <Text style={styles.note}>
                No thanks, I'll join a carpool later
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default WaiverPopup;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: 448,
    borderRadius: 12,
    paddingHorizontal: 25,
    paddingVertical: 18,
    backgroundColor: "white",
    // borderWidth: 1,
    // borderColor: "#E5E7EB",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  icon: {
    width: "100%",
    alignItems: "center",
  },
  header: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgb(0,0,0)',
    paddingTop: 6,
  },
  msg: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgb(0,0,0)',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    marginTop: 4,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  redBtn: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: Theme.cornellRed,
  },
  btnTxt: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  note: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  }
})