import {model, Schema} from 'mongoose';

const userSchema = new Schema({
  email: {type: String, required: true, unique: true},
  passwordHash: {type: String, required: true, select: false},
}, {timestamps: true});

export const User = model('User', userSchema);

export function publicUser(user: {_id: unknown; email: string; createdAt: Date}) {
  return {id: String(user._id), email: user.email, createdAt: user.createdAt.toISOString()};
}
