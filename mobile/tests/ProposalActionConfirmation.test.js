import { cleanup, fireEvent, render } from '@testing-library/react-native';
import ProposalActionConfirmation from '../components/community/ProposalActionConfirmation';

afterEach(cleanup);

test.each([
  ['archive', 'Archive proposal?', 'Cancel', 'Archive'],
  ['delete', 'Delete draft?', 'Keep Draft', 'Delete Draft'],
  ['publish', 'Publish proposal?', 'Keep Editing', 'Publish'],
])('shared %s confirmation keeps the correct labels and closes without fallback content', async (action, title, cancel, confirm) => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();
  const view = await render(<ProposalActionConfirmation action={action} onCancel={onCancel} onConfirm={onConfirm} />);
  expect(view.getByText(title)).toBeTruthy();
  await fireEvent.press(view.getByText(cancel));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
  await fireEvent.press(view.getByText(confirm));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  await view.rerender(<ProposalActionConfirmation action={null} onCancel={onCancel} onConfirm={onConfirm} />);
  expect(view.toJSON()).toBeNull();
});
