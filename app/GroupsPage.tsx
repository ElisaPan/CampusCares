/*************
 * TODO:
 *  Severe:
 *    press join and all orgs show joined, orgs show up in profile, on logout/in disappears
 *  High:
 *    -
 *  Low
 *    -
 */
import * as Theme from '@/constants/theme';
import { useGroups } from '@/hooks/useGroups';
import { useUserStore } from '@/hooks/useUserStore';
import { OrganizationType, organizationTypes } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const GroupsPage = () => {
  const { organizations: allOrgs, currentUser, setCurrentUser, setStudents, students } = useUserStore();
  const { joinOrg, leaveOrg, refreshOrganizations, createOrg } = useGroups();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgType, setNewOrgType] = useState<OrganizationType | ''>('');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [newOrgDescription, setNewOrgDescription] = useState('');

  // Filter organizations based on search term
  const filteredOrgs = useMemo(() => {
    if (!searchTerm.trim()) return allOrgs;
    return allOrgs.filter((org) => org.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allOrgs, searchTerm]);

  // Check if search term matches any existing organization exactly
  const exactMatch = useMemo(() => {
    return allOrgs.find((org) => org.name.toLowerCase() === searchTerm.toLowerCase());
  }, [allOrgs, searchTerm]);

  const handleCreateFromSearch = () => {
    console.log("creating...")
    if (searchTerm.trim() && newOrgType) {
      createOrg(searchTerm.trim(), newOrgType, newOrgDescription.trim() || undefined);
      setSearchTerm('');
      setNewOrgType('');
      setNewOrgDescription('');
      setShowCreateForm(false);
    }
  };

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
        {/* Header */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.headerTitle}>
            Manage Organizations
          </Text>
          <Text style={styles.headerSubtitle}>
            Find and join organizations, or create new ones to expand your impact.
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.searchTitle}>
            Search for organizations
          </Text>
          <View style={{ position: 'relative' }}>
            <View style={styles.searchContainer}>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Type your organization name..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
              />
              <View style={styles.searchIcon}>
                <Ionicons name="search" size={28} color={'#9CA3AF'} />
              </View>
            </View>
          </View>
        </View>

        {/* Search Results */}
        {searchTerm.trim() && (
          <View style={styles.sectionWrapper}>
            {filteredOrgs.length > 0 ? (
              <View style={styles.resultsCard}>
                <Text style={styles.resultsHeader}>Found organizations:</Text>
                <View style={styles.resultsList}>
                  {filteredOrgs.map((org) => {
                    const isMember = currentUser.organizationIds?.includes(org.id);
                    return (
                      <Pressable
                        key={org.id}
                        style={styles.orgCard}
                        onPress={() => router.push(`/GroupDetailPage?id=${org.id}`)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orgName}>
                            {org.name}
                          </Text>
                          <Text style={styles.orgType}>{org.type}</Text>
                        </View>
                        {isMember ? (
                          <View style={styles.memberBtns}>
                            <Text style={styles.joined}>Joined ✓</Text>
                            <Pressable
                              onPress={() => leaveOrg(org.id)}
                              style={styles.leaveWrapper}
                            >
                              <Text style={styles.leaveTxt}>Leave</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => joinOrg(org.id)}
                            style={styles.joinBtn}
                          >
                            <Text style={styles.joinTxt}>Join</Text>
                          </Pressable>
                        )}
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.resultsCard}>
                <Text style={styles.none}>No organizations found matching "{searchTerm}"</Text>
                {!exactMatch && (
                  <Pressable
                    onPress={() => setShowCreateForm(true)}
                    style={styles.createBtn}
                  >
                    <Text style={styles.createBtnTxt}>Create new organization: "{searchTerm}"</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* All Organizations */}
        <View style={styles.allOrgs}>
          <Text style={styles.allOrgsHeader}>Browse all organizations</Text>
          <ScrollView style={styles.allOrgsWrapper}>
            <View style={{ gap: 8 }}>
              {allOrgs
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((org) => {
                  const isMember = currentUser.organizationIds?.includes(org.id);
                  return (
                    <Pressable
                      key={org.id}
                      style={styles.orgCard}
                      onPress={() => router.push(`/GroupDetailPage?id=${org.id}`)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orgName}>
                          {org.name}
                        </Text>
                        <Text style={styles.orgType}>{org.type}</Text>
                      </View>
                      {isMember ? (
                        <View style={styles.memberBtns}>
                          <Text style={styles.joined}>Joined ✓</Text>
                          <Pressable
                            onPress={() => leaveOrg(org.id)}
                            style={styles.leaveWrapper}
                          >
                            <Text style={styles.leaveTxt}>Leave</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => joinOrg(org.id)}
                          style={styles.joinBtn}
                        >
                          <Text style={styles.joinTxt}>Join</Text>
                        </Pressable>
                      )}
                    </Pressable>
                  );
                })}
            </View>
          </ScrollView>
        </View>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <Text style={Theme.themes.termsFooter}>
          Click here to see our{" "}
          <Text
            style={{ textDecorationLine: 'underline', color: '#374151' }}
            onPress={() => Linking.openURL("https://www.campuscares.us/terms_of_service.pdf")}
          >
            Terms of Service and Privacy Policy
          </Text>
          .
        </Text>
      </View>
      <Modal
        visible={showCreateForm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowCreateForm(false);
          setNewOrgType('');
          setNewOrgDescription('');
        }}
      >
        {/* Create Organization Form */}
        <Pressable
          style={styles.modalBackdrop}
          onPress={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateForm(false);
              setNewOrgType('');
              setNewOrgDescription('');
            }
          }}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalHeader}>Create "{searchTerm}"</Text>
            <View style={styles.formSection}>
              <Text style={styles.formSectionHeader}>
                Organization Type *
              </Text>
              <Pressable
                onPress={() => setShowTypePicker(true)}
                style={styles.pickerBtn}
              >
                <Text style={[styles.pickerBtnTxt, !newOrgType && { color: '#9CA3AF' }]}>
                  {newOrgType || 'Select a type...'}
                </Text>
                <MaterialDesignIcons name='chevron-down' size={12} color='#6B7280' />
              </Pressable>
              <Modal
                visible={showTypePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTypePicker(false)}
              >
                <Pressable
                  style={styles.pickerBackdrop}
                  onPress={() => setShowTypePicker(false)}
                >
                  <Pressable style={styles.pickerSheet} onPress={() => {}}>
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerHeaderTxt}>Select a type</Text>
                      <Pressable onPress={() => setShowTypePicker(false)}>
                        <Text style={{ fontSize: 20, color: '#6B7280' }}>✕</Text>
                      </Pressable>
                    </View>
                    <FlatList
                      data={organizationTypes}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <Pressable
                          style={[
                            styles.pickerOption,
                            newOrgType === item && styles.pickerOptionSelected,
                          ]}
                          onPress={() => {
                            setNewOrgType(item as OrganizationType);
                            setShowTypePicker(false);
                          }}
                        >
                          <Text style={styles.pickerOptionTxt}>{item}</Text>
                          {newOrgType === item && <Text style={{ color: '#2563EB' }}>✓</Text>}
                        </Pressable>
                      )}
                    />
                  </Pressable>
                </Pressable>
              </Modal>
            </View>
            <View style={styles.formSection}>
              <Text style={styles.formSectionHeader}>Description (optional)</Text>
              <TextInput
                value={newOrgDescription}
                onChangeText={setNewOrgDescription}
                placeholder="Brief description of your organization..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={styles.descInput}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalBtns}>
              <Pressable
                disabled={!newOrgType}
                onPress={() => handleCreateFromSearch()}
                style={styles.createOrgBtn}
              >
                <Text style={styles.createOrgBtnTxt}>Create Organization</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowCreateForm(false);
                  setNewOrgType('');
                  setNewOrgDescription('');
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

