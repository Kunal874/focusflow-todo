import type { Task } from './types';
export type TasksState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pendingIds: string[];
};
export type TasksAction =
  | { type: 'loading'; value: boolean }
  | { type: 'failure'; message: string }
  | { type: 'replace'; tasks: Task[] }
  | { type: 'upsert'; task: Task }
  | { type: 'remove'; id: string }
  | { type: 'begin' | 'done'; id: string };
export function tasksReducer(
  state: TasksState,
  action: TasksAction,
): TasksState {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.value,
        ...(action.value ? { error: null } : {}),
      };
    case 'failure':
      return { ...state, error: action.message };
    case 'replace':
      return { ...state, tasks: action.tasks, error: null };
    case 'upsert':
      return {
        ...state,
        tasks: [
          action.task,
          ...state.tasks.filter(task => task.id !== action.task.id),
        ],
        error: null,
      };
    case 'remove':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.id),
        error: null,
      };
    case 'begin':
      return {
        ...state,
        pendingIds: [...state.pendingIds, action.id],
        error: null,
      };
    case 'done':
      return {
        ...state,
        pendingIds: state.pendingIds.filter(id => id !== action.id),
      };
  }
}
