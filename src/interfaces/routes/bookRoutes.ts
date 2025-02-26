import { Router } from 'express';
import { BookController } from '../controllers/BookController';

export const bookRoutes = (bookController: BookController): Router => {
  const router = Router();

  router.get('/', bookController.getBooks.bind(bookController));
  router.get('/search', bookController.searchBooks.bind(bookController));
  router.get('/:id', bookController.getBookById.bind(bookController));
  router.post('/', bookController.createBook.bind(bookController));
  router.put('/:id', bookController.updateBook.bind(bookController));
  router.delete('/:id', bookController.deleteBook.bind(bookController));

  return router;
}; 