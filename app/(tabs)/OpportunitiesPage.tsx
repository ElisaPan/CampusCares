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

import MultiOppCard from '@/components/MultiOppCard';
import OpportunityCard from '@/components/OpportunityCard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import * as Theme from '@/constants/theme';
import { mockMultiOpps, mockOpportunities, mockUsers } from '@/data/initialData';
import { FeedItem, FeedOrderItem, MultiOpp, Opportunity, Organization, SignUp, User } from '@/types';

interface OpportunitiesPageProps {
  opportunities: Opportunity[];
  students: User[];
  signups: SignUp[];
  currentUser: User | null;
  handleSignUp?: (opportunityId: number) => void;
  handleUnSignUp?: (
    opportunityId: number,
    opportunityDate?: string,
    opportunityTime?: string
  ) => Promise<boolean>;
  allOrgs: Organization[];
  currentUserSignupsSet?: Set<number>;
  multiopps: MultiOpp[];
  feedOrder: FeedOrderItem[];
  invisibleMultioppIds: number[];
  showCarpoolPopup?: number | null;
  setShowCarpoolPopup?: React.Dispatch<React.SetStateAction<number | null>>;
  showPopup?: (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'error'
  ) => void;
  oppsLoading: boolean
}

const Header = ({ user }: { user: User }) => (
  <View style={styles.header}>
    <Text style={styles.headerText}>Upcoming Opportunities</Text>
    <View style={styles.subheader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerSubtext}>Find the perfect way to make an impact in the Ithaca community.</Text>
      </View>
      {user && (
        <View style={{ marginLeft: 4 }}>
          <Pressable
            onPress={() => router.push('../create-opportunity')}
            style={styles.createOppBtn}
          >
            <Text style={styles.createOppBtnText}>Create Opportunity</Text>
          </Pressable>
        </View>
      )}
    </View>
  </View>
);

const Footer = () => (
  <Text style={styles.termsFooter}>
    Click here to see our{" "}
    <Text
      style={{ textDecorationLine: 'underline', color: '#374151' }}
      onPress={() => Linking.openURL('/terms_of_service.pdf')} //FIXXXXXXX
    >
      Terms of Service and Privacy Policy
    </Text>
    .
  </Text>
);

const OpportunitiesPage: React.FC<OpportunitiesPageProps> = ({
  opportunities,
  students,
  signups,
  currentUser,
  handleSignUp,
  handleUnSignUp,
  allOrgs,
  currentUserSignupsSet,
  multiopps,
  feedOrder,
  invisibleMultioppIds,
  showCarpoolPopup,
  setShowCarpoolPopup,
  showPopup,
  oppsLoading
}) => {

  const USE_MOCKS = true;

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


  if (!user) return <Text>User not found</Text>;

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

  const [showExternalSignupModal, setShowExternalSignupModal] = useState(false);
  const [showExternalUnsignupModal, setShowExternalUnsignupModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

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
      // Open the external URL in a new tab
      window.open(selectedOpportunity.redirect_url!, '_blank');

      if (handleSignUp) {
        // Still register the user locally
        handleSignUp(selectedOpportunity.id);
        // if (selectedOpportunity.allow_carpool) {
        //   setShowCarpoolPopup(true)
        // }
      }
      // Close the modal
      setShowExternalSignupModal(false);
      setSelectedOpportunity(null);
    }
  };

  const handleExternalUnsignupConfirm = () => {
    if (selectedOpportunity) {
      // Proceed with local unregistration
      if (handleUnSignUp) {
        handleUnSignUp(selectedOpportunity.id, selectedOpportunity.date, selectedOpportunity.time);
      }

      // Close the modal
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

  // console.log('user:', user);

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerText}>Upcoming Opportunities</Text>
        <View style={styles.subheader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtext}>Find the perfect way to make an impact in the Ithaca community.</Text>
          </View>
          {user && (
            <View style={{ marginLeft: 4 }}>
              <Pressable
                onPress={() => router.push('../create-opportunity')}
                style={styles.createOppBtn}
              >
                <Text style={styles.createOppBtnText}>Create Opportunity</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View> */}

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
        ListFooterComponent={<Footer />}
        renderItem={({ item }) => {
          if (item.kind === 'multiopp') {
            return (
              <View style={{ marginBottom: 32 }}>
                <MultiOppCard
                  key={`multiopp-${item.data.id}`}
                  multiopp={item.data}
                  currentUser={user}
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
            <View style={{ marginBottom: 32 }}>
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

      {oppsLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : feedItems.length === 0 ? (
        <View style={styles.loadedView}>
          <Text style={styles.noOpps}>There are currently no opportunities.</Text>
          {user && 
            <Text style={styles.noOppsDesc}>Please click 'Create Opportunity' if you would like to propose an opportunity.</Text>
          }
        </View>
      ) : null}

      {/* External Signup Modal */}
      {showExternalSignupModal && selectedOpportunity && (
        <View style={styles.signupModalContainer}>
          <View style={styles.signupModalBox}>
            <Text style={styles.signupModalHeader}>External Registration Required</Text>
            <Text style={{ marginBottom: 16, color: '#757575' }}>
              Please register externally on this link by clicking the button below.
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, marginBottom: 24, color: '#757575' }}>
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
        <View style={styles.signupModalContainer}>
          <View style={styles.signupModalBox}>
            <Text style={styles.signupModalHeader}>External Application Notice</Text>
            <Text style={{ marginBottom: 16, color: '#757575' }}>
              This opportunity required an external application. Please notify the host non-profit
              that you no longer are able to participate in this opportunity.
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, marginBottom: 24, color: '#757575' }}>
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

      {/* Terms */}
      {/* <Text style={styles.termsFooter}>
        Click here to see our{" "}
        <Text
          style={{ textDecorationLine: 'underline', color: '#374151' }}
          onPress={() => Linking.openURL('/terms_of_service.pdf')} //FIXXXXXXX
        >
          Terms of Service and Privacy Policy
        </Text>
        .
      </Text> */}
    </View>
  );
};

export default OpportunitiesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 24,
  },
  header: {
    // marginBottom: 24,
    paddingBottom: 24,
  },
  headerText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  subheader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
  },
  headerSubtext: {
    color: '#4b5563',
    fontSize: 16,
  },
  createOppBtn: {
    backgroundColor: Theme.cornellRed,
    width: 120,
    paddingHorizontal: 2,
    paddingVertical: 14,
    marginLeft: 0,
    borderRadius: 8,
    alignItems: 'center',
  },
  createOppBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  loadingText: {
    padding: 32,
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '600',
  },
  loadedView: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'column',
    textAlign: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: '0 10px 15px -3px rgb(0, 0, 0, 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  oppsGrid: {
    width: '100%',
    flex: 1,
  },
  noOpps: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#1f2937',
  },
  noOppsDesc: {
    marginTop: 12,
    color: '#9E9E9E',
    lineHeight: 20
  },
  signupModalContainer: {
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
    lineHeight: 28,
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
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 24,
  },
})