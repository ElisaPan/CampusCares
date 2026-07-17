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
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCurrentOpportunities, getMultiOpps, getOrgs, getUsers } from '@/api';
import { Header as MainHeader } from '@/components/HeaderComponent';
import MultiOppCard from '@/components/MultiOppCard';
import OpportunityCard from '@/components/OpportunityCard';
import * as Theme from '@/constants/theme';
import { useCloneOpportunity } from "@/context/CloneOpportunityContext";
import { mockMultiOpps, mockOpportunities, mockUsers } from '@/data/initialData';
import { useUserStore } from '@/hooks/useUserStore';
import { FeedItem, FeedOrderItem, MultiOpp, Opportunity, User } from '@/types';

function isOpportunity(opp: Opportunity | MultiOpp): opp is Opportunity {
  return 'allow_carpool' in opp;
}

function isMultiOpp(opp: Opportunity | MultiOpp): opp is MultiOpp {
  return !('allow_carpool' in opp);
}

interface OpportunitiesPageProps {
  // students: User[];
  // signups: SignUp[];
  handleSignUp?: (opportunityId: number) => void;
  handleUnSignUp?: (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ) => Promise<boolean>;
  // currentUserSignupsSet?: Set<number>;
  feedOrder: FeedOrderItem[];
  invisibleMultioppIds: number[];
  showCarpoolPopup?: number | null;
  setShowCarpoolPopup?: React.Dispatch<React.SetStateAction<number | null>>;
  showPopup?: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void;
}

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  // students,
  // signups,
  handleSignUp,
  handleUnSignUp,
  // currentUserSignupsSet,
  feedOrder,
  invisibleMultioppIds,
  showCarpoolPopup,
  setShowCarpoolPopup,
  showPopup,
}) => {
  const { students, setStudents, setSignups, allOpps, organizations: allOrgs, setOrganizations, currentUser, setAllOpps, setCurrentUser, updateCurrentUser, clearCurrentUser, signups } = useUserStore();
  const [oppsLoading, setOppsLoading] = useState(true);

  useEffect(() => {
    const start = Date.now();
    setOppsLoading(true);
    Promise.all([
      getOrgs(),
      getCurrentOpportunities(),
      getMultiOpps(),
      getUsers(),
    ])
      .then(([orgs, opps, multiopps, students]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingOpps = opps.filter((o) => new Date(o.date) >= today);
        const upcomingMultiopps = multiopps.filter((m) =>
          m.opportunities?.some((o) => new Date(o.date) >= today)
        );
        console.log('Fetch took', Date.now() - start, 'ms');
        console.log('opps count:', opps.length, 'multiopps count:', multiopps.length);
        setOrganizations(orgs);
        setAllOpps([...upcomingOpps, ...upcomingMultiopps]);
        setStudents(students);
      })
      .catch(console.error)
      .finally(() => setOppsLoading(false));
  }, []);
  
  const opportunities = allOpps.filter(isOpportunity);
  const multiopps = allOpps.filter(isMultiOpp);

  console.log('opps: ' + opportunities)
  console.log('multiopps: ' + multiopps)

  const USE_MOCKS = false;

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = rawId ? parseInt(rawId, 10) : null;

  const baseUser =
    parsedId !== null
      ? students?.find((s) => s.id === parsedId)
      : currentUser;
  
  const user = USE_MOCKS ? mockUsers[0] : baseUser;
  const userOpportunities = USE_MOCKS ? mockOpportunities : opportunities;
  const userMultiOpps = USE_MOCKS ? mockMultiOpps : multiopps;

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const currentUserSignupsSet = useMemo(() => {
    if (!currentUser) return new Set<number>();
    const userSignups = new Set<number>();
    signups.forEach((signup) => {
      if (signup.userId === currentUser.id) userSignups.add(signup.opportunityId);
    });
    opportunities.forEach((opp) => {
      const isRegistered = opp.involved_users?.some(
        (user) => user.id === currentUser.id && user.registered === true
      );
      if (isRegistered) userSignups.add(opp.id);
    });
    return userSignups;
  }, [currentUser, opportunities, signups]);

  const feedItems = useMemo((): FeedItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
        if (opp.localDate.getTime() < today.getTime()) return false;
        if (opp.multiopp) return false;
        if (!opp.visibility || opp.visibility.length === 0) return true;
        if (!user) return false;
        if (user.admin) return true;
        const userOrgIds = user.organizationIds || [];
        return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
      });

    // Filter visible multiopps (excluding invisible ones set by admin)
    const invisibleSet = new Set(invisibleMultioppIds);
    const visibleMultiOpps = (userMultiOpps ?? []).filter((m) => {
      if (invisibleSet.has(m.id)) return false;
      if (!m.visibility || m.visibility.length === 0) return true;
      if (!user) return false;
      if (user.admin) return true;
      const userOrgIds = user.organizationIds || [];
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
      // Fallback: chronological by first date
      const dateA = a.kind === 'opp'
        ? (a.data as typeof standaloneOpps[0]).fullDateTime.getTime()
        : new Date(a.data.date).getTime();
      const dateB = b.kind === 'opp'
        ? (b.data as typeof standaloneOpps[0]).fullDateTime.getTime()
        : new Date(b.data.date).getTime();
      return dateA - dateB;
    });
  }, [userOpportunities, userMultiOpps, user, feedOrder, invisibleMultioppIds]);
  
  const handleExternalSignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalSignupModal(true);
  };

  const handleExternalUnsignup = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setShowExternalUnsignupModal(true);
  };

  const handleExternalSignupConfirm = () => {
    if (selectedOpportunity) {
      if (!user) {
        router.push('../login');
        return;
      }
      window.open(selectedOpportunity.redirect_url!, '_blank');
      if (handleSignUp) {
        handleSignUp(selectedOpportunity.id);
      }
      setShowExternalSignupModal(false);
      setSelectedOpportunity(null);
    }
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

  if (!user) return <Text>User not found</Text>;

  const Header = ({ user }: { user: User }) => (
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
      <View style={styles.mainHeader}>
        <MainHeader />
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
        ListHeaderComponent={<Header user={user}/>}
        ListFooterComponent={<Footer oppsLoading={oppsLoading}/>}
        ListEmptyComponent={
          oppsLoading ? (
            <View style={styles.loadingView}>
              <ActivityIndicator size='large' color={Theme.cornellRed} />
            </View>
          ) : feedItems.length === 0 ? (
            <View style={styles.loadedView}>
              <Text style={styles.noOpps}>There are currently no opportunities.</Text>
              {user && 
                <Text style={styles.noOppsDesc}>Please click 'Create Opportunity' if you would like to propose an opportunity.</Text>
              }
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === 'multiopp') {
            return (
              <View style={{ marginBottom: 20 }}>
                <MultiOppCard
                  key={`multiopp-${item.data.id}`}
                  multiopp={item.data}
                  allOrgs={allOrgs}
                  opportunitiesData={userOpportunities}
                  onSignUp={handleSignUp}
                  onUnSignUp={handleUnSignUp}
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
              (user: User) => user.registered === true || opp.host_id === user.id
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
            !!user &&
            (opp.involved_users
              ? opp.involved_users.some(
                  (participant: User) =>
                    Number(participant.id) === Number(user.id) &&
                    (participant.registered || Number(opp.host_id) === Number(user.id))
                )
              : currentUserSignupsSet?.has(opp.id) ?? false);

          return (
            <View style={{ marginBottom: 20 }}>
              <OpportunityCard
                key={`opp-${opp.id}`}
                opportunity={opp}
                signedUpStudents={signedUpStudents}
                currentUser={user}
                onSignUp={handleSignUp}
                onUnSignUp={handleUnSignUp}
                isUserSignedUp={isUserSignedUp}
                allOrgs={allOrgs}
                onExternalSignup={handleExternalSignup}
                onExternalUnsignup={handleExternalUnsignup}
                showPopup={showPopup}
              />
            </View>
          );
        }}
        />

      {/* External Signup Modal */}
      {showExternalSignupModal && selectedOpportunity && (
        <View style={styles.signupModalBackdrop}>
          <View style={styles.signupModalBox}>
            <Text style={styles.signupModalHeader}>External Registration Required</Text>
            <Text style={{ marginBottom: 16, color: '#757575' }}>
              Please register externally on this link by clicking the button below.
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 24, color: '#757575' }}>
              After registering externally, you'll still be registered locally in our system.
            </Text>
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleExternalSignupConfirm}
                style={styles.externalSignupBtn}
              >
                <Text>Open Link & Register Locally</Text>
              </Pressable>
              <Pressable
                onPress={handleExternalSignupCancel}
                style={styles.externalCancelBtn}
              >
                <Text>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* External Unsignup Modal */}
      {showExternalUnsignupModal && selectedOpportunity && (
        <View style={styles.signupModalBackdrop}>
          <View style={styles.signupModalBox}>
            <Text style={styles.signupModalHeader}>External Application Notice</Text>
            <Text style={{ marginBottom: 16, color: '#757575' }}>
              This opportunity required an external application. Please notify the host non-profit
              that you no longer are able to participate in this opportunity.
            </Text>
            <Text style={{ fontSize: 14, marginBottom: 24, color: '#757575' }}>
              You will still be unregistered from our local system.
            </Text>
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={handleExternalUnsignupConfirm}
                style={styles.externalSignupBtn}
              >
                <Text>Unregister Locally</Text>
              </Pressable>
              <Pressable
                onPress={handleExternalSignupCancel}
                style={styles.externalCancelBtn}
              >
                <Text>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default OpportunitiesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainHeader: {
    paddingHorizontal: 16,
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,   
  },
  signupModalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    width: '100%',
  },
  signupModalHeader: {
    color: '#212121',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  externalSignupBtn: {
    flex: 1,
    backgroundColor: Theme.cornellRed,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  externalSignupBtnTexts: {
    color: 'white',
    fontWeight: '700',
  },
  externalCancelBtn: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  termsFooter: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
})