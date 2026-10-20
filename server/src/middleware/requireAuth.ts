import type {RequestHandler} from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {User} from '../auth/User.js';
import {tokenOptions} from '../auth/tokens.js';
import {ApiError} from './errorHandler.js';

export function requireAuth(secret: string): RequestHandler {
  return async (req, res, next) => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    let userId: string;
    try {
      if (!match) throw new Error('Missing token');
      const payload = jwt.verify(match[1], secret, {...tokenOptions, algorithms: ['HS256']});
      if (typeof payload !== 'object' || !payload.sub ||
          !mongoose.isObjectIdOrHexString(payload.sub)) throw new Error('Invalid subject');
      userId = payload.sub;
    } catch {
      next(new ApiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.'));
      return;
    }
    if (!await User.exists({_id: userId})) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Please sign in again.'));
      return;
    }
    res.locals.userId = userId;
    next();
  };
}
