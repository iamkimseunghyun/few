import { z } from 'zod';

/**
 * Common schemas used across multiple routers
 */

// Pagination schemas
export const paginationInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const infiniteQueryInput = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  direction: z.enum(["forward", "backward"]).default("forward").optional(),
});

// ID schemas
export const idInput = z.object({
  id: z.string().min(1),
});

// Common field validators
export const usernameSchema = z.string().min(2).max(30).regex(/^[a-zA-Z0-9_-]+$/);
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const ratingSchema = z.number().min(1).max(5);

// Date range schema
export const dateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
});

// Sort schema
export const sortSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.record(z.string(), z.any()).optional(),
});