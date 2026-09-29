import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import ProposalActionConfirmation from '../../components/community/ProposalActionConfirmation';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import { DangerButton, screenSpacing } from '../../components/community/CommunityUI';
import AdminProposalCard from '../../components/community/AdminProposalCard';
import ProposalSearchField from '../../components/community/ProposalSearchField';
import ManageCoopAdminScreen from './ManageCoopAdminScreen';
import HouseholdManagementScreen from './HouseholdManagementScreen';
import { archiveProposal, deleteDraft, listMyProposals, publishProposal } from '../../services/proposalService';
import { useAuthStore } from '../../store/authStore';
import { filterProposalsBySearch, getCommunityError } from '../../utils/community';

import { adminCategories as categories, historyFilters, getProposalManagementState, selectAdminProposals, proposalActionCopy } from '../../utils/proposalManagement';

export default function ManageProposalsScreen({ navigation }) {
  const [section, setSection] = useState('Proposals');
  const isAdmin = useAuthStore((state) => state.user?.isCoopAdmin === true);
  if (!isAdmin) return <ScreenContainer><EmptyState title="Co-op Management" description="Only Co-op Administrators can manage proposals." icon="lock-outline" /></ScreenContainer>;
  return <ScreenContainer edges={['left', 'right']}>
    <View accessibilityRole="tablist" style={styles.mainTabs}>
      {['Proposals', 'Administrator', 'Households'].map((label) => <Pressable key={label} accessibilityRole="tab" accessibilityLabel={`${label} section`} accessibilityState={{ selected: section === label }} onPress={() => setSection(label)} style={[styles.mainTab, section === label && (label === 'Households' ? styles.householdsSelected : label === 'Administrator' ? styles.administratorSelected : styles.proposalsSelected)]}>
        <Text style={[styles.tabLabel, section === label && styles.mainSelectedLabel, section === label && { color: label === 'Households' ? '#554A82' : label === 'Administrator' ? '#356FA3' : '#14633F' }]}>{label}</Text>
      </Pressable>)}
    </View>
    <View style={[styles.section, section !== 'Proposals' && styles.hidden]}><ProposalManagementSection navigation={navigation} /></View>
    {section === 'Administrator' ? <ManageCoopAdminScreen embedded /> : null}
    {section === 'Households' ? <HouseholdManagementScreen /> : null}
  </ScreenContainer>;
}

