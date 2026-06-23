import { auth } from "@/firebase-config";
import { Redirect } from "expo-router";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | undefined>(
    undefined
  );

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
  }, []);

  if (firebaseUser === undefined) {
    return (
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  if (firebaseUser) {
    return <Redirect href="/(tabs)/OpportunitiesPage" />;
  }

  return <Redirect href="/HomePage" />;
}