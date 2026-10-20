/* eslint-env jest */
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => true),
  resetGenericPassword: jest.fn(async () => true),
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
const { NativeModules } = require('react-native');
NativeModules.FocusFlowConfig = {
  apiBaseUrl: 'http://10.0.2.2:3000/api',
  allowHttp: true,
};
