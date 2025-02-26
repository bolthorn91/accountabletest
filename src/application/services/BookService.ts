import { ObjectId } from 'mongodb';
import { Book, BookEntity } from '../../domain/models/Book';
import { BookRepository, BookSearchQuery } from '../../domain/repositories/BookRepository';

export class BookService {
  constructor(private bookRepository: BookRepository) {}

  async getBookById(id: string): Promise<Book | null> {
    return this.bookRepository.findById(new ObjectId(id));
  }

  async getBookByIsbn(isbn: string): Promise<Book | null> {
    return this.bookRepository.findByIsbn(isbn);
  }

  async getAllBooks(page = 1, limit = 10): Promise<Book[]> {
    return this.bookRepository.findAll(page, limit);
  }

  async searchBooks(query: BookSearchQuery, page: number = 1, limit: number = 10): Promise<Book[]> {
    return this.bookRepository.search(query, page, limit);
  }

  async createBook(bookData: Omit<Book, '_id'>): Promise<Book> {
    const book = new BookEntity({
      ...bookData,
      totalCopies: bookData.totalCopies || 4,
      availableCopies: bookData.availableCopies || bookData.totalCopies || 4
    });
    
    return this.bookRepository.create(book);
  }

  async updateBook(id: string, bookData: Partial<Book>): Promise<Book | null> {
    return this.bookRepository.update(new ObjectId(id), bookData);
  }

  async deleteBook(id: string): Promise<boolean> {
    return this.bookRepository.delete(new ObjectId(id));
  }

  async borrowBook(id: string): Promise<Book | null> {
    const book = await this.bookRepository.findById(new ObjectId(id));
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    const bookEntity = new BookEntity(book);
    
    if (!bookEntity.isAvailable()) {
      throw new Error('Book is not available');
    }
    
    bookEntity.borrow();
    
    return this.bookRepository.update(new ObjectId(id), {
      availableCopies: bookEntity.availableCopies
    });
  }

  async returnBook(id: string): Promise<Book | null> {
    const book = await this.bookRepository.findById(new ObjectId(id));
    
    if (!book) {
      throw new Error('Book not found');
    }
    
    const bookEntity = new BookEntity(book);
    bookEntity.return();
    
    return this.bookRepository.update(new ObjectId(id), {
      availableCopies: bookEntity.availableCopies
    });
  }

  async getTotalBooks(): Promise<number> {
    return this.bookRepository.count();
  }
} 