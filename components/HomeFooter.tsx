/*************
 * TODO:
 *  Severe:
 *    Terms & Services -- upload to backend
 *  High:
 *    Update numbers
 *  Low
 *    -
 */
import linkedinLogo from '@/assets/icons/linkedin.svg';
import logoBanner from '@/assets/images/logo-banner.png';
import * as Linking from "expo-linking";
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const HomeFooter = () => {
  return (
    <View style={styles.container}>
      <View style={styles.socialsWrapper}>
        <Pressable onPress={() => Linking.openURL("https://www.linkedin.com/company/campus-cares")}>
          <Image source={linkedinLogo}/>
        </Pressable>
      </View>
      <View style={styles.logoWrapper}>
        <Image source={logoBanner} />
        <View style={styles.sublinks}>
          <Pressable onPress={() => Linking.openURL("https://www.campuscares.us/terms_of_service.pdf")}>
            <Text style={styles.termsServices}>Terms of Service</Text>
          </Pressable>
        </View>
        <Text style={styles.trademark}>© 2026 CampusCares. All rights reserved.</Text>
      </View>
    </View>
  )
}

export default HomeFooter;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#B31B1B',
    flexDirection: 'row',
    paddingVertical: 40,
    paddingHorizontal: 100,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 100,
    textAlign: 'center',
  },
  socialsWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  logoWrapper: {
    flexDirection: 'column',
    gap: 8,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sublinks: {
    
  },
  termsServices: {
    color: '#F4CCCA',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  trademark: {
    color: '#F4CCCA',
    fontSize: 14,
  }
})