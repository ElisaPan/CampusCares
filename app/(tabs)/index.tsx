import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Redirect } from "expo-router";

import { auth } from '@/firebase-config';
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";


export default function Index() {
  const [firebaseUser, setFirebaseUser] =
    useState<FirebaseUser | null | undefined>(undefined);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    return unsubscribe;
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