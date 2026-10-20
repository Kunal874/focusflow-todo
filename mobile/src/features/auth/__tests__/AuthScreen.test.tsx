import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AuthScreen } from '../AuthScreen';
import { useAuth, type AuthValue } from '../AuthContext';
jest.mock('../AuthContext', () => ({ useAuth: jest.fn() }));
const signIn = jest.fn(),
  signUp = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    status: 'signedOut',
    user: null,
    error: null,
    serverUrl: 'http://10.0.2.2:3000/api',
    signIn,
    signUp,
    changeServer: jest.fn(),
  } as unknown as AuthValue);
});
it('validates required input without calling the API', async () => {
  await render(<AuthScreen mode="login" onSwitch={() => {}} />);
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  expect(signIn).not.toHaveBeenCalled();
});
it('submits once while pending and preserves form data on an error', async () => {
  let fail!: (error: Error) => void;
  signIn.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      }),
  );
  await render(<AuthScreen mode="login" onSwitch={() => {}} />);
  fireEvent.changeText(screen.getByLabelText('Email'), 'a@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'long-password');
  fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  fireEvent.press(screen.getByRole('button', { name: 'Signing in…' }));
  expect(signIn).toHaveBeenCalledTimes(1);
  await act(async () => {
    fail(new Error('Email or password is incorrect.'));
  });
  expect(
    await screen.findByText('Email or password is incorrect.'),
  ).toBeTruthy();
  expect(screen.getByLabelText('Email').props.value).toBe('a@example.com');
});
it('requires matching confirmation when creating an account', async () => {
  await render(<AuthScreen mode="register" onSwitch={() => {}} />);
  fireEvent.changeText(screen.getByLabelText('Email'), 'a@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'long-password');
  fireEvent.changeText(
    screen.getByLabelText('Confirm password'),
    'different-password',
  );
  fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('Passwords must match.')).toBeTruthy();
  expect(signUp).not.toHaveBeenCalled();
});
