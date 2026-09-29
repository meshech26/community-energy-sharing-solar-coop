import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '../../components/community/CommunityUI';
import ErrorMessage from '../../components/ErrorMessage';
import ScreenContainer from '../../components/ScreenContainer';
import { SectionHeader, screenSpacing } from '../../components/community/CommunityUI';
import ProposalForm from '../../components/community/ProposalForm';
import { createProposal } from '../../services/proposalService';
import { getCommunityError } from '../../utils/community';

export default function CreateProposalScreen({ navigation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const saveDraft = async (payload) => {
    setIsSubmitting(true);
    setError('');
    try {
      const proposal = await createProposal(payload);
      navigation.replace('ProposalDetails', { proposalId: proposal.id });
    } catch (requestError) {
      setError(getCommunityError(requestError, 'We could not save this proposal. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionHeader description="Save a draft, then review and publish." title="Create proposal" />
        <Card>{error ? <ErrorMessage>{error}</ErrorMessage> : null}<ProposalForm isSubmitting={isSubmitting} onSubmit={saveDraft} submitLabel="Save Draft" /></Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { ...screenSpacing } });
