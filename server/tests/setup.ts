import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {afterAll, beforeAll, beforeEach} from 'vitest';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), {dbName: 'focusflow_test'});
});

beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
