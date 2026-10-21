import {Router} from 'express';
import mongoose from 'mongoose';
import type {AppConfig} from '../config.js';
import {requireAuth} from '../middleware/requireAuth.js';
import {ApiError} from '../middleware/errorHandler.js';
import {Task, publicTask} from './Task.js';
import {createTaskSchema, mergedTaskSchema, updateTaskSchema} from './validation.js';

export function taskRoutes(config: AppConfig) {
  const router = Router();
  router.use(requireAuth(config.jwtSecret));
  router.param('id', (_req, _res, next, id: string) => {
    next(mongoose.isObjectIdOrHexString(id) ? undefined :
      new ApiError(400, 'VALIDATION_ERROR', 'This task ID is invalid.'));
  });
  router.get('/', async (_req, res) => {
    const tasks = await Task.find({ownerId: res.locals.userId}).sort({createdAt: -1, _id: 1});
    res.json({tasks: tasks.map(publicTask)});
  });
  router.post('/', async (req, res) => {
    const input = createTaskSchema.parse(req.body);
    const task = await Task.create({...input, ownerId: res.locals.userId});
    res.status(201).json({task: publicTask(task)});
  });
  router.patch('/:id', async (req, res) => {
    const input = updateTaskSchema.parse(req.body);
    const task = await Task.findOne({_id: req.params.id, ownerId: res.locals.userId});
    if (!task) throw new ApiError(404, 'NOT_FOUND', 'This task was not found.');
    const merged = mergedTaskSchema.parse({
      title: input.title ?? task.title, description: input.description ?? task.description,
      scheduledAt: input.scheduledAt ?? task.scheduledAt.toISOString(),
      deadlineAt: input.deadlineAt ?? task.deadlineAt.toISOString(),
      priority: input.priority ?? task.priority,
    });
    task.set(merged);
    if (input.status && input.status !== task.status) {
      task.status = input.status;
      task.completedAt = input.status === 'completed' ? new Date() : null;
    }
    await task.save();
    res.json({task: publicTask(task)});
  });
  router.delete('/:id', async (req, res) => {
    const result = await Task.deleteOne({_id: req.params.id, ownerId: res.locals.userId});
    if (!result.deletedCount) throw new ApiError(404, 'NOT_FOUND', 'This task was not found.');
    res.status(204).end();
  });
  return router;
}
