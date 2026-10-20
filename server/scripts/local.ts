import {randomBytes} from 'node:crypto';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import mongoose from 'mongoose';
import {startLocalDatabase} from './localDatabase.js';
import {createApp} from '../src/app.js';
import {connectDatabase} from '../src/db.js';
import {readConfig} from '../src/config.js';

// This starts a real, loopback-only mongod with persistent files, not a mock database.
const dbPath = resolve('.local/mongodb');
mkdirSync(dbPath, {recursive: true});
if (!existsSync('.env')) {
  writeFileSync('.env', [
    'PORT=3000', 'MONGODB_URI=mongodb://127.0.0.1:27017/focusflow',
    'JWT_SECRET=' + randomBytes(32).toString('hex'), 'NODE_ENV=development', '',
  ].join('\n'), {mode: 0o600, flag: 'wx'});
}
process.loadEnvFile('.env');
const config = readConfig();
if (config.mongoUri !== 'mongodb://127.0.0.1:27017/focusflow') {
  throw new Error('dev:local uses its own local database. Use npm run dev for a configured external database.');
}
const {mongo, uri} = await startLocalDatabase(dbPath);
await connectDatabase(uri);
const server = createApp(config).listen(config.port, '0.0.0.0', () => {
  console.log('FocusFlow local API ready on port ' + config.port + '. MongoDB data persists in server/.local/mongodb.');
});
const shutdown = () => {
  server.close(() => {
    void mongoose.disconnect().then(() => mongo.stop({doCleanup: false})).then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
