import { NativeModules } from 'react-native';
export const connectionConfig = NativeModules.FocusFlowConfig ?? {
  apiBaseUrl: '',
  allowHttp: false,
};
export function normalizeServerUrl(input: string): string {
  const value = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/\s]+(?:\/[^\s?#]*)?$/.test(value) || /@/.test(value)) {
    throw new Error(
      'Enter a full API address, for example https://your-server.com/api.',
    );
  }
  if (!connectionConfig.allowHttp && !value.startsWith('https://')) {
    throw new Error('Production connections must use HTTPS.');
  }
  return value;
}
