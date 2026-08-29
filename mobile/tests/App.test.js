import { cleanup, fireEvent, render } from '@testing-library/react-native';
import App from '../App';
import { listPublishedProposals } from '../services/proposalService';
import { useAuthStore } from '../store/authStore';

jest.mock('../services/proposalService', () => ({
  listPublishedProposals: jest.fn(),
}));

describe('App', () => {
  afterEach(async () => {
    await cleanup();
    useAuthStore.getState().logout();
  });

  test('renders Login for an unauthenticated user', async () => {
    const { getByText } = await render(<App />);

    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  test('uses isCoopAdmin rather than email to render the role badge', async () => {
    useAuthStore.getState().login(
      { name: 'Member account', email: 'isuri@gmail.com', household: 'household-id', isCoopAdmin: false },
      'test-token'
    );
    const memberView = await render(<App />);

    expect(memberView.queryByTestId('coop-admin-badge')).toBeNull();
    await memberView.unmount();

    useAuthStore.getState().login(
      { name: 'Another member', email: 'another.member@example.test', household: 'household-id', isCoopAdmin: true },
      'test-token'
    );
    const adminView = await render(<App />);

    expect(adminView.getByTestId('coop-admin-badge')).toBeTruthy();
    expect(adminView.getAllByText('Dashboard').length).toBeGreaterThan(0);
  });

  test('renders exactly the four main areas for an authenticated household member', async () => {
    useAuthStore.getState().login(
      { name: 'Household member', email: 'member@example.test', household: 'household-id', isCoopAdmin: false },
      'test-token'
    );
    const { getAllByText, queryByTestId } = await render(<App />);

    ['Dashboard', 'Energy Sharing', 'Community', 'My Impact'].forEach((label) => {
      expect(getAllByText(label).length).toBeGreaterThan(0);
    });
    expect(queryByTestId('coop-admin-badge')).toBeNull();
  });

  test('opens each accessible top-level tab without showing a back control', async () => {
    listPublishedProposals.mockResolvedValue([]);
    useAuthStore.getState().login(
      { name: 'Household member', email: 'member@example.test', household: 'household-id', isCoopAdmin: false },
      'test-token'
    );
    const view = await render(<App />);

    fireEvent.press(view.getByLabelText('Open Dashboard'));
    expect(await view.findByText('Your Solar Share overview will appear here.')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Open Energy Sharing'));
    expect(await view.findByText('View and manage community energy-sharing activity.')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Open Community'));
    expect(await view.findByText('No active proposals')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Open My Impact'));
    expect(await view.findByText('Track your energy savings and sustainability progress.')).toBeTruthy();
    expect(view.queryByLabelText('Back to Community')).toBeNull();
  });

  test('logs out from the shared app header', async () => {
    useAuthStore.getState().login(
      { name: 'Household member', email: 'member@example.test', household: 'household-id', isCoopAdmin: false },
      'test-token'
    );
    const { findByText, getByLabelText } = await render(<App />);

    fireEvent.press(getByLabelText('Log out'));

    expect(await findByText('Welcome back')).toBeTruthy();
  });

  test('navigation renders the registration route', async () => {
    const { findByText, getByText } = await render(<App />);

    fireEvent.press(getByText(/Create an account/));

    expect(await findByText('Join your community')).toBeTruthy();
  });
});
