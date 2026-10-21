import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {createApp} from '../src/app.js';

const secret = 'test-only-secret-with-at-least-32-bytes';
const credentials = {email: 'person@example.com', password: 'long-enough-password'};
let app: ReturnType<typeof createApp>;
beforeEach(() => { app = createApp({jwtSecret: secret, port: 3000}); });

it('registers, stores a hash, logs in, and returns the current user', async () => {
  const registered = await request(app).post('/api/auth/register').send(credentials);
  expect(registered.status).toBe(201);
  expect(registered.body.user.email).toBe(credentials.email);
  expect(registered.body.accessToken).toEqual(expect.any(String));
  expect(Date.parse(registered.body.expiresAt)).toBeGreaterThan(Date.now());
  expect(JSON.stringify(registered.body)).not.toContain('password');
  const record = await mongoose.connection.collection('users').findOne({email: credentials.email});
  expect(record?.passwordHash).toMatch(/^\$argon2id\$/);
  expect(record?.passwordHash).not.toBe(credentials.password);
  const login = await request(app).post('/api/auth/login').send(credentials);
  expect(login.status).toBe(200);
  const me = await request(app).get('/api/auth/me')
    .auth(login.body.accessToken, {type: 'bearer'});
  expect(me.status).toBe(200);
  expect(me.body.user.id).toBe(registered.body.user.id);
});

it('normalizes email and rejects duplicate registrations', async () => {
  const first = await request(app).post('/api/auth/register')
    .send({...credentials, email: ' Person@Example.com '});
  expect(first.status).toBe(201);
  expect(first.body.user.email).toBe(credentials.email);
  const duplicate = await request(app).post('/api/auth/register').send(credentials);
  expect(duplicate.status).toBe(409);
  expect(duplicate.body.error.code).toBe('EMAIL_IN_USE');
});

it.each([
  {...credentials, email: 'not-an-email'},
  {...credentials, password: 'short'},
  {...credentials, password: 'x'.repeat(129)},
  {...credentials, ownerId: 'injected'},
])('rejects invalid registration %#', async body => {
  const response = await request(app).post('/api/auth/register').send(body);
  expect(response.status).toBe(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});

it('does not trim passwords and gives generic incorrect-credential errors', async () => {
  const password = '  significant-spaces  ';
  expect((await request(app).post('/api/auth/register').send({...credentials, password})).status).toBe(201);
  const incorrect = await request(app).post('/api/auth/login').send({...credentials, password: password.trim()});
  const missing = await request(app).post('/api/auth/login').send({...credentials, email: 'absent@example.com'});
  expect(incorrect.status).toBe(401);
  expect(missing.status).toBe(401);
  expect(incorrect.body).toEqual(missing.body);
});

it('rejects missing, expired, wrong-audience and wrong-algorithm tokens', async () => {
  const registered = await request(app).post('/api/auth/register').send(credentials);
  expect(registered.status).toBe(201);
  const sub = registered.body.user.id;
  const tokens = [
    '',
    jwt.sign({sub}, secret, {issuer: 'focusflow-api', audience: 'focusflow-mobile', expiresIn: -1}),
    jwt.sign({sub}, secret, {issuer: 'focusflow-api', audience: 'other', expiresIn: '1h'}),
    jwt.sign({sub}, secret, {issuer: 'focusflow-api', audience: 'focusflow-mobile', algorithm: 'HS384'}),
  ];
  for (const token of tokens) {
    const response = await request(app).get('/api/auth/me')
      .set('Authorization', token ? 'Bearer ' + token : '');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  }
});

it('throttles the eleventh authentication attempt in one minute', async () => {
  for (let index = 0; index < 10; index++) {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.status).toBe(400);
  }
  const response = await request(app).post('/api/auth/login').send({});
  expect(response.status).toBe(429);
  expect(response.body.error.code).toBe('RATE_LIMITED');
});
