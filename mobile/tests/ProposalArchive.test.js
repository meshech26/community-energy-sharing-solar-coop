import { NavigationContainer } from '@react-navigation/native';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import ManageProposalsScreen from '../screens/community/ManageProposalsScreen';
import ProposalDetailsScreen from '../screens/community/ProposalDetailsScreen';
import { archiveProposal, getProposal, getVoteStatus, listMyProposals } from '../services/proposalService';
import { useAuthStore } from '../store/authStore';
import { formatProposalDate } from '../utils/community';

jest.mock('../services/proposalService', () => ({
  archiveProposal: jest.fn(), listMyProposals: jest.fn(), getProposal: jest.fn(),
  getVoteStatus: jest.fn(), deleteDraft: jest.fn(), publishProposal: jest.fn(),
}));
const cancelled = {
  id: 'cancelled-id', title: 'Cancelled battery project', summary: 'Shared storage',
  description: 'Historical description', benefits: 'Historical benefits', estimatedCost: 100,
  householdImpact: 'Shared benefit', proposer: { id: 'admin-id', name: 'Test admin' },
  status: 'cancelled', cancellationReason: 'Supplier withdrew', archivedAt: null,
  votingStartDate: '2026-09-01T09:00:00.000Z', votingDeadline: '2026-09-30T09:00:00.000Z',
};
const archived = { ...cancelled, archivedAt: '2026-09-15T09:00:00.000Z' };
const navigation = { navigate: jest.fn() };
const show = (screen) => render(<NavigationContainer>{screen}</NavigationContainer>);
beforeEach(() => {
  jest.clearAllMocks();
  [archiveProposal, getProposal, getVoteStatus, listMyProposals].forEach((mock) => mock.mockReset());
  useAuthStore.getState().login({ id: 'admin-id', name: 'Admin', isCoopAdmin: true }, 'test-token');
});
afterEach(async () => { await cleanup(); useAuthStore.getState().logout(); });

test('archive requires confirmation, can be cancelled, and moves the record into Archived history', async () => {
  listMyProposals.mockResolvedValueOnce([cancelled]).mockResolvedValue([archived]);
  archiveProposal.mockResolvedValue(archived);
  const view = await show(<ManageProposalsScreen navigation={navigation} />);
  await fireEvent.press(view.getByLabelText('Show cancelled proposals'));
  fireEvent.press(await view.findByText('Archive', { exact: true }));
  expect(await view.findByText('Archive proposal?')).toBeTruthy();
  expect(view.getByText(/kept in Proposal History as a read-only record/)).toBeTruthy();
  expect(archiveProposal).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('Cancel', { exact: true }));
  await waitFor(() => expect(view.queryByText('Archive proposal?')).toBeNull());
  expect(archiveProposal).not.toHaveBeenCalled();
  fireEvent.press(view.getByText('Archive', { exact: true }));
  await view.findByText('Archive proposal?');
  fireEvent.press(view.getAllByText('Archive', { exact: true }).slice(-1)[0]);
  expect(await view.findByText('Proposal archived successfully.')).toBeTruthy();
  await waitFor(() => expect(view.queryByText(cancelled.title)).toBeNull());
  expect(view.getByText('No cancelled proposals')).toBeTruthy();
  expect(archiveProposal).toHaveBeenCalledTimes(1);
  expect(archiveProposal).toHaveBeenCalledWith(cancelled.id);
  await fireEvent.press(view.getByLabelText('Show history proposals'));
  expect(view.getAllByText('Archived', { exact: true })).toHaveLength(2);
  expect(view.getByText(`Originally cancelled • Archived ${new Date(archived.archivedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`)).toBeTruthy();
  expect(view.queryByText('Archive', { exact: true })).toBeNull();
  await fireEvent.press(view.getByLabelText(`View details: ${cancelled.title}`));
  expect(navigation.navigate).toHaveBeenCalledWith('ProposalDetails', { proposalId: cancelled.id });
});

test('archive failure keeps the cancelled proposal available with a friendly retry message', async () => {
  listMyProposals.mockResolvedValue([cancelled]);
  archiveProposal.mockRejectedValue(new Error('offline'));
  const view = await show(<ManageProposalsScreen navigation={navigation} />);
  await fireEvent.press(view.getByLabelText('Show cancelled proposals'));
  fireEvent.press(await view.findByText('Archive', { exact: true }));
  await view.findByText('Archive proposal?');
  fireEvent.press(view.getAllByText('Archive', { exact: true }).slice(-1)[0]);
  await view.findByText(/We could not archive this proposal|could not reach Solar Share|Unable to reach Solar Share/i);
  expect(view.queryByText('Proposal archived successfully.')).toBeNull();
  expect(archiveProposal).toHaveBeenCalledTimes(1);
  fireEvent.press(view.getByText('Try again'));
  expect(await view.findByText(cancelled.title)).toBeTruthy();
  expect(view.getByText('Archive', { exact: true })).toBeTruthy();
});

test('archived cards are searchable, remain in history after reopening, and offer details only', async () => {
  listMyProposals.mockResolvedValue([archived, { ...cancelled, id: 'other-id', title: 'Other cancelled project' }]);
  const view = await show(<ManageProposalsScreen navigation={navigation} />);
  await fireEvent.press(view.getByLabelText('Show history proposals'));
  await view.findByText(cancelled.title);
  fireEvent.changeText(view.getByLabelText('Search proposals'), 'battery');
  await waitFor(() => expect(view.queryByText('Other cancelled project')).toBeNull());
  expect(view.getByText('View details')).toBeTruthy();
  for (const label of ['Archive', 'Edit', 'Publish', 'Cancel', 'Delete Draft', 'Vote now']) {
    expect(view.queryByText(label, { exact: true })).toBeNull();
  }
  fireEvent.changeText(view.getByLabelText('Search proposals'), 'no matching title');
  expect(await view.findByText('No proposals match your search.')).toBeTruthy();
  fireEvent.press(view.getByLabelText('Clear proposal search'));
  expect(await view.findByText(cancelled.title)).toBeTruthy();
  await view.unmount();
  const reopened = await show(<ManageProposalsScreen navigation={navigation} />);
  await fireEvent.press(reopened.getByLabelText('Show history proposals'));
  expect(await reopened.findByText(/Originally cancelled • Archived/)).toBeTruthy();
});

test.each([true, false])('archived details preserve history without voting or mutation controls (admin=%s)', async (isCoopAdmin) => {
  useAuthStore.getState().login({ id: isCoopAdmin ? 'admin-id' : 'member-id', isCoopAdmin }, 'test-token');
  getProposal.mockResolvedValue(archived);
  const view = await show(<ProposalDetailsScreen navigation={navigation} route={{ params: { proposalId: archived.id } }} />);
  expect(await view.findByText('Archived', { exact: true })).toBeTruthy();
  expect(view.getByText(`Archived on ${formatProposalDate(archived.archivedAt)}`)).toBeTruthy();
  for (const text of ['Historical description', 'Historical benefits', 'Shared benefit', 'Test admin', 'Supplier withdrew']) {
    expect(view.getByText(text)).toBeTruthy();
  }
  for (const label of ['Vote now', 'Edit draft', 'Publish proposal', 'Cancel proposal', 'Delete Draft', 'Archive']) {
    expect(view.queryByText(label, { exact: true })).toBeNull();
  }
  expect(getVoteStatus).not.toHaveBeenCalled();
});

test('members never receive management archive controls', async () => {
  useAuthStore.getState().login({ id: 'member-id', isCoopAdmin: false }, 'test-token');
  listMyProposals.mockResolvedValue([cancelled]);
  const view = await show(<ManageProposalsScreen navigation={navigation} />);
  expect(await view.findByText('Only Co-op Administrators can manage proposals.')).toBeTruthy();
  expect(view.queryByText('Archive', { exact: true })).toBeNull();
});
