import { ObjectId } from 'mongodb';
import { Book, BookEntity } from './Book';

describe('BookEntity', () => {
  let bookData: Book;
  let bookEntity: BookEntity;

  beforeEach(() => {
    bookData = {
      _id: new ObjectId(),
      isbn: '9781234567897',
      title: 'Test Book',
      author: 'Test Author',
      publicationYear: 2023,
      publisher: 'Test Publisher',
      retailPrice: 29.99,
      totalCopies: 5,
      availableCopies: 3
    };
    
    bookEntity = new BookEntity(bookData);
  });

  describe('constructor', () => {
    it('should create a book entity with the provided data', () => {
      expect(bookEntity._id).toEqual(bookData._id);
      expect(bookEntity.isbn).toEqual(bookData.isbn);
      expect(bookEntity.title).toEqual(bookData.title);
      expect(bookEntity.author).toEqual(bookData.author);
      expect(bookEntity.publicationYear).toEqual(bookData.publicationYear);
      expect(bookEntity.publisher).toEqual(bookData.publisher);
      expect(bookEntity.retailPrice).toEqual(bookData.retailPrice);
      expect(bookEntity.totalCopies).toEqual(bookData.totalCopies);
      expect(bookEntity.availableCopies).toEqual(bookData.availableCopies);
    });

    it('should set default values for missing properties', () => {
      const minimalBookData = {
        isbn: '9781234567897',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 29.99
      };
      
      const entity = new BookEntity(minimalBookData as Book);
      
      expect(entity.totalCopies).toEqual(4);
      expect(entity.availableCopies).toEqual(4);
    });
  });

  describe('isAvailable', () => {
    it('should return true when there are available copies', () => {
      expect(bookEntity.isAvailable()).toBe(true);
    });

    it('should return false when there are no available copies', () => {
      bookEntity.availableCopies = 0;
      expect(bookEntity.isAvailable()).toBe(false);
    });
  });

  describe('borrow', () => {
    it('should decrease available copies by 1', () => {
      const initialAvailableCopies = bookEntity.availableCopies;
      
      bookEntity.borrow();
      
      expect(bookEntity.availableCopies).toEqual(initialAvailableCopies - 1);
    });

    it('should throw an error if no copies are available', () => {
      bookEntity.availableCopies = 0;
      
      expect(() => bookEntity.borrow()).toThrow('Book is not available');
    });
  });

  describe('return', () => {
    it('should increase available copies by 1', () => {
      bookEntity.availableCopies = bookEntity.totalCopies - 1;
      const initialAvailableCopies = bookEntity.availableCopies;
      
      bookEntity.return();
      
      expect(bookEntity.availableCopies).toEqual(initialAvailableCopies + 1);
    });

    it('should throw an error if trying to return more books than total copies', () => {
      bookEntity.availableCopies = bookEntity.totalCopies;
      
      expect(() => bookEntity.return()).toThrow('Cannot return more books than total copies');
    });
  });
}); 