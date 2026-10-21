import type { ApiClient } from '../../lib/api';
import type { User } from './types';
export type AuthState = {
  status: 'restoring' | 'signedOut' | 'signedIn';
  user: User | null;
  error: string | null;
  serverUrl: string;
  api: ApiClient | null;
  sessionKey: number;
};
export type AuthAction =
  | { type: 'restoring' }
  | { type: 'error'; message: string | null }
  | { type: 'out'; serverUrl: string; sessionKey: number; error?: string }
  | {
      type: 'in';
      serverUrl: string;
      sessionKey: number;
      user: User;
      api: ApiClient;
    };
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  if (action.type === 'restoring')
    return { ...state, status: 'restoring', error: null };
  if (action.type === 'error') return { ...state, error: action.message };
  if (action.type === 'out')
    return {
      status: 'signedOut',
      user: null,
      api: null,
      error: action.error ?? null,
      serverUrl: action.serverUrl,
      sessionKey: action.sessionKey,
    };
  return {
    status: 'signedIn',
    user: action.user,
    api: action.api,
    error: null,
    serverUrl: action.serverUrl,
    sessionKey: action.sessionKey,
  };
}
