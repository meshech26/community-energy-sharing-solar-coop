import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import ResultsSummary from '../../components/community/ResultsSummary';
import { getResults } from '../../services/proposalService';
import { formatProposalDate, getCommunityError } from '../../utils/community';

export default function VotingResultsScreen({ route }) {
  const { proposalId, proposalTitle, votingDeadline } = route.params;
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try { setResults(await getResults(proposalId)); }
    catch (requestError) { setError(getCommunityError(requestError, 'Results will be available after voting closes.')); }
    finally { setIsLoading(false); }
  }, [proposalId]);

  useFocusEffect(useCallback(() => { loadResults(); }, [loadResults]));

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader description={proposalTitle} eyebrow="Community vote" title="Final results" />
        {isLoading ? <LoadingState label="Loading final results…" /> : null}
        {error ? <View><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadResults}>Try again</SecondaryButton></View> : null}
        {!isLoading && !error && results ? (
          <>
            <ResultsSummary results={results} />
            {votingDeadline ? (
              <View style={styles.closedNote}>
                <Text style={styles.closedNoteLabel}>Voting closed</Text>
                <Text style={styles.closedNoteValue}>{formatProposalDate(votingDeadline)}</Text>
              </View>
            ) : null}
          </>
        ) : null}
        {!isLoading && !error && !results ? <EmptyState description="Results will be available after voting closes." icon="chart-bar" title="Results unavailable" /> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  closedNote: { alignItems: 'center', marginBottom: 6, marginTop: 2 },
  closedNoteLabel: { color: '#6A776E', fontSize: 13, fontWeight: '700', marginBottom: 3, textTransform: 'uppercase' },
  closedNoteValue: { color: '#526158', fontSize: 14 },
});
