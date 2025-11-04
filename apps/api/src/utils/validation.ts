import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(20).optional(),
});

export const dateRangeSchema = z.object({
  from: z.string().optional(), // Accept date or datetime strings
  to: z.string().optional(),
});

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[a-z]/, 'Must contain lowercase').regex(/[0-9]/, 'Must contain number').regex(/[^A-Za-z0-9]/, 'Must contain special char');

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/).optional();

