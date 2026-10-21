/* global fetch, console */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';

// Dedicated local verification only; never send test writes to a hosted database.
const base = 'http://127.0.0.1:3000/api';
async function call(path, method = 'GET', body, token) {
  const response = await fetch(base + path, {
    method,
    headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {})},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {status: response.status, body: response.status === 204 ? undefined : await response.json()};
}
assert.equal((await call('/health')).status, 200);
const suffix = Date.now().toString();
const password = randomBytes(18).toString('base64url');
const a = await call('/auth/register', 'POST', {email: 'qa-a-' + suffix + '@example.test', password});
const b = await call('/auth/register', 'POST', {email: 'qa-b-' + suffix + '@example.test', password});
assert.equal(a.status, 201); assert.equal(b.status, 201);
const login = await call('/auth/login', 'POST', {email: a.body.user.email, password});
assert.equal(login.status, 200);
const token = login.body.accessToken;
assert.equal((await call('/auth/me', 'GET', undefined, token)).body.user.id, a.body.user.id);
const input = {
  title: 'Local API verification', description: 'Synthetic task created and deleted by the smoke check.',
  scheduledAt: '2030-01-01T09:00:00Z', deadlineAt: '2030-01-02T09:00:00Z', priority: 'high',
};
const created = await call('/tasks', 'POST', input, token);
assert.equal(created.status, 201);
const path = '/tasks/' + created.body.task.id;
assert.equal((await call('/tasks', 'GET', undefined, token)).body.tasks.length, 1);
assert.equal((await call(path, 'PATCH', {title: 'Edited verification'}, b.body.accessToken)).status, 404);
assert.equal((await call('/tasks', 'GET', undefined, b.body.accessToken)).body.tasks.length, 0);
assert.equal((await call(path, 'PATCH', {deadlineAt: '2020-01-01T00:00:00Z'}, token)).status, 400);
const done = await call(path, 'PATCH', {status: 'completed'}, token);
assert.equal(done.body.task.status, 'completed'); assert.ok(done.body.task.completedAt);
assert.equal((await call(path, 'PATCH', {status: 'pending'}, token)).body.task.completedAt, null);
assert.equal((await call(path, 'DELETE', undefined, token)).status, 204);
assert.deepEqual((await call('/tasks', 'GET', undefined, token)).body.tasks, []);
console.log('LOCAL_API_SMOKE_OK: health, registration, login, task persistence, dates, completion/reopen, deletion, and two-user isolation.');
