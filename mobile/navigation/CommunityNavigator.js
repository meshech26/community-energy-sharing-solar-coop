import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InnerScreenHeader from '../components/InnerScreenHeader';
import navigationFocusLayout from './NavigationFocusLayout';
import NotificationsScreen from '../screens/community/NotificationsScreen';
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
import ManageCoopAdminScreen from '../screens/community/ManageCoopAdminScreen';
import AdminTransferRequestScreen from '../screens/community/AdminTransferRequestScreen';
import { useAuthStore } from '../store/authStore';
import { MyAccountScreen, ChangePasswordScreen } from '../screens/account/AccountScreens';

const Stack = createNativeStackNavigator();

export default function CommunityNavigator() {
  const isAdmin = useAuthStore((state) => state.user?.isCoopAdmin === true);
  return (
    <Stack.Navigator layout={navigationFocusLayout} initialRouteName="CommunityHome" screenOptions={{ animation: 'slide_from_right', header: (props) => <InnerScreenHeader {...props} /> }}>
      <Stack.Screen component={NotificationsScreen} name="Notifications" options={{ backLabel: 'Community', title: 'Notifications' }} />
      <Stack.Screen component={CommunityHomeScreen} name="CommunityHome" options={{ headerShown: false, title: 'Community' }} />
      <Stack.Screen component={MyAccountScreen} name="MyAccount" options={{ backLabel: 'Community', title: 'My Account' }} />
      <Stack.Screen component={ChangePasswordScreen} name="ChangePassword" options={{ backLabel: 'My Account', title: 'Change password' }} />
      <Stack.Screen component={ProposalDetailsScreen} name="ProposalDetails" options={{ backLabel: 'Community', title: 'Proposal Details' }} />
      <Stack.Screen component={AdminTransferRequestScreen} name="AdminTransferRequest" options={{ backLabel: 'Notifications', title: 'Administrator Request' }} />
      {isAdmin ? <Stack.Group navigationKey="admin">
      <Stack.Screen component={ManageCoopAdminScreen} name="ManageCoopAdmin" options={{ backLabel: 'Management', title: 'Co-op Administrator' }} />
      <Stack.Screen component={ManageProposalsScreen} name="ManageProposals" options={{ backLabel: 'Community', title: 'Co-op Management' }} />
      <Stack.Screen component={CreateProposalScreen} name="CreateProposal" options={{ backLabel: 'Community', title: 'Create Proposal' }} />
      <Stack.Screen component={EditProposalScreen} name="EditProposal" options={{ backLabel: 'Proposals', title: 'Edit Proposal' }} />
      <Stack.Screen component={CancelProposalScreen} name="CancelProposal" options={{ backLabel: 'Proposal', title: 'Cancel Proposal' }} />
      </Stack.Group> : null}
      <Stack.Screen component={VoteScreen} name="Vote" options={{ backLabel: 'Proposal', title: 'Cast Your Vote' }} />
      <Stack.Screen component={ReviewVoteScreen} name="ReviewVote" options={{ backLabel: 'Vote', title: 'Review Vote' }} />
      <Stack.Screen component={VoteConfirmedScreen} name="VoteConfirmed" options={{ backLabel: 'Proposal', title: 'Vote Submitted' }} />
      <Stack.Screen component={VotingResultsScreen} name="VotingResults" options={{ backLabel: 'Proposal', title: 'Voting Results' }} />
    </Stack.Navigator>
  );
}
