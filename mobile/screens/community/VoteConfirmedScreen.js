import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import ScreenContainer from '../../components/ScreenContainer';
import SecondaryButton from '../../components/SecondaryButton';
import SectionHeader from '../../components/SectionHeader';

export default function VoteConfirmedScreen({ navigation, route }) {
  const { proposalId } = route.params;
  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader eyebrow="Community vote" title="Vote submitted" />
        <Card style={styles.successCard}>
          <View style={styles.iconWrap}><MaterialCommunityIcons color="#FFFFFF" name="check" size={30} /></View>
          <Text style={styles.message}>Your household vote has been recorded and remains private.</Text>
          <View style={styles.actions}>
            <PrimaryButton onPress={() => navigation.replace('ProposalDetails', { proposalId })}>Back to proposal</PrimaryButton>
            <SecondaryButton onPress={() => navigation.popToTop()}>Back to Community</SecondaryButton>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 24, paddingTop: 30 },
  successCard: { alignItems: 'center', borderTopColor: '#74B998', borderTopWidth: 3 },
  iconWrap: { alignItems: 'center', backgroundColor: '#16764C', borderRadius: 30, height: 60, justifyContent: 'center', marginBottom: 18, width: 60 },
  message: { color: '#526158', fontSize: 16, lineHeight: 24, marginBottom: 20, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 12 },
});
