/*************
 * TODO:
 *  Severe:
 *    -
 *  High:
 *    -
 *  Low
 *    -
 */
import { getProfilePictureSource, updateOrganization } from '@/api';
import * as Theme from '@/constants/theme';
import { useGroups } from '@/hooks/useGroups';
import { useUserStore } from '@/hooks/useUserStore';
import { isOpportunity } from '@/utils/isOpp';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';

const GroupDetailPage: React.FC = () => {
  const { students: allUsers, allOpps, organizations: allOrgs, currentUser, signups } = useUserStore();
  const { joinOrg, leaveOrg } = useGroups();

  const [reloadKey, setReloadKey] = useState(0);
  
  const { id } = useLocalSearchParams<{ id?: string; mode?: string }>();

  const org = allOrgs.find((g) => g.id === parseInt(id!));
  if (!org) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size='large' color={Theme.cornellRed} />
      </View>
    )
  }
  const isMember = currentUser?.organizationIds && currentUser?.organizationIds.includes(org.id);

  const opportunities = useMemo(() => allOpps.filter(isOpportunity), [allOpps]);

  const handleUnapproveOrganization = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        'Unapprove Organization',
        `Are you sure you want to unapprove the organization "${org.name}"? This will hide it from all users.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Unapprove', style: 'destructive', onPress: () => resolve(true) },
        ]
      );
    });

    if (!confirmed) return;

    try {
      await updateOrganization(org.id, { approved: false });
      Alert.alert('Organization has been unapproved successfully!');
      setReloadKey(prev => prev + 1);
    } catch (error: any) {
      Alert.alert(`Error unapproving organization: ${error.message}`);
    }
  };

  const [showFullDescription, setShowFullDescription] = useState(false);

  // Function to format description text with newlines and links
  const formatDescription = (text: string, maxLines?: number) => {
    const lines = text.split(/\r?\n/);
    const displayLines = maxLines ? lines.slice(0, maxLines) : lines;
    const hasMoreLines = maxLines && lines.length > maxLines;

    return (
      <>
        {displayLines.map((line, lineIndex) => {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts = line.split(urlRegex);
          return (
            <View key={lineIndex}>
              {parts.map((part, partIndex) => {
                if (urlRegex.test(part)) {
                  return (
                    <Pressable
                    key={partIndex}
                    onPress={() => Linking.openURL(part)}
                  >
                    <Text style={styles.link}>{part}</Text>
                  </Pressable>
                  );
                }
                return <Text key={partIndex}>{part}</Text>;
              })}
            </View>
          );
        })}
        {hasMoreLines && !showFullDescription && (
          <View>
            <LinearGradient
              colors={['transparent', '#fff']}
              style={styles.fadeGradient}
              pointerEvents="none"
            />
            <Pressable onPress={() => setShowFullDescription(true)}>
              <Text style={styles.seeMore}>See more...</Text>
            </Pressable>
          </View>
        )}
      </>
    );
  };

  const { members, memberCount, orgTotalPoints, orgRank, upcomingEvents } = useMemo(() => {
    // Use the same calculation method as leaderboard
    const memberIds = allUsers
      .filter((u) => u.organizationIds && u.organizationIds.includes(org.id))
      .map((u) => u.id);
    const currentMembers = allUsers.filter((u) => memberIds.includes(u.id));

    // const memberCount = org.member_count !== undefined ? org.member_count : currentMembers.length;
    const memberCount = memberIds.length

    // Use the same points calculation as leaderboard
    const totalPoints = memberIds.reduce((sum, memberId) => {
      const user = allUsers.find((u) => u.id === memberId);
      return sum + (user?.points || 0);
    }, 0);

    const categoryOrgs = allOrgs
      .filter((g) => g.type === org.type)
      .map((g) => {
        const orgMemberIds = allUsers
          .filter((u) => u.organizationIds && u.organizationIds.includes(g.id))
          .map((u) => u.id);
        const points = orgMemberIds.reduce((sum, memberId) => {
          const user = allUsers.find((u) => u.id === memberId);
          return sum + (user?.points || 0);
        }, 0);
        return { id: g.id, points };
      })
      .sort((a, b) => b.points - a.points);

    const rank = categoryOrgs.findIndex((g) => g.id === org.id) + 1;

    // Find upcoming events for the group
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const memberIdsSet = new Set(currentMembers.map((m) => m.id));
    const groupOppIds = new Set<number>();
    signups.forEach((s) => {
      if (memberIdsSet.has(s.userId)) {
        groupOppIds.add(s.opportunityId);
      }
    });

    const events = opportunities
      .filter(
        (opp) =>
          groupOppIds.has(opp.id) && new Date(`${opp.date}T00:00:00`).getTime() >= today.getTime()
      )
      .map((opp) => {
        const attendingMemberCount = signups.filter(
          (s) => s.opportunityId === opp.id && memberIdsSet.has(s.userId)
        ).length;
        return { ...opp, attendingMemberCount };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      members: currentMembers,
      memberCount,
      orgTotalPoints: totalPoints,
      orgRank: rank,
      upcomingEvents: events,
    };
  }, [org, allUsers, allOrgs, opportunities, signups]);

  if (!currentUser) {
    return (
      <View style={styles.loadingView}>
        <ActivityIndicator size='large' color={Theme.cornellRed} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View>
        <Pressable
          style={styles.backWrapper}
          onPress={() => router.back()}
        >
          <MaterialIcons name='chevron-left' size={18} color='#374151' />
          <Text style={styles.backTxt}>Back</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.orgName}>{org.name}</Text>
        <Text style={styles.orgType}>{org.type}</Text>
        
        {/* Organization Description */}
        {org.description && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.orgDesc}>
              {showFullDescription
                ? formatDescription(org.description)
                : formatDescription(org.description, 3)}
            </Text>
            {showFullDescription && (
              <Pressable
                onPress={() => setShowFullDescription(false)}
                style={styles.seeMoreDesc}
              >
                See less
              </Pressable>
            )}
          </View>
        )}

        {/* Organization Stats */}
        <View style={styles.statsList}>
          <View style={[styles.statCol, { marginLeft: -12 }]}>
            <View style={styles.statRow}>
              <Ionicons name="globe-outline" size={20} color={'#EAB308'} />
              <Text style={styles.statValue}>{orgTotalPoints.toLocaleString()}</Text>
            </View>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statCol}>
            <View style={styles.statRow}>
              <MaterialDesignIcons name="account-group-outline" size={20} color="#3B82F6" />
              <Text style={styles.statValue}>{memberCount}</Text>
            </View>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statCol}>
            <View style={styles.statRow}>
              <FontAwesome6 name="chart-simple" size={18} color="#22C55E" />
              <Text style={styles.statValue}>#{orgRank}</Text>
            </View>
            <Text style={styles.statLabel}>Rank in {org.type}</Text>
          </View>
        </View>

        {/* User Buttons */}
        <Pressable
          onPress={() => (isMember ? leaveOrg(org.id) : joinOrg(org.id))}
          style={[
            styles.memberBtn,
            { backgroundColor: isMember ? '#DC2626' : '#16A34A' }
          ]}
        >
          <Text style={styles.memberBtnTxt}>{isMember ? 'Leave Organization' : 'Join Organization'}</Text>
        </Pressable>

        {/* Admin Unapprove Button */}
        {currentUser.admin && org.approved !== false && (
          <Pressable
            onPress={handleUnapproveOrganization}
            style={styles.adminUnapprove}
          >
            <Text style={styles.unapproveTxt}>Unapprove Organization</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Members ({memberCount})</Text>
        {memberCount > 0 ? (
          <View style={styles.membersList}>
            {members.length > 0 ? (
              members
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((member) => (
                  <Pressable
                    key={member.id}
                    onPress={() => router.push(`/UserProfile?id=${member.id}`)}
                    style={styles.memberWrapper}
                  >
                    <Image
                      source={getProfilePictureSource(member.profile_image, member.photoURL)}
                      alt={member.name}
                      style={styles.memberImg}
                    />
                    <Text style={styles.memberName}>{member.name}</Text>
                  </Pressable>
                ))
            ) : (
              <Text style={styles.smallGray}>
                Member list not available, but {memberCount} member{memberCount !== 1 ? 's' : ''}{' '}
                exist{memberCount !== 1 ? '' : 's'}.
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.smallGray}>This organization has no members yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default GroupDetailPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
  },
  backWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
    gap: 4,
  },
  backTxt: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '400',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  orgName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  orgType: {
    color: '#9E9E9E',
    fontWeight: '500',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  orgDesc: {
    color: '#616161',
    fontSize: 24,
    lineHeight: 30,
    flexShrink: 1, 
  },
  seeMoreDesc: {
    color: Theme.cornellRed,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  statsList: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
    marginBottom: 12,
    gap: 9,
  },
  statCol: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    width: '33%',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 14,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  memberBtn: {
    width: '90%',
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    alignItems: 'center',
  },
  memberBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  adminUnapprove: {
    width: '90%',
    backgroundColor: '#EA580C',
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    alignItems: 'center',
  },
  unapproveTxt: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  membersList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  memberWrapper: {
    width: 155,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ededed',
    borderRadius: 999,
    gap: 10,
  },
  memberImg: {
    height: 32,
    width: 32,
    borderRadius: 999,
    objectFit: 'cover',
  },
  memberName: {
    color: '#424242',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  smallGray: {
    color: '#9E9E9E'
  },

  link: {
    color: '#C8102E',
    textDecorationLine: 'underline',
    flexShrink: 1,
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
  },
  seeMore: {
    color: '#C8102E',
    fontWeight: '500',
    fontSize: 14,
    marginTop: 8,
  },

})