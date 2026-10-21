import {existsSync} from 'node:fs';
import mongoose from 'mongoose';
import {createApp} from './app.js';
import {readConfig} from './config.js';
import {connectDatabase} from './db.js';

if (existsSync('.env')) process.loadEnvFile('.env');

try {
  const config = readConfig();
  await connectDatabase(config.mongoUri);
  const server = createApp(config).listen(config.port, '0.0.0.0', () => {
    console.log('FocusFlow API listening on port ' + config.port);
  });
  const shutdown = () => {
    server.close(() => { void mongoose.disconnect().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  // Driver errors can embed connection details, so never print the raw exception.
  console.error('API startup failed. Check MONGODB_URI, JWT_SECRET, PORT, and database availability.');
  process.exitCode = 1;
  await mongoose.disconnect();
}
