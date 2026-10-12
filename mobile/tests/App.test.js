jest.mock('../MapWrapper', () => 'MapWrapper');
jest.mock('../StripeWrapper', () => ({
  StripeProvider: ({ children }) => children,
  CardField: 'CardField',
  useStripe: () => ({ confirmPayment: jest.fn() }),
}));
jest.mock('../global.css', () => ({}));
jest.mock('expo-linking', () => ({
  createURL: (path) => 'exp://' + path,
}));

import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  test('debug render result', () => {
    const result = render(<App />);

    console.log('RENDER RESULT:', Object.keys(result));

    expect(result).toBeTruthy();
  });
});