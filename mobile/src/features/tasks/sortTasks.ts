import type { Task, SortMode, Priority } from './types';
const weight = { low: 1 / 3, medium: 2 / 3, high: 1 };
const time = (value: string) => Date.parse(value);
const urgency = (value: string, now: number, hours: number) =>
  Math.max(0, Math.min(1, 1 - (time(value) - now) / (hours * 3600000)));
const score = (task: Task, now: number) =>
  50 * weight[task.priority] +
  35 * urgency(task.deadlineAt, now, 72) +
  15 * urgency(task.scheduledAt, now, 24);
const tie = (a: Task, b: Task) =>
  time(a.deadlineAt) - time(b.deadlineAt) ||
  time(a.scheduledAt) - time(b.scheduledAt) ||
  time(a.createdAt) - time(b.createdAt) ||
  a.id.localeCompare(b.id);

export function sortTasks(tasks: Task[], mode: SortMode, now: number): Task[] {
  return tasks.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    if (a.status === 'completed') {
      return (
        time(b.completedAt ?? b.updatedAt) -
          time(a.completedAt ?? a.updatedAt) || a.id.localeCompare(b.id)
      );
    }
    if (mode === 'smart') {
      const overdue =
        Number(time(b.deadlineAt) < now) - Number(time(a.deadlineAt) < now);
      return overdue || score(b, now) - score(a, now) || tie(a, b);
    }
    if (mode === 'deadline')
      return time(a.deadlineAt) - time(b.deadlineAt) || tie(a, b);
    if (mode === 'schedule')
      return time(a.scheduledAt) - time(b.scheduledAt) || tie(a, b);
    return weight[b.priority] - weight[a.priority] || tie(a, b);
  });
}
export function filterTasks(
  tasks: Task[],
  status: 'all' | 'pending' | 'completed',
  priority: 'all' | Priority,
): Task[] {
  return tasks.filter(
    task =>
      (status === 'all' || task.status === status) &&
      (priority === 'all' || task.priority === priority),
  );
}
