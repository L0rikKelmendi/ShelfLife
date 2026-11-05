jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-router', () => ({
  router: {
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));
// Calendar layout is exercised by the browser flow; keep form tests independent
// of the native Modal implementation.
jest.mock('../src/components/Calendar', () => () => null);

const { AccessibilityInfo } = require('react-native');
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
