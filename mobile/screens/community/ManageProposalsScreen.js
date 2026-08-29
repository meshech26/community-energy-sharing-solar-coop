import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ConfirmationDialog from '../../components/ConfirmationDialog';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import ProposalCard from '../../components/community/ProposalCard';
import { deleteDraft, listMyProposals, publishProposal } from '../../services/proposalService';
import { useAuthStore } from '../../store/authStore';
import { getCommunityError, getProposalStatusLabel, proposalAccents } from '../../utils/community';

const statusOrder = ['draft', 'upcoming', 'active', 'closed', 'cancelled'];

export default function ManageProposalsScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [proposals, setProposals] = useState([]);
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
    if (!pendingAction) return;
    setIsActioning(true);
    setError('');
    setSuccessMessage('');
    try {
      if (pendingAction.type === 'publish') await publishProposal(pendingAction.proposal.id);
      else await deleteDraft(pendingAction.proposal.id);
      setSuccessMessage(pendingAction.type === 'publish' ? 'Proposal published successfully.' : 'Draft deleted successfully.');
      setPendingAction(null);
      await loadProposals();
    } catch (requestError) {
      setError(getCommunityError(requestError, pendingAction.type === 'publish' ? 'We could not publish this proposal. Please try again.' : 'We could not delete this draft. Please try again.'));
      setPendingAction(null);
    } finally { setIsActioning(false); }
  };

  if (user?.isCoopAdmin !== true) return <ScreenContainer edges={['left', 'right']}><View style={styles.page}><EmptyState description="Only Co-op Administrators can manage proposals." icon="lock-outline" title="Proposal management" /></View></ScreenContainer>;

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.page}>
        <SectionHeader description="Create, publish, and manage your co-op proposals." eyebrow="Co-op Admin" title="Manage proposals" />
        <PrimaryButton onPress={() => navigation.navigate('CreateProposal')}>Create Proposal</PrimaryButton>
        {isLoading ? <LoadingState label="Loading your proposals…" /> : null}
        {error ? <View style={styles.error}><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadProposals}>Try again</SecondaryButton></View> : null}
        {successMessage ? <Text accessibilityLiveRegion="polite" style={styles.success}>{successMessage}</Text> : null}
        {!isLoading && !error && proposals.length === 0 ? <View style={styles.empty}><EmptyState description="Create a proposal to begin collecting community decisions." icon="file-document-outline" title="No proposals yet" /></View> : null}
        {!isLoading && !error ? statusOrder.map((status) => {
          const group = proposals.filter((proposal) => proposal.status === status);
          if (!group.length) return null;
          return (
            <View key={status} style={styles.group}>
              <View style={styles.groupHeading}>
                <View style={[styles.groupMarker, { backgroundColor: proposalAccents[status] }]} />
                <Text style={[styles.groupTitle, { color: proposalAccents[status] }]}>{getProposalStatusLabel(status)}</Text>
              </View>
              {group.map((proposal) => (
                <View key={proposal.id}>
                  <ProposalCard onPress={() => navigation.navigate('ProposalDetails', { proposalId: proposal.id })} proposal={proposal} />
                  {proposal.status === 'draft' ? (
                    <View style={styles.draftActions}>
                      <View style={styles.cardActions}>
                        <SecondaryButton onPress={() => navigation.navigate('EditProposal', { proposalId: proposal.id })}>Edit</SecondaryButton>
                        <PrimaryButton onPress={() => setPendingAction({ proposal, type: 'publish' })}>Publish</PrimaryButton>
                      </View>
                      <PrimaryButton icon="trash-can-outline" onPress={() => setPendingAction({ proposal, type: 'delete' })} tone="danger">Delete Draft</PrimaryButton>
                    </View>
                  ) : null}
                  {['upcoming', 'active', 'closed'].includes(proposal.status) ? <View style={styles.cardActions}><SecondaryButton onPress={() => navigation.navigate('CancelProposal', { proposalId: proposal.id, proposalTitle: proposal.title })}>Cancel</SecondaryButton></View> : null}
                </View>
              ))}
            </View>
          );
        }) : null}
      </ScrollView>
      <ConfirmationDialog
        cancelLabel={pendingAction?.type === 'delete' ? 'Keep Draft' : 'Keep Editing'}
        confirmLabel={pendingAction?.type === 'delete' ? 'Delete Draft' : 'Publish'}
        destructive={pendingAction?.type === 'delete'}
        isConfirming={isActioning}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
        title={pendingAction?.type === 'delete' ? 'Delete draft?' : 'Publish proposal?'}
        visible={Boolean(pendingAction)}
      >
        {pendingAction?.type === 'delete' ? 'This draft has not been published. Deleting it will permanently remove it.' : 'Household Members will be able to view this proposal once it becomes available.'}
      </ConfirmationDialog>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  error: { marginTop: 20 },
  success: { color: '#14633F', fontSize: 14, fontWeight: '700', marginTop: 16 },
  empty: { marginTop: 24 },
  group: { marginTop: 26 },
  groupHeading: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
  groupMarker: { borderRadius: 4, height: 8, marginRight: 8, width: 8 },
  groupTitle: { fontSize: 17, fontWeight: '800' },
  cardActions: { flexDirection: 'row', gap: 10, marginBottom: 18, marginTop: -4 },
  draftActions: { gap: 10, marginBottom: 18, marginTop: -4 },
});
