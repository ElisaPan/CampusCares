import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getProfilePictureSource } from '@/api';
import UserContext from '@/components/user-context';
import { mockUsers } from '@/data/initialData';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext } from 'react';

export const Header = () => {
    const { students, currentUser } = useContext(UserContext);
    const USE_MOCKS = true;
    const { id } = useLocalSearchParams<{ id?: string }>();
    const parsedId = id ? Number(id) : null;

    const baseUser =
    parsedId !== null
        ? students.find((s) => s.id === parsedId) || currentUser
        : currentUser;
    const profileUser = USE_MOCKS ? mockUsers[0] : baseUser;
    if (!profileUser) return <Text>User not found</Text>;
    
  return (
    <View style={styles.container}>
        <View>
            <Pressable
                onPress={() => router.push('/(tabs)/EventsPage')}
            >
                <Image
                    style={styles.logo}
                    source={require('@/assets/images/logo.png')}
                    alt="CampusCaresLogo"
                />
            </Pressable>
        </View>
        <View style={styles.right}>
            <View>
                <Pressable
                    onPress={() => router.push('/NotificationsPage')}
                    style={styles.notifBtn}
                >
                    <Ionicons
                        name="notifications-outline"
                        size={28}
                        color={'#4B5563'}
                        />
                </Pressable>
            </View>
            <View>
                <Pressable
                    onPress={() => router.push('/(tabs)/ProfilePage')}
                    style={styles.profile}
                >
                    <Image 
                        style={styles.profilePic}
                        source={getProfilePictureSource(profileUser.profile_image, profileUser.photoURL)}
                        alt={profileUser.name}
                        resizeMode="cover"
                    />
                </Pressable>
            </View>
        </View>
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    width: 75,
    height: 75,
    borderRadius: 9999,
    marginTop: 40,
    marginLeft: 5,
  },
  right: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  notifBtn: {
    marginTop: 65,
    marginRight: 25,
  },
  profile: {
    marginTop: 55,
    marginRight: 10
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 9999,
  }
});