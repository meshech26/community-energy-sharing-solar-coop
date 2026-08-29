import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Card from '../Card';
import StatusBadge from '../StatusBadge';
import ResultsDonutChart, { chartColors } from './ResultsDonutChart';

const formatPercentage = (value, total) => {
  if (!total) return '0%';
  const percentage = (value / total) * 100;
  return `${Number(percentage.toFixed(1))}%`;
};

const ResultRow = ({ color, label, total, value }) => {
  const percentage = total ? (value / total) * 100 : 0;
  return (
    <View style={styles.resultRow}>
      <View style={styles.resultHeader}>
        <View style={styles.resultName}><View style={[styles.marker, { backgroundColor: color }]} /><Text style={styles.rowLabel}>{label}</Text></View>
        <Text style={styles.rowValue}>{value} <Text style={styles.percentage}>{formatPercentage(value, total)}</Text></Text>
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
      <Card style={styles.decisionCard}>
        <View style={styles.decisionTop}><Text style={styles.eyebrow}>Final decision</Text><MaterialCommunityIcons color={decisionTone === 'green' ? '#16764C' : decisionTone === 'danger' ? '#B14B56' : '#3E78A8'} name={decisionIcon} size={26} /></View>
        <StatusBadge label={results.finalDecision} tone={decisionTone} />
      </Card>
      <Card style={styles.card}>
        <Text style={styles.heading}>Voting results</Text>
        <ResultsDonutChart abstainVotes={results.abstainVotes} noVotes={results.noVotes} totalVotes={results.totalVotes} yesVotes={results.yesVotes} />
        <ResultRow color={chartColors.yes} label="Yes" total={results.totalVotes} value={results.yesVotes} />
        <ResultRow color={chartColors.no} label="No" total={results.totalVotes} value={results.noVotes} />
        <ResultRow color={chartColors.abstain} label="Abstain" total={results.totalVotes} value={results.abstainVotes} />
      </Card>
      <Card style={styles.card}>
        <Text style={styles.heading}>Participation</Text>
        <Text style={styles.participationValue}>{results.participatingHouseholds} of {results.eligibleHouseholds} households</Text>
        <Text style={styles.participationRate}>{results.participationRate}%</Text>
        <View style={styles.participationTrack}><View style={[styles.participationFill, { width: `${participation}%` }]} /></View>
        <Text style={styles.participationCaption}>Participation rate</Text>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  decisionCard: { gap: 10, marginBottom: 14 },
  decisionTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  card: { marginBottom: 14 },
  eyebrow: { color: '#627168', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  heading: { color: '#173322', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  resultRow: { borderTopColor: '#EDF1EE', borderTopWidth: 1, paddingVertical: 12 },
  resultHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  resultName: { alignItems: 'center', flexDirection: 'row' },
  marker: { borderRadius: 5, height: 10, marginRight: 9, width: 10 },
  rowLabel: { color: '#627168', fontSize: 15 },
  rowValue: { color: '#173322', fontSize: 16, fontWeight: '800' },
  percentage: { color: '#627168', fontSize: 13, fontWeight: '700' },
  barTrack: { backgroundColor: '#EDF1EE', borderRadius: 99, height: 6, marginTop: 9, overflow: 'hidden' },
  barFill: { borderRadius: 99, height: '100%', minWidth: 0 },
  participationValue: { color: '#173322', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  participationRate: { color: '#16764C', fontSize: 28, fontWeight: '800', marginBottom: 14 },
  participationTrack: { backgroundColor: '#E4ECE6', borderRadius: 99, height: 9, overflow: 'hidden' },
  participationFill: { backgroundColor: '#16764C', borderRadius: 99, height: '100%' },
  participationCaption: { color: '#627168', fontSize: 13, marginTop: 8 },
});
