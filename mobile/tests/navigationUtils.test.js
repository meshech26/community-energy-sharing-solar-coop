import { safeGoBack } from '../utils/navigationUtils';

describe('navigationUtils - safeGoBack', () => {
  test('calls navigation.goBack() when canGoBack() is true', () => {
    const mockGoBack = jest.fn();
    const mockNavigate = jest.fn();
    const navigation = {
      canGoBack: jest.fn(() => true),
      goBack: mockGoBack,
      navigate: mockNavigate,
    };

    safeGoBack(navigation, 'MainTabs');

    expect(navigation.canGoBack).toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('falls back to navigation.navigate() when canGoBack() is false (e.g. after refresh)', () => {
    const mockGoBack = jest.fn();
    const mockNavigate = jest.fn();
    const navigation = {
      canGoBack: jest.fn(() => false),
      goBack: mockGoBack,
      navigate: mockNavigate,
    };

    safeGoBack(navigation, 'MainTabs');

    expect(navigation.canGoBack).toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('MainTabs');
  });

  test('falls back with parameters when provided', () => {
    const mockGoBack = jest.fn();
    const mockNavigate = jest.fn();
    const navigation = {
      canGoBack: jest.fn(() => false),
      goBack: mockGoBack,
      navigate: mockNavigate,
    };

    safeGoBack(navigation, 'MainTabs', { screen: 'Dashboard' });

    expect(mockGoBack).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('MainTabs', { screen: 'Dashboard' });
  });

  test('handles null navigation safely without throwing', () => {
    expect(() => safeGoBack(null)).not.toThrow();
    expect(() => safeGoBack(undefined)).not.toThrow();
  });
});
