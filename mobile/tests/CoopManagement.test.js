import { NavigationContainer } from '@react-navigation/native';
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import ManageProposalsScreen from '../screens/community/ManageProposalsScreen';
import CommunityNavigator from '../navigation/CommunityNavigator';
import { getAdminTransferSummary, getEligibleAdminMembers } from '../services/adminTransferService';
import { useAuthStore } from '../store/authStore';

jest.mock('../services/proposalService', () => ({ listMyProposals: jest.fn().mockResolvedValue([]), listPublishedProposals: jest.fn().mockResolvedValue([]) }));
jest.mock('../services/adminTransferService', () => ({ getAdminTransferSummary: jest.fn(), getEligibleAdminMembers: jest.fn() }));
const currentAdmin = { id: 'admin', name: 'Current admin', email: 'admin@example.test', isCoopAdmin: true };
const navigation = { navigate: jest.fn() };
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().login(currentAdmin, 'test-token');
  getAdminTransferSummary.mockResolvedValue({ currentAdmin, pendingRequest: null });
  getEligibleAdminMembers.mockResolvedValue([]);
});
afterEach(async () => { await cleanup(); useAuthStore.getState().logout(); });
const show = () => render(<NavigationContainer><ManageProposalsScreen navigation={navigation} /></NavigationContainer>);

test('existing route presents one Co-op Management header with Community back navigation', async () => {
  const view = await render(<NavigationContainer><CommunityNavigator /></NavigationContainer>);
  await fireEvent.press(await view.findByText('Co-op Management'));
  expect(await view.findByLabelText('Administrator section')).toBeTruthy();
  expect(view.getAllByText('Co-op Management')).toHaveLength(1);
  expect(view.getByLabelText('Back to Community')).toBeTruthy();
  expect(view.queryByText('Manage Proposals')).toBeNull();
});
test('Create Proposal is green and available under every subcategory with unchanged navigation', async () => {
  const view = await show();
  await view.findByText('No proposals yet');
  expect(view.getByLabelText('Proposals section')).toHaveStyle({ backgroundColor: '#EAF5EC', borderColor: '#16764C', borderBottomWidth: 3, minHeight: 48 });
  for (const category of ['drafts', 'published', 'cancelled', 'history']) {
    await fireEvent.press(view.getByLabelText(`Show ${category} proposals`));
    const button = view.getByRole('button', { name: 'Create Proposal' });
    expect(button).toHaveStyle({ backgroundColor: '#16764C' });
    await fireEvent.press(button);
    expect(navigation.navigate).toHaveBeenLastCalledWith('CreateProposal');
  }
});
test('Administrator shows only its own content and blue accents, without the old redundant button', async () => {
  const view = await show();
  expect(view.queryByText('Manage Co-op Administrator')).toBeNull();
  await fireEvent.press(view.getByLabelText('Administrator section'));
  expect(await view.findByText(currentAdmin.email)).toBeTruthy();
  expect(view.getByLabelText('Administrator section').props.accessibilityState.selected).toBe(true);
  expect(view.getByLabelText('Administrator section')).toHaveStyle({ backgroundColor: '#EAF2F8', borderColor: '#356FA3', borderBottomWidth: 3 });
  expect(view.getByText('Co-op Administrator')).toHaveStyle({ color: '#356FA3' });
  expect(view.getByRole('button', { name: 'Transfer Administrator Role' })).toHaveStyle({ backgroundColor: '#356FA3' });
  expect(view.queryByText('Create Proposal')).toBeNull();
  expect(view.queryByLabelText('Search proposals')).toBeNull();
  for (const label of ['Drafts', 'Published', 'Cancelled', 'History']) expect(view.queryByText(label)).toBeNull();
  await fireEvent.press(view.getByText('Transfer Administrator Role'));
  expect(view.getByText('Select new Co-op Administrator')).toBeTruthy();
});
test('switching sections preserves proposal search and selected subcategory', async () => {
  const view = await show();
  await view.findByText('No proposals yet');
  await fireEvent.press(view.getByLabelText('Show history proposals'));
  await fireEvent.changeText(view.getByLabelText('Search proposals'), 'solar');
  await fireEvent.press(view.getByLabelText('Administrator section'));
  await view.findByText(currentAdmin.email);
  await fireEvent.press(view.getByLabelText('Proposals section'));
  expect(view.getByLabelText('Search proposals').props.value).toBe('solar');
  expect(view.getByLabelText('Show history proposals').props.accessibilityState.selected).toBe(true);
});

test('section tabs, category filters and history chips have distinct styling and accessible targets', async () => {
  const view = await show();
  await view.findByText('No proposals yet');
  expect(view.getByLabelText('Proposals section')).toHaveStyle({ minHeight: 48, borderRadius: 4, borderBottomWidth: 3 });
  expect(view.getByLabelText('Show drafts proposals')).toHaveStyle({ minHeight: 44, borderRadius: 8, borderWidth: 1 });
  await fireEvent.press(view.getByLabelText('Show history proposals'));
  expect(view.getByLabelText('History filter: All')).toHaveStyle({ minHeight: 44, borderRadius: 20, borderWidth: 1, backgroundColor: '#EAF5EC' });
  await fireEvent.press(view.getByLabelText('History filter: Archived'));
  expect(view.getByLabelText('History filter: Archived').props.accessibilityState.selected).toBe(true);
  expect(view.getByLabelText('History filter: All').props.accessibilityState.selected).toBe(false);
});
test('pending transfer uses amber and shows the target email with a secondary cancel action', async () => {
  getAdminTransferSummary.mockResolvedValue({ currentAdmin, pendingRequest: { id: 'transfer', targetUser: { name: 'Nominated member', email: 'target@example.test' } } });
  const view = await show();
  await fireEvent.press(view.getByLabelText('Administrator section'));
  expect(await view.findByText('target@example.test')).toBeTruthy();
  expect(view.getByText('Pending Administrator Transfer').parent).toHaveStyle({ backgroundColor: '#FFF4DE', borderColor: '#9A690F' });
  expect(view.getByText('Awaiting response')).toHaveStyle({ color: '#8A5A00' });
  expect(view.getByText('Cancel Request')).toBeTruthy();
  expect(view.queryByText('Transfer Administrator Role')).toBeNull();
});
