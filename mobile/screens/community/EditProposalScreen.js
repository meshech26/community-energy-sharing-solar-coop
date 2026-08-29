import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';

import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingState from '../../components/LoadingState';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import ProposalForm from '../../components/community/ProposalForm';
import { getProposal, updateDraft } from '../../services/proposalService';
import { getCommunityError } from '../../utils/community';

export default function EditProposalScreen({ navigation, route }) {
  const { proposalId } = route.params;
  const [proposal, setProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProposal = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try { setProposal(await getProposal(proposalId)); }
    catch (requestError) { setError(getCommunityError(requestError, "We couldn't load this draft. Please try again.")); }
    finally { setIsLoading(false); }
  }, [proposalId]);

  useFocusEffect(useCallback(() => { loadProposal(); }, [loadProposal]));

  const save = async (payload) => {
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await updateDraft(proposalId, payload);
      navigation.replace('ProposalDetails', { proposalId: updated.id });
    } catch (requestError) {
      setError(getCommunityError(requestError, 'We could not update this draft. Please try again.'));
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <ScreenContainer edges={['left', 'right']}><LoadingState label="Loading draft…" /></ScreenContainer>;
  if (error && !proposal) return <ScreenContainer edges={['left', 'right']}><View style={styles.errorPage}><ErrorMessage>{error}</ErrorMessage><SecondaryButton onPress={loadProposal}>Try again</SecondaryButton></View></ScreenContainer>;

  const initialValues = proposal;
  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionHeader description="Only draft proposals can be edited." eyebrow="Co-op Admin" title="Edit draft" />
        <Card>{error ? <ErrorMessage>{error}</ErrorMessage> : null}<ProposalForm initialValues={initialValues} isSubmitting={isSubmitting} onSubmit={save} submitLabel="Save changes" /></Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 }, errorPage: { padding: 24 } });
