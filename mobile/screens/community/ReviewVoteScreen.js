import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';
import VotePrivacyCallout from '../../components/community/VotePrivacyCallout';
import { submitVote } from '../../services/proposalService';
import { getCommunityError } from '../../utils/community';

const labels = { yes: 'Yes', no: 'No', abstain: 'Abstain' };
const choiceColors = { yes: '#16764C', no: '#B14B56', abstain: '#9A690F' };

export default function ReviewVoteScreen({ navigation, route }) {
  const { choice, proposalId, proposalTitle } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await submitVote(proposalId, choice);
      navigation.replace('VoteConfirmed', { proposalId, proposalTitle });
    } catch (requestError) {
      setError(getCommunityError(requestError, 'We could not submit your household vote. Please try again.'));
    } finally { setIsSubmitting(false); }
  };

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader eyebrow="Community vote" title="Review your vote" />
        <Card>
          <View style={styles.item}><Text style={styles.label}>Proposal</Text><Text style={styles.value}>{proposalTitle}</Text></View>
          <View style={styles.item}><Text style={styles.label}>Your household vote</Text><View style={[styles.choicePill, { backgroundColor: `${choiceColors[choice]}18` }]}><Text style={[styles.choice, { color: choiceColors[choice] }]}>{labels[choice]}</Text></View></View>
          <Text style={styles.message}>Your household can submit one final vote. Please check your selection before confirming.</Text>
          <VotePrivacyCallout compact />
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <View style={styles.actions}>
            <SecondaryButton disabled={isSubmitting} onPress={() => navigation.goBack()}>Change vote</SecondaryButton>
            <PrimaryButton loading={isSubmitting} onPress={confirm}>Confirm vote</PrimaryButton>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  item: { borderBottomColor: '#EDF1EE', borderBottomWidth: 1, marginBottom: 16, paddingBottom: 16 },
  label: { color: '#627168', fontSize: 13, fontWeight: '700', marginBottom: 5 },
  value: { color: '#173322', fontSize: 17, fontWeight: '800', lineHeight: 23 },
  choicePill: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  choice: { fontSize: 18, fontWeight: '800' },
  message: { color: '#526158', fontSize: 15, lineHeight: 23, marginBottom: 20 },
  actions: { gap: 12 },
});
