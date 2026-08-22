import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  test('debug render result', () => {
    const result = render(<App />);

    console.log('RENDER RESULT:', Object.keys(result));

    expect(result).toBeTruthy();
  });
});