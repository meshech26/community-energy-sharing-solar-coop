import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card, DangerButton, SectionHeader, screenSpacing } from '../components/community/CommunityUI';
import BaseCard from '../components/Card';
import VoteConfirmedScreen from '../screens/community/VoteConfirmedScreen';

afterEach(cleanup);

test('vote completion navigation uses light accessible actions with unchanged destinations', async () => {
  const navigation = { replace: jest.fn(), popToTop: jest.fn() };
  const view = await render(<VoteConfirmedScreen navigation={navigation} route={{ params: { proposalId: 'proposal-1' } }} />);
  for (const label of ['Back to proposal', 'Back to Community']) {
    expect(view.getByRole('button', { name: label })).toHaveStyle({ borderColor: '#BFD5C6', borderWidth: 1, minHeight: 52 });
    expect(view.getByText(label)).toHaveStyle({ color: '#14633F' });
    await fireEvent.press(view.getByRole('button', { name: label }));
  }
  expect(navigation.replace).toHaveBeenCalledWith('ProposalDetails', { proposalId: 'proposal-1' });
  expect(navigation.popToTop).toHaveBeenCalledTimes(1);
});

test('compact Community surfaces do not change the global card defaults', async () => {
  const view = await render(<><Card><Text>Community card</Text></Card><BaseCard><Text>Other screen card</Text></BaseCard></>);
  expect(view.getByText('Community card').parent).toHaveStyle({ padding: 16, borderRadius: 12 });
  expect(view.getByText('Other screen card').parent).toHaveStyle({ padding: 20, borderRadius: 16 });
  expect(screenSpacing.paddingHorizontal).toBe(20);
});

test('Community heading retains readable hierarchy and all supporting content', async () => {
  const view = await render(<SectionHeader title="Page title" eyebrow="Community" description="Supporting description" />);
  expect(view.getByRole('header')).toHaveStyle({ fontSize: 26, lineHeight: 32 });
  expect(view.getByText('Supporting description')).toHaveStyle({ fontSize: 16 });
});

test('quiet destructive action keeps its label, touch target and disabled behavior', async () => {
  const onPress = jest.fn();
  const view = await render(<DangerButton onPress={onPress}>Delete Draft</DangerButton>);
  expect(view.getByRole('button')).toHaveStyle({ minHeight: 48, borderColor: '#EEC1C5' });
  expect(view.getByText('Delete Draft')).toHaveStyle({ color: '#B14B56' });
  await fireEvent.press(view.getByRole('button'));
  expect(onPress).toHaveBeenCalledTimes(1);
  await view.rerender(<DangerButton disabled onPress={onPress}>Delete Draft</DangerButton>);
  expect(view.getByRole('button')).toHaveStyle({ backgroundColor: '#E5EBE7', borderColor: '#C8D2CB' });
  expect(view.getByText('Delete Draft')).toHaveStyle({ color: '#526158' });
  await fireEvent.press(view.getByRole('button'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
