import {createServer} from 'node:net';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import mongoose from 'mongoose';
import {startLocalDatabase} from '../scripts/localDatabase.js';

it('connects to its managed database when the requested port is occupied', async () => {
  const occupied = createServer();
  occupied.listen(0);
  await once(occupied, 'listening');
  const address = occupied.address();
  if (!address || typeof address === 'string') throw new Error('No TCP port');
  const dbPath = await mkdtemp(join(tmpdir(), 'focusflow-local-'));
  let database: Awaited<ReturnType<typeof startLocalDatabase>> | undefined;
  try {
    database = await startLocalDatabase(dbPath, address.port);
    expect(new URL(database.uri).port).not.toBe(String(address.port));
    const connection = await mongoose.createConnection(database.uri).asPromise();
    try {
      expect(connection.name).toBe('focusflow');
      expect((await connection.db!.admin().ping()).ok).toBe(1);
    } finally {
      await connection.close();
    }
  } finally {
    await database?.mongo.stop();
    occupied.close();
    await rm(dbPath, {recursive: true, force: true});
  }
});
