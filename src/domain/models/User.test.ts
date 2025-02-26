import { ObjectId } from 'mongodb';
import { User, UserEntity } from './User';
import { BookEntity } from './Book';

describe('UserEntity', () => {
  let userData: User;
  let userEntity: UserEntity;

  beforeEach(() => {
    userData = {
      _id: new ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      walletBalance: 50,
      borrowedBooks: []
    };
    
    userEntity = new UserEntity(userData);
  });

  describe('constructor', () => {
    it('should create a user entity with the provided data', () => {
      expect(userEntity._id).toEqual(userData._id);
      expect(userEntity.name).toEqual(userData.name);
      expect(userEntity.email).toEqual(userData.email);
      expect(userEntity.walletBalance).toEqual(userData.walletBalance);
      expect(userEntity.borrowedBooks).toEqual(userData.borrowedBooks);
    });

    it('should set default values for missing properties', () => {
      const minimalUserData = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const entity = new UserEntity(minimalUserData as User);
      
      expect(entity.walletBalance).toBeUndefined();
      expect(entity.borrowedBooks).toEqual([]);
    });
  });

  describe('canBorrowBook', () => {
    it('should return true when user has enough balance and less than 3 borrowed books', () => {
      const book = {
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
      
      expect(userEntity.canBorrowBook(book as BookEntity)).toBe(true);
    });

    it('should return false when user has insufficient balance', () => {
      userEntity.walletBalance = 2;
      
      const book = {
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
      
      expect(userEntity.canBorrowBook(book as BookEntity)).toBe(false);
    });

    it('should return false when user has already borrowed 3 books', () => {
      userEntity.borrowedBooks = [
        { bookId: new ObjectId(), borrowedAt: new Date(), dueDate: new Date(), returned: false },
        { bookId: new ObjectId(), borrowedAt: new Date(), dueDate: new Date(), returned: false },
        { bookId: new ObjectId(), borrowedAt: new Date(), dueDate: new Date(), returned: false }
      ];
      
      const book = {
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
      
      expect(userEntity.canBorrowBook(book as BookEntity)).toBe(false);
    });
  });

  describe('borrowBook', () => {
    it('should add a book to borrowedBooks', () => {
      const bookId = new ObjectId();
      
      userEntity.borrowBook(bookId);
      
      expect(userEntity.borrowedBooks.length).toBe(1);
      expect(userEntity.borrowedBooks[0].bookId).toEqual(bookId);
      expect(userEntity.borrowedBooks[0].returned).toBe(false);
      expect(userEntity.borrowedBooks[0].borrowedAt).toBeInstanceOf(Date);
      expect(userEntity.borrowedBooks[0].dueDate).toBeInstanceOf(Date);
    });
  });

  describe('returnBook', () => {
    it('should mark a borrowed book as returned', () => {
      const bookId = new ObjectId();
      userEntity.borrowedBooks = [
        { bookId, borrowedAt: new Date(), dueDate: new Date(), returned: false }
      ];
      
      userEntity.returnBook(bookId);
      
      expect(userEntity.borrowedBooks[0].returned).toBe(true);
      expect(userEntity.borrowedBooks[0].returnedAt).toBeInstanceOf(Date);
    });

    it('should throw an error if book is not found in borrowedBooks', () => {
      const bookId1 = new ObjectId();
      const bookId2 = new ObjectId();
      
      userEntity.borrowedBooks = [
        { bookId: bookId1, borrowedAt: new Date(), dueDate: new Date(), returned: false }
      ];
      
      expect(() => userEntity.returnBook(bookId2)).toThrow('Book not found in borrowed books');
    });
  });

  describe('addToWallet', () => {
    it('should increase wallet balance by the specified amount', () => {
      const initialBalance = userEntity.walletBalance;
      const amount = 25;
      
      userEntity.addToWallet(amount);
      
      expect(userEntity.walletBalance).toEqual(initialBalance + amount);
    });
  });

  describe('deductFromWallet', () => {
    it('should decrease wallet balance by the specified amount', () => {
      const initialBalance = userEntity.walletBalance;
      const amount = 20;
      
      userEntity.deductFromWallet(amount);
      
      expect(userEntity.walletBalance).toEqual(initialBalance - amount);
    });

    it('should throw an error if balance is insufficient', () => {
      userEntity.walletBalance = 10;
      const amount = 20;
      
      expect(() => userEntity.deductFromWallet(amount)).toThrow('Insufficient balance');
    });
  });
}); 