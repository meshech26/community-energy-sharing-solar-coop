import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import * as ReactNative from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import LoadingState from '../components/LoadingState';
import InnerScreenHeader from '../components/InnerScreenHeader';
import ConfirmationDialog from '../components/ConfirmationDialog';
import VoteOption from '../components/community/VoteOption';
import ProposalDateTimeField from '../components/community/ProposalDateTimeField';
import ProposalForm from '../components/community/ProposalForm';
import ProposalCard from '../components/community/ProposalCard';
import ResultsDonutChart from '../components/community/ResultsDonutChart';

afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test('vote options announce checked state and preserve the selected callback', async () => {
  const press = jest.fn();
  const view = await render(<VoteOption choice="abstain" selected={false} onPress={press} />);
  expect(view.getByRole('radio', { name: 'Vote Abstain' }).props.accessibilityState.checked).toBe(false);
  await fireEvent.press(view.getByRole('radio'));
  expect(press).toHaveBeenCalledTimes(1);
  await view.rerender(<VoteOption choice="abstain" selected onPress={press} />);
  expect(view.getByRole('radio').props.accessibilityState.checked).toBe(true);
  expect(view.getByRole('radio')).toHaveStyle({ minHeight: 54 });
});

test('buttons keep their names while busy and allow expanded labels', async () => {
  const press = jest.fn();
  const view = await render(<><PrimaryButton loading onPress={press}>Publish proposal</PrimaryButton><SecondaryButton onPress={press}>Keep editing</SecondaryButton></>);
  const publish = view.getByRole('button', { name: 'Publish proposal' });
  expect(publish.props.accessibilityState).toEqual({ disabled: true, busy: true });
  expect(view.getByText('Publish proposal')).toHaveStyle({ color: '#526158' });
  await fireEvent.press(publish);
  expect(press).not.toHaveBeenCalled();
  for (const button of view.getAllByRole('button')) {
    expect(button).toHaveStyle({ minHeight: 52, paddingVertical: 12, maxWidth: '100%' });
    expect(StyleSheet.flatten(button.props.style).height).toBeUndefined();
  }
});

test('loading states have a spoken name and a busy state', async () => {
  const view = await render(<LoadingState label="Loading proposals…" />);
  expect(view.getByRole('progressbar', { name: 'Loading proposals…' }).props.accessibilityState.busy).toBe(true);
  expect(view.getByText('Loading proposals…')).toHaveStyle({ flexShrink: 1 });
});

test('inner header keeps its back context accessible without repeating it visually', async () => {
  const goBack = jest.fn();
  const view = await render(<InnerScreenHeader back={{ title: 'Community' }} options={{ title: 'Co-op Management' }} navigation={{ goBack }} />);
  expect(view.getByRole('header').props.numberOfLines).toBeUndefined();
  expect(view.queryByText('Community')).toBeNull();
  expect(view.getByRole('button', { name: 'Back to Community' })).toHaveStyle({ minWidth: 44, minHeight: 44 });
  await fireEvent.press(view.getByRole('button', { name: 'Back to Community' }));
  expect(goBack).toHaveBeenCalledTimes(1);
});

test('confirmation scrolls and wraps actions without changing confirm/cancel behavior', async () => {
  const confirm = jest.fn(); const cancel = jest.fn();
  const view = await render(<ConfirmationDialog visible title="Publish proposal?" confirmLabel="Publish" cancelLabel="Keep Editing" onConfirm={confirm} onCancel={cancel}>Households will be able to see this proposal.</ConfirmationDialog>);
  expect(view.getByTestId('confirmation-scroll')).toBeTruthy();
  expect(view.getAllByRole('button')).toHaveLength(2);
  await fireEvent.press(view.getByRole('button', { name: 'Keep Editing' }));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
  await fireEvent.press(view.getByRole('button', { name: 'Publish' }));
  expect(confirm).toHaveBeenCalledTimes(1);
});

