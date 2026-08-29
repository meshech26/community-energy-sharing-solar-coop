import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InnerScreenHeader from '../components/InnerScreenHeader';
import CancelProposalScreen from '../screens/community/CancelProposalScreen';
import CommunityHomeScreen from '../screens/community/CommunityHomeScreen';
import CreateProposalScreen from '../screens/community/CreateProposalScreen';
import EditProposalScreen from '../screens/community/EditProposalScreen';
import ManageProposalsScreen from '../screens/community/ManageProposalsScreen';
import ProposalDetailsScreen from '../screens/community/ProposalDetailsScreen';
import ReviewVoteScreen from '../screens/community/ReviewVoteScreen';
import VoteConfirmedScreen from '../screens/community/VoteConfirmedScreen';
import VoteScreen from '../screens/community/VoteScreen';
import VotingResultsScreen from '../screens/community/VotingResultsScreen';

const Stack = createNativeStackNavigator();

export default function CommunityNavigator() {
  return (
    <Stack.Navigator screenOptions={{ animation: 'slide_from_right', header: (props) => <InnerScreenHeader {...props} /> }}>
      <Stack.Screen component={CommunityHomeScreen} name="CommunityHome" options={{ headerShown: false, title: 'Community' }} />
      <Stack.Screen component={ProposalDetailsScreen} name="ProposalDetails" options={{ backLabel: 'Community', title: 'Proposal Details' }} />
      <Stack.Screen component={ManageProposalsScreen} name="ManageProposals" options={{ backLabel: 'Community', title: 'Manage Proposals' }} />
      <Stack.Screen component={CreateProposalScreen} name="CreateProposal" options={{ backLabel: 'Community', title: 'Create Proposal' }} />
      <Stack.Screen component={EditProposalScreen} name="EditProposal" options={{ backLabel: 'Proposals', title: 'Edit Proposal' }} />
      <Stack.Screen component={CancelProposalScreen} name="CancelProposal" options={{ backLabel: 'Proposal', title: 'Cancel Proposal' }} />
      <Stack.Screen component={VoteScreen} name="Vote" options={{ backLabel: 'Proposal', title: 'Cast Your Vote' }} />
      <Stack.Screen component={ReviewVoteScreen} name="ReviewVote" options={{ backLabel: 'Vote', title: 'Review Vote' }} />
      <Stack.Screen component={VoteConfirmedScreen} name="VoteConfirmed" options={{ backLabel: 'Proposal', title: 'Vote Submitted' }} />
      <Stack.Screen component={VotingResultsScreen} name="VotingResults" options={{ backLabel: 'Proposal', title: 'Voting Results' }} />
    </Stack.Navigator>
  );
}
