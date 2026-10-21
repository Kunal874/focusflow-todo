import type {ErrorRequestHandler} from 'express';
import mongoose from 'mongoose';
import {ZodError} from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) { next(error); return; }
  if (error instanceof ApiError) {
    res.status(error.status).json({error: {code: error.code, message: error.message}});
    return;
  }
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.');
      if (field && !fields[field]) fields[field] = issue.message;
    }
    res.status(400).json({error: {
      code: 'VALIDATION_ERROR', message: 'Check your details and try again.', fields,
    }});
    return;
  }
  if (error instanceof mongoose.Error.VersionError) {
    res.status(409).json({error: {
      code: 'CONFLICT', message: 'This task changed. Refresh and try again.',
    }});
    return;
  }
  if (typeof error === 'object' && error !== null && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({error: {code: 'VALIDATION_ERROR', message: 'Request must contain valid JSON.'}});
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({error: {code: 'PAYLOAD_TOO_LARGE', message: 'This request is too large.'}});
      return;
    }
  }
  res.status(500).json({error: {code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.'}});
};
