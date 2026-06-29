/*************
 * TODO:
 *  Severe:
 *    
 *  High:
 *    Update numbers
 *  Low
 *    -
 */
import logoBanner from '@/assets/images/logo-banner.png';
import { FontAwesome } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const HomeFooter = () => {
  return (
    <View style={styles.footer}>
      <View style={styles.socials}>
        <Pressable onPress={() => Linking.openURL("https://www.instagram.com/campuscares.us/")}>
           <FontAwesome name="instagram" size={32} color="white" />
        </Pressable>
        <Pressable onPress={() => Linking.openURL("https://www.linkedin.com/company/campus-cares")}>
          <FontAwesome name="linkedin-square" size={32} color="white" />
        </Pressable>
      </View>
      <View style={styles.logos}>
        <Image source={logoBanner} style={styles.logoBanner}/>
        <Pressable onPress={() => Linking.openURL("https://www.campuscares.us/terms_of_service.pdf")}>
          <Text style={styles.termsServices}>Terms of Service</Text>
        </Pressable>
        <Text style={styles.copyright}>© 2026 CampusCares. All rights reserved.</Text>
      </View>
    </View>
  )
}

export default HomeFooter;

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#B31B1B',
    paddingVertical: 30,
    alignItems: 'center',
    width: '100%',
  },
  socials: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIcon: {
    width: 32,
    height: 32,
  },
  logos: {
    alignItems: "center",
    gap: 8,
    color: 'white',
  },
  logoBanner: {
    width: 273,
    height: 50,
    marginTop: 4,
    marginBottom: 2,
    resizeMode: 'contain',
  },
  termsServices: {
    color: '#F4CCCA',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  copyright: {
    color: '#F4CCCA',
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  }
})