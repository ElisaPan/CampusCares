import { Redirect } from "expo-router";

export default function Index() {
  // const [firebaseUser, setFirebaseUser] =
  //   useState<FirebaseUser | null | undefined>(undefined);

  // useEffect(() => {
  //   return onAuthStateChanged(auth, (user) => {
  //     setFirebaseUser(user);
  //   });
  // }, []);

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     setFirebaseUser(user);
  //   });

  //   return unsubscribe;
  // }, []);

  // if (firebaseUser === undefined) {
  //   return (
  //     <View>
  //       <ActivityIndicator />
  //     </View>
  //   );
  // }

  // if (firebaseUser) {
    return <Redirect href="/(tabs)/OpportunitiesPage" />;
  // }

  // return <Redirect href="/HomePage" />;
}