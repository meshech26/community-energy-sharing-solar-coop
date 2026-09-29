import { fireEvent, render } from '@testing-library/react-native';
import SearchField from '../components/SearchField';

test.each([
  ['Search households', 'Clear household search', '#6A5D9F'],
  ['Search members', 'Clear member search', '#356FA3'],
  ['Search proposals', 'Clear proposal search', '#16764C'],
])('%s shares typography, accessible clearing and focus styling', async (label, clearLabel, accentColor) => {
  const onChangeText = jest.fn();
  const view = await render(<SearchField label={label} clearLabel={clearLabel} accentColor={accentColor} value="Lake" onChangeText={onChangeText} />);
  const input = view.getByLabelText(label);
  expect(view.getByText(label)).toBeTruthy();
  expect(input).toHaveStyle({ fontSize: 14, minHeight: 48, padding: 12 });
  expect(input.parent).toHaveStyle({ borderRadius: 12, backgroundColor: '#FFFFFF' });
  await fireEvent(input, 'focus');
  expect(input.parent).toHaveStyle({ borderColor: accentColor });
  await fireEvent.changeText(input, 'Perera');
  expect(onChangeText).toHaveBeenCalledWith('Perera');
  await fireEvent.press(view.getByLabelText(clearLabel));
  expect(onChangeText).toHaveBeenLastCalledWith('');
});
