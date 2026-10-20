import React from 'react';
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import * as Keychain from 'react-native-keychain';
import { AuthProvider, useAuth, type AuthValue } from '../AuthContext';
import { TOKEN_SERVICE } from '../../../lib/session';

const user = {
  id: 'account-a',
  email: 'a@example.com',
  createdAt: '2030-01-01T00:00:00Z',
};
const session = {
  user,
  accessToken: 'new-token',
  expiresAt: '2030-01-01T01:00:00Z',
};
const response = (status: number, body: unknown) =>
  ({
    status,
    ok: status < 300,
    text: async () => JSON.stringify(body),
  } as Response);
const fetchMock = jest.fn();
let latest: AuthValue;
function Probe() {
  latest = useAuth();
  return (
    <>
      <Text>{latest.status}</Text>
      <Text>{latest.user?.email}</Text>
      <Text>{latest.error}</Text>
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(Keychain.getGenericPassword).mockResolvedValue(false);
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
});
const mount = async () => {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
};
const savedToken = () =>
  jest.mocked(Keychain.getGenericPassword).mockImplementation(async options =>
    options?.service === TOKEN_SERVICE
      ? ({
          username: 'session',
          password: 'saved-token',
          service: TOKEN_SERVICE,
          storage: 'KeystoreAESGCM',
        } as Keychain.UserCredentials)
      : false,
  );

it('signs in, securely persists the token and clears it on logout', async () => {
  fetchMock.mockResolvedValue(response(200, session));
  await mount();
  await screen.findByText('signedOut');
  await act(async () => {
    await latest.signIn('a@example.com', 'long-password');
  });
  expect(screen.getByText(user.email)).toBeTruthy();
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'session',
    'new-token',
    { service: TOKEN_SERVICE },
  );
  await act(async () => {
    await latest.signOut();
  });
  expect(screen.getByText('signedOut')).toBeTruthy();
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
    service: TOKEN_SERVICE,
  });
});
it('restores a stored token through /auth/me', async () => {
  savedToken();
  fetchMock.mockResolvedValue(response(200, { user }));
  await mount();
  await screen.findByText(user.email);
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/auth\/me$/);
});
it('keeps the credential on network failure and allows restoration retry', async () => {
  savedToken();
  fetchMock.mockRejectedValueOnce(new TypeError('Offline'));
  await mount();
  await waitFor(() => expect(latest.error).toMatch(/Cannot reach/));
  expect(latest.status).toBe('restoring');
  expect(Keychain.resetGenericPassword).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(response(200, { user }));
  await act(async () => {
    await latest.retryRestore();
  });
  expect(screen.getByText(user.email)).toBeTruthy();
});
it('clears an expired token on a confirmed 401', async () => {
  savedToken();
  fetchMock.mockResolvedValue(
    response(401, { error: { code: 'UNAUTHORIZED', message: 'Expired' } }),
  );
  await mount();
  await screen.findByText('signedOut');
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
    service: TOKEN_SERVICE,
  });
});
it('ignores a delayed login response after logout', async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  await mount();
  await screen.findByText('signedOut');
  let login!: Promise<void>;
  await act(async () => {
    login = latest.signIn('a@example.com', 'long-password');
  });
  await act(async () => {
    await latest.signOut();
    finish(response(200, session));
    await login;
  });
  expect(screen.getByText('signedOut')).toBeTruthy();
  expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
});
