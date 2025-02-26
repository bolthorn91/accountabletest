import { Request, Response } from 'express';
import { BookService } from '../../application/services/BookService';
import { BookSearchQuery } from '../../domain/repositories/BookRepository';

export class BookController {
  constructor(private bookService: BookService) {}

  async getBooks(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const books = await this.bookService.getAllBooks(page, limit);
      const total = await this.bookService.getTotalBooks();
      
      res.json({
        data: books,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  }

  async getBookById(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.bookService.getBookById(req.params.id);
      
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch book' });
    }
  }

  async searchBooks(req: Request, res: Response): Promise<void> {
    try {
      const { title, author, year, page = '1', limit = '10' } = req.query;
      
      const searchQuery: BookSearchQuery = {};
      
      if (title) searchQuery.title = title as string;
      if (author) searchQuery.author = author as string;
      if (year) searchQuery.year = parseInt(year as string);
      
      const books = await this.bookService.searchBooks(
        searchQuery,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      res.json({
        data: books,
        meta: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          count: books.length,
          filters: searchQuery
        }
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async createBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.bookService.createBook(req.body);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async updateBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.bookService.updateBook(req.params.id, req.body);
      
      if (!book) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      
      res.json(book);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async deleteBook(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.bookService.deleteBook(req.params.id);
      
      if (!success) {
        res.status(404).json({ error: 'Book not found' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
} 