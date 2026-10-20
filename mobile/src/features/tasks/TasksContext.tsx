import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from './types';
import { useAuth } from '../auth/AuthContext';
import { tasksReducer, type TasksAction } from './tasksReducer';
export type TasksValue = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pendingIds: string[];
  refresh(): Promise<void>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  remove(id: string): Promise<void>;
};
const Context = createContext<TasksValue | null>(null);
export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { api } = useAuth();
  if (!api) throw new Error('A signed-in session is required.');
  const [state, dispatch] = useReducer(tasksReducer, {
    tasks: [],
    loading: true,
    error: null,
    pendingIds: [],
  });
  const alive = useRef(true);
  const generation = useRef(0);
  const sequence = useRef(0);
  const version = useRef(0);
  const pending = useRef(new Map<string, Promise<unknown>>());
  const refresh = useCallback(async (): Promise<void> => {
    const id = ++sequence.current;
    const startedVersion = version.current;
    dispatch({ type: 'loading', value: true });
    try {
      const result = await api.request<{ tasks: Task[] }>('/tasks');
      if (!alive.current || id !== sequence.current) return;
      if (startedVersion === version.current)
        dispatch({ type: 'replace', tasks: result.tasks });
      else void refresh().catch(() => {});
    } catch (error) {
      if (alive.current && id === sequence.current) {
        dispatch({
          type: 'failure',
          message:
            error instanceof Error
              ? error.message
              : 'Could not load your tasks.',
        });
      }
      throw error;
    } finally {
      if (alive.current && id === sequence.current)
        dispatch({ type: 'loading', value: false });
    }
  }, [api]);
  const invalidate = useCallback(() => {
    alive.current = false;
    generation.current++;
    sequence.current++;
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh().catch(() => {});
    return invalidate;
  }, [refresh, invalidate]);
  const run = useCallback(
    <T,>(
      id: string,
      work: () => Promise<T>,
      commit: (result: T) => TasksAction,
    ): Promise<T> => {
      const existing = pending.current.get(id);
      if (existing) return existing as Promise<T>;
      const startedGeneration = generation.current;
      dispatch({ type: 'begin', id });
      const operation = (async () => {
        try {
          const result = await work();
          if (!alive.current || startedGeneration !== generation.current)
            throw new Error('Your session changed.');
          version.current++;
          dispatch(commit(result));
          return result;
        } catch (error) {
          if (alive.current && startedGeneration === generation.current) {
            dispatch({
              type: 'failure',
              message:
                error instanceof Error
                  ? error.message
                  : 'Could not save your change.',
            });
          }
          throw error;
        }
      })();
      pending.current.set(id, operation);
      const settle = () => {
        pending.current.delete(id);
        if (alive.current) dispatch({ type: 'done', id });
      };
      void operation.then(settle, settle);
      return operation;
    },
    [],
  );
  const create = useCallback(
    (input: CreateTaskInput) =>
      run(
        'create',
        async () => {
          const result = await api.request<{ task: Task }>('/tasks', {
            method: 'POST',
            body: JSON.stringify(input),
          });
          return result.task;
        },
        task => ({ type: 'upsert', task }),
      ),
    [api, run],
  );
  const update = useCallback(
    (id: string, input: UpdateTaskInput) =>
      run(
        id,
        async () => {
          const result = await api.request<{ task: Task }>(
            '/tasks/' + encodeURIComponent(id),
            { method: 'PATCH', body: JSON.stringify(input) },
          );
          return result.task;
        },
        task => ({ type: 'upsert', task }),
      ),
    [api, run],
  );
  const remove = useCallback(
    (id: string) =>
      run(
        id,
        () =>
          api.request<void>('/tasks/' + encodeURIComponent(id), {
            method: 'DELETE',
          }),
        () => ({ type: 'remove', id }),
      ),
    [api, run],
  );
  return (
    <Context.Provider value={{ ...state, refresh, create, update, remove }}>
      {children}
    </Context.Provider>
  );
}
export function useTasks(): TasksValue {
  const value = useContext(Context);
  if (!value) throw new Error('TasksProvider is missing.');
  return value;
}
