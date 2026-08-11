/*************
 * TODO:
 *  Severe:
 *    -
 *  High:
 *    Sign Up button function
 *    Click opportunity link function
 *  Low
 *    Redesign page title formatting
 */
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import CarpoolPopup from '@/components/carpool/CarpoolPopup';
import { Header as MainHeader } from '@/components/HeaderComponent';
import MultiOppCard from '@/components/MultiOppCard';
import OpportunityCard from '@/components/OpportunityCard';
import PublicHeader from '@/components/PublicHeaderComponent';
import * as Theme from '@/constants/theme';
import { useCloneOpportunity } from "@/context/CloneOpportunityContext";
import { mockMultiOpps, mockOpportunities } from '@/data/initialData';
import { useSignupHandlers } from '@/hooks/useSignupHandlers';
import { useUserStore } from '@/hooks/useUserStore';
import { FeedItem, FeedOrderItem, MultiOpp, Opportunity, User } from '@/types';
import { isMultiOpp, isOpportunity } from '@/utils/isOpp';

interface OpportunitiesPageProps {
  // students: User[];
  // signups: SignUp[];
  // handleSignUp?: (opportunityId: number) => void;
  // handleUnSignUp?: (
  //   opportunityId: number,
  //   opportunityDate?: string,
  //   opportunityTime?: string
  // ) => Promise<boolean>;
  // currentUserSignupsSet?: Set<number>;
  feedOrder: FeedOrderItem[];
  invisibleMultioppIds: number[];
  // showCarpoolPopup?: number | null;
  // setShowCarpoolPopup?: React.Dispatch<React.SetStateAction<number | null>>;
  // showPopup?: (
  //   title: string,
  //   message: string,
  //   type: 'success' | 'info' | 'warning' | 'error'
  // ) => void;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  // students,
  // signups,
  // handleSignUp,
  // handleUnSignUp,
  // currentUserSignupsSet,
  feedOrder,
  invisibleMultioppIds,
  // showCarpoolPopup,
  // setShowCarpoolPopup,
  // showPopup,
}) => {
  const { showCarpoolPopup, setShowCarpoolPopup, showPopup, currentUserSignupsSet, students, setStudents, setSignups, allOpps, organizations: allOrgs, setOrganizations, currentUser, setAllOpps, setCurrentUser, updateCurrentUser, clearCurrentUser, signups } = useUserStore();
  const { handleSignUp, handleUnSignUp } = useSignupHandlers();
  const [oppsLoading, setOppsLoading] = useState(true);
  
  const opportunities = useMemo(() => allOpps.filter(isOpportunity), [allOpps]);
  const multiopps = allOpps.filter(isMultiOpp);

  const USE_MOCKS = false;

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  const baseUser =
    parsedId !== null
      ? students?.find((s) => s.id === parsedId)
      : currentUser;
  
  const userOpportunities = USE_MOCKS ? mockOpportunities : opportunities;
  const userMultiOpps = USE_MOCKS ? mockMultiOpps : multiopps;

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useMemo(() => {
    if (!currentUser) return new Set<number>();
    signups.forEach((signup) => {
      if (signup.userId === currentUser.id) currentUserSignupsSet.add(signup.opportunityId);
    });
    opportunities.forEach((opp) => {
      const isRegistered = opp.involved_users?.some(
        (u) => u.id === currentUser.id && u.registered === true
      );
      if (isRegistered) currentUserSignupsSet.add(opp.id);
    });
    return currentUserSignupsSet;
  }, [currentUser, opportunities, signups]);

  const feedItems = useMemo((): FeedItem[] => {
    const now = new Date();

    // Filter standalone opps (approved, upcoming, visible, not part of a multiopp)
    const standaloneOpps = (userOpportunities ?? []).map((opp) => {
      const [year, month, day] = opp.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const [hours, minutes] = opp.time.split(':').map(Number);
      const fullDateTime = new Date(year, month - 1, day, hours, minutes);
      return { ...opp, localDate, fullDateTime };
    })
    .filter((opp) => {
      if (!opp.approved) return false;
      if (opp.fullDateTime.getTime() < now.getTime()) return false;
      // if (currentUser && opp.involved_users?.includes(currentUser)) return true;
      // if ((opp.total_slots - Number(opp.involved_users?.length)) === 0) return false;
      if (opp.multiopp) return false;
      if (!opp.visibility || opp.visibility.length === 0) return true;
      if (!currentUser) return false;
      if (currentUser.admin) return true;
      const userOrgIds = currentUser.organizationIds || [];
      return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
    });

    // Filter visible multiopps (excluding invisible ones set by admin)
    const invisibleSet = new Set(invisibleMultioppIds);
    const visibleMultiOpps = (userMultiOpps ?? []).filter((m) => {
      if (invisibleSet.has(m.id)) return false;
      if (!m.visibility || m.visibility.length === 0) return true;
      if (!currentUser) return false;
      if (currentUser.admin) return true;
      const userOrgIds = currentUser.organizationIds || [];
      return m.visibility.some((orgId) => userOrgIds.includes(orgId));
    });

    // Build position lookup from feedOrder — key: `${is_multiopp}-${id}`
    const positionMap = new Map<string, number>(
      (feedOrder ?? []).map((item, index) => [`${item.is_multiopp}-${item.id}`, index])
    );

    const oppItems: FeedItem[] = standaloneOpps.map((opp) => ({ kind: 'opp', data: opp }));
    const multiItems: FeedItem[] = visibleMultiOpps.map((m) => ({ kind: 'multiopp', data: m }));

    return [...oppItems, ...multiItems].sort((a, b) => {
      const keyA = `${a.kind === 'multiopp'}-${a.data.id}`;
      const keyB = `${b.kind === 'multiopp'}-${b.data.id}`;
      const posA = positionMap.get(keyA) ?? Infinity;
      const posB = positionMap.get(keyB) ?? Infinity;
      if (posA !== posB) return posA - posB;

      // Fallback: chronological by next upcoming date
      const getNextDate = (item: FeedItem): number => {
        if (item.kind === 'opp') {
          return (item.data as typeof standaloneOpps[0]).fullDateTime.getTime();
        }
        // For multiopps, find the next upcoming occurrence
        const multiOpp = item.data as MultiOpp;
        const upcoming = (multiOpp.opportunities ?? [])
          .map((o) => new Date(o.date).getTime())
          .filter((t) => t >= now.getTime())
          .sort((a, b) => a - b);
        return upcoming[0] ?? Infinity; // no upcoming dates → sort to end
      };

      return getNextDate(a) - getNextDate(b);
    });
  }, [userOpportunities, userMultiOpps, currentUser, feedOrder, invisibleMultioppIds]);
  
  const handleExternalSignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalSignupModal(true);
  };

  const handleExternalUnsignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalUnsignupModal(true);
  };

  const handleExternalSignupConfirm = async () => {
    if (!selectedOpportunity) return;
    if (!currentUser) {
      router.push(`/LoginPage`);
      return;
    }
    if (selectedOpportunity.redirect_url) {
      await Linking.openURL(selectedOpportunity.redirect_url);
    }
    await handleSignUp(selectedOpportunity.id);
    setShowExternalSignupModal(false);
    setSelectedOpportunity(null);
  };

  const handleExternalUnsignupConfirm = () => {
    if (selectedOpportunity) {
      if (handleUnSignUp) {
        handleUnSignUp(selectedOpportunity.id, selectedOpportunity.date, selectedOpportunity.time);
      }
      setShowExternalUnsignupModal(false);
      setSelectedOpportunity(null);
    }
  };

  const handleExternalSignupCancel = () => {
    setShowExternalSignupModal(false);
    setSelectedOpportunity(null);
  };

  const handleExternalUnsignupCancel = () => {
    setShowExternalUnsignupModal(false);
    setSelectedOpportunity(null);
  };

  const { setClonedOpportunityData } = useCloneOpportunity();
  const handleCreateNew = () => {
    setClonedOpportunityData(null);
    router.push(`/CreateOpportunityPage`);
  };

  const Header = ({ user }: { user: User | null | undefined }) => (
    <View style={styles.headerWrapper}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTxt}>Opportunities</Text>
        <Text style={styles.headerSubtxt}>Impact the Ithaca community</Text>
      </View>
      <View style={styles.headerRight}>
        {user && (
          <View style={{ marginLeft: 4 }}>
            <Pressable
              onPress={handleCreateNew}
              style={styles.createOppBtn}
            >
              <Text style={styles.createOppBtnTxt}>+  Create</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  const Footer = ({ oppsLoading }: { oppsLoading: boolean }) => (
    <>
      
      <Text style={styles.termsFooter}>
        Click here to see our{" "}
        <Text
          style={{ textDecorationLine: 'underline', color: '#374151' }}
          onPress={() => Linking.openURL("https://www.campuscares.us/terms_of_service.pdf")}
        >
          Terms of Service and Privacy Policy
        </Text>
        .
      </Text>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        { currentUser ? <MainHeader /> : <PublicHeader /> }
      </View>
      {/* Opportunities Grid */}
      <FlatList
        style={styles.oppsGrid}
        data={feedItems}
        numColumns={1}
        key={1}
        contentContainerStyle={{ padding: 16 }}
        keyExtractor={(item) =>
          item.kind === 'multiopp'
          ? `multiopp-${item.data.id}`
          : `opp-${item.data.id}`
        }
        ListHeaderComponent={<Header user={currentUser}/>}
        ListFooterComponent={<Footer oppsLoading={oppsLoading}/>}
        ListEmptyComponent={
          oppsLoading ? (
            <View style={styles.loadingView}>
              <ActivityIndicator size='large' color={Theme.cornellRed} />
            </View>
          ) : feedItems.length === 0 ? (
            <View style={styles.loadedView}>
              <Text style={styles.noOpps}>There are currently no opportunities.</Text>
              {currentUser && 
                <Text style={styles.noOppsDesc}>Please click 'Create Opportunity' if you would like to propose an opportunity.</Text>
              }
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === 'multiopp') {
            return (
              <View style={styles.card}>
                <MultiOppCard
                  key={`multiopp-${item.data.id}`}
                  multiopp={item.data}
                  opportunitiesData={userOpportunities}
                  onExternalSignup={handleExternalSignup}
                  onExternalUnsignup={handleExternalUnsignup}
                />
              </View>
            );
          }
          const opp = item.data;
          let signedUpStudents: User[] = [];
          if (opp.involved_users && opp.involved_users.length > 0) {
            signedUpStudents = opp.involved_users.filter(
              (u: User) => u.registered === true || opp.host_id === u.id
            );
          } else {
            const safeSignups = signups ?? [];
            const safeStudents = students ?? [];  
            const opportunitySignups = safeSignups.filter(
              (s) => s.opportunityId === opp.id
            );
            signedUpStudents = safeStudents.filter((student) =>
              opportunitySignups.some((s) => s.userId === student.id)
            );
          }
          const isUserSignedUp =
            !!currentUser &&
            (opp.involved_users
              ? opp.involved_users.some(
                  (participant: User) =>
                    Number(participant.id) === Number(currentUser.id) &&
                    (participant.registered || Number(opp.host_id) === Number(currentUser.id))
                )
              : currentUserSignupsSet?.has(opp.id) ?? false);

          return (
            <View style={styles.card}>
              <OpportunityCard
                key={`opp-${opp.id}`}
                opportunity={opp}
                signedUpStudents={signedUpStudents}
                isUserSignedUp={isUserSignedUp}
                onExternalSignup={handleExternalSignup}
                onExternalUnsignup={handleExternalUnsignup}
                showPopup={showPopup}
              />
            </View>
          );
        }}
        />
      
      {showCarpoolPopup !== null && (
        <CarpoolPopup
          opportunityId={showCarpoolPopup}
          setShowPopup={setShowCarpoolPopup}
        />
      )}

      {/* External Signup Modal */}
      <Modal
        visible={showExternalSignupModal && !!selectedOpportunity}
        transparent
        animationType="fade"
        onRequestClose={handleExternalSignupCancel}
      >
        <View style={styles.signupModalBackdrop}>
          <View style={styles.signupModalBox}>
            <Text style={styles.signupModalHeader}>External Registration Required</Text>
            <Text style={{ color: '#4B5563', marginBottom: 8 }}>
              Please register externally on this link by clicking the button below.
            </Text>
            <Text style={[styles.smallGray500, { marginBottom: 18 } ]}>
              After registering externally, you'll still be registered locally in our system.
            </Text>
            <View style={{ gap: 6 }}>
              <Pressable onPress={handleExternalSignupConfirm} style={styles.extSignupBtn}>
                <Text style={styles.extSignupBtnTxt}>Open Link & Register Locally</Text>
              </Pressable>
              <Pressable onPress={handleExternalSignupCancel} style={styles.extCancelBtn}>
                <Text style={styles.extCancelBtnTxt}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* External Unsignup Modal */}
      <Modal
        visible={showExternalUnsignupModal && !!selectedOpportunity}
        transparent
        animationType="fade"
        onRequestClose={handleExternalSignupCancel}
      >
        <View style={styles.signupModalBackdrop}>
          <View style={styles.signupModalBox}>
            <Text style={styles.signupModalHeader}>External Application Notice</Text>
            <Text style={{ color: '#4B5563', marginBottom: 8 }}>
              This opportunity required an external application. Please notify the host non-profit
              that you no longer are able to participate in this opportunity.
            </Text>
            <Text style={[styles.smallGray500, { marginBottom: 18 } ]}>
              You will still be unregistered from our local system.
            </Text>
            <View style={{ gap: 6 }}>
              <Pressable onPress={handleExternalUnsignupConfirm} style={styles.extSignupBtn}>
                <Text style={styles.extSignupBtnTxt}>Unregister Locally</Text>
              </Pressable>
              <Pressable onPress={handleExternalSignupCancel} style={styles.extCancelBtn}>
                <Text style={styles.extCancelBtnTxt}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default OpportunitiesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // paddingHorizontal: 16,
    backgroundColor: '#fff',
    zIndex: 1,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerWrapper: {
    marginVertical: 6,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    marginLeft: 10,
  },
  headerTxt: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subheader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  headerSubtxt: {
    color: '#4b5563',
    fontSize: 16,
  },
  headerRight: {
    marginRight: 10,
  },
  createOppBtn: {
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createOppBtnTxt: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  loadingView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 130,
    marginBottom: 280,
  },
  loadedView: {
    width: '100%',
    flexDirection: 'column',
    paddingVertical: 24,
    marginTop: 10,
    marginBottom: 380,
    backgroundColor: 'white',
    borderRadius: 16,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  oppsGrid: {
    width: '100%',
    flex: 1,
  },
  card: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  noOpps: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1f2937',
  },
  noOppsDesc: {
    fontSize: 14,
    marginTop: 12,
    marginHorizontal: 24,
    textAlign: 'center',
    color: '#999999',
  },
  signupModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signupModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  signupModalHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  extSignupBtn: {
    backgroundColor: Theme.cornellRed,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  extSignupBtnTxt: {
    color: 'white',
    fontWeight: '600',
  },
  extCancelBtn: {
    backgroundColor: '#9E9E9E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  extCancelBtnTxt: {
    color: 'white',
    fontWeight: '500',
  },
  smallGray500: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9E9E9E',
    marginBottom: 24
  },
  termsFooter: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
})