export type AppConfig = {jwtSecret: string; port: number; trustProxy?: number};

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  if (!env.MONGODB_URI?.startsWith('mongodb')) {
    throw new Error('Set MONGODB_URI to a MongoDB connection string.');
  }
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET) < 32 ||
      env.JWT_SECRET.startsWith('replace-')) {
    throw new Error('Set JWT_SECRET to at least 32 random bytes.');
  }
  return {
    port, mongoUri: env.MONGODB_URI, jwtSecret: env.JWT_SECRET,
    trustProxy: env.TRUST_PROXY === '1' ? 1 : undefined,
  };
}
