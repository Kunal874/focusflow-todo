import request from 'supertest';
import {createApp} from '../src/app.js';

let app: ReturnType<typeof createApp>;
let token: string;
const input = {
  title: 'Finish assignment',
  description: 'Build and demonstrate the Android app.',
  scheduledAt: '2030-01-01T09:00:00.000Z',
  deadlineAt: '2030-01-02T12:00:00.000Z',
  priority: 'high',
};

beforeEach(async () => {
  app = createApp({jwtSecret: 'test-only-secret-with-at-least-32-bytes', port: 3000});
  const response = await request(app).post('/api/auth/register')
    .send({email: 'a@example.com', password: 'long-enough-password'});
  expect(response.status).toBe(201);
  token = response.body.accessToken;
});
const api = (method: 'get'|'post'|'patch'|'delete', path: string) =>
  request(app)[method]('/api/tasks' + path).auth(token, {type: 'bearer'});

it('persists all task fields, edits, completes idempotently, reopens and deletes', async () => {
  const created = await api('post', '').send(input);
  expect(created.status).toBe(201);
  const task = created.body.task;
  expect(task).toMatchObject({...input, status: 'pending', completedAt: null});
  expect(task.ownerId).toBeUndefined();
  expect(task._id).toBeUndefined();
  expect((await api('get', '')).body.tasks).toEqual([task]);
  const edited = await api('patch', '/' + task.id).send({title: 'Edited', description: 'More detail'});
  expect(edited.status).toBe(200);
  expect(edited.body.task.priority).toBe('high');
  const completed = await api('patch', '/' + task.id).send({status: 'completed'});
  expect(completed.body.task.completedAt).toEqual(expect.any(String));
  const repeated = await api('patch', '/' + task.id).send({status: 'completed'});
  expect(repeated.body.task.completedAt).toBe(completed.body.task.completedAt);
  const reopened = await api('patch', '/' + task.id).send({status: 'pending'});
  expect(reopened.body.task.completedAt).toBeNull();
  expect((await api('delete', '/' + task.id)).status).toBe(204);
  expect((await api('get', '')).body.tasks).toEqual([]);
});

it('isolates two accounts and hides ownership behind 404', async () => {
  const created = await api('post', '').send(input);
  expect(created.status).toBe(201);
  const id = created.body.task.id;
  const second = await request(app).post('/api/auth/register')
    .send({email: 'b@example.com', password: 'long-enough-password'});
  const bToken = second.body.accessToken;
  expect((await request(app).get('/api/tasks').auth(bToken, {type: 'bearer'})).body.tasks).toEqual([]);
  for (const method of ['patch', 'delete'] as const) {
    const response = await request(app)[method]('/api/tasks/' + id)
      .auth(bToken, {type: 'bearer'}).send({title: 'Stolen'});
    expect(response.status).toBe(404);
  }
  expect((await api('get', '')).body.tasks[0].title).toBe(input.title);
  expect((await request(app).get('/api/tasks')).status).toBe(401);
});

it('validates merged dates, enums, unknown fields, and IDs', async () => {
  for (const invalid of [
    {...input, title: ' '}, {...input, description: ''}, {...input, priority: 'urgent'},
    {...input, scheduledAt: '2030-02-31T09:00:00Z'}, {...input, scheduledAt: '2030-01-01T09:00:00'},
    {...input, scheduledAt: '2031-01-01T09:00:00Z'}, {...input, ownerId: 'injected'},
  ]) {
    expect((await api('post', '').send(invalid)).status).toBe(400);
  }
  const created = await api('post', '').send(input);
  const id = created.body.task.id;
  expect((await api('patch', '/' + id).send({deadlineAt: '2020-01-01T00:00:00Z'})).status).toBe(400);
  expect((await api('patch', '/' + id).send({scheduledAt: '2031-01-01T00:00:00Z'})).status).toBe(400);
  expect((await api('patch', '/' + id).send({})).status).toBe(400);
  expect((await api('patch', '/' + id).send({completedAt: '2020-01-01T00:00:00Z'})).status).toBe(400);
  expect((await api('patch', '/invalid-id').send({title: 'Edit'})).status).toBe(400);
  expect((await api('delete', '/000000000000000000000000')).status).toBe(404);
});

it('accepts past/equal dates and defaults priority to medium', async () => {
  const response = await api('post', '').send({
    title: 'Overdue', description: 'Still needs doing',
    scheduledAt: '2020-01-01T00:00:00Z', deadlineAt: '2020-01-01T00:00:00Z',
  });
  expect(response.status).toBe(201);
  expect(response.body.task.priority).toBe('medium');
});
