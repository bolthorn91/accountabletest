import { ObjectId } from 'mongodb';
import { BookEntity } from './Book';

export interface BorrowedBook {
  bookId: ObjectId;
  borrowedAt: Date;
  dueDate: Date;
  returned: boolean;
  returnedAt?: Date;
}

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  walletBalance: number;
  borrowedBooks: BorrowedBook[];
}

export class UserEntity implements User {
  _id?: ObjectId;
  name: string;
  email: string;
  walletBalance: number;
  borrowedBooks: BorrowedBook[];

  constructor(user: User) {
    this._id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.walletBalance = user.walletBalance;
    this.borrowedBooks = user.borrowedBooks || [];
  }

  canBorrowBook(book: BookEntity): boolean {
    // Check if user has enough balance
    if (this.walletBalance < 3) {
      return false;
    }
    // Check if user has already borrowed 3 books
    const activeBorrows = this.borrowedBooks.filter(b => !b.returned);
    if (activeBorrows.length >= 3) {
      console.log('already has 3 books', {this: this}) 
      return false;
    }
    // Check if user has already borrowed this book
    const alreadyBorrowed = activeBorrows.some(b => b.bookId.toString() === book._id?.toString());
    if (alreadyBorrowed) {
      console.log('already has this book', {this: this});
      return false;
    }

    return true;
  }

  borrowBook(bookId: ObjectId): void {
    // Deduct fee from wallet
    this.walletBalance -= 3;

    // Add book to borrowed books
    const dueDate = new Date();
    if (process.env.NODE_ENV === 'production') {
      dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period
    } else {
      dueDate.setMinutes(dueDate.getMinutes() + 2); // 2 minutes loan period
    }

    this.borrowedBooks.push({
      bookId,
      borrowedAt: new Date(),
      dueDate,
      returned: false
    });
  }

  returnBook(bookId: ObjectId): number {
    const bookIndex = this.borrowedBooks.findIndex(
      b => !b.returned && b.bookId.toString() === bookId.toString()
    );

    if (bookIndex === -1) {
      throw new Error('Book not found in borrowed books');
    }

    const book = this.borrowedBooks[bookIndex];
    book.returned = true;
    book.returnedAt = new Date();

    // Calculate late fee if any
    let lateFee = 0;
    if (book.returnedAt > book.dueDate) {
      if (process.env.NODE_ENV === 'production') {
        // Production: charge by day
        const daysLate = Math.ceil(
          (book.returnedAt.getTime() - book.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        lateFee = daysLate * 0.2; // 0.2€ per day
      } else {
        // Non-production: charge by minute
        const minutesLate = Math.ceil(
          (book.returnedAt.getTime() - book.dueDate.getTime()) / (1000 * 60)
        );
        lateFee = minutesLate * (0.2 / (24 * 60)); // 0.2€ per day converted to per minute
      }
    }

    return lateFee;
  }

  getActiveBorrowedBooks(): BorrowedBook[] {
    return this.borrowedBooks.filter(b => !b.returned);
  }

  deductFromWallet(amount: number): void {
    if (this.walletBalance < amount) {
      throw new Error('Insufficient balance');
    }
    this.walletBalance -= amount;
  }

  addToWallet(amount: number): void {
    this.walletBalance += amount;
  }
} 