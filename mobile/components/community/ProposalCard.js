import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from './CommunityUI';
import { ProposalBadge, ProposalTitleSummary, ProposalProposer } from './ProposalCardContent';
import { formatProposalDate, getProposalStatusLabel, getProposalTimingText, proposalAccents } from '../../utils/community';

export default function ProposalCard({ onPress, proposal }) {
  return (
    <Pressable accessibilityLabel={`View proposal: ${proposal.title}`} accessibilityValue={{ text: `${proposal.archivedAt ? 'Archived' : getProposalStatusLabel(proposal.status)}. ${proposal.summary}. ${proposal.archivedAt ? `Archived on ${formatProposalDate(proposal.archivedAt)}` : getProposalTimingText(proposal)}${proposal.status === 'active' && typeof proposal.householdHasVoted === 'boolean' && new Date(proposal.votingDeadline) > new Date() ? (proposal.householdHasVoted ? '. Household vote submitted' : '. Vote pending') : ''}` }} accessibilityRole="button" onPress={onPress} style={({ hovered, pressed }) => [hovered && styles.hovered, pressed && styles.pressed]}>
      <Card style={[styles.card, { borderLeftColor: proposal.archivedAt ? '#66746C' : proposalAccents[proposal.status] || '#66746C' }]}>
        <View style={styles.topRow}>
          <ProposalBadge proposal={proposal} />
        </View>
        <ProposalTitleSummary proposal={proposal} titleStyle={styles.title} summaryStyle={styles.summary} />
        <View style={styles.metaRow}>
          <ProposalProposer proposal={proposal} style={styles.proposer} />
          {proposal.archivedAt ? <Text style={styles.timing}>Originally cancelled</Text> : null}
          <Text style={styles.timing}>{proposal.archivedAt ? `Archived on ${formatProposalDate(proposal.archivedAt)}` : getProposalTimingText(proposal)}</Text>
        </View>
        {proposal.status === 'active' && typeof proposal.householdHasVoted === 'boolean' && new Date(proposal.votingDeadline) > new Date() ? <View style={[styles.voteChip, { backgroundColor: proposal.householdHasVoted ? '#E8F1FA' : '#FFF4DE' }]}>
          <MaterialCommunityIcons name={proposal.householdHasVoted ? 'check-circle-outline' : 'clock-outline'} color={proposal.householdHasVoted ? '#3E78A8' : '#9A690F'} size={16} />
          <Text style={[styles.voteLabel, { color: proposal.householdHasVoted ? '#245B87' : '#8A5A00' }]}>{proposal.householdHasVoted ? 'Household vote submitted' : 'Vote pending'}</Text>
        </View> : null}
        <View style={styles.actionRow}>
          <Text style={styles.actionLabel}>{proposal.archivedAt ? 'View details' : 'View proposal'}</Text>
          <MaterialCommunityIcons color="#14633F" name="chevron-right" size={21} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  voteChip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, marginTop: 12, maxWidth: '100%' },
  voteLabel: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  card: { borderLeftWidth: 4, marginBottom: 12, paddingLeft: 16 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  hovered: { opacity: 0.93 },
  topRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 10 },
  title: { color: '#173322', fontSize: 17, fontWeight: '700', lineHeight: 23, marginBottom: 7 },
  summary: { color: '#627168', fontSize: 15, lineHeight: 22, marginBottom: 10 },
  metaRow: { gap: 4 },
  proposer: { color: '#526158', fontSize: 13, fontWeight: '600' },
  timing: { color: '#526158', fontSize: 13, fontWeight: '500' },
  actionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionLabel: { color: '#14633F', fontSize: 13, fontWeight: '600', marginRight: 2 },
});