test('date picker exposes chosen/disabled dates, named 44-point controls and unchanged confirmation', async () => {
  const onChange = jest.fn();
  const initial = new Date(2026, 8, 27, 10, 15).toISOString();
  const view = await render(<ProposalDateTimeField label="Voting starts" value={initial} minimumDate={initial} onChange={onChange} />);
  await fireEvent.press(view.getByRole('button', { name: 'Choose Voting starts' }));
  for (const name of ['Previous month', 'Next month', 'Earlier hour', 'Later hour', 'Set minutes to 00']) {
    expect(view.getByRole('button', { name })).toHaveStyle({ minHeight: 44 });
  }
  const selected = view.getByRole('button', { name: `Select ${new Date(2026, 8, 27).toDateString()}` });
  expect(selected.props.accessibilityState).toEqual({ disabled: false, selected: true });
  expect(selected).toHaveStyle({ minHeight: 44 });
  expect(view.getByRole('button', { name: `Select ${new Date(2026, 8, 26).toDateString()}` }).props.accessibilityState.disabled).toBe(true);
  expect(view.queryByLabelText('Unavailable date')).toBeNull();
  expect(view.getByTestId('date-picker-scroll')).toBeTruthy();
  expect(view.getByTestId('date-calendar-scroll').props.horizontal).toBe(true);
  expect(onChange).not.toHaveBeenCalled();
  await fireEvent.press(view.getByRole('button', { name: 'Confirm' }));
  expect(onChange).toHaveBeenCalledWith(initial);
});

test('proposal form explains required fields and retains validation', async () => {
  const onSubmit = jest.fn();
  const view = await render(<ProposalForm onSubmit={onSubmit} submitLabel="Save Draft" />);
  expect(view.getByText(/All fields are required/)).toBeTruthy();
  await fireEvent.press(view.getByRole('button', { name: 'Save Draft' }));
  expect(view.getByText('Complete all proposal fields before saving.')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('proposal cards expose status, summary and household state without exposing the vote choice', async () => {
  const proposal = { title: 'Solar project', summary: 'Add panels', status: 'active', householdHasVoted: true, votingDeadline: '2099-01-01T00:00:00Z' };
  const view = await render(<ProposalCard proposal={proposal} onPress={jest.fn()} />);
  const text = view.getByRole('button', { name: 'View proposal: Solar project' }).props.accessibilityValue.text;
  expect(text).toContain('Active'); expect(text).toContain('Add panels'); expect(text).toContain('Household vote submitted');
  expect(text).not.toMatch(/voted yes|voted no|voted abstain/i);
});

test('large-text results move the total outside the fixed donut and retain a chart summary', async () => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 320, height: 568, scale: 1, fontScale: 2 });
  const view = await render(<ResultsDonutChart yesVotes={5} noVotes={2} abstainVotes={1} totalVotes={8} />);
  expect(view.getByRole('image', { name: '8 total votes: 5 yes, 2 no, 1 abstain' })).toBeTruthy();
  expect(view.getByText('TOTAL VOTES').parent).toHaveStyle({ position: 'relative' });
});

const luminance = (hex) => hex.match(/../g).map((part) => parseInt(part, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
test.each(['primary', 'administrator', 'household', 'danger'])('disabled %s actions remain legible and cannot be activated', async (tone) => {
  const press = jest.fn();
  const view = await render(<PrimaryButton tone={tone} disabled onPress={press}>Review action</PrimaryButton>);
  expect(view.getByRole('button')).toHaveStyle({ backgroundColor: '#E5EBE7', minHeight: 52 });
  expect(view.getByText('Review action')).toHaveStyle({ color: '#526158' });
  await fireEvent.press(view.getByRole('button'));
  expect(press).not.toHaveBeenCalled();
  const values = [luminance('526158'), luminance('E5EBE7')].sort((a, b) => b - a);
  expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
});
test('disabled secondary actions use the same readable neutral state', async () => {
  const press = jest.fn();
  const view = await render(<SecondaryButton disabled onPress={press}>Keep editing</SecondaryButton>);
  expect(view.getByRole('button')).toHaveStyle({ backgroundColor: '#E5EBE7' });
  expect(view.getByText('Keep editing')).toHaveStyle({ color: '#526158' });
  await fireEvent.press(view.getByRole('button'));
  expect(press).not.toHaveBeenCalled();
});
test.each([['primary', '#16764C'], ['administrator', '#356FA3'], ['household', '#6A5D9F']])('enabled %s actions retain solid brand/section fills', async (tone, backgroundColor) => {
  const view = await render(<PrimaryButton tone={tone}>Create proposal</PrimaryButton>);
  expect(view.getByRole('button')).toHaveStyle({ backgroundColor });
  expect(view.getByText('Create proposal')).toHaveStyle({ color: '#FFFFFF' });
  expect(view.getByRole('button').props.accessibilityState.disabled).toBe(false);
});
test.each([['245B87', 'E8F1FA'], ['8A5A00', 'FFF4DE'], ['B14B56', 'FCECED'], ['627168', 'FFFFFF'], ['FFFFFF', '16764C'], ['FFFFFF', '6A5D9F']])('reviewed text pair #%s on #%s reaches 4.5:1', (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
});
