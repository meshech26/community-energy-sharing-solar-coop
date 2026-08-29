import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SectionHeader from '../../components/SectionHeader';
import VoteOption from '../../components/community/VoteOption';
import VotePrivacyCallout from '../../components/community/VotePrivacyCallout';

export default function VoteScreen({ navigation, route }) {
  const { proposalId, proposalTitle } = route.params;
  const [choice, setChoice] = useState('');

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader description={proposalTitle} eyebrow="Community vote" title="Choose your household vote" />
        <VotePrivacyCallout />
        <Card style={styles.card}>
          <Text style={styles.supporting}>Your household can submit one final vote for this proposal.</Text>
          <VoteOption choice="yes" onPress={() => setChoice('yes')} selected={choice === 'yes'} />
          <VoteOption choice="no" onPress={() => setChoice('no')} selected={choice === 'no'} />
          <VoteOption choice="abstain" onPress={() => setChoice('abstain')} selected={choice === 'abstain'} />
          <PrimaryButton disabled={!choice} onPress={() => navigation.navigate('ReviewVote', { choice, proposalId, proposalTitle })}>Review vote</PrimaryButton>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  card: { paddingBottom: 20 },
  supporting: { color: '#627168', fontSize: 15, lineHeight: 23, marginBottom: 16 },
});
