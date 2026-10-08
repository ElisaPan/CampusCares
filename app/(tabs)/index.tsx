import { useEffect, useState } from "react";

import { Redirect } from "expo-router";

import { getCurrentOpportunities, getMultiOpps, getOrgs, getUserByEmail, getUsersMinimal } from "@/api";
import { auth } from '@/firebase-config';
import { useUserStore } from "@/hooks/useUserStore";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";

import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | undefined>(undefined);
  const { setCurrentUser, setOrganizations, setStudents, setAllOpps } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        await SplashScreen.hideAsync();
        return;
      }
      // setFirebaseUser(user);

      // if (user) {
        try {
          const token = await user.getIdToken();
          // const existingUser = await getUserByEmail(user.email!, token);
          // if (existingUser) {
          //   setCurrentUser(existingUser);

          const [existingUser, opps, multiopps] = await Promise.all([
            getUserByEmail(user.email!, token),
            // getOrgs(),
            getCurrentOpportunities(),
            getMultiOpps(),
            // getUsers(),
          ]);
          if (existingUser) {
            setCurrentUser(existingUser);
          }
          // setOrganizations(orgs);
          // setStudents(students);
          setAllOpps([...opps, ...multiopps]);
          getOrgs().then(setOrganizations).catch((e) => console.error(e));
          getUsersMinimal().then(setStudents).catch((e) => console.error(e));
          // }
          setFirebaseUser(user)
        } catch (e) {
          console.error('Failed to restore user session:', e);
          setFirebaseUser(user);
         } finally {
          await SplashScreen.hideAsync();
        }
      // }
    });
    return unsubscribe;
  }, []);

  if (firebaseUser === undefined) {
    return null;
  }

  if (firebaseUser) {
    return <Redirect href="/(tabs)/OpportunitiesPage" />;
  }

  return <Redirect href="/HomePage" />;
}