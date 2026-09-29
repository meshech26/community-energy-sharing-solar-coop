import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from './CommunityUI';
import ResultsDonutChart, { chartColors } from './ResultsDonutChart';

const formatPercentage = (value, total) => {
  if (!total) return '0%';
  const percentage = (value / total) * 100;
  return `${Number(percentage.toFixed(1))}%`;
};

const ResultRow = ({ color, label, total, value }) => {
  const percentage = total ? (value / total) * 100 : 0;
  return (
    <View accessible accessibilityLabel={`${label}: ${value} votes, ${formatPercentage(value, total)}`} style={styles.resultRow}>
      <View style={styles.resultHeader}>
        <View style={styles.resultName}><View style={[styles.marker, { backgroundColor: color }]} /><Text style={styles.rowLabel}>{label}</Text></View>
        <View style={styles.resultNumbers}><Text style={styles.rowValue}>{value}</Text><Text style={styles.percentage}>{formatPercentage(value, total)}</Text></View>
      </View>
      <View style={styles.barTrack}><View style={[styles.barFill, { backgroundColor: color, width: `${percentage}%` }]} /></View>
    </View>
  );
};

export default function ResultsSummary({ results }) {
  const decisionTone = results.finalDecision === 'Approved' ? 'green' : results.finalDecision === 'Rejected' ? 'danger' : 'blue';
  const decisionIcon = results.finalDecision === 'Approved' ? 'check-circle-outline' : results.finalDecision === 'Rejected' ? 'close-circle-outline' : 'scale-balance';
  const participation = Math.min(100, Math.max(0, Number(results.participationRate) || 0));

  return (
    <>
      <Card style={[styles.decisionCard, { backgroundColor: decisionTone === 'green' ? '#F1F8F3' : decisionTone === 'danger' ? '#FDF4F4' : '#F2F5F8' }]}>
        <Text accessibilityRole="header" style={styles.eyebrow}>Final decision</Text>
        <View style={styles.decisionTop}><MaterialCommunityIcons accessible={false} color={decisionTone === 'green' ? '#16764C' : decisionTone === 'danger' ? '#B14B56' : '#3E78A8'} name={decisionIcon} size={24} /><Text style={styles.decisionValue}>{results.finalDecision}</Text></View>
      </Card>
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Participation</Text>
        <Text style={styles.participationValue}>{results.participatingHouseholds} of {results.eligibleHouseholds} households</Text>
        <Text style={styles.participationRate}>{results.participationRate}%</Text>
        <View style={styles.participationTrack}><View style={[styles.participationFill, { width: `${participation}%` }]} /></View>
        <Text style={styles.participationCaption}>Participation rate</Text>
      </Card>
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Voting results</Text>
        <ResultsDonutChart abstainVotes={results.abstainVotes} noVotes={results.noVotes} totalVotes={results.totalVotes} yesVotes={results.yesVotes} />
        <ResultRow color={chartColors.yes} label="Yes" total={results.totalVotes} value={results.yesVotes} />
        <ResultRow color={chartColors.no} label="No" total={results.totalVotes} value={results.noVotes} />
        <ResultRow color={chartColors.abstain} label="Abstain" total={results.totalVotes} value={results.abstainVotes} />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  decisionCard: { gap: 10, marginBottom: 14 },
  decisionTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  decisionValue: { color: '#173322', fontSize: 22, fontWeight: '700', flexShrink: 1 },
  card: { marginBottom: 14 },
  eyebrow: { color: '#526158', fontSize: 14, fontWeight: '500' },
  heading: { color: '#173322', fontSize: 17, fontWeight: '600', marginBottom: 10 },
  resultRow: { borderTopColor: '#EDF1EE', borderTopWidth: 1, paddingVertical: 12 },
  resultHeader: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  resultName: { alignItems: 'center', flexDirection: 'row', flexShrink: 1 },
  resultNumbers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'baseline', gap: 16, marginLeft: 'auto' },
  marker: { borderRadius: 5, height: 10, marginRight: 9, width: 10 },
  rowLabel: { color: '#29332E', fontSize: 15, flexShrink: 1 },
  rowValue: { color: '#173322', fontSize: 16, fontWeight: '600', minWidth: 28, textAlign: 'right', fontVariant: ['tabular-nums'] },
  percentage: { color: '#627168', fontSize: 14, fontWeight: '400', minWidth: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
  barTrack: { backgroundColor: '#E9EFEB', borderRadius: 99, height: 4, marginTop: 9, overflow: 'hidden' },
  barFill: { borderRadius: 99, height: '100%', minWidth: 0 },
  participationValue: { color: '#526158', fontSize: 15, fontWeight: '400', marginBottom: 6 },
  participationRate: { color: '#16764C', fontSize: 30, fontWeight: '700', marginBottom: 12 },
  participationTrack: { backgroundColor: '#E9EFEB', borderRadius: 99, height: 6, overflow: 'hidden' },
  participationFill: { backgroundColor: '#16764C', borderRadius: 99, height: '100%' },
  participationCaption: { color: '#627168', fontSize: 13, marginTop: 8 },
});
