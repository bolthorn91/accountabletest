import { ObjectId } from 'mongodb';
import { Reservation, ReservationEntity } from '../../domain/models/Reservation';
import { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import { BookService } from './BookService';
import { UserService } from './UserService';
import { User, UserEntity } from '../../domain/models/User';
import { Book, BookEntity } from '../../domain/models/Book';

export interface EmailService {
  sendDueReminder(user: User, book: Book, dueDate: Date): Promise<void>;
  sendLateReminder(user: User, book: Book, dueDate: Date, lateFee: number): Promise<void>;
  sendBookPurchaseNotification(user: User, book: Book, amount: number): Promise<void>;
}

export class ReservationService {
  constructor(
    private reservationRepository: ReservationRepository,
    private bookService: BookService,
    private userService: UserService,
    private emailService: EmailService
  ) {}

  async getReservationById(id: string): Promise<Reservation | null> {
    return this.reservationRepository.findById(new ObjectId(id));
  }

  async getReservationsByUserId(userId: string, page = 1, limit = 10): Promise<Reservation[]> {
    return this.reservationRepository.findByUserId(new ObjectId(userId), page, limit);
  }

  async getReservationsByBookId(bookId: string, page = 1, limit = 10): Promise<Reservation[]> {
    return this.reservationRepository.findByBookId(new ObjectId(bookId), page, limit);
  }

  async createReservation(userId: string, bookId: string): Promise<Reservation> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const book = await this.bookService.getBookById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    const userEntity = new UserEntity(user);
    const bookEntity = new BookEntity(book);

    if (!userEntity.canBorrowBook(bookEntity)) {
      throw new Error('User cannot borrow this book');
    }

    if (!bookEntity.isAvailable()) {
      throw new Error('Book is not available');
    }

    await this.userService.deductFromWallet(userId, 3);

    await this.bookService.borrowBook(bookId);

    // Create reservation
    const dueDate = new Date();
    if (process.env.NODE_ENV === 'production') {
      dueDate.setDate(dueDate.getDate() + 14); // 14 days for production
    } else {
      dueDate.setMinutes(dueDate.getMinutes() + 2); // 2 minutes for development
    }

    const reservation: Omit<Reservation, '_id'> = {
      userId: new ObjectId(userId),
      bookId: new ObjectId(bookId),
      reservedAt: new Date(),
      dueDate,
      returned: false,
      fee: 3,
      lateFee: 0,
      reminderSent: false,
      lateReminderSent: false,
      bookRetailPrice: book.retailPrice
    };

    userEntity.borrowBook(new ObjectId(bookId));
    await this.userService.updateUser(userId, {
      borrowedBooks: userEntity.borrowedBooks
    });

    return this.reservationRepository.create(reservation);
  }

  async returnReservation(id: string, isPurchase: boolean = false): Promise<Reservation | null> {
    const reservation = await this.reservationRepository.findById(new ObjectId(id));
    
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    if (reservation.returned) {
      throw new Error('Book already returned');
    }
    
    await this.bookService.returnBook(reservation.bookId.toString());
    
    const reservationEntity = new ReservationEntity(reservation);
    let lateFee = 0;
    
    if (!isPurchase) {
      lateFee = reservationEntity.calculateLateFee();
      
      if (lateFee > 0) {
        await this.userService.deductFromWallet(reservation.userId.toString(), lateFee);
      }
    }
    
    const user = await this.userService.getUserById(reservation.userId.toString());
    if (user) {
      const userEntity = new UserEntity(user);
      userEntity.returnBook(reservation.bookId);
      await this.userService.updateUser(reservation.userId.toString(), {
        borrowedBooks: userEntity.borrowedBooks
      });
    }
    
    // Update reservation
    return this.reservationRepository.update(reservation._id!, {
      returned: true,
      returnedAt: new Date(),
      lateFee: isPurchase ? reservation.lateFee : lateFee // Keep existing late fee if purchase
    });
  }

  async processReminders(): Promise<void> {
    // Process due date reminders
    const dueReminders = await this.reservationRepository.findPendingReminders();
    
    for (const reservation of dueReminders) {
      const user = await this.userService.getUserById(reservation.userId.toString());
      const book = await this.bookService.getBookById(reservation.bookId.toString());
      
      if (user && book) {
        await this.emailService.sendDueReminder(user, book, reservation.dueDate);
        
        await this.reservationRepository.update(reservation._id!, {
          reminderSent: true,
          lastReminderSentAt: new Date()
        });
      }
    }
    
    // Find all overdue reservations (not just ones that haven't had a late reminder)
    const overdueReservations = await this.reservationRepository.findPendingLateReminders();
    console.log(`Found ${overdueReservations.length} overdue reservations`);
    
    for (const reservation of overdueReservations) {
      const user = await this.userService.getUserById(reservation.userId.toString());
      const book = await this.bookService.getBookById(reservation.bookId.toString());
      
      if (user && book) {
        const reservationEntity = new ReservationEntity(reservation);
        const daysLate = reservationEntity.getDaysLate();
        
        // Calculate late fee (0.2€ per day)
        let lateFee: number;
        if (process.env.NODE_ENV === 'production') {
          lateFee = daysLate * 0.2; // 0.2€ per day in production
        } else {
          const minutesLate = Math.ceil(
            (new Date().getTime() - reservation.dueDate.getTime()) / (1000 * 60)
          );
          lateFee = minutesLate * 0.2
        }
        
        lateFee = Math.min(lateFee, book.retailPrice);
        
        await this.reservationRepository.update(reservation._id!, {
          lateFee,
          lastLateFeeUpdate: new Date()
        });

        if (lateFee >= book.retailPrice) {
          console.log(`Late fee (${lateFee}) has reached book retail price (${book.retailPrice}). User ${user.name} is considered to have bought the book.`);
          
          await this.returnReservation(reservation._id!.toString(), true);
          await this.userService.deductFromWallet(user._id!.toString(), book.retailPrice);
          await this.emailService.sendBookPurchaseNotification(user, book, book.retailPrice);
          
          continue;
        }
        
        // Only send a late reminder if one hasn't been sent recently (e.g., in the last day)
        const shouldSendReminder = !reservation.lastReminderSentAt || 
          (new Date().getTime() - reservation.lastReminderSentAt.getTime() > 
            (process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 2 * 60 * 1000));
        
        if (shouldSendReminder) {
          await this.emailService.sendLateReminder(user, book, reservation.dueDate, lateFee);
          await this.reservationRepository.update(reservation._id!, {
            lateReminderSent: true,
            lastReminderSentAt: new Date()
          });
        }
      }
    }
  }

  async getTotalReservations(): Promise<number> {
    return this.reservationRepository.count();
  }
} 