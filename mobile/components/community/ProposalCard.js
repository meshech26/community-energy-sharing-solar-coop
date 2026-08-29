import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Card from '../Card';
import StatusBadge from '../StatusBadge';
import { getProposalStatusLabel, getProposalTimingText, proposalAccents, proposalTones } from '../../utils/community';

export default function ProposalCard({ onPress, proposal }) {
  return (
    <Pressable accessibilityLabel={`View proposal: ${proposal.title}`} accessibilityRole="button" onPress={onPress} style={({ hovered, pressed }) => [hovered && styles.hovered, pressed && styles.pressed]}>
      <Card style={[styles.card, { borderLeftColor: proposalAccents[proposal.status] || '#66746C' }]}>
        <View style={styles.topRow}>
          <StatusBadge label={getProposalStatusLabel(proposal.status)} tone={proposalTones[proposal.status]} />
        </View>
        <Text numberOfLines={2} style={styles.title}>{proposal.title}</Text>
        <Text numberOfLines={2} style={styles.summary}>{proposal.summary}</Text>
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.proposer}>By {proposal.proposer?.name || 'Co-op Administrator'}</Text>
          <Text style={styles.timing}>{getProposalTimingText(proposal)}</Text>
        </View>
        <View style={styles.actionRow}>
          <Text style={styles.actionLabel}>View proposal</Text>
          <MaterialCommunityIcons color="#14633F" name="chevron-right" size={21} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, marginBottom: 14, paddingLeft: 16 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  hovered: { opacity: 0.93 },
  topRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 14 },
  title: { color: '#173322', fontSize: 18, fontWeight: '800', lineHeight: 23, marginBottom: 7 },
  summary: { color: '#627168', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaRow: { borderTopColor: '#EDF1EE', borderTopWidth: 1, gap: 4, paddingTop: 13 },
  proposer: { color: '#526158', fontSize: 13, fontWeight: '600' },
  timing: { color: '#16764C', fontSize: 13, fontWeight: '700' },
  actionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  actionLabel: { color: '#14633F', fontSize: 14, fontWeight: '800', marginRight: 2 },
});
