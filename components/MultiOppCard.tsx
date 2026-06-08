/*************
 * TODO:
 *  Severe:
 *    On error fallback for Opportunity Image
 *    Fix links / router push
 */

import { getProfilePictureSource } from '@/api';
import * as Theme from '@/constants/theme';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MultiOpp, Opportunity, Organization, User } from '../types';


interface MultiOppCardProps {
  multiopp: MultiOpp;
  currentUser: User | null;
  allOrgs: Organization[];
  opportunitiesData?: Opportunity[];
  onSignUp?: (opportunityId: number) => void;
  onUnSignUp?: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  onExternalSignup?: (opportunity: Opportunity) => void;
  onExternalUnsignup?: (opportunity: Opportunity) => void;
}

const pad = (value: number) => value.toString().padStart(2, '0');
const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const formatLocalTime = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
const normalizeTimeInput = (time?: string | null) => {
  if (!time) return undefined;
  if (time.length === 5) return `${time}:00`;
  return time;
};
const parseDateTime = (dateString?: string, timeString?: string) => {
  if (!dateString) return null;

  if (dateString.includes('T')) {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  if (timeString) {
    const parts = timeString.split(':').map(Number);
    hours = parts[0] ?? 0;
    minutes = parts[1] ?? 0;
    seconds = parts[2] ?? 0;
  }

  return new Date(year, month - 1, day, hours, minutes, seconds);
};

const Avatar = ({ user }: { user: User }) => {
	const [error, setError] = useState(false);
	return (
		<Image
			source={getProfilePictureSource(user.profile_image, user.photoURL)}
			onError={() => setError(true)}
			style={styles.avatar}
		/>
	);
};


const MultiOppCard: React.FC<MultiOppCardProps> = ({
  multiopp,
  currentUser,
  allOrgs,
  opportunitiesData,
  onSignUp,
  onUnSignUp,
  onExternalSignup,
  onExternalUnsignup,
}) => {
  // Combined memo for both map and display opportunities
  const { displayOpportunities, opportunityMap } = useMemo(() => {
    const map = new Map<number, Opportunity>();
    if (!Array.isArray(opportunitiesData)) return { displayOpportunities: [], opportunityMap: map };

    opportunitiesData.forEach((opp) => map.set(opp.id, opp));

    if (!Array.isArray(multiopp?.opportunities)) return { displayOpportunities: [], opportunityMap: map };

    const ids = multiopp.opportunities.map((o) => o.id);
    const fullOpps = opportunitiesData.filter((o) => ids.includes(o.id));
    const sorted = [...fullOpps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const now = new Date();
    const upcoming = sorted.filter((o) => new Date(o.date) > now);
    const displayList = upcoming.length > 0 ? upcoming : sorted.length > 0 ? [sorted[0]] : [];
    const displayOpportunities = displayList.slice(0, 2);

    return { displayOpportunities, opportunityMap: map };
  }, [multiopp, opportunitiesData]);

	const handleCardPress = () => {
		if (!currentUser) {
				router.push(`../sign-up`);
				return;
		}
		router.push(`/multiopp/${multiopp.id}`);
		};
	
	const [pressedStudentId, setPressedStudentId] = useState<number | null>(null);
	const handleProfilePress = (studentId: number) => {
    if (!currentUser) setPressedStudentId(null);

    if (pressedStudentId === studentId) {
      setPressedStudentId(null); // Hide if already showing
    } else {
      setPressedStudentId(studentId); // Show name
    }
  };

	const img = multiopp.image;
	const oppPicSource =
		typeof img === 'string' && img.startsWith('http')
			? { uri: img }
			: require('@/assets/images/backup.jpg');

  return (
    <Pressable
		onPress={handleCardPress}
		style={styles.card}
    >
			<Image 
				style={styles.oppPic}
				source={oppPicSource}
				alt={multiopp.name}
			/>
			<View style={styles.content}>
				<View style={styles.header}>
					<Text style={styles.headerText}>
						{multiopp.nonprofit || 'Community Organization'}
					</Text>
				</View>
				<Text style={styles.oppName}>{multiopp.name}</Text>
				{!!multiopp.address && (
					<Text style={styles.oppAddress}>📍 {multiopp.address}</Text>
				)}
				<View style={styles.upcomingOpps}>
					<Text style={styles.upcomingOppsHeader}>Upcoming Opportunities</Text>
					{displayOpportunities.length > 0 ? (
						<FlatList
							style={styles.oppsList}
							data={displayOpportunities}
							keyExtractor={(item) => item.id.toString()}
							renderItem={({item}) => {
								const fullOpp = opportunityMap?.get(item.id);
								const opp = { ...item, ...(fullOpp || {}) } as Opportunity & {
									max_volunteers?: number;
								};

								const normalizedTime = normalizeTimeInput(opp.time);
								const rawDateString = typeof opp.date === 'string' ? opp.date : '';
								const oppDate = parseDateTime(rawDateString, normalizedTime);

								const displayTime = (
									gmtDate: string,
									gmtTime?: string,
									durationMinutes?: number
								) => {
									if (!gmtDate) return { date: 'Date TBD', timeRange: '' };

									const [y, m, d] = gmtDate.split('-').map(Number);
									const [h = 0, min = 0, s = 0] = (gmtTime || '00:00:00').split(':').map(Number);

									// Create date directly - the time is already in Eastern from the API
									const start = new Date(y, m - 1, d, h, min, s);
									if (Number.isNaN(start.getTime())) return { date: 'Date TBD', timeRange: '' };

									const end = new Date(start.getTime() + (durationMinutes ?? 0) * 60 * 1000);

									const dateStr = start.toLocaleDateString('en-US', {
										weekday: 'short',
										month: 'short',
										day: 'numeric',
									});
									const timeFmt = { hour: 'numeric', minute: '2-digit', hour12: true } as const;
									const timeRange = `${start.toLocaleTimeString('en-US', timeFmt)} – ${end.toLocaleTimeString('en-US', timeFmt)}`;

									return { date: dateStr, timeRange };
								};
								const participants = Array.isArray(opp.involved_users) ? opp.involved_users : [];
								const isUserSignedUp = currentUser ? participants.some((u) => u.id === currentUser.id) : false;
								const totalSlots =
									typeof opp.total_slots === 'number'
										? opp.total_slots
										: typeof opp.max_volunteers === 'number'
											? opp.max_volunteers
											: undefined;
								const availableSlots =
									typeof totalSlots === 'number' ? Math.max(totalSlots - participants.length, 0) : Infinity;
								const slotsFull = typeof totalSlots === 'number' ? availableSlots <= 0 : false;
								const canSignUp = !isUserSignedUp && (typeof totalSlots !== 'number' || availableSlots > 0);
								const eventStarted = oppDate ? new Date() >= oppDate : false;
								
								const derivedDateString =
									oppDate || !rawDateString
										? oppDate
											? formatLocalDate(oppDate)
											: undefined
										: rawDateString.split('T')[0];
								const derivedTimeString =
									normalizedTime ?? (oppDate ? formatLocalTime(oppDate) : undefined);
								const redirectUrl = opp.redirect_url;

								const buttonDisabled = eventStarted || (!canSignUp && !isUserSignedUp);
								const buttonText = eventStarted
									? 'Event Already Started'
									: isUserSignedUp
										? 'Signed Up ✓'
										: canSignUp
											? redirectUrl
												? 'Sign Up Externally'
												: 'Sign Up'
											: 'No Slots Available';

								const handleButtonPress = () => {
									if (buttonDisabled) return;

									if (isUserSignedUp) {
										if (redirectUrl && onExternalUnsignup) {
											onExternalUnsignup(opp);
										} else {
											if (onUnSignUp) {
												onUnSignUp(opp.id, derivedDateString, derivedTimeString);
											}
										}
									} else {
										if (redirectUrl && onExternalSignup) {
											onExternalSignup(opp);
										} else {
											if (onSignUp) {
												onSignUp(opp.id);
											}
										}
									}
								};
								return (
									<View style={styles.oneOpp}>
										<View style={styles.left}>
											<Text style={styles.day}>{displayTime(opp.date, opp.time, opp.duration).date}</Text>
											<Text style={styles.time}>{displayTime(opp.date, opp.time, opp.duration).timeRange}</Text>
											<Text style={styles.slots}>
												{slotsFull
													? 'Slots full'
													: `${participants.length}/${totalSlots ?? '∞'} volunteers`}
											</Text>
										</View>
										<View style={styles.right}>
											<View style={styles.participants}>
												{participants.slice(0, 4).map((u, index) => (
													<View
														key={u.id}
														style={[
															styles.avatarContainer,
															index !== 0 && { marginLeft: -10 }, // overlap
															{ zIndex: participants.length - index }, // stack order
														]}
														>
														<Pressable key={u.id} onPress={() => handleProfilePress(u.id)}>
															<Avatar user={u} />
														</Pressable>
													</View>
												))}
												{participants.length > 4 && (
													<Text style={styles.moreText}>
														+{participants.length - 4}
													</Text>
												)}
											</View>
											<Pressable
												onPress={handleButtonPress}
												disabled={buttonDisabled}
												style={({ pressed }) => [
													styles.signUpBtn,
													isUserSignedUp && { backgroundColor: '#16a34a' },
													!isUserSignedUp && canSignUp && { backgroundColor: Theme.cornellRed },
													!isUserSignedUp && (!canSignUp || buttonDisabled) && { backgroundColor: '#9ca3af' },
													pressed && !buttonDisabled && { opacity: 0.85 },
												]}
											>
												<Text style={styles.signUpText}>
													{buttonText}
												</Text>
											</Pressable>
										</View>
									</View>
								)
							}}
						/>
					) : (
						<Text style={styles.noOpps}>No upcoming opportunities.</Text>
					)}
				</View>

				{Array.isArray(multiopp.visibility) && multiopp.visibility.length > 0 && (
					<View style={styles.visibleTo}>
						<Text style={styles.visibleToText}>Visible to:</Text>
						<View style={styles.tagContainer}>
							{multiopp.visibility.map((orgId) => {
								const org = allOrgs.find((o) => o.id === orgId);
								if (!org) return null;
								return (
									<View key={org.id} style={styles.tag}>
										<Text style={styles.tagText}>{org.name}</Text>
									</View>
								);
							})}
						</View>
					</View>
				)}
				<View>
					<Pressable
						onPress={handleCardPress}
						style={styles.viewMore}
					>
						<Text style={styles.viewMoreTxt}>View More Dates</Text>
					</Pressable>
				</View>
			</View>
    </Pressable>
  );
};

export default MultiOppCard;

const styles = StyleSheet.create({
	card: {
		backgroundColor: 'white',
		borderRadius: 16,
		overflow: 'hidden',
		flexDirection: 'column',
		boxShadow: '0 10px 15px -3px rgb(0, 0, 0, 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
		elevation: 5,
	},
	oppPic: {
		objectFit: 'cover',
		height: 192,
		width: '100%',
	},
	content: {
		padding: 24,
		flexDirection: 'column',
		flexGrow: 1,
	},
	header: {
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	headerText: {
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		fontWeight: '600',
		fontSize: 14,
		lineHeight: 20,
		overflow: 'hidden',
		textOverflow: '...',
		color: Theme.cornellRed
	},
	oppName: {
		color: '#111827',
		fontWeight: '700',
		fontSize: 20,
		lineHeight: 28,
		marginBottom: 8,
	},
	oppAddress: {
    color: '#4b5563',
    fontSize: 14,
    marginBottom: 16,
  },
	upcomingOpps: {
		marginBottom: 8,
	},
	upcomingOppsHeader: {
		color: '#1f2937',
		fontWeight: '600',
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 4,
	},
	oppsList: {
		rowGap: 8
	},
	oneOpp: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		backgroundColor: '#f9fafb',
		borderRadius: 8,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	left: {
		flexDirection: 'column',
		minWidth: 0,
	},
	day: {
		color: '#111827',
		fontWeight: '500',
		fontSize: 14,
		lineHeight: 20,
	},
	time: {
		color: '#111827',
		fontSize: 14,
		lineHeight: 20,
	},
	slots: {
		color: '#6b7280',
		fontSize: 12,
		lineHeight: 16,
		marginTop: 2
	},
	right: {
		gap: 8,
		alignItems: 'center',
		flexDirection: 'column',
		flexShrink: 0,
	},
	participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
	avatarContainer: {
		width: 24,
  	height: 24,
	},
	avatar: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderRadius: 9999,
		objectFit: 'cover',
		borderColor: 'white',
	},
	moreText: {
		fontSize: 14,
		lineHeight: 20,
		color: '#6b7280',
		alignSelf: 'center',
		marginLeft: 8,
	},
	signUpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  signUpBtnDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  signUpBtnPressed: {
    opacity: 0.85,
  },
	visibleTo: {
		marginTop: 'auto',
		marginBottom: 4
	},
	visibleToText: {
		color: '#1f2937',
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '600',
		marginBottom: 4,
	},
	tagContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
	},
	tag: {
		backgroundColor: '#f3f4f6',
		borderRadius: 999,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	tagText: {
		fontSize: 12,
		color: '#374151',
	},
	noOpps: {
		color: '#6b7280',
		fontSize: 14,
		lineHeight: 20,
		fontStyle: 'italic',
	},
	viewMore: {
		width: '100%',
		paddingVertical: 6,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#D1D5DB',
	},
	viewMoreTxt: {
		color: '#4B5563',
		fontSize: 12,
		fontWeight: '600',
	},
})