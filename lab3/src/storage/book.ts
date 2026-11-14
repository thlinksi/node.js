import { randomUUID } from 'crypto';
import {
  Book,
  BookFilters,
  CreateBookInput,
  UpdateBookInput,
} from '../schemas/book.schema';

const books = new Map<string, Book>();

export function getAllBooks(filters: BookFilters = {}): Book[] {
  const search = filters.search?.toLowerCase();
  return [...books.values()].filter(
    (book) =>
      (filters.genre === undefined || book.genre === filters.genre) &&
      (search === undefined || book.title.toLowerCase().includes(search))
  );
}

export function getClassicBooks(): Book[] {
  return [...books.values()].filter((book) => book.year < 1950);
}

export function getBookById(id: string): Book | undefined {
  return books.get(id);
}

export function createBook(data: CreateBookInput): Book {
  const now = new Date();
  const book: Book = {
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  books.set(book.id, book);
  return book;
}

export function updateBook(
  id: string,
  data: UpdateBookInput
): Book | undefined {
  const existing = books.get(id);
  if (!existing) {
    return undefined;
  }
  const updated: Book = {
    id: existing.id,
    title: data.title ?? existing.title,
    description: data.description ?? existing.description,
    year: data.year ?? existing.year,
    genre: data.genre ?? existing.genre,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  };
  books.set(id, updated);
  return updated;
}

export function deleteBook(id: string): boolean {
  return books.delete(id);
}

export function resetStorage(): void {
  books.clear();
}
