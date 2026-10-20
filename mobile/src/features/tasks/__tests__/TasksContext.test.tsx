import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { TasksProvider, useTasks, type TasksValue } from '../TasksContext';
import { useAuth, type AuthValue } from '../../auth/AuthContext';
import { ApiClient } from '../../../lib/api';
import type { Task } from '../types';
jest.mock('../../auth/AuthContext', () => ({ useAuth: jest.fn() }));
const task: Task = {
  id: 'one',
  title: 'Saved task',
  description: 'Details',
  priority: 'high',
  status: 'pending',
  scheduledAt: '2030-01-01T09:00:00Z',
  deadlineAt: '2030-01-02T09:00:00Z',
  completedAt: null,
  createdAt: '2030-01-01T00:00:00Z',
  updatedAt: '2030-01-01T00:00:00Z',
};
const response = (status: number, body?: unknown) =>
  ({
    status,
    ok: status < 300,
    text: async () => JSON.stringify(body),
  } as Response);
const fetchMock = jest.fn();
let latest: TasksValue;
function Probe() {
  latest = useTasks();
  return (
    <>
      <Text>{latest.tasks.map(item => item.title).join(',')}</Text>
      <Text>{latest.error}</Text>
    </>
  );
}
beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
  jest.mocked(useAuth).mockReturnValue({
    api: new ApiClient('https://example.com/api', 'a-token'),
  } as AuthValue);
});
const mount = async () => {
  await render(
    <TasksProvider>
      <Probe />
    </TasksProvider>,
  );
};

it('loads persisted tasks and keeps them on failed refresh/delete', async () => {
  fetchMock.mockResolvedValueOnce(response(200, { tasks: [task] }));
  await mount();
  await screen.findByText('Saved task');
  fetchMock.mockRejectedValueOnce(new TypeError('Offline'));
  await act(async () => {
    await expect(latest.remove(task.id)).rejects.toThrow();
  });
  expect(screen.getByText('Saved task')).toBeTruthy();
  fetchMock.mockRejectedValueOnce(new TypeError('Offline'));
  await act(async () => {
    await expect(latest.refresh()).rejects.toThrow();
  });
  expect(screen.getByText('Saved task')).toBeTruthy();
});
it('waits for server confirmation and deduplicates a pending creation', async () => {
  fetchMock.mockResolvedValueOnce(response(200, { tasks: [] }));
  await mount();
  await act(async () => {});
  let finish!: (value: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const input = {
    title: task.title,
    description: task.description,
    scheduledAt: task.scheduledAt,
    deadlineAt: task.deadlineAt,
    priority: task.priority,
  };
  let first!: Promise<Task>, second!: Promise<Task>;
  await act(async () => {
    first = latest.create(input);
    second = latest.create(input);
  });
  expect(latest.tasks).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    finish(response(201, { task }));
    await first;
    await second;
  });
  expect(latest.tasks).toEqual([task]);
});
it('does not leak a delayed response into a newly mounted user workspace', async () => {
  let finish!: (value: Response) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const first = await render(
    <TasksProvider>
      <Probe />
    </TasksProvider>,
  );
  await first.unmount();
  fetchMock.mockResolvedValueOnce(
    response(200, { tasks: [{ ...task, id: 'two', title: 'User B task' }] }),
  );
  await mount();
  await screen.findByText('User B task');
  await act(async () => {
    finish(response(200, { tasks: [task] }));
  });
  expect(screen.queryByText('Saved task')).toBeNull();
  expect(screen.getByText('User B task')).toBeTruthy();
});

it.each(['edit', 'delete'] as const)(
  'queues a distinct %s after a pending completion',
  async action => {
    fetchMock.mockResolvedValueOnce(response(200, { tasks: [task] }));
    await mount();
    await screen.findByText('Saved task');
    let finish!: (value: Response) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve;
        }),
    );
    fetchMock.mockResolvedValueOnce(
      action === 'edit'
        ? response(200, {
            task: { ...task, title: 'Edited task', status: 'completed' },
          })
        : response(204),
    );
    let completion!: Promise<Task>;
    let next!: Promise<unknown>;
    await act(async () => {
      completion = latest.update(task.id, { status: 'completed' });
      next =
        action === 'edit'
          ? latest.update(task.id, { title: 'Edited task' })
          : latest.remove(task.id);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      finish(response(200, { task: { ...task, status: 'completed' } }));
      await completion;
      await next;
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].method).toBe(
      action === 'edit' ? 'PATCH' : 'DELETE',
    );
    expect(latest.tasks).toEqual(
      action === 'edit'
        ? [
            expect.objectContaining({
              title: 'Edited task',
              status: 'completed',
            }),
          ]
        : [],
    );
    expect(latest.pendingIds).toEqual([]);
  },
);
