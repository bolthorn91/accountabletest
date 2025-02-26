import { ObjectId } from 'mongodb';

export interface Book {
  _id?: ObjectId;
  isbn: string;
  title: string;
  author: string;
  publicationYear: number;
  publisher: string;
  retailPrice: number;
  totalCopies: number;
  availableCopies: number;
}

export class BookEntity implements Book {
  _id?: ObjectId;
  isbn: string;
  title: string;
  author: string;
  publicationYear: number;
  publisher: string;
  retailPrice: number;
  totalCopies: number;
  availableCopies: number;

  constructor(book: Book) {
    this._id = book._id;
    this.isbn = book.isbn;
    this.title = book.title;
    this.author = book.author;
    this.publicationYear = book.publicationYear;
    this.publisher = book.publisher;
    this.retailPrice = book.retailPrice;
    this.totalCopies = book.totalCopies || 4; // Default to 4 copies per reference
    this.availableCopies = book.availableCopies || this.totalCopies;
  }

  isAvailable(): boolean {
    return this.availableCopies > 0;
  }

  borrow(): void {
    if (!this.isAvailable()) {
      throw new Error('Book is not available');
    }
    this.availableCopies--;
  }

  return(): void {
    if (this.availableCopies >= this.totalCopies) {
      throw new Error('Cannot return more books than total copies');
    }
    this.availableCopies++;
  }
} 