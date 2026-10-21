import {MongoMemoryServer} from 'mongodb-memory-server';

export async function startLocalDatabase(dbPath: string, port = 27017) {
  const mongo = await MongoMemoryServer.create({
    instance: {port, ip: '127.0.0.1', dbName: 'focusflow', dbPath, storageEngine: 'wiredTiger'},
  });
  // Port selection may move the managed instance when another service owns the preferred port.
  return {mongo, uri: mongo.getUri('focusflow')};
}