export default GroupsPage;

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
    padding: 24,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1,
  },
  sectionWrapper: {
    marginBottom: 14,
  },
  headerTitle: {
    color: '#212121',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#757575',
    fontSize: 14,
    textAlign: 'center',
  },
  searchTitle: {
    color: '#212121',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -4,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    fontSize: 16,
  },
  resultsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginLeft: -12,
    marginRight: -12,
  },
  resultsHeader: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultsList: {
    rowGap: 8,
    overflowY: 'auto',
  },
  orgCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 12,
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orgName: {
    color: '#424242',
    fontSize: 14,
    fontWeight: '500',
    flexWrap: 'wrap'
  },
  orgType: {
    color: '#9E9E9E',
    fontSize: 12,
  },
  memberBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  joined: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  leaveWrapper: {
    paddingLeft: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leaveTxt: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  joinBtn: {
    backgroundColor: Theme.cornellRed,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 100,
    flexShrink: 0,
  },
  joinTxt: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  none: {
    color: '#757575',
    marginBottom: 8,
  },
  createBtn: {
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnTxt: {
    color: 'white',
    fontWeight: '600',
  },
  allOrgs: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginLeft: -12,
    marginRight: -12,
  },
  allOrgsHeader: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  allOrgsWrapper: {
    flexDirection: 'column',
    rowGap: 8,
    maxHeight: 440,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalHeader: {
    color: '#212121',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  formSection: {
    marginBottom: 12,
  },
  formSectionHeader: {
    color: '#616161',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: 36,
    backgroundColor: '#fff',
  },
  pickerBtnTxt: {
    fontSize: 12,
    color: '#111827',
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  pickerHeaderTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionTxt: {
    fontSize: 14,
    color: '#111827',
  },
  descInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    minHeight: 80,
    backgroundColor: '#fff',
  },
  modalBtns: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 8,
  },
  createOrgBtn: {
    backgroundColor: Theme.cornellRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  createOrgBtnTxt: {
    color: 'white',
    fontWeight: '500',
  },
  cancelBtn: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  cancelBtnTxt: {
    color: '#616161',
    fontWeight: '500',
  },
})