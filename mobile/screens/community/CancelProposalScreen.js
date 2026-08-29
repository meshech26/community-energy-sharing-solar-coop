import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import { cancelProposal } from '../../services/proposalService';
import { getCommunityError } from '../../utils/community';

export default function CancelProposalScreen({ navigation, route }) {
  const { proposalId, proposalTitle } = route.params;
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return setError('Provide a short explanation for community members.');
    setError('');
    setIsSubmitting(true);
    try {
      await cancelProposal(proposalId, reason.trim());
      navigation.replace('ProposalDetails', { proposalId });
    } catch (requestError) {
      setError(getCommunityError(requestError, 'We could not cancel this proposal. Please try again.'));
    } finally { setIsSubmitting(false); }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionHeader description={proposalTitle} eyebrow="Co-op Admin" title="Cancel proposal" />
        <Card>
          <FormInput label="Cancellation reason" multiline numberOfLines={4} onChangeText={setReason} placeholder="Explain why this proposal is being cancelled" value={reason} />
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <View style={styles.actions}>
            <PrimaryButton loading={isSubmitting} onPress={submit} tone="danger">Confirm cancellation</PrimaryButton>
            <SecondaryButton disabled={isSubmitting} onPress={() => navigation.goBack()}>Back</SecondaryButton>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 }, actions: { gap: 12 } });
