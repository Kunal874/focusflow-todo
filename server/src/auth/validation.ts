import {z} from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  // Spaces are significant in passwords, so deliberately do not trim.
  password: z.string().min(10, 'Use at least 10 characters.').max(128),
}).strict();
