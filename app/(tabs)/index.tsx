import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Redirect } from "expo-router";

import { getCurrentOpportunities, getMultiOpps, getOrgs, getUserByEmail, getUsers } from "@/api";
import { auth } from '@/firebase-config';
import { useUserStore } from "@/hooks/useUserStore";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";


export default function Index() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);

  // Call the hook ONCE at the top level of the component
  const { setCurrentUser, setOrganizations, setStudents, setAllOpps } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const token = await user.getIdToken();
          const existingUser = await getUserByEmail(user.email!, token);
          if (existingUser) {
            setCurrentUser(existingUser); // just use the closure variable — no hook call here

            const [orgs, opps, multiopps, students] = await Promise.all([
              getOrgs(),
              getCurrentOpportunities(),
              getMultiOpps(),
              getUsers(),
            ]);
            setOrganizations(orgs);
            setStudents(students);
            setAllOpps([...opps, ...multiopps]);
          }
        } catch (e) {
          console.error('Failed to restore user session:', e);
        }
      }
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