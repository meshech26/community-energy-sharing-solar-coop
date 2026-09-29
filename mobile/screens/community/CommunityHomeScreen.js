import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import { screenSpacing } from '../../components/community/CommunityUI';
import ProposalCard from '../../components/community/ProposalCard';
import NotificationBell from '../../components/community/NotificationBell';
import ProposalSearchField from '../../components/community/ProposalSearchField';
import { listPublishedProposals } from '../../services/proposalService';
import { useAuthStore } from '../../store/authStore';
import { filterProposalsBySearch, getCommunityError, getProposalStatusLabel, proposalAccents } from '../../utils/community';

const filters = ['active', 'upcoming', 'closed'];

export default function CommunityHomeScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setProposals([]);
    setError('');
    try {
      setProposals(await listPublishedProposals());
    } catch (requestError) {
      setError(getCommunityError(requestError, "We couldn't load community proposals. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadProposals(); }, [loadProposals]));

  const counts = filters.reduce((result, status) => ({ ...result, [status]: proposals.filter((proposal) => proposal.status === status).length }), {});
  const statusProposals = proposals.filter((proposal) => proposal.status === filter);
  const filteredProposals = filterProposalsBySearch(statusProposals, searchQuery);
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text accessibilityRole="header" style={styles.title}>Community</Text>
            <NotificationBell onPress={() => navigation.navigate('Notifications')} />
          </View>
        </View>

        <ProposalSearchField onChangeText={setSearchQuery} value={searchQuery} />

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
                style={({ pressed }) => [styles.filter, selected && { backgroundColor: `${accent}12`, borderColor: accent, borderBottomWidth: 3 }, pressed && styles.filterPressed]}
              >
                <Text style={[styles.filterLabel, selected && { color: accent }]}>{getProposalStatusLabel(status)} {counts[status]}</Text>
              </Pressable>
            );
          })}
        </View>

        {user?.isCoopAdmin === true ? (
          <View style={styles.adminActions}>
            <PrimaryButton onPress={() => navigation.navigate('CreateProposal')}>Create Proposal</PrimaryButton>
            <SecondaryButton onPress={() => navigation.navigate('ManageProposals')}>Co-op Management</SecondaryButton>
          </View>
        ) : null}

        {isLoading ? <LoadingState label="Loading community proposals…" /> : null}
        {error ? (
          <View>
            <ErrorMessage>{error}</ErrorMessage>
            <SecondaryButton onPress={loadProposals}>Try again</SecondaryButton>
          </View>
        ) : null}
        {!isLoading && !error && filteredProposals.length === 0 && hasSearchQuery && statusProposals.length > 0 ? (
          <EmptyState
            description="Try another title or keyword."
            icon="magnify-close"
            title="No proposals match your search."
          />
        ) : null}
        {!isLoading && !error && filteredProposals.length === 0 && (!hasSearchQuery || statusProposals.length === 0) ? (
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
  content: { flexGrow: 1, ...screenSpacing },
  header: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, color: '#173322', fontSize: 26, fontWeight: '700', lineHeight: 32, paddingTop: 8 },

  adminActions: { gap: 8, marginBottom: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filter: { alignItems: 'center', borderColor: '#DDE5DF', borderRadius: 4, borderBottomWidth: 2, flexGrow: 1, flexBasis: 80, minHeight: 44, paddingHorizontal: 6, paddingVertical: 10, justifyContent: 'center' },
  filterPressed: { opacity: 0.78 },
  filterLabel: { color: '#627168', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
