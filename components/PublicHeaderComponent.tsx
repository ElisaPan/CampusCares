/*************
 * TODO:
 *  Severe:
 *    
 *  High:
 *    Update numbers
 *  Low
 *    -
 */
import * as Theme from '@/constants/theme';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const PublicHeader = () => {
  return (
    <View style={styles.header}>
      <View>
        <Pressable
          onPress={() => router.push(`/HomePage`)}
        >
          <Image
            style={styles.logo}
            source={require('@/assets/images/logo.png')}
            alt="CampusCaresLogo"
          />
        </Pressable>
      </View>
      <View style={styles.headerBtns}>
        <Pressable
          style={styles.loginBtn}
          onPress={() => router.push('/LoginPage')}
        >
          <Text style={styles.loginTxt}>Login</Text>
        </Pressable>

        <Pressable
          style={styles.signUpBtn}
          onPress={() => router.push('/SignUpPage')}
        >
          <Text style={styles.signUpTxt}>Sign Up</Text>
        </Pressable>
      </View>
  </View>
  )
}

export default PublicHeader;

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    marginLeft: 5,
  },
  headerBtns: {
    flexDirection: "row",
    gap: 8,
    marginRight: 6,
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Theme.cornellRed,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  loginTxt: {
    color: Theme.cornellRed,
    fontSize: 14,
    fontWeight: "600",
  },
  signUpBtn: {
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  signUpTxt: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  }

})