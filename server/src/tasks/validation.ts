import {z} from 'zod';

const fields = {
  title: z.string().trim().min(1, 'Add a title.').max(120),
  description: z.string().trim().min(1, 'Add a description.').max(2000),
  scheduledAt: z.iso.datetime({offset: true}),
  deadlineAt: z.iso.datetime({offset: true}),
  priority: z.enum(['low', 'medium', 'high']),
};
const datesInOrder = (task: {scheduledAt: string; deadlineAt: string}) =>
  Date.parse(task.scheduledAt) <= Date.parse(task.deadlineAt);
const dateError = {message: 'Deadline must be on or after the scheduled time.', path: ['deadlineAt']};
export const createTaskSchema = z.object({
  ...fields, priority: fields.priority.default('medium'),
}).strict().refine(datesInOrder, dateError);
export const updateTaskSchema = z.object({
  ...fields, status: z.enum(['pending', 'completed']),
}).partial().strict().refine(value => Object.keys(value).length > 0, 'Choose something to update.');
export const mergedTaskSchema = z.object(fields).refine(datesInOrder, dateError);
