import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, DangerButton } from '../../components/community/CommunityUI';
import ProposalActionConfirmation from '../../components/community/ProposalActionConfirmation';
import ProposalReadAloud from '../../components/community/ProposalReadAloud';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import { SectionHeader, screenSpacing } from '../../components/community/CommunityUI';
import { ProposalBadge } from '../../components/community/ProposalCardContent';
import { getProposalManagementState, proposalActionCopy } from '../../utils/proposalManagement';
import { deleteDraft, getProposal, getVoteStatus, publishProposal } from '../../services/proposalService';
import { useAuthStore } from '../../store/authStore';
import { formatEstimatedCost, formatProposalDate, getCommunityError, getProposalTimingText } from '../../utils/community';

const NarrationHighlight = ({ active, children }) => (
  <View testID={active ? 'narration-highlight' : undefined} style={active ? styles.narrationHighlight : undefined}>
    <Text accessibilityLiveRegion="polite" style={styles.screenReaderStatus}>{active ? `Reading: ${active.label}` : ''}</Text>
    {children}
  </View>
);

const DetailRow = ({ icon, label, value, active }) => (
  <NarrationHighlight active={active}><View style={styles.detailRow}>
    <View style={styles.detailLabelRow}>{icon ? <MaterialCommunityIcons color="#627168" name={icon} size={16} /> : null}<Text style={styles.detailLabel}>{label}</Text></View>
    <Text style={styles.detailValue}>{value}</Text>
  </View></NarrationHighlight>
);

