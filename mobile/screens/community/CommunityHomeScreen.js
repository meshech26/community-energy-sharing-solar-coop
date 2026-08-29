import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import ProposalCard from '../../components/community/ProposalCard';
import { listPublishedProposals } from '../../services/proposalService';
import { useAuthStore } from '../../store/authStore';
import { getCommunityError, getProposalStatusLabel, proposalAccents } from '../../utils/community';

const filters = ['active', 'upcoming', 'closed'];

export default function CommunityHomeScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setProposals(await listPublishedProposals());
    } catch (requestError) {
      setError(getCommunityError(requestError, "We couldn't load community proposals. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadProposals(); }, [loadProposals]));

  const counts = filters.reduce((result, status) => ({ ...result, [status]: proposals.filter((proposal) => proposal.status === status).length }), {});
  const filteredProposals = proposals.filter((proposal) => proposal.status === filter);

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader description="Take part in decisions that affect your co-op." eyebrow="Co-op Proposals & Voting" title="Community" />

        {user?.isCoopAdmin === true ? (
          <View style={styles.adminActions}>
            <PrimaryButton onPress={() => navigation.navigate('CreateProposal')}>Create Proposal</PrimaryButton>
            <SecondaryButton onPress={() => navigation.navigate('ManageProposals')}>Manage Proposals</SecondaryButton>
          </View>
        ) : null}

        <View accessibilityRole="tablist" style={styles.filters}>
          {filters.map((status) => {
            const selected = filter === status;
            const accent = proposalAccents[status];
            return (
              <Pressable
                accessibilityLabel={`Show ${getProposalStatusLabel(status).toLowerCase()} proposals`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={status}
                onPress={() => setFilter(status)}
                style={({ pressed }) => [styles.filter, selected && { backgroundColor: `${accent}12`, borderColor: accent }, pressed && styles.filterPressed]}
              >
                <Text style={[styles.filterLabel, selected && { color: accent }]}>{getProposalStatusLabel(status)} {counts[status]}</Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? <LoadingState label="Loading community proposals…" /> : null}
        {error ? (
          <View>
            <ErrorMessage>{error}</ErrorMessage>
            <SecondaryButton onPress={loadProposals}>Try again</SecondaryButton>
          </View>
        ) : null}
        {!isLoading && !error && filteredProposals.length === 0 ? (
          <EmptyState
            description={filter === 'active' ? 'There are no proposals requiring your vote right now.' : filter === 'upcoming' ? 'There are no scheduled proposals at the moment.' : 'Completed community decisions will appear here.'}
            icon="account-group-outline"
            title={`No ${filter} proposals`}
          />
        ) : null}
        {!isLoading && !error ? filteredProposals.map((proposal) => (
          <ProposalCard key={proposal.id} onPress={() => navigation.navigate('ProposalDetails', { proposalId: proposal.id })} proposal={proposal} />
        )) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  adminActions: { gap: 10, marginBottom: 22 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filter: { alignItems: 'center', borderColor: '#DDE5DF', borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 42, paddingHorizontal: 6, justifyContent: 'center' },
  filterPressed: { opacity: 0.78 },
  filterLabel: { color: '#627168', fontSize: 12, fontWeight: '700' },
  filterLabelSelected: { color: '#14633F' },
});
