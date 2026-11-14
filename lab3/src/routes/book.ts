import { Request, Response, Router } from 'express';
import {
  CreateBookInput,
  UpdateBookInput,
  createSchema,
  filterSchema,
  updateSchema,
} from '../schemas/book.schema';
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  getClassicBooks,
  updateBook,
} from '../storage/book';
import { AppError } from '../middleware/AppError';
import { validate } from '../middleware/validate';
const router = Router();
router.get('/', (req: Request, res: Response) => {
  const filters = filterSchema.parse(req.query);
  res.status(200).json(getAllBooks(filters));
});

router.get('/classics', (_req: Request, res: Response) => {
  res.status(200).json(getClassicBooks());
});

router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const book = getBookById(req.params.id);
  if (!book) {
    throw new AppError(404, 'Book not found');
  }
  res.status(200).json(book);
});

router.post(
  '/',
  validate(createSchema),
  (req: Request<object, unknown, CreateBookInput>, res: Response) => {
    res.status(201).json(createBook(req.body));
  }
);

router.patch(
  '/:id',
  validate(updateSchema),
  (req: Request<{ id: string }, unknown, UpdateBookInput>, res: Response) => {
    const book = updateBook(req.params.id, req.body);
    if (!book) {
      throw new AppError(404, 'Book not found');
    }
    res.status(200).json(book);
  }
);

router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  if (!deleteBook(req.params.id)) {
    throw new AppError(404, 'Book not found');
  }
  res.status(204).send();
});
export default router;