export default function ProposalDetailsScreen({ navigation, route }) {
  const user = useAuthStore((state) => state.user);
  const { proposalId } = route.params;
  const [activeSegment, setActiveSegment] = useState(null);
  const active = (key) => activeSegment?.key === key ? activeSegment : null;
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
    setVoteStatus(null);
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
  }, [proposalId, user?.id]);

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
      setError(getCommunityError(requestError, proposalActionCopy.publish.failure));
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
      setError(getCommunityError(requestError, proposalActionCopy.delete.failure));
      setConfirmation(null);
    } finally { setIsDeleting(false); }
  };

  if (isLoading) return <ScreenContainer edges={['left', 'right']}><LoadingState label="Loading proposal…" /></ScreenContainer>;
  if (error && !proposal) {
    return <ScreenContainer edges={['left', 'right']}><View style={styles.errorPage}><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadProposal}>Try again</SecondaryButton></View></ScreenContainer>;
  }

  const isOwnerAdmin = user?.isCoopAdmin === true;
  const managementState = getProposalManagementState(proposal);

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <NarrationHighlight active={active('title') || active('summary')}><SectionHeader description={proposal.summary} title={proposal.title} /></NarrationHighlight>
        <View style={styles.statusRow}><ProposalBadge proposal={proposal} /><Text accessibilityLiveRegion="polite" style={styles.timing}>{proposal.archivedAt ? `Archived on ${formatProposalDate(proposal.archivedAt)}` : getProposalTimingText(proposal, currentTime)}</Text></View>
        {proposal.archivedAt ? <Text style={[styles.body, styles.sectionHeading]}>Originally cancelled. This proposal is kept as a read-only historical record.</Text> : null}
        {error ? <View style={styles.inlineError}><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadProposal}>Try again</SecondaryButton></View> : null}

        <ProposalReadAloud proposal={proposal} onActiveSegmentChange={setActiveSegment} />
        <Card style={styles.card}>
          <Text style={styles.cardHeading}>Voting information</Text>
          <DetailRow active={active('votingStartDate')} icon="calendar-start" label="Voting starts" value={formatProposalDate(proposal.votingStartDate)} />
          <DetailRow active={active('votingDeadline')} icon="calendar-clock" label="Voting deadline" value={formatProposalDate(proposal.votingDeadline)} />
        </Card>
        <Card style={styles.card}>
          <NarrationHighlight active={active('description')}><Text style={styles.cardHeading}>About this proposal</Text>
          <Text style={styles.body}>{proposal.description}</Text></NarrationHighlight>
          <NarrationHighlight active={active('benefits')}><Text style={[styles.cardHeading, styles.sectionHeading]}>Expected benefits</Text>
          <Text style={styles.body}>{proposal.benefits}</Text></NarrationHighlight>
          <DetailRow active={active('estimatedCost')} icon="cash" label="Estimated cost" value={formatEstimatedCost(proposal.estimatedCost)} />
          <DetailRow active={active('householdImpact')} icon="home-group" label="Household impact" value={proposal.householdImpact} />
          <DetailRow active={active('proposer')} icon="account-outline" label="Proposed by" value={proposal.proposer?.name || 'Co-op Administrator'} />
        </Card>

        {proposal.status === 'cancelled' ? <Card style={[styles.card, styles.cancelledCard]}><View style={styles.calloutTitle}><MaterialCommunityIcons color="#B14B56" name="close-circle-outline" size={21} /><Text style={[styles.cardHeading, styles.cancelledText]}>Cancellation notice</Text></View><Text style={[styles.body, styles.cancelledText]}>{proposal.cancellationReason || 'This proposal has been cancelled.'}</Text></Card> : null}
        {proposal.status === 'active' && voteStatus?.hasVoted === true ? <Card style={[styles.card, styles.successCard]}><Text style={[styles.cardHeading, styles.submittedText]}>Household voting status</Text><View style={styles.calloutTitle}><MaterialCommunityIcons color="#3E78A8" name="check-circle-outline" size={21} /><Text style={[styles.body, styles.submittedText]}>Household vote submitted</Text></View><Text style={[styles.body, styles.submittedText]}>Your household has already submitted a vote for this proposal.</Text></Card> : null}
        {proposal.status === 'active' && voteStatus?.hasVoted === false && new Date(proposal.votingDeadline) > currentTime ? <Card style={[styles.card, styles.voteCard]}><Text style={[styles.cardHeading, styles.pendingText]}>Household voting status</Text><View style={styles.calloutTitle}><MaterialCommunityIcons color="#9A690F" name="clock-outline" size={21} /><Text style={[styles.body, styles.pendingText]}>Vote pending</Text></View><Text style={[styles.body, styles.pendingText]}>Your household has not submitted a vote yet.</Text><PrimaryButton onPress={() => navigation.navigate('Vote', { proposalId, proposalTitle: proposal.title })}>Vote now</PrimaryButton></Card> : null}
        {proposal.status === 'active' ? <Text style={styles.resultsHint}>Results will be available after voting closes.</Text> : null}
        {proposal.status === 'upcoming' ? <Card style={styles.card}><Text style={styles.cardHeading}>Voting has not started</Text><Text style={styles.body}>Voting opens {formatProposalDate(proposal.votingStartDate)}.</Text></Card> : null}
        {proposal.status === 'closed' ? <View style={styles.resultsAction}><SecondaryButton onPress={() => navigation.navigate('VotingResults', { proposalId, proposalTitle: proposal.title, votingDeadline: proposal.votingDeadline })}>View results</SecondaryButton></View> : null}

        {isOwnerAdmin && managementState.draft ? <View style={styles.adminActions}><SecondaryButton onPress={() => navigation.navigate('EditProposal', { proposalId })}>Edit draft</SecondaryButton><PrimaryButton loading={isPublishing} onPress={() => setConfirmation('publish')}>Publish proposal</PrimaryButton><DangerButton icon="trash-can-outline" loading={isDeleting} onPress={() => setConfirmation('delete')}>Delete Draft</DangerButton></View> : null}
        {isOwnerAdmin && managementState.published ? <View style={styles.adminActions}><DangerButton onPress={() => navigation.navigate('CancelProposal', { proposalId, proposalTitle: proposal.title })}>Cancel proposal</DangerButton></View> : null}
      </ScrollView>
      <ProposalActionConfirmation
        action={confirmation}
        isConfirming={confirmation === 'delete' ? isDeleting : isPublishing}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmation === 'delete' ? removeDraft : publish}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  narrationHighlight: { backgroundColor: '#F1F8F3', borderLeftWidth: 3, borderLeftColor: '#16764C', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  screenReaderStatus: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0.01 },
  content: { flexGrow: 1, ...screenSpacing },
  card: { marginTop: 14 },
  statusRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  timing: { color: '#526158', flex: 1, fontSize: 13, fontWeight: '700', marginLeft: 12, textAlign: 'right' },
  cardHeading: { color: '#173322', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  sectionHeading: { marginTop: 20 },
  body: { color: '#526158', fontSize: 15, lineHeight: 23 },
  detailRow: { borderTopColor: '#EDF1EE', borderTopWidth: 1, marginTop: 14, paddingTop: 13 },
  detailLabelRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  detailLabel: { color: '#627168', fontSize: 13, fontWeight: '700' },
  detailValue: { color: '#29352F', fontSize: 15, lineHeight: 22 },
  adminActions: { gap: 12, marginTop: 16 },
  errorPage: { padding: 24 },
  inlineError: { marginTop: 14 },
  cancelledCard: { backgroundColor: '#FCECED', borderColor: '#B14B56', borderLeftWidth: 3 },
  successCard: { backgroundColor: '#E8F1FA', borderColor: '#3E78A8', borderLeftWidth: 3 },
  voteCard: { backgroundColor: '#FFF4DE', borderColor: '#9A690F', borderLeftWidth: 3, gap: 12 },
  submittedText: { color: '#245B87' }, pendingText: { color: '#8A5A00' }, cancelledText: { color: '#B14B56' },
  calloutTitle: { alignItems: 'center', flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  resultsHint: { color: '#627168', fontSize: 14, lineHeight: 21, marginTop: 16, textAlign: 'center' },
  resultsAction: { marginTop: 16 },
});
