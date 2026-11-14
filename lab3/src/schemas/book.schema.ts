import { z } from 'zod';

export const genreSchema = z.enum([
  'fiction',
  'fantasy',
  'science',
  'history',
  'biography',
]);

export const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  year: z.number().int().min(1450).max(new Date().getFullYear()),
  genre: genreSchema,
});

export const updateSchema = createSchema.partial();

export const filterSchema = z.object({
  genre: genreSchema.optional(),
  search: z.string().min(1).optional(),
});

export type CreateBookInput = z.infer<typeof createSchema>;
export type UpdateBookInput = z.infer<typeof updateSchema>;
export type BookFilters = z.infer<typeof filterSchema>;

export type Book = CreateBookInput & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
