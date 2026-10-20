import { toIsoDateTime, validateTaskInput } from '../validation';
const valid = {
  title: 'Task',
  description: 'Details',
  scheduledAt: '2030-01-01T09:00:00Z',
  deadlineAt: '2030-01-02T09:00:00Z',
  priority: 'medium' as const,
};
it('rejects empty fields and an inverted schedule/deadline', () => {
  expect(
    validateTaskInput({ ...valid, title: ' ', description: '' }),
  ).toMatchObject({
    title: expect.any(String),
    description: expect.any(String),
  });
  expect(
    validateTaskInput({ ...valid, deadlineAt: '2020-01-01T00:00:00Z' })
      .deadlineAt,
  ).toEqual(expect.any(String));
  expect(
    validateTaskInput({ ...valid, scheduledAt: 'invalid' }).scheduledAt,
  ).toEqual(expect.any(String));
  expect(validateTaskInput(valid)).toEqual({});
});
it('preserves the instant when converting device-local date-times to UTC', () => {
  expect(toIsoDateTime(new Date('2030-01-01T09:00:00+05:30'))).toBe(
    '2030-01-01T03:30:00.000Z',
  );
  expect(() => toIsoDateTime(new Date('invalid'))).toThrow();
});
