import request from 'supertest';
import app from '../src/app';
import { resetStorage } from '../src/storage/book';
const validBook =
    {
  title: 'Dune',
  description: 'Science fiction novel',
  year: 1965,
  genre: 'fiction',
};

async function addBook(data: object = validBook)
{
  return request(app).post('/api/books').send(data);
}

beforeEach(() => {
  resetStorage();
});

describe('POST /api/books', () => {
  it('should create a book and return 201', async () => {
    const res = await addBook();
    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toMatchObject(validBook);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('should create a book without optional description', async () => {
    const res = await addBook({ title: 'Emma', year: 1815, genre: 'fiction' });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('description');
  });

  it('should return 400 if title is empty', async () => {
    const res = await addBook({ ...validBook, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details[0].path).toBe('title');
  });

  it('should return 400 if title is longer than 100 characters', async () => {
    const res = await addBook({ ...validBook, title: 'a'.repeat(101) });
    expect(res.status).toBe(400);
  });

  it('should return 400 if description is too long', async () => {
    const res = await addBook({ ...validBook, description: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });

  it('should return 400 if year is out of range', async () => {
    const tooOld = await addBook({ ...validBook, year: 1000 });
    const future = await addBook({
      ...validBook,
      year: new Date().getFullYear() + 1,
    });
    const notInteger = await addBook({ ...validBook, year: 1999.5 });
    expect(tooOld.status).toBe(400);
    expect(future.status).toBe(400);
    expect(notInteger.status).toBe(400);
  });

  it('should return 400 if genre is not allowed', async () => {
    const res = await addBook({ ...validBook, genre: 'cooking' });
    expect(res.status).toBe(400);
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/api/books').send({});
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThanOrEqual(3);
  });

  it('should return 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Content-Type', 'application/json')
      .send('{"title": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid JSON');
  });
});

describe('GET /api/books', () => {
  it('should return empty array when there are no books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return all books', async () => {
    await addBook();
    await addBook({ title: 'Emma', year: 1815, genre: 'fiction' });
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/books with query parameters', () => {
  beforeEach(async () => {
    await addBook({ title: 'Dune', year: 1965, genre: 'fiction' });
    await addBook({ title: 'The Hobbit', year: 1937, genre: 'fantasy' });
    await addBook({ title: 'The Silmarillion', year: 1977, genre: 'fantasy' });
    await addBook({ title: 'Cosmos', year: 1980, genre: 'science' });
  });

  it('should filter by genre', async () => {
    const res = await request(app).get('/api/books?genre=fantasy');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should search by title ignoring case', async () => {
    const res = await request(app).get('/api/books?search=THE');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should combine genre and search', async () => {
    const res = await request(app).get(
      '/api/books?genre=fantasy&search=hobbit'
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('The Hobbit');
  });

  it('should return empty array if nothing matches', async () => {
    const res = await request(app).get('/api/books?genre=history');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 400 for invalid genre', async () => {
    const res = await request(app).get('/api/books?genre=cooking');
    expect(res.status).toBe(400);
  });

  it('should return 400 for empty search', async () => {
    const res = await request(app).get('/api/books?search=');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/books/classics', () => {
  it('should return only books published before 1950', async () => {
    await addBook({ title: 'Dune', year: 1965, genre: 'fiction' });
    await addBook({ title: 'The Hobbit', year: 1937, genre: 'fantasy' });
    await addBook({ title: 'Emma', year: 1815, genre: 'fiction' });
    const res = await request(app).get('/api/books/classics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((book: { year: number }) => book.year < 1950)).toBe(
      true
    );
  });

  it('should return empty array if there are no classics', async () => {
    await addBook({ title: 'Dune', year: 1965, genre: 'fiction' });
    const res = await request(app).get('/api/books/classics');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/books/:id', () => {
  it('should return a book by id', async () => {
    const created = await addBook();
    const res = await request(app).get(`/api/books/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it('should return 404 if book does not exist', async () => {
    const res = await request(app).get('/api/books/unknown-id');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Book not found' });
  });
});

describe('PATCH /api/books/:id', () => {
  it('should update only passed fields', async () => {
    const created = await addBook();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const res = await request(app)
      .patch(`/api/books/${created.body.id}`)
      .send({ title: 'Dune Messiah' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Dune Messiah');
    expect(res.body.year).toBe(validBook.year);
    expect(res.body.createdAt).toBe(created.body.createdAt);
    expect(res.body.updatedAt).not.toBe(created.body.updatedAt);
  });

  it('should return 404 if book does not exist', async () => {
    const res = await request(app).patch('/api/books/unknown-id').send({});
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid data', async () => {
    const created = await addBook();
    const res = await request(app)
      .patch(`/api/books/${created.body.id}`)
      .send({ year: 'old' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe('year');
  });
});

describe('DELETE /api/books/:id', () => {
  it('should delete a book and return 204', async () => {
    const created = await addBook();
    const res = await request(app).delete(`/api/books/${created.body.id}`);
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    const after = await request(app).get(`/api/books/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  it('should return 404 if book does not exist', async () => {
    const res = await request(app).delete('/api/books/unknown-id');
    expect(res.status).toBe(404);
  });
});
