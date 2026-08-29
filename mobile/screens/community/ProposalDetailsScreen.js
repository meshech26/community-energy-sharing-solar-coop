import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import StatusBadge from '../../components/StatusBadge';
import { deleteDraft, getProposal, getVoteStatus, publishProposal } from '../../services/proposalService';
import { useAuthStore } from '../../store/authStore';
import { formatEstimatedCost, formatProposalDate, getCommunityError, getProposalStatusLabel, getProposalTimingText, proposalTones } from '../../utils/community';

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelRow}>{icon ? <MaterialCommunityIcons color="#627168" name={icon} size={16} /> : null}<Text style={styles.detailLabel}>{label}</Text></View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function ProposalDetailsScreen({ navigation, route }) {
  const user = useAuthStore((state) => state.user);
  const { proposalId } = route.params;
  const [proposal, setProposal] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const loadProposal = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const loadedProposal = await getProposal(proposalId);
      setProposal(loadedProposal);
      if (loadedProposal.status === 'active') {
        setVoteStatus(await getVoteStatus(proposalId));
      } else {
        setVoteStatus(null);
      }
    } catch (requestError) {
      setError(getCommunityError(requestError, "We couldn't load this proposal. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [proposalId]);

  useFocusEffect(useCallback(() => { loadProposal(); }, [loadProposal]));

  useEffect(() => {
    if (proposal?.status !== 'active') return undefined;

    setCurrentTime(new Date());
    const intervalId = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(intervalId);
  }, [proposal?.status]);

  const publish = async () => {
    setIsPublishing(true);
    setError('');
    try {
      await publishProposal(proposalId);
      setConfirmation(null);
      await loadProposal();
    } catch (requestError) {
      setError(getCommunityError(requestError, 'We could not publish this proposal. Please try again.'));
      setConfirmation(null);
    } finally {
      setIsPublishing(false);
    }
  };

  const removeDraft = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await deleteDraft(proposalId);
      setConfirmation(null);
      navigation.popToTop();
    } catch (requestError) {
      setError(getCommunityError(requestError, 'We could not delete this draft. Please try again.'));
      setConfirmation(null);
    } finally { setIsDeleting(false); }
  };

  if (isLoading) return <ScreenContainer edges={['left', 'right']}><LoadingState label="Loading proposal…" /></ScreenContainer>;
  if (error && !proposal) {
    return <ScreenContainer edges={['left', 'right']}><View style={styles.errorPage}><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadProposal}>Try again</SecondaryButton></View></ScreenContainer>;
  }

  const isOwnerAdmin = user?.isCoopAdmin === true && String(proposal.proposer?.id) === String(user?.id);

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader description={proposal.summary} eyebrow="Community proposal" title={proposal.title} />
        <View style={styles.statusRow}><StatusBadge label={getProposalStatusLabel(proposal.status)} tone={proposalTones[proposal.status]} /><Text accessibilityLiveRegion="polite" style={styles.timing}>{getProposalTimingText(proposal, currentTime)}</Text></View>
        {error ? <View style={styles.inlineError}><ErrorMessage>{error}</ErrorMessage></View> : null}

        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Voting information</Text>
          <DetailRow icon="calendar-start" label="Voting starts" value={formatProposalDate(proposal.votingStartDate)} />
          <DetailRow icon="calendar-clock" label="Voting deadline" value={formatProposalDate(proposal.votingDeadline)} />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>About this proposal</Text>
          <Text style={styles.body}>{proposal.description}</Text>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Expected benefits</Text>
          <Text style={styles.body}>{proposal.benefits}</Text>
          <DetailRow icon="cash" label="Estimated cost" value={formatEstimatedCost(proposal.estimatedCost)} />
          <DetailRow icon="home-group" label="Household impact" value={proposal.householdImpact} />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Proposed by</Text>
          <Text style={styles.body}>{proposal.proposer?.name || 'Co-op Administrator'}</Text>
        </Card>

        {proposal.status === 'cancelled' ? <Card style={[styles.card, styles.cancelledCard]}><Text style={styles.cardHeading}>Cancellation notice</Text><Text style={styles.body}>{proposal.cancellationReason || 'This proposal has been cancelled.'}</Text></Card> : null}
        {proposal.status === 'active' && voteStatus?.hasVoted ? <Card style={[styles.card, styles.successCard]}><View style={styles.calloutTitle}><MaterialCommunityIcons color="#16764C" name="check-circle-outline" size={21} /><Text style={styles.cardHeading}>Vote submitted</Text></View><Text style={styles.body}>Your household has already submitted a vote for this proposal.</Text></Card> : null}
        {proposal.status === 'active' && !voteStatus?.hasVoted ? <Card style={[styles.card, styles.voteCard]}><Text style={styles.cardHeading}>Your household can vote</Text><Text style={styles.body}>Your household can submit one final vote for this proposal.</Text><PrimaryButton onPress={() => navigation.navigate('Vote', { proposalId, proposalTitle: proposal.title })}>Vote on this proposal</PrimaryButton></Card> : null}
        {proposal.status === 'active' ? <Text style={styles.resultsHint}>Results will be available after voting closes.</Text> : null}
        {proposal.status === 'upcoming' ? <Card style={styles.card}><Text style={styles.cardHeading}>Voting has not started</Text><Text style={styles.body}>Voting opens {formatProposalDate(proposal.votingStartDate)}.</Text></Card> : null}
        {proposal.status === 'closed' ? <View style={styles.resultsAction}><PrimaryButton onPress={() => navigation.navigate('VotingResults', { proposalId, proposalTitle: proposal.title, votingDeadline: proposal.votingDeadline })}>View final results</PrimaryButton></View> : null}

        {isOwnerAdmin && proposal.status === 'draft' ? <View style={styles.adminActions}><SecondaryButton onPress={() => navigation.navigate('EditProposal', { proposalId })}>Edit draft</SecondaryButton><PrimaryButton loading={isPublishing} onPress={() => setConfirmation('publish')}>Publish proposal</PrimaryButton><PrimaryButton icon="trash-can-outline" loading={isDeleting} onPress={() => setConfirmation('delete')} tone="danger">Delete Draft</PrimaryButton></View> : null}
        {isOwnerAdmin && ['upcoming', 'active', 'closed'].includes(proposal.status) ? <View style={styles.adminActions}><SecondaryButton onPress={() => navigation.navigate('CancelProposal', { proposalId, proposalTitle: proposal.title })}>Cancel proposal</SecondaryButton></View> : null}
      </ScrollView>
      <ConfirmationDialog
        cancelLabel={confirmation === 'delete' ? 'Keep Draft' : 'Keep Editing'}
        confirmLabel={confirmation === 'delete' ? 'Delete Draft' : 'Publish'}
        destructive={confirmation === 'delete'}
        isConfirming={confirmation === 'delete' ? isDeleting : isPublishing}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmation === 'delete' ? removeDraft : publish}
        title={confirmation === 'delete' ? 'Delete draft?' : 'Publish proposal?'}
        visible={Boolean(confirmation)}
      >
        {confirmation === 'delete' ? 'This draft has not been published. Deleting it will permanently remove it.' : 'Household Members will be able to view this proposal once it becomes available.'}
      </ConfirmationDialog>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  card: { marginTop: 14 },
  statusRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  timing: { color: '#526158', flex: 1, fontSize: 13, fontWeight: '700', marginLeft: 12, textAlign: 'right' },
  cardHeading: { color: '#173322', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  body: { color: '#526158', fontSize: 15, lineHeight: 23 },
  detailRow: { borderTopColor: '#EDF1EE', borderTopWidth: 1, marginTop: 14, paddingTop: 13 },
  detailLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  detailLabel: { color: '#627168', fontSize: 13, fontWeight: '700' },
  detailValue: { color: '#29352F', fontSize: 15, lineHeight: 22 },
  adminActions: { gap: 12, marginTop: 16 },
  errorPage: { padding: 24 },
  inlineError: { marginTop: 14 },
  cancelledCard: { borderLeftColor: '#B14B56', borderLeftWidth: 3 },
  successCard: { borderLeftColor: '#16764C', borderLeftWidth: 3 },
  voteCard: { borderLeftColor: '#16764C', borderLeftWidth: 3, gap: 12 },
  calloutTitle: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  resultsHint: { color: '#627168', fontSize: 14, lineHeight: 21, marginTop: 16, textAlign: 'center' },
  resultsAction: { marginTop: 16 },
});
