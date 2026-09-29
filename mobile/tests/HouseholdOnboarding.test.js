import { NavigationContainer } from '@react-navigation/native';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import * as SafeArea from 'react-native-safe-area-context';
import HouseholdManagementScreen from '../screens/community/HouseholdManagementScreen';
import ManageProposalsScreen from '../screens/community/ManageProposalsScreen';
import { createHousehold, listHouseholds } from '../services/householdService';
import { useAuthStore } from '../store/authStore';

jest.mock('../services/householdService', () => ({ createHousehold: jest.fn(), listHouseholds: jest.fn() }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({ __esModule: true, default: 'RefreshControl' }));
jest.mock('../services/proposalService', () => ({ listMyProposals: jest.fn().mockResolvedValue([]) }));
const household = { id: 'household', name: 'Lake View Household', invitationCode: 'SS-7K4M9QAB' };
const admin = { id: 'admin', isCoopAdmin: true };
const show = () => render(<NavigationContainer><HouseholdManagementScreen /></NavigationContainer>);
test('name search trims whitespace, ignores case, preserves copy and clears back to all households', async () => {
  listHouseholds.mockResolvedValue([household, { id: 'second', name: 'Perera Household', invitationCode: 'SOLAR-P8R2' }]);
  const view = await show();
  await view.findByText('Perera Household');
  await fireEvent.changeText(view.getByLabelText('Search households'), '  LAKE VIEW  ');
  expect(view.queryByText('Perera Household')).toBeNull();
  expect(view.getByText(household.name)).toBeTruthy();
  await fireEvent.press(view.getByLabelText(`Copy invitation code for ${household.name}`));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(household.invitationCode);
  await fireEvent.changeText(view.getByLabelText('Search households'), 'SOLAR-P8R2');
  expect(view.getByText('No households found')).toBeTruthy();
  expect(view.getByText('Try another household name.')).toBeTruthy();
  await fireEvent.press(view.getByLabelText('Clear household search'));
  expect(view.getByText('Perera Household')).toBeTruthy();
  expect(view.getByText(household.name)).toBeTruthy();
  expect(view.queryByText('No households found')).toBeNull();
  expect(listHouseholds).toHaveBeenCalledTimes(1);
});
test('long lists retain every code and Copy target with device-safe bottom spacing', async () => {
  const originalInsets = SafeArea.useSafeAreaInsets.getMockImplementation();
  SafeArea.useSafeAreaInsets.mockReturnValue({ top: 0, left: 0, right: 0, bottom: 34 });
  const items = Array.from({ length: 50 }, (_, index) => ({ id: `house-${index}`, name: `Long Lake View participating household number ${index}`, invitationCode: `LEGACY-${index}` }));
  listHouseholds.mockResolvedValue(items);
  try {
    const view = await show();
    await view.findByText(items[49].invitationCode);
    expect(view.getAllByText('Copy')).toHaveLength(50);
    expect(view.getByTestId('household-scroll').props.contentContainerStyle).toEqual(expect.arrayContaining([expect.objectContaining({ paddingBottom: 62 })]));
    expect(view.getByText(items[49].name).props.numberOfLines).toBeUndefined();
    expect(view.getByText(items[49].invitationCode).parent).toHaveStyle({ flexWrap: 'wrap' });
    await fireEvent.press(view.getByLabelText(`Copy invitation code for ${items[49].name}`));
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(items[49].invitationCode);
  } finally { SafeArea.useSafeAreaInsets.mockImplementation(originalInsets); }
});
test('loads automatically and recovers through pull-to-refresh without a visible refresh button', async () => {
  listHouseholds.mockRejectedValueOnce(new Error('offline'));
  const view = await show();
  await view.findByText('We could not reach Solar Share. Please check your connection and try again.');
  expect(listHouseholds).toHaveBeenCalledTimes(1);
  expect(view.queryByText('Refresh households')).toBeNull();
  listHouseholds.mockResolvedValue([household]);
  await fireEvent(view.getByTestId('household-pull-refresh'), 'refresh');
  expect(await view.findByText(household.invitationCode)).toBeTruthy();
  expect(listHouseholds).toHaveBeenCalledTimes(2);
  expect(view.queryByText('We could not reach Solar Share. Please check your connection and try again.')).toBeNull();
  expect(view.queryByText('Refresh households')).toBeNull();
});
test('Household primary action is purple with indigo input focus and neutral body text', async () => {
  const view = await show();
  await view.findByText('No households yet. Add a participating household to get started.');
  expect(view.getByRole('button', { name: 'Create Household' })).toHaveStyle({ backgroundColor: '#6A5D9F', minHeight: 52 });
  expect(view.getByText('Create Household')).toHaveStyle({ color: '#FFFFFF' });
  expect(view.getByPlaceholderText('Enter household name')).toBeTruthy();
  expect(view.getByLabelText('Household name')).toHaveStyle({ fontSize: 14, borderRadius: 12, minHeight: 48 });
  expect(view.getByLabelText('Search households')).toHaveStyle({ fontSize: 14, padding: 12, minHeight: 48 });
  expect(view.queryByText('Household name')).toBeNull();
  expect(view.getByText('Household name (required)')).toBeTruthy();
  expect(view.queryByText('Solar Share generates the invitation code automatically.')).toBeNull();
  expect(view.getByText('Add Household')).toHaveStyle({ color: '#29332E', fontSize: 16, fontWeight: '600' });
  expect(view.getByText('Participating households')).toHaveStyle({ color: '#29332E', fontSize: 16, fontWeight: '600' });
  expect(view.getByLabelText('Household name')).toHaveStyle({ borderColor: '#DDE5DF', backgroundColor: '#FFFFFF' });
  await fireEvent(view.getByLabelText('Household name'), 'focus');
  expect(view.getByLabelText('Household name')).toHaveStyle({ borderColor: '#6A5D9F', outlineColor: '#6A5D9F', backgroundColor: '#FFFFFF' });
  await fireEvent(view.getByLabelText('Household name'), 'blur');
  expect(view.getByLabelText('Household name')).toHaveStyle({ borderColor: '#DDE5DF' });
  expect(view.getByText('Share invitation codes privately with household members.')).toHaveStyle({ color: '#526158' });
});
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().login(admin, 'test-token');
  listHouseholds.mockResolvedValue([]);
  createHousehold.mockResolvedValue(household);
  Clipboard.setStringAsync.mockResolvedValue(true);
});
afterEach(async () => { await cleanup(); useAuthStore.getState().logout(); });
test('admin can reach Households from Co-op Management without mixing proposal controls', async () => {
  const view = await render(<NavigationContainer><ManageProposalsScreen navigation={{ navigate: jest.fn() }} /></NavigationContainer>);
  await fireEvent.press(view.getByLabelText('Households section'));
  expect(view.getByLabelText('Households section')).toHaveStyle({ backgroundColor: '#F2EFF8', borderColor: '#6A5D9F', borderBottomWidth: 3 });
  expect(view.getByText('Households')).toHaveStyle({ color: '#554A82', fontWeight: '600' });
  expect(await view.findByText('Add Household')).toBeTruthy();
  expect(view.queryByText('Create Proposal')).toBeNull();
  expect(view.queryByLabelText('Search proposals')).toBeNull();
  expect(view.queryByText('Transfer Administrator Role')).toBeNull();
});
test('creation sends only a trimmed name and displays the server code as selectable, noneditable text', async () => {
  const household = { id: 'new-household', name: 'New Household', invitationCode: 'SOLAR-4K7M' };
  createHousehold.mockResolvedValueOnce(household);
  const view = await show();
  await view.findByText('No households yet. Add a participating household to get started.');
  await fireEvent.changeText(view.getByLabelText('Household name'), ` ${household.name} `);
  await fireEvent.press(view.getByText('Create Household'));
  expect(createHousehold).toHaveBeenCalledWith(household.name);
  expect(await view.findByText('Household created')).toBeTruthy();
  expect(view.getByText('Household created')).toHaveStyle({ color: '#14633F', fontSize: 14, fontWeight: '600', flexShrink: 1 });
  expect(view.getByText(household.name)).toHaveStyle({ color: '#29332E' });
  expect(view.getByText(household.invitationCode)).toHaveStyle({ color: '#554A82', backgroundColor: '#F2EFF8', borderColor: '#D8D2E8', fontSize: 16 });
  expect(view.getByText(household.invitationCode).props.selectable).toBe(true);
  expect(view.getByLabelText('Household name').props.value).toBe('');
  expect(view.getAllByText(household.invitationCode)).toHaveLength(1);
  expect(view.getAllByText('Invitation code')).toHaveLength(1);
  await fireEvent.press(view.getByLabelText(`Copy invitation code for ${household.name}`));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith('SOLAR-4K7M');
  await fireEvent.changeText(view.getByLabelText('Search households'), ' new household ');
  expect(view.getAllByText('SOLAR-4K7M')).toHaveLength(1);
  await fireEvent.press(view.getByLabelText(`Copy invitation code for ${household.name}`));
  expect(Clipboard.setStringAsync).toHaveBeenLastCalledWith('SOLAR-4K7M');
});
test('existing household codes are listed and copied only on explicit admin action', async () => {
  listHouseholds.mockResolvedValue([household]);
  const view = await show();
  await view.findByText(household.invitationCode);
  expect(view.getByText(household.name)).toHaveStyle({ color: '#29332E' });
  expect(view.getByText('Copy')).toHaveStyle({ color: '#554A82' });
  expect(view.queryByText('Invitation code')).toBeNull();
  expect(view.getByLabelText(`Copy invitation code for ${household.name}`)).toHaveStyle({ borderColor: '#6A5D9F', backgroundColor: '#FFFFFF', minHeight: 44 });
  expect(Clipboard.setStringAsync).not.toHaveBeenCalled();
  await fireEvent.press(view.getByLabelText(`Copy invitation code for ${household.name}`));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(household.invitationCode);
  expect(await view.findByText(`Code copied for ${household.name}.`)).toBeTruthy();
});
test('unsupported clipboard has a manual-copy fallback and never reports false success', async () => {
  listHouseholds.mockResolvedValue([household]);
  Clipboard.setStringAsync.mockResolvedValue(false);
  const view = await show();
  await fireEvent.press(await view.findByLabelText(`Copy invitation code for ${household.name}`));
  expect(await view.findByText('Copy is unavailable. Select the code to copy it manually.')).toBeTruthy();
  expect(view.getByText(household.invitationCode).props.selectable).toBe(true);
});
test('missing name and duplicate household errors leave the form usable', async () => {
  const view = await show();
  await fireEvent.press(view.getByText('Create Household'));
  expect(view.getByText('Enter a household name.')).toBeTruthy();
  expect(createHousehold).not.toHaveBeenCalled();
  createHousehold.mockRejectedValueOnce({ response: { status: 409, data: { message: 'A household with this name already exists.' } } });
  await fireEvent.changeText(view.getByLabelText('Household name'), household.name);
  await fireEvent.press(view.getByText('Create Household'));
  expect(await view.findByText('A household with this name already exists.')).toBeTruthy();
  expect(view.getByLabelText('Household name').props.value).toBe(household.name);
});
test('network failure is friendly and does not show a fake success or generated code', async () => {
  createHousehold.mockRejectedValueOnce(new Error('offline'));
  const view = await show();
  await fireEvent.changeText(view.getByLabelText('Household name'), household.name);
  await fireEvent.press(view.getByText('Create Household'));
  expect(await view.findByText('We could not reach Solar Share. Please check your connection and try again.')).toBeTruthy();
  expect(view.queryByText('Household created')).toBeNull();
});
test('normal members do not fetch households or see codes, including after demotion', async () => {
  useAuthStore.getState().login({ ...admin, isCoopAdmin: false }, 'test-token');
  const memberView = await show();
  expect(listHouseholds).not.toHaveBeenCalled();
  expect(memberView.queryByText('Create Household')).toBeNull();
  await memberView.unmount();
  useAuthStore.getState().login(admin, 'test-token');
  listHouseholds.mockResolvedValue([household]);
  const view = await show();
  await view.findByText(household.invitationCode);
  await act(async () => useAuthStore.getState().updateUser({ ...admin, isCoopAdmin: false }));
  expect(view.queryByText(household.invitationCode)).toBeNull();
  expect(view.queryByText('Create Household')).toBeNull();
});

test('copy feedback clears after five seconds without removing the code', async () => {
  listHouseholds.mockResolvedValue([household]);
  const view = await show();
  await view.findByText(household.invitationCode);
  jest.useFakeTimers();
  try {
    await fireEvent.press(view.getByLabelText(`Copy invitation code for ${household.name}`));
    expect(view.getByText(`Code copied for ${household.name}.`)).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(5000));
    expect(view.queryByText(`Code copied for ${household.name}.`)).toBeNull();
    expect(view.getByText(household.invitationCode)).toBeTruthy();
  } finally { jest.useRealTimers(); }
});
