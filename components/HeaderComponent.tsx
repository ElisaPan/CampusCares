import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';

import UserContext from '@/components/user-context';
import * as Theme from '@/constants/theme';
import { mockUsers } from '@/data/initialData';
import { useUserStore } from '@/hooks/useUserStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext } from 'react';

export const Header = () => {
	const { currentUser, setCurrentUser } = useUserStore();

	const USE_MOCKS = false;

	const { students } = useContext(UserContext);
	const { id } = useLocalSearchParams<{ id?: string }>();
	const parsedId = id ? Number(id) : null;

	const baseUser =
	parsedId !== null
			? students.find((s) => s.id === parsedId) || currentUser
			: currentUser;
	const profileUser = USE_MOCKS ? mockUsers[0] : baseUser;
	if (!profileUser) {
		return (
			<View style={styles.loadingView}>
				<ActivityIndicator size='large' color={Theme.cornellRed} />
			</View>
		)
	};
	
  return (
    <View style={styles.container}>
			<View>
				<Pressable
					onPress={() => router.push(`/(tabs)/OpportunitiesPage`)}
				>
					<Image
						style={styles.logo}
						source={require('@/assets/images/logo.png')}
						alt="CampusCaresLogo"
					/>
				</Pressable>
			</View>
			<View>
				<Pressable
					onPress={() => router.push(`/NotificationsPage`)}
					style={styles.notifBtn}
				>
					<Ionicons
						name="notifications-outline"
						size={26}
						color={'#4B5563'}
					/>
				</Pressable>
			</View>
		</View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
		backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
		paddingTop: 8,
    paddingBottom: 4,
  },
	loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    marginTop: 40,
    marginLeft: 5,
  },
  notifBtn: {
    marginTop: 57,
    marginRight: 20,
  },
});