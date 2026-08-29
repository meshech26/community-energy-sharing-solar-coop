import { NavigationContainer } from '@react-navigation/native';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import CommunityHomeScreen from '../screens/community/CommunityHomeScreen';
import EditProposalScreen from '../screens/community/EditProposalScreen';
import ManageProposalsScreen from '../screens/community/ManageProposalsScreen';
import ProposalDetailsScreen from '../screens/community/ProposalDetailsScreen';
import ReviewVoteScreen from '../screens/community/ReviewVoteScreen';
import VoteScreen from '../screens/community/VoteScreen';
import VotingResultsScreen from '../screens/community/VotingResultsScreen';
import ProposalDateTimeField from '../components/community/ProposalDateTimeField';
import ProposalForm from '../components/community/ProposalForm';
import CommunityNavigator from '../navigation/CommunityNavigator';
import { deleteDraft, getProposal, getResults, getVoteStatus, listMyProposals, listPublishedProposals, publishProposal, submitVote } from '../services/proposalService';
import { useAuthStore } from '../store/authStore';

jest.mock('../services/proposalService', () => ({
  deleteDraft: jest.fn(),
  getProposal: jest.fn(),
  getResults: jest.fn(),
  getVoteStatus: jest.fn(),
  listMyProposals: jest.fn(),
  listPublishedProposals: jest.fn(),
  publishProposal: jest.fn(),
  submitVote: jest.fn(),
}));

const proposals = [
  { id: 'active-id', title: 'Battery storage', summary: 'Store more shared solar energy.', status: 'active', proposer: { id: 'admin-id', name: 'Admin Member' }, votingStartDate: '2026-08-01T09:00:00.000Z', votingDeadline: '2026-12-01T09:00:00.000Z' },
  { id: 'upcoming-id', title: 'Roof upgrade', summary: 'Improve community panels.', status: 'upcoming', proposer: { id: 'admin-id', name: 'Admin Member' }, votingStartDate: '2026-12-05T09:00:00.000Z', votingDeadline: '2026-12-12T09:00:00.000Z' },
  { id: 'closed-id', title: 'Meter replacement', summary: 'Replace ageing meters.', status: 'closed', proposer: { id: 'admin-id', name: 'Admin Member' }, votingStartDate: '2026-01-01T09:00:00.000Z', votingDeadline: '2026-01-08T09:00:00.000Z' },
];

const detailProposal = {
  ...proposals[0],
  description: 'Detailed proposal description.',
  benefits: 'Lower shared energy costs.',
  estimatedCost: 2500,
  householdImpact: 'No additional household action is required.',
  publishedAt: '2026-08-01T09:00:00.000Z',
};
const draftProposal = { ...detailProposal, id: 'draft-id', status: 'draft', title: 'Draft battery proposal' };

const navigation = { goBack: jest.fn(), navigate: jest.fn(), popToTop: jest.fn(), replace: jest.fn() };
const renderWithNavigation = async (component) => render(<NavigationContainer>{component}</NavigationContainer>);

describe('Community frontend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
  });

  afterEach(async () => {
    await cleanup();
    useAuthStore.getState().logout();
  });

  test('loads real proposal data and filters active, upcoming, and closed proposals', async () => {
    listPublishedProposals.mockResolvedValue(proposals);
    const view = await renderWithNavigation(<CommunityHomeScreen navigation={navigation} />);

    expect(await view.findByText('Battery storage')).toBeTruthy();
    fireEvent.press(view.getByText('Upcoming 1'));
    expect(await view.findByText('Roof upgrade')).toBeTruthy();
    fireEvent.press(view.getByText('Closed 1'));
    expect(await view.findByText('Meter replacement')).toBeTruthy();
  });

  test('shows admin controls only for isCoopAdmin true', async () => {
    listPublishedProposals.mockResolvedValue([]);
    useAuthStore.getState().login({ id: 'member-id', name: 'Member', isCoopAdmin: false }, 'token');
    const memberView = await renderWithNavigation(<CommunityHomeScreen navigation={navigation} />);
    await memberView.findByText('No active proposals');
    expect(memberView.queryByText('Create Proposal')).toBeNull();
    await memberView.unmount();

    useAuthStore.getState().login({ id: 'admin-id', name: 'Admin', isCoopAdmin: true }, 'token');
    const adminView = await renderWithNavigation(<CommunityHomeScreen navigation={navigation} />);
    expect(await adminView.findByText('Create Proposal')).toBeTruthy();
    expect(adminView.getByText('Manage Proposals')).toBeTruthy();
  });

  test('shows a loading state while proposal data is being retrieved', async () => {
    let resolveProposals;
    listPublishedProposals.mockReturnValue(new Promise((resolve) => { resolveProposals = resolve; }));
    const view = await renderWithNavigation(<CommunityHomeScreen navigation={navigation} />);

    expect(await view.findByText('Loading community proposals…')).toBeTruthy();
    resolveProposals([]);
    expect(await view.findByText('No active proposals')).toBeTruthy();
  });

  test('uses stack navigation for a proposal details back control', async () => {
    listPublishedProposals.mockResolvedValue(proposals);
    getProposal.mockResolvedValue(detailProposal);
    getVoteStatus.mockResolvedValue({ hasVoted: false });
    const view = await render(<NavigationContainer><CommunityNavigator /></NavigationContainer>);

    expect(await view.findByText('Community')).toBeTruthy();
    expect(view.queryByLabelText('Back to Community')).toBeNull();
    fireEvent.press(view.getByLabelText('View proposal: Battery storage'));

    expect(await view.findByText('Proposal Details')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Back to Community'));
    expect(await view.findByText('Community')).toBeTruthy();
    expect(view.queryByLabelText('Back to Community')).toBeNull();
  });

  test('renders an empty and an API error state without crashing', async () => {
    listPublishedProposals.mockResolvedValue([]);
    const emptyView = await renderWithNavigation(<CommunityHomeScreen navigation={navigation} />);
    expect(await emptyView.findByText('No active proposals')).toBeTruthy();
    await emptyView.unmount();

    listPublishedProposals.mockRejectedValue({ response: { status: 500, data: { message: 'Unable to retrieve proposals at this time.' } } });
    const errorView = await renderWithNavigation(<CommunityHomeScreen navigation={navigation} />);
    expect(await errorView.findByText('Unable to retrieve proposals at this time.')).toBeTruthy();
    expect(errorView.getByText('Try again')).toBeTruthy();
  });

  test('renders proposal details and hides voting choices for an already-voted household', async () => {
    getProposal.mockResolvedValue(detailProposal);
    getVoteStatus.mockResolvedValue({ hasVoted: true });
    const view = await renderWithNavigation(<ProposalDetailsScreen navigation={navigation} route={{ params: { proposalId: 'active-id' } }} />);

    expect(await view.findByText('Detailed proposal description.')).toBeTruthy();
    expect(view.getByText('Your household has already submitted a vote for this proposal.')).toBeTruthy();
    expect(view.queryByText('Cast household vote')).toBeNull();
  });

  test('opens publish confirmation before publishing a draft from proposal details', async () => {
    useAuthStore.getState().login({ id: 'admin-id', name: 'Admin', isCoopAdmin: true }, 'token');
    getProposal.mockResolvedValue(draftProposal);
    publishProposal.mockResolvedValue({ ...draftProposal, status: 'upcoming' });
    const view = await renderWithNavigation(<ProposalDetailsScreen navigation={navigation} route={{ params: { proposalId: 'draft-id' } }} />);

    await view.findByText('Publish proposal');
    fireEvent.press(view.getByText('Publish proposal'));
    expect(await view.findByText('Publish proposal?')).toBeTruthy();
    expect(publishProposal).not.toHaveBeenCalled();
    fireEvent.press(view.getByText('Publish'));
    await waitFor(() => expect(publishProposal).toHaveBeenCalledWith('draft-id'));
  });

  test('allows draft deletion only after explicit confirmation in management', async () => {
    useAuthStore.getState().login({ id: 'admin-id', name: 'Admin', isCoopAdmin: true }, 'token');
    listMyProposals.mockResolvedValueOnce([draftProposal]).mockResolvedValueOnce([]);
    deleteDraft.mockResolvedValue({ deletedProposalId: 'draft-id' });
    const view = await renderWithNavigation(<ManageProposalsScreen navigation={navigation} />);

    expect(await view.findByText('Delete Draft')).toBeTruthy();
    fireEvent.press(view.getByText('Delete Draft'));
    expect(await view.findByText('Delete draft?')).toBeTruthy();
    expect(deleteDraft).not.toHaveBeenCalled();
    fireEvent.press(view.getAllByText('Delete Draft')[1]);
    await waitFor(() => expect(deleteDraft).toHaveBeenCalledWith('draft-id'));
    await waitFor(() => expect(view.queryByText('Draft battery proposal')).toBeNull());
  });

  test('opens a confirmation before publishing a draft from management', async () => {
    useAuthStore.getState().login({ id: 'admin-id', name: 'Admin', isCoopAdmin: true }, 'token');
    listMyProposals.mockResolvedValue([draftProposal]);
    publishProposal.mockResolvedValue({ ...draftProposal, status: 'upcoming' });
    const view = await renderWithNavigation(<ManageProposalsScreen navigation={navigation} />);

    expect(await view.findByText('Draft battery proposal')).toBeTruthy();
    fireEvent.press(view.getByText('Publish'));
    expect(await view.findByText('Publish proposal?')).toBeTruthy();
    expect(publishProposal).not.toHaveBeenCalled();
    fireEvent.press(view.getAllByText('Publish', { exact: true })[1]);
    await waitFor(() => expect(publishProposal).toHaveBeenCalledWith('draft-id'));
    expect(view.queryByText('}')).toBeNull();
  });

  test('does not show Delete Draft for published proposals', async () => {
    useAuthStore.getState().login({ id: 'admin-id', name: 'Admin', isCoopAdmin: true }, 'token');
    listMyProposals.mockResolvedValue([proposals[0], proposals[1], proposals[2]]);
    const view = await renderWithNavigation(<ManageProposalsScreen navigation={navigation} />);

    expect(await view.findByText('Battery storage')).toBeTruthy();
    expect(view.getByText('Roof upgrade')).toBeTruthy();
    expect(view.getByText('Meter replacement')).toBeTruthy();
    expect(view.queryByText('Delete Draft')).toBeNull();
  });

  test('opens the voting deadline calendar and displays a friendly stored date', async () => {
    const value = '2026-09-05T12:30:00.000Z';
    const expected = new Date(value).toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·');
    const view = await render(<ProposalDateTimeField label="Voting deadline" onChange={jest.fn()} value={value} />);

    expect(view.getByText(expected)).toBeTruthy();
    expect(view.queryByText(value)).toBeNull();
    fireEvent.press(view.getByLabelText('Choose Voting deadline'));
    expect(await view.findByText('Time')).toBeTruthy();
    fireEvent.press(view.getByText('Cancel'));
    await waitFor(() => expect(view.queryByText('Time')).toBeNull());
  });

  test('loads existing draft dates into the edit form', async () => {
    getProposal.mockResolvedValue(draftProposal);
    const start = new Date(draftProposal.votingStartDate).toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·');
    const deadline = new Date(draftProposal.votingDeadline).toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·');
    const view = await renderWithNavigation(<EditProposalScreen navigation={navigation} route={{ params: { proposalId: 'draft-id' } }} />);

    expect(await view.findByText('Save changes')).toBeTruthy();
    expect(view.getByText(start)).toBeTruthy();
    expect(view.getByText(deadline)).toBeTruthy();
  });

  test('opens the date picker and returns an ISO value after confirmation', async () => {
    const onChange = jest.fn();
    const view = await render(<ProposalDateTimeField label="Voting starts" onChange={onChange} />);

    await act(async () => { fireEvent.press(view.getByLabelText('Choose Voting starts')); });
    expect(await view.findByText('Time')).toBeTruthy();
    await act(async () => { fireEvent.press(view.getByLabelText('Later hour')); });
    await act(async () => { fireEvent.press(view.getByLabelText('Set minutes to 30')); });
    await act(async () => { fireEvent.press(view.getByText('Confirm')); });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(Number.isNaN(new Date(onChange.mock.calls[0][0]).getTime())).toBe(false);
    await waitFor(() => expect(view.queryByText('Time')).toBeNull());
  });

  test('keeps frontend deadline validation when a deadline is before the start', async () => {
    const onSubmit = jest.fn();
    const view = await render(<ProposalForm initialValues={{ ...draftProposal, votingStartDate: '2026-09-02T09:00:00.000Z', votingDeadline: '2026-09-01T09:00:00.000Z' }} onSubmit={onSubmit} submitLabel="Save Draft" />);

    fireEvent.press(view.getByText('Save Draft'));
    expect(await view.findByText('The voting deadline must be after the voting start date.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('selecting a vote does not submit it and only moves to review', async () => {
    const view = await render(<VoteScreen navigation={navigation} route={{ params: { proposalId: 'active-id', proposalTitle: 'Battery storage' } }} />);

    expect(view.getByText('Review vote').parent.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(view.getByLabelText('Vote Yes'));
    await waitFor(() => expect(view.getByLabelText('Vote Yes').props.accessibilityState.selected).toBe(true));
    expect(submitVote).not.toHaveBeenCalled();
    fireEvent.press(view.getByText('Review vote'));
    expect(submitVote).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith('ReviewVote', { choice: 'yes', proposalId: 'active-id', proposalTitle: 'Battery storage' });
  });

  test('explains household vote privacy before a choice is selected', async () => {
    const view = await render(<VoteScreen navigation={navigation} route={{ params: { proposalId: 'active-id', proposalTitle: 'Battery storage' } }} />);

    expect(view.getByText('Your household vote is private.')).toBeTruthy();
    expect(view.getByText('Individual voting choices are not shown to other members or the Co-op Administrator. Only combined results are shown after voting closes.')).toBeTruthy();
  });

  test('allows Yes, No, and Abstain to be selected without submitting a vote', async () => {
    const view = await render(<VoteScreen navigation={navigation} route={{ params: { proposalId: 'active-id', proposalTitle: 'Battery storage' } }} />);

    for (const label of ['Yes', 'No', 'Abstain']) {
      fireEvent.press(view.getByLabelText(`Vote ${label}`));
      await waitFor(() => expect(view.getByLabelText(`Vote ${label}`).props.accessibilityState.selected).toBe(true));
      expect(submitVote).not.toHaveBeenCalled();
    }
  });

  test('submits exactly once only after Confirm vote is pressed', async () => {
    submitVote.mockResolvedValue({ hasVoted: true, message: 'Your household vote has been submitted successfully.' });
    const view = await render(<ReviewVoteScreen navigation={navigation} route={{ params: { choice: 'yes', proposalId: 'active-id', proposalTitle: 'Battery storage' } }} />);

    expect(submitVote).not.toHaveBeenCalled();
    fireEvent.press(view.getByText('Confirm vote'));
    expect(submitVote).toHaveBeenCalledTimes(1);
    expect(submitVote).toHaveBeenCalledWith('active-id', 'yes');
  });

  test('reminds the member that the reviewed vote remains private', async () => {
    const view = await render(<ReviewVoteScreen navigation={navigation} route={{ params: { choice: 'yes', proposalId: 'active-id', proposalTitle: 'Battery storage' } }} />);

    expect(view.getByText('Your household vote remains private.')).toBeTruthy();
    expect(view.getByText('Only combined results are shown after voting closes.')).toBeTruthy();
    expect(view.getByText('Change vote')).toBeTruthy();
    expect(view.getByText('Confirm vote')).toBeTruthy();
  });

  test('does not show active aggregate results and renders closed backend results', async () => {
    getProposal.mockResolvedValue(detailProposal);
    getVoteStatus.mockResolvedValue({ hasVoted: false });
    const activeView = await renderWithNavigation(<ProposalDetailsScreen navigation={navigation} route={{ params: { proposalId: 'active-id' } }} />);
    await activeView.findByText('Vote on this proposal');
    expect(activeView.queryByText('Voting results')).toBeNull();
    await activeView.unmount();

    getResults.mockResolvedValue({ yesVotes: 5, noVotes: 2, abstainVotes: 1, totalVotes: 8, participatingHouseholds: 8, eligibleHouseholds: 10, participationRate: 80, finalDecision: 'Approved' });
    const resultsView = await renderWithNavigation(<VotingResultsScreen route={{ params: { proposalId: 'closed-id', proposalTitle: 'Meter replacement' } }} />);
    expect(await resultsView.findByText('Voting results')).toBeTruthy();
    expect(resultsView.getByText('Approved')).toBeTruthy();
    expect(resultsView.getByText('8 of 10 households')).toBeTruthy();
    expect(resultsView.getByLabelText('8 total votes: 5 yes, 2 no, 1 abstain')).toBeTruthy();
    expect(resultsView.getByText('62.5%')).toBeTruthy();
  });
});
