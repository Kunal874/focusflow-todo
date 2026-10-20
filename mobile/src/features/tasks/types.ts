export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';
export type SortMode = 'smart' | 'deadline' | 'schedule' | 'priority';
export type Task = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  deadlineAt: string;
  priority: Priority;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateTaskInput = Pick<
  Task,
  'title' | 'description' | 'scheduledAt' | 'deadlineAt' | 'priority'
>;
export type UpdateTaskInput = Partial<CreateTaskInput & { status: TaskStatus }>;
