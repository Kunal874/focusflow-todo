import request from 'supertest';
import mongoose from 'mongoose';
import {createApp} from '../src/app.js';

const app = createApp({jwtSecret: 'test-only-secret-with-at-least-32-bytes', port: 3000});

it('reports the connected database', async () => {
  const response = await request(app).get('/api/health');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({status: 'ok', database: 'connected'});
});

it('returns 503 when the database is unavailable', async () => {
  const client = mongoose.connection.getClient();
  const uri = client.options.hosts[0].toString();
  await mongoose.disconnect();
  try {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('DATABASE_UNAVAILABLE');
  } finally {
    await mongoose.connect('mongodb://' + uri, {dbName: 'focusflow_test'});
  }
});

it('normalizes invalid JSON and rejects oversized requests', async () => {
  const malformed = await request(app).post('/api/auth/login')
    .set('Content-Type', 'application/json').send('{');
  expect(malformed.status).toBe(400);
  expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
  const large = await request(app).post('/api/auth/login').send({data: 'x'.repeat(40000)});
  expect(large.status).toBe(413);
  expect(large.body.error.code).toBe('PAYLOAD_TOO_LARGE');
});
