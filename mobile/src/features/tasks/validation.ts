import type { CreateTaskInput } from './types';
export function validateTaskInput(
  input: CreateTaskInput,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.title.trim() || input.title.trim().length > 120)
    errors.title = 'Use a title of 1–120 characters.';
  if (!input.description.trim() || input.description.trim().length > 2000)
    errors.description = 'Use a description of 1–2000 characters.';
  if (!Number.isFinite(Date.parse(input.scheduledAt)))
    errors.scheduledAt = 'Choose a valid scheduled time.';
  if (!Number.isFinite(Date.parse(input.deadlineAt)))
    errors.deadlineAt = 'Choose a valid deadline.';
  if (
    !errors.scheduledAt &&
    !errors.deadlineAt &&
    Date.parse(input.scheduledAt) > Date.parse(input.deadlineAt)
  ) {
    errors.deadlineAt = 'Deadline must be on or after the scheduled time.';
  }
  return errors;
}
export function toIsoDateTime(date: Date): string {
  return date.toISOString();
}
