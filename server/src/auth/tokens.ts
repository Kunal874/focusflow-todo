import jwt from 'jsonwebtoken';
import {publicUser} from './User.js';

export const tokenOptions = {issuer: 'focusflow-api', audience: 'focusflow-mobile'} as const;

export function createSession(user: Parameters<typeof publicUser>[0], secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  return {
    user: publicUser(user),
    accessToken: jwt.sign({sub: String(user._id), iat: issuedAt}, secret, {
      ...tokenOptions, algorithm: 'HS256', expiresIn: 3600,
    }),
    expiresAt: new Date((issuedAt + 3600) * 1000).toISOString(),
  };
}
