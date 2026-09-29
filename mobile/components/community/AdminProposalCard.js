import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from './CommunityUI';
import { ProposalBadge, ProposalTitleSummary, ProposalProposer } from './ProposalCardContent';
import { getResults } from '../../services/proposalService';
import { getProposalTimingText } from '../../utils/community';
import { getProposalManagementState } from '../../utils/proposalManagement';

const historyDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function AdminProposalCard({ proposal, onView, onArchive, children }) {
  const { archived: isArchived, closed: isClosed, cancelled, published } = getProposalManagementState(proposal);
  const [decision, setDecision] = useState(null);
  const [resultFailed, setResultFailed] = useState(false);
  useEffect(() => {
    let current = true;
    setDecision(null);
    setResultFailed(false);
    if (isClosed) {
      getResults(proposal.id).then((results) => {
        if (current) setDecision(results?.finalDecision || null);
      }).catch(() => { if (current) setResultFailed(true); });
    }
    return () => { current = false; };
  }, [isClosed, proposal.id]);

  const action = isArchived ? 'View details' : isClosed ? 'View results' : 'View proposal';
  const metadata = isArchived ? `Originally cancelled • Archived ${historyDate(proposal.archivedAt)}`
    : isClosed ? `Voting completed ${historyDate(proposal.votingDeadline)}`
      : published ? getProposalTimingText(proposal) : null;
  return (
    <Card style={styles.card}>
      <ProposalBadge proposal={proposal} neutralDraft />
      <ProposalTitleSummary proposal={proposal} titleStyle={styles.title} summaryStyle={styles.summary} />
      <ProposalProposer proposal={proposal} style={styles.meta} />
      {metadata ? <Text style={styles.meta}>{metadata}</Text> : null}
      {isClosed ? <Text style={styles.meta}>{decision ? `Final decision: ${decision}` : resultFailed ? 'Open results to retry loading the final decision.' : 'Loading final decision…'}</Text> : null}
      <View style={styles.actionArea}>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${action}: ${proposal.title}`} onPress={onView} style={({ pressed }) => [styles.viewAction, pressed && styles.pressed]}>
          <Text style={styles.link}>{action}</Text><MaterialCommunityIcons color="#14633F" name="chevron-right" size={20} />
        </Pressable>
        {cancelled && onArchive ? <Pressable accessibilityRole="button" accessibilityLabel={`Archive proposal: ${proposal.title}`} onPress={onArchive} style={({ pressed }) => [styles.archiveAction, pressed && styles.pressed]}><Text style={styles.archiveText}>Archive</Text></Pressable> : null}
      </View>
      {children}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, gap: 6 },
  title: { color: '#173322', fontSize: 17, fontWeight: '700', lineHeight: 23, marginTop: 6 },
  summary: { color: '#526158', fontSize: 14, lineHeight: 21, marginBottom: 4 },
  meta: { color: '#627168', fontSize: 13, lineHeight: 20 },
  actionArea: { borderTopWidth: 1, borderTopColor: '#EDF1EE', marginTop: 8, paddingTop: 8, gap: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  viewAction: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingRight: 8, maxWidth: '100%' },
  link: { color: '#14633F', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  archiveAction: { minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#C8D5CE', borderRadius: 10, justifyContent: 'center' },
  archiveText: { color: '#40594B', fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
