import { cleanup, render } from '@testing-library/react-native';
import ConfirmationDialog from '../components/ConfirmationDialog';

afterEach(cleanup);

test('closing an archive dialog never renders fallback publish labels, even as hidden content', async () => {
  const view = await render(
    <ConfirmationDialog visible title="Archive proposal?" cancelLabel="Cancel" confirmLabel="Archive">
      Keep this proposal in history.
    </ConfirmationDialog>
  );
  expect(view.getByText('Archive proposal?')).toBeTruthy();
  await view.rerender(
    <ConfirmationDialog visible={false} title="Publish proposal?" cancelLabel="Keep Editing" confirmLabel="Publish">
      Publish this proposal.
    </ConfirmationDialog>
  );
  expect(view.toJSON()).toBeNull();
  expect(view.queryByText('Keep Editing', { includeHiddenElements: true })).toBeNull();
  expect(view.queryByText('Publish', { includeHiddenElements: true })).toBeNull();
  await view.rerender(
    <ConfirmationDialog visible title="Publish proposal?" cancelLabel="Keep Editing" confirmLabel="Publish">
      Publish this proposal.
    </ConfirmationDialog>
  );
  expect(view.getByText('Publish proposal?')).toBeTruthy();
  expect(view.getByText('Keep Editing')).toBeTruthy();
});
