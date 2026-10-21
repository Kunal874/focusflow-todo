import { sortTasks, filterTasks } from '../sortTasks';
import type { Task } from '../types';
const now = Date.parse('2030-01-01T12:00:00Z');
const make = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  title: id,
  description: 'Description',
  priority: 'medium',
  status: 'pending',
  completedAt: null,
  scheduledAt: '2030-01-01T09:00:00Z',
  deadlineAt: '2030-01-02T12:00:00Z',
  createdAt: '2029-01-01T00:00:00Z',
  updatedAt: '2029-01-01T00:00:00Z',
  ...extra,
});
const ids = (tasks: Task[]) => tasks.map(task => task.id);
it('puts overdue pending first, then higher scores, with completed last', () => {
  const tasks = [
    make('done', { status: 'completed', completedAt: '2030-01-01T11:00:00Z' }),
    make('low', { priority: 'low' }),
    make('high', { priority: 'high' }),
    make('overdue', { priority: 'low', deadlineAt: '2030-01-01T10:00:00Z' }),
  ];
  const before = JSON.stringify(tasks);
  expect(ids(sortTasks(tasks, 'smart', now))).toEqual([
    'overdue',
    'high',
    'low',
    'done',
  ]);
  expect(JSON.stringify(tasks)).toBe(before);
});
it('mixes deadline and schedule urgency with priority', () => {
  const tasks = [
    make('distant-high', {
      priority: 'high',
      scheduledAt: '2030-01-10T00:00:00Z',
      deadlineAt: '2030-01-11T00:00:00Z',
    }),
    make('due-low', { priority: 'low', deadlineAt: '2030-01-01T12:00:00Z' }),
  ];
  expect(ids(sortTasks(tasks, 'smart', now))).toEqual([
    'due-low',
    'distant-high',
  ]);
  const schedule = [
    make('later', { scheduledAt: '2030-01-02T09:00:00Z' }),
    make('ready'),
  ];
  expect(ids(sortTasks(schedule, 'smart', now))).toEqual(['ready', 'later']);
});
it('uses stable ties and completedAt order', () => {
  const tasks = [
    make('b'),
    make('a'),
    make('old', { status: 'completed', completedAt: '2029-01-01T00:00:00Z' }),
    make('new', { status: 'completed', completedAt: '2029-02-01T00:00:00Z' }),
  ];
  expect(ids(sortTasks(tasks, 'smart', now))).toEqual(['a', 'b', 'new', 'old']);
});
it('supports each alternative sort and combined filters', () => {
  const tasks = [
    make('later'),
    make('earlier', {
      deadlineAt: '2030-01-01T18:00:00Z',
      scheduledAt: '2030-01-01T08:00:00Z',
      priority: 'high',
    }),
  ];
  for (const mode of ['deadline', 'schedule', 'priority'] as const) {
    expect(ids(sortTasks(tasks, mode, now))).toEqual(['earlier', 'later']);
  }
  expect(ids(filterTasks(tasks, 'pending', 'high'))).toEqual(['earlier']);
  expect(filterTasks(tasks, 'completed', 'all')).toEqual([]);
  expect(filterTasks([], 'all', 'all')).toEqual([]);
});
it('re-ranks when the clock crosses a deadline', () => {
  const tasks = [
    make('high', { priority: 'high' }),
    make('crossing', { priority: 'low', deadlineAt: '2030-01-01T12:00:01Z' }),
  ];
  expect(ids(sortTasks(tasks, 'smart', now + 2000))[0]).toBe('crossing');
});
