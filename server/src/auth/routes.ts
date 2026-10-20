import {Router} from 'express';
import {rateLimit} from 'express-rate-limit';
import * as argon2 from 'argon2';
import type {AppConfig} from '../config.js';
import {ApiError} from '../middleware/errorHandler.js';
import {requireAuth} from '../middleware/requireAuth.js';
import {User, publicUser} from './User.js';
import {credentialsSchema} from './validation.js';
import {createSession} from './tokens.js';

export function authRoutes(config: AppConfig) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({error: {
      code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a minute and try again.',
    }}),
  });
  router.post('/register', limiter, async (req, res) => {
    const {email, password} = credentialsSchema.parse(req.body);
    await User.init();
    const passwordHash = await argon2.hash(password, {type: argon2.argon2id});
    try {
      const user = await User.create({email, passwordHash});
      res.status(201).json(createSession(user, config.jwtSecret));
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        throw new ApiError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');
      }
      throw error;
    }
  });
  router.post('/login', limiter, async (req, res) => {
    const {email, password} = credentialsSchema.parse(req.body);
    const user = await User.findOne({email}).select('+passwordHash');
    if (!user || !await argon2.verify(user.passwordHash, password)) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    res.json(createSession(user, config.jwtSecret));
  });
  router.get('/me', requireAuth(config.jwtSecret), async (_req, res) => {
    const user = await User.findById(res.locals.userId).orFail();
    res.json({user: publicUser(user)});
  });
  return router;
}
