import { ObjectId } from 'mongodb';
import { Book } from '../models/Book';

export interface BookRepository {
  findById(id: ObjectId): Promise<Book | null>;
  findByIsbn(isbn: string): Promise<Book | null>;
  findAll(page: number, limit: number): Promise<Book[]>;
  search(query: BookSearchQuery, page: number, limit: number): Promise<Book[]>;
  create(book: Book): Promise<Book>;
  update(id: ObjectId, book: Partial<Book>): Promise<Book | null>;
  delete(id: ObjectId): Promise<boolean>;
  count(): Promise<number>;
}

export interface BookSearchQuery {
  title?: string;
  author?: string;
  year?: number;
}

