import {model, Schema} from 'mongoose';

const taskSchema = new Schema({
  ownerId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  title: {type: String, required: true},
  description: {type: String, required: true},
  scheduledAt: {type: Date, required: true},
  deadlineAt: {type: Date, required: true},
  priority: {type: String, enum: ['low', 'medium', 'high'], default: 'medium', required: true},
  status: {type: String, enum: ['pending', 'completed'], default: 'pending', required: true},
  completedAt: {type: Date, default: null},
}, {
  timestamps: true,
  // Prevent concurrent one-field edits from bypassing the combined-date invariant.
  optimisticConcurrency: true,
});
taskSchema.index({ownerId: 1, createdAt: -1});
export const Task = model('Task', taskSchema);

export function publicTask(task: {
  _id: unknown; title: string; description: string; scheduledAt: Date; deadlineAt: Date;
  priority: string; status: string; completedAt?: Date | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: String(task._id), title: task.title, description: task.description,
    scheduledAt: task.scheduledAt.toISOString(), deadlineAt: task.deadlineAt.toISOString(),
    priority: task.priority, status: task.status,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString(),
  };
}
