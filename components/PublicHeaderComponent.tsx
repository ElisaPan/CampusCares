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
        {/* <Pressable
          onPress={() => router.push(`/(tabs)/OpportunitiesPage`)}
        > */}
          <Image
            style={styles.logo}
            source={require('@/assets/images/logo.png')}
            alt="CampusCaresLogo"
          />
        {/* </Pressable> */}
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
    paddingTop: 40,
  },
  logo: {
    width: 75,
    height: 75,
    borderRadius: 9999,
    marginLeft: 5,
  },
  headerBtns: {
    flexDirection: "row",
    gap: 12,
    marginRight: 20,
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Theme.cornellRed,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  loginTxt: {
    color: Theme.cornellRed,
    fontWeight: "600",
  },
  signUpBtn: {
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  signUpTxt: {
    color: "white",
    fontWeight: "700",
  }

})