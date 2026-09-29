import { NavigationContainer } from '@react-navigation/native';
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import ManageProposalsScreen from '../screens/community/ManageProposalsScreen';
import ProposalDetailsScreen from '../screens/community/ProposalDetailsScreen';
import { getProposal, getResults, listMyProposals } from '../services/proposalService';
import { useAuthStore } from '../store/authStore';

jest.mock('../services/proposalService', () => ({
  listMyProposals: jest.fn(), getResults: jest.fn(), getProposal: jest.fn(),
  archiveProposal: jest.fn(), deleteDraft: jest.fn(), publishProposal: jest.fn(), getVoteStatus: jest.fn(),
}));
const base = { summary: 'Shared solar improvements', description: 'Proposal description', benefits: 'Lower costs', householdImpact: 'Shared benefit', estimatedCost: 10, proposer: { id: 'admin', name: 'Admin' }, votingStartDate: '2026-01-01T09:00:00Z', votingDeadline: '2026-01-15T09:00:00Z' };
const records = ['draft', 'upcoming', 'active', 'cancelled', 'closed'].map((status) => ({ ...base, id: status, title: `${status} project`, status }));
records.push({ ...base, id: 'archived', title: 'archived project', status: 'cancelled', archivedAt: '2026-02-01T09:00:00Z' });
const navigation = { navigate: jest.fn() };
const show = () => render(<NavigationContainer><ManageProposalsScreen navigation={navigation} /></NavigationContainer>);
beforeEach(() => {
  jest.clearAllMocks();
  listMyProposals.mockResolvedValue(records);
  getResults.mockResolvedValue({ finalDecision: 'Approved' });
  useAuthStore.getState().login({ id: 'admin', isCoopAdmin: true }, 'test-token');
});
afterEach(async () => { await cleanup(); useAuthStore.getState().logout(); });

test('main categories preserve lifecycle badges and separate archived records from cancelled work', async () => {
  const view = await show();
  expect(await view.findByText('draft project')).toBeTruthy();
  // The navigator already provides the screen title; do not repeat it in content.
  expect(view.queryByText('Manage proposals')).toBeNull();
  expect(view.queryByText('Co-op Admin')).toBeNull();
  expect(view.getByText('Manage your co-op’s proposals.')).toBeTruthy();
  expect(view.queryByText('active project')).toBeNull();
  expect(view.getByText('Edit')).toBeTruthy();
  expect(view.getByText('Publish')).toBeTruthy();
  expect(view.getByText('Delete Draft')).toBeTruthy();
  expect(view.getByText('Draft', { exact: true }).parent).toHaveStyle({ backgroundColor: '#F1F4F2' });
  const draftsTab = view.getByLabelText('Show drafts proposals');
  expect(draftsTab.props.accessibilityState.selected).toBe(true);
  expect(draftsTab).toHaveStyle({ minHeight: 44, borderWidth: 1, backgroundColor: '#EAF5EC' });
  await fireEvent.press(view.getByLabelText('Show published proposals'));
  expect(view.getByText('active project')).toBeTruthy();
  expect(view.getByText('upcoming project')).toBeTruthy();
  expect(view.getByText('Active').parent).toHaveStyle({ backgroundColor: '#E2F3E9' });
  expect(view.getByText('Upcoming')).toBeTruthy();
  expect(view.queryByText('closed project')).toBeNull();
  expect(view.queryByText('Archive', { exact: true })).toBeNull();
  await fireEvent.press(view.getByLabelText('Show cancelled proposals'));
  expect(view.getByText('cancelled project')).toBeTruthy();
  expect(view.queryByText('archived project')).toBeNull();
  expect(view.queryByText('Delete Draft')).toBeNull();
  const archive = view.getByLabelText('Archive proposal: cancelled project');
  expect(archive).toHaveStyle({ minHeight: 44, borderColor: '#C8D5CE' });
  expect(archive.parent).toBe(view.getByLabelText('View proposal: cancelled project').parent);
  await fireEvent.press(archive);
  expect(await view.findByText('Archive proposal?')).toBeTruthy();
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('History All, Closed, Archived and search preserve read-only access and result navigation', async () => {
  const view = await show();
  await view.findByText('draft project');
  await fireEvent.press(view.getByLabelText('Show history proposals'));
  expect(view.getByLabelText('History filter: All').props.accessibilityState.selected).toBe(true);
  expect(view.getByText('closed project')).toBeTruthy();
  expect(view.getByText('archived project')).toBeTruthy();
  expect(await view.findByText('Final decision: Approved')).toBeTruthy();
  expect(getResults).toHaveBeenCalledWith('closed');
  expect(getResults).not.toHaveBeenCalledWith('archived');
  for (const label of ['Edit', 'Publish', 'Cancel', 'Delete Draft', 'Archive', 'Vote now']) expect(view.queryByText(label, { exact: true })).toBeNull();
  await fireEvent.press(view.getByLabelText('View results: closed project'));
  expect(navigation.navigate).toHaveBeenCalledWith('VotingResults', { proposalId: 'closed', proposalTitle: 'closed project', votingDeadline: base.votingDeadline });
  await fireEvent.press(view.getByLabelText('History filter: Closed'));
  expect(view.getByText('closed project')).toBeTruthy();
  expect(view.queryByText('archived project')).toBeNull();
  await fireEvent.press(view.getByLabelText('History filter: Archived'));
  expect(view.getByText('archived project')).toBeTruthy();
  expect(view.queryByText('closed project')).toBeNull();
  await fireEvent.press(view.getByLabelText('View details: archived project'));
  expect(navigation.navigate).toHaveBeenCalledWith('ProposalDetails', { proposalId: 'archived' });
  await fireEvent.press(view.getByLabelText('History filter: All'));
  await fireEvent.changeText(view.getByLabelText('Search proposals'), 'archived');
  expect(view.getByText('archived project')).toBeTruthy();
  expect(view.queryByText('closed project')).toBeNull();
  await fireEvent.changeText(view.getByLabelText('Search proposals'), 'CLOSED');
  expect(view.getByText('closed project')).toBeTruthy();
  expect(view.queryByText('archived project')).toBeNull();
});

test('result loading failures do not hide historical proposals or the existing results route', async () => {
  getResults.mockRejectedValue(new Error('offline'));
  const view = await show();
  await view.findByText('draft project');
  await fireEvent.press(view.getByLabelText('Show history proposals'));
  expect(await view.findByText('Open results to retry loading the final decision.')).toBeTruthy();
  expect(view.getByText('closed project')).toBeTruthy();
  await fireEvent.press(view.getByLabelText('View results: closed project'));
  expect(navigation.navigate).toHaveBeenCalledWith('VotingResults', expect.objectContaining({ proposalId: 'closed' }));
});

test('closed details remain read-only while retaining final results access', async () => {
  getProposal.mockResolvedValue(records.find((item) => item.status === 'closed'));
  const view = await render(<NavigationContainer><ProposalDetailsScreen navigation={navigation} route={{ params: { proposalId: 'closed' } }} /></NavigationContainer>);
  expect(await view.findByRole('button', { name: 'View results' })).toHaveStyle({ borderWidth: 1, borderColor: '#BFD5C6', minHeight: 52 });
  expect(view.getByText('View results')).toHaveStyle({ color: '#14633F' });
  expect(view.queryByText('Cancel proposal')).toBeNull();
  expect(view.queryByText('Edit draft')).toBeNull();
  expect(view.queryByText('Vote now')).toBeNull();
  await fireEvent.press(view.getByText('View results'));
  const proposal = records.find((item) => item.status === 'closed');
  expect(navigation.navigate).toHaveBeenCalledWith('VotingResults', { proposalId: 'closed', proposalTitle: proposal.title, votingDeadline: proposal.votingDeadline });
});
