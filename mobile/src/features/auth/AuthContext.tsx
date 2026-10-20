import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import { ApiClient, ApiError } from '../../lib/api';
import { connectionConfig, normalizeServerUrl } from '../../lib/config';
import {
  readToken,
  writeToken,
  clearToken,
  readServerUrl,
  writeServerUrl,
} from '../../lib/session';
import type { User, AuthSession } from './types';
import { authReducer } from './authReducer';

export type AuthValue = {
  status: 'restoring' | 'signedOut' | 'signedIn';
  user: User | null;
  error: string | null;
  serverUrl: string;
  api: ApiClient | null;
  sessionKey: number;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  retryRestore(): Promise<void>;
  changeServer(url: string): Promise<void>;
};
const Context = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const defaultUrl: string = connectionConfig.apiBaseUrl;
  const [state, dispatch] = useReducer(authReducer, {
    status: 'restoring',
    user: null,
    error: null,
    serverUrl: defaultUrl,
    api: null,
    sessionKey: 0,
  });
  const epoch = useRef(0);
  const active = useRef(true);
  const server = useRef(defaultUrl);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const flight = useRef<Promise<void> | null>(null);
  const current = useCallback(
    (id: number) => active.current && epoch.current === id,
    [],
  );
  const persist = useCallback(
    (token: string | null, id: number) => {
      // Serialize native writes so a late sign-in cannot overwrite a newer logout.
      const operation = storageQueue.current
        .catch(() => {})
        .then(async () => {
          if (!current(id)) return;
          if (token) await writeToken(token);
          else await clearToken();
        });
      storageQueue.current = operation;
      return operation;
    },
    [current],
  );
  const expire = useCallback(
    (id: number) => {
      if (!current(id)) return;
      const next = ++epoch.current;
      dispatch({
        type: 'out',
        serverUrl: server.current,
        sessionKey: next,
        error: 'Your session expired. Sign in again.',
      });
      void persist(null, next).catch(() => {
        if (current(next))
          dispatch({
            type: 'error',
            message:
              'Could not clear the saved session. Please sign out again.',
          });
      });
    },
    [current, persist],
  );
  const establish = useCallback(
    (user: User, token: string, id: number) => {
      if (!current(id)) return;
      dispatch({
        type: 'in',
        user,
        serverUrl: server.current,
        sessionKey: id,
        api: new ApiClient(server.current, token, () => expire(id)),
      });
    },
    [current, expire],
  );
  const retryRestore = useCallback(async () => {
    const id = ++epoch.current;
    dispatch({ type: 'restoring' });
    try {
      const [savedUrl, token] = await Promise.all([
        readServerUrl(),
        readToken(),
      ]);
      if (!current(id)) return;
      server.current = normalizeServerUrl(savedUrl || defaultUrl);
      if (!token) {
        dispatch({ type: 'out', serverUrl: server.current, sessionKey: id });
        return;
      }
      const result = await new ApiClient(server.current, token).request<{
        user: User;
      }>('/auth/me');
      establish(result.user, token, id);
    } catch (error) {
      if (!current(id)) return;
      if (error instanceof ApiError && error.status === 401) {
        await persist(null, id);
        if (current(id))
          dispatch({
            type: 'out',
            serverUrl: server.current,
            sessionKey: id,
            error: 'Your session expired. Sign in again.',
          });
      } else {
        dispatch({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Could not restore your sign-in. Try again.',
        });
      }
    }
  }, [current, defaultUrl, establish, persist]);
  const invalidate = useCallback(() => {
    active.current = false;
    epoch.current++;
  }, []);
  useEffect(() => {
    active.current = true;
    void retryRestore();
    return invalidate;
  }, [retryRestore, invalidate]);
  const authenticate = useCallback(
    (mode: 'login' | 'register', email: string, password: string) => {
      if (flight.current) return flight.current;
      const id = ++epoch.current;
      dispatch({ type: 'error', message: null });
      const operation = (async () => {
        const url = normalizeServerUrl(server.current);
        const result = await new ApiClient(url).request<AuthSession>(
          '/auth/' + mode,
          {
            method: 'POST',
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              password,
            }),
          },
        );
        if (!current(id)) return;
        await persist(result.accessToken, id);
        establish(result.user, result.accessToken, id);
      })();
      flight.current = operation;
      const done = () => {
        if (flight.current === operation) flight.current = null;
      };
      void operation.then(done, done);
      return operation;
    },
    [current, establish, persist],
  );
  const signIn = useCallback(
    (email: string, password: string) => authenticate('login', email, password),
    [authenticate],
  );
  const signUp = useCallback(
    (email: string, password: string) =>
      authenticate('register', email, password),
    [authenticate],
  );
  const signOut = useCallback(async () => {
    const id = ++epoch.current;
    flight.current = null;
    await persist(null, id);
    if (current(id))
      dispatch({ type: 'out', serverUrl: server.current, sessionKey: id });
  }, [current, persist]);
  const changeServer = useCallback(
    async (input: string) => {
      const url = normalizeServerUrl(input);
      const id = ++epoch.current;
      flight.current = null;
      await persist(null, id);
      const operation = storageQueue.current.then(async () => {
        if (current(id)) await writeServerUrl(url);
      });
      storageQueue.current = operation;
      await operation;
      if (current(id)) {
        server.current = url;
        dispatch({ type: 'out', serverUrl: url, sessionKey: id });
      }
    },
    [current, persist],
  );
  return (
    <Context.Provider
      value={{ ...state, signIn, signUp, signOut, retryRestore, changeServer }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth(): AuthValue {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is missing.');
  return value;
}