function ProposalManagementSection({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [proposals, setProposals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Drafts');
  const [historyFilter, setHistoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [isActioning, setIsActioning] = useState(false);

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try { setProposals(await listMyProposals()); }
    catch (requestError) { setError(getCommunityError(requestError, "We couldn't load your proposals. Please try again.")); }
    finally { setIsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadProposals(); }, [loadProposals]));

  const confirmAction = async () => {
    if (!proposalActionCopy[pendingAction?.type] || isActioning) return;
    setIsActioning(true);
    setError('');
    setSuccessMessage('');
    try {
      if (pendingAction.type === 'publish') await publishProposal(pendingAction.proposal.id);
      else if (pendingAction.type === 'archive') {
        const archived = await archiveProposal(pendingAction.proposal.id);
        setProposals((current) => current.map((item) => item.id === archived.id ? archived : item));
      }
      else await deleteDraft(pendingAction.proposal.id);
      setSuccessMessage(proposalActionCopy[pendingAction.type].success);
      setPendingAction(null);
      await loadProposals();
    } catch (requestError) {
      setError(getCommunityError(requestError, proposalActionCopy[pendingAction.type].failure));
      setPendingAction(null);
    } finally { setIsActioning(false); }
  };

  if (user?.isCoopAdmin !== true) return <ScreenContainer edges={['left', 'right']}><View style={styles.page}><EmptyState description="Only Co-op Administrators can manage proposals." icon="lock-outline" title="Proposal management" /></View></ScreenContainer>;

  const categoryProposals = selectAdminProposals(proposals, category, historyFilter);
  const filteredProposals = filterProposalsBySearch(categoryProposals, searchQuery);
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.introduction}>Manage your co-op’s proposals.</Text>
        <PrimaryButton icon="plus" onPress={() => navigation.navigate('CreateProposal')}>Create Proposal</PrimaryButton>
        <View style={styles.search}><ProposalSearchField onChangeText={setSearchQuery} value={searchQuery} /></View>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {categories.map((label) => <Pressable key={label} accessibilityRole="tab" accessibilityLabel={`Show ${label.toLowerCase()} proposals`} accessibilityState={{ selected: category === label }} onPress={() => { setCategory(label); if (label === 'History') setHistoryFilter('All'); }} style={[styles.tab, category === label && styles.selectedTab]}><Text style={[styles.tabLabel, category === label && styles.selectedLabel]}>{label}</Text></Pressable>)}
        </View>
        {category === 'History' ? <View style={styles.historyFilters}>{historyFilters.map((label) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`History filter: ${label}`} accessibilityState={{ selected: historyFilter === label }} onPress={() => setHistoryFilter(label)} style={[styles.historyFilter, historyFilter === label && styles.selectedChip]}><Text style={[styles.filterLabel, historyFilter === label && styles.selectedLabel]}>{label}</Text></Pressable>)}</View> : null}
        {isLoading ? <LoadingState label="Loading your proposals…" /> : null}
        {error ? <View style={styles.error}><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadProposals}>Try again</SecondaryButton></View> : null}
        {successMessage ? <Text accessibilityLiveRegion="polite" style={styles.success}>{successMessage}</Text> : null}
        {!isLoading && !error && proposals.length === 0 ? <View style={styles.empty}><EmptyState description="Create a proposal to begin collecting community decisions." icon="file-document-outline" title="No proposals yet" /></View> : null}
        {!isLoading && !error && proposals.length > 0 && filteredProposals.length === 0 && hasSearchQuery ? <View style={styles.empty}><EmptyState description="Try another title or keyword." icon="magnify-close" title="No proposals match your search." /></View> : null}
        {!isLoading && !error && proposals.length > 0 && filteredProposals.length === 0 && !hasSearchQuery ? <View style={styles.empty}><EmptyState title={category === 'History' ? 'No proposal history yet' : `No ${category.toLowerCase()} proposals`} description={category === 'History' ? 'Completed and archived proposals will appear here.' : 'Proposals in this category will appear here.'} icon="file-document-outline" /></View> : null}
        {!isLoading && !error ? <View style={styles.list}>{filteredProposals.map((proposal) => {
          const state = getProposalManagementState(proposal);
          return (
                  <AdminProposalCard key={proposal.id} proposal={proposal} onArchive={() => setPendingAction({ proposal, type: 'archive' })} onView={() => state.closed ? navigation.navigate('VotingResults', { proposalId: proposal.id, proposalTitle: proposal.title, votingDeadline: proposal.votingDeadline }) : navigation.navigate('ProposalDetails', { proposalId: proposal.id })}>
                  {state.draft ? (
                    <View style={styles.draftActions}>
                      <View style={styles.cardActions}>
                        <SecondaryButton onPress={() => navigation.navigate('EditProposal', { proposalId: proposal.id })}>Edit</SecondaryButton>
                        <PrimaryButton onPress={() => setPendingAction({ proposal, type: 'publish' })}>Publish</PrimaryButton>
                      </View>
                      <View style={styles.destructiveAction}><DangerButton icon="trash-can-outline" onPress={() => setPendingAction({ proposal, type: 'delete' })}>Delete Draft</DangerButton></View>
                    </View>
                  ) : null}
                  {state.published ? <View style={styles.cardActions}><DangerButton onPress={() => navigation.navigate('CancelProposal', { proposalId: proposal.id, proposalTitle: proposal.title })}>Cancel</DangerButton></View> : null}
                  </AdminProposalCard>
              ); })}</View> : null}
      </ScrollView>
      <ProposalActionConfirmation
        action={pendingAction?.type}
        isConfirming={isActioning}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  mainTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingTop: 20 },
  mainTab: { flexGrow: 1, flexShrink: 1, flexBasis: 90, minHeight: 48, borderBottomWidth: 2, borderColor: '#DDE5DF', borderRadius: 4, alignItems: 'center', justifyContent: 'center', padding: 10 },
  proposalsSelected: { backgroundColor: '#EAF5EC', borderColor: '#16764C', borderBottomWidth: 3 },
  administratorSelected: { backgroundColor: '#EAF2F8', borderColor: '#356FA3', borderBottomWidth: 3 },
  householdsSelected: { backgroundColor: '#F2EFF8', borderColor: '#6A5D9F', borderBottomWidth: 3 },
  mainSelectedLabel: { fontWeight: '600' },
  section: { flex: 1 }, hidden: { display: 'none' },
  page: { flexGrow: 1, ...screenSpacing },
  introduction: { color: '#627168', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  error: { marginTop: 20 },
  success: { color: '#14633F', fontSize: 14, fontWeight: '700', marginTop: 16 },
  empty: { marginTop: 24 },
  search: { marginTop: 16 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 18 },
  tab: { flexGrow: 1, flexBasis: 65, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 8, paddingVertical: 8 },
  tabLabel: { color: '#526158', fontSize: 13, fontWeight: '500' },
  selectedTab: { backgroundColor: '#EAF5EC', borderColor: '#BFD5C6' },
  selectedChip: { backgroundColor: '#EAF5EC', borderColor: '#16764C' },
  selectedLabel: { color: '#14633F', fontWeight: '600' },
  historyFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  historyFilter: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderColor: '#DDE5DF', borderRadius: 20 },
  filterLabel: { color: '#526158', fontSize: 12, fontWeight: '500' },
  list: { marginTop: 16 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  draftActions: { gap: 12 },
  destructiveAction: { borderTopWidth: 1, borderTopColor: '#EDF1EE', paddingTop: 12, alignItems: 'flex-start' },
});
