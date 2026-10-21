import * as Keychain from 'react-native-keychain';
export const TOKEN_SERVICE = 'focusflow.session';
const SERVER_SERVICE = 'focusflow.server';
export async function readToken(): Promise<string | null> {
  const value = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
  return value ? value.password : null;
}
export async function writeToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('session', token, {
    service: TOKEN_SERVICE,
  });
}
export async function clearToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}
export async function readServerUrl(): Promise<string | null> {
  const value = await Keychain.getGenericPassword({ service: SERVER_SERVICE });
  return value ? value.password : null;
}
export async function writeServerUrl(url: string): Promise<void> {
  await Keychain.setGenericPassword('server', url, { service: SERVER_SERVICE });
}
