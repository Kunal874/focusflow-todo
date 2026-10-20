import React from 'react';
import { Alert } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { TaskFormScreen } from '../TaskFormScreen';
import { useTasks, type TasksValue } from '../TasksContext';
jest.mock('../TasksContext', () => ({ useTasks: jest.fn() }));
jest.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: { open: jest.fn() },
}));
const create = jest.fn(),
  update = jest.fn(),
  remove = jest.fn();
const onBack = jest.fn();
const task = {
  id: 'one',
  title: 'Saved title',
  description: 'Saved description',
  scheduledAt: '2030-01-01T09:00:00Z',
  deadlineAt: '2030-01-02T09:00:00Z',
  priority: 'high',
  status: 'pending',
  completedAt: null,
  createdAt: '2030-01-01T00:00:00Z',
  updatedAt: '2030-01-01T00:00:00Z',
} as const;
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useTasks).mockReturnValue({
    tasks: [task],
    pendingIds: [],
    create,
    update,
    remove,
  } as unknown as TasksValue);
});
it('requires title and description before saving', async () => {
  await render(<TaskFormScreen onBack={onBack} />);
  fireEvent.press(screen.getByRole('button', { name: 'Create task' }));
  expect(
    await screen.findByText('Use a title of 1–120 characters.'),
  ).toBeTruthy();
  expect(create).not.toHaveBeenCalled();
});
it('creates once with all fields and navigates only after confirmation', async () => {
  let finish!: () => void;
  create.mockImplementation(
    () =>
      new Promise(resolve => {
        finish = () => resolve(task);
      }),
  );
  await render(<TaskFormScreen onBack={onBack} />);
  fireEvent.changeText(screen.getByLabelText('Title'), 'New title');
  fireEvent.changeText(screen.getByLabelText('Description'), 'New details');
  fireEvent.press(screen.getByRole('button', { name: 'High priority' }));
  fireEvent.press(screen.getByRole('button', { name: 'Create task' }));
  fireEvent.press(screen.getByRole('button', { name: 'Saving…' }));
  expect(create).toHaveBeenCalledTimes(1);
  expect(create.mock.calls[0][0]).toMatchObject({
    title: 'New title',
    description: 'New details',
    priority: 'high',
  });
  expect(Number.isFinite(Date.parse(create.mock.calls[0][0].scheduledAt))).toBe(
    true,
  );
  expect(onBack).not.toHaveBeenCalled();
  await act(async () => {
    finish();
  });
  await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
});
it('keeps saved values on an API error and confirms deletion', async () => {
  update.mockRejectedValueOnce(new Error('Server unavailable. Try again.'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await render(<TaskFormScreen taskId="one" onBack={onBack} />);
  fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(
    await screen.findByText('Server unavailable. Try again.'),
  ).toBeTruthy();
  expect(screen.getByLabelText('Title').props.value).toBe('Saved title');
  fireEvent.press(screen.getByRole('button', { name: 'Delete task' }));
  expect(remove).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2]!;
  remove.mockResolvedValueOnce(undefined);
  await act(async () => {
    buttons.find(button => button.text === 'Delete')!.onPress?.();
  });
  expect(remove).toHaveBeenCalledWith('one');
  alert.mockRestore();
});
