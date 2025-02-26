import { ObjectId } from 'mongodb';
import { ReservationService } from './ReservationService';
import { BookService } from './BookService';
import { UserService } from './UserService';
import { EmailService } from '../../infrastructure/services/EmailService';
import { ReservationRepository } from '../../domain/repositories/ReservationRepository';
import { Reservation } from '../../domain/models/Reservation';
import { Book } from '../../domain/models/Book';
import { User } from '../../domain/models/User';

const mockReservationRepository: jest.Mocked<ReservationRepository> = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByBookId: jest.fn(),
  findActiveByUserId: jest.fn(),
  findPendingReminders: jest.fn(),
  findPendingLateReminders: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn()
};

const mockBookService = {
  getBookById: jest.fn(),
  getBookByIsbn: jest.fn(),
  getAllBooks: jest.fn(),
  searchBooks: jest.fn(),
  createBook: jest.fn(),
  updateBook: jest.fn(),
  deleteBook: jest.fn(),
  borrowBook: jest.fn(),
  returnBook: jest.fn(),
  getTotalBooks: jest.fn()
};

const mockUserService = {
  getUserById: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  addToWallet: jest.fn(),
  deductFromWallet: jest.fn(),
  getTotalUsers: jest.fn()
};

const mockEmailService: jest.Mocked<EmailService> = {
  sendDueReminder: jest.fn(),
  sendLateReminder: jest.fn(),
  sendBookPurchaseNotification: jest.fn()
};

describe('ReservationService', () => {
  let reservationService: ReservationService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    reservationService = new ReservationService(
      mockReservationRepository,
      mockBookService as unknown as BookService,
      mockUserService as unknown as UserService,
      mockEmailService
    );
  });
  
  describe('getReservationById', () => {
    it('should return a reservation by id', async () => {
      const mockReservation: Reservation = {
        _id: new ObjectId(),
        userId: new ObjectId(),
        bookId: new ObjectId(),
        reservedAt: new Date(),
        dueDate: new Date(),
        returned: false,
        fee: 3,
        lateFee: 0,
        reminderSent: false,
        lateReminderSent: false
      };
      
      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      
      const result = await reservationService.getReservationById(mockReservation._id!.toString());
      
      expect(result).toEqual(mockReservation);
      expect(mockReservationRepository.findById).toHaveBeenCalledWith(mockReservation._id);
    });
  });
  
  describe('createReservation', () => {
    it('should create a reservation', async () => {
      const userId = new ObjectId();
      const bookId = new ObjectId();
      
      const mockUser: User = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      const mockBook: Book = {
        _id: bookId,
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 20,
        totalCopies: 4,
        availableCopies: 4
      };
      
      const mockReservation: Reservation = {
        _id: new ObjectId(),
        userId,
        bookId,
        reservedAt: expect.any(Date),
        dueDate: expect.any(Date),
        returned: false,
        fee: 3,
        lateFee: 0,
        reminderSent: false,
        lateReminderSent: false,
        bookRetailPrice: 20
      };
      
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockBookService.getBookById.mockResolvedValue(mockBook);
      mockBookService.borrowBook.mockResolvedValue(mockBook);
      mockReservationRepository.create.mockResolvedValue(mockReservation);
      
      const result = await reservationService.createReservation(
        userId.toString(),
        bookId.toString()
      );
      
      expect(result).toEqual(mockReservation);
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId.toString());
      expect(mockBookService.getBookById).toHaveBeenCalledWith(bookId.toString());
      expect(mockBookService.borrowBook).toHaveBeenCalledWith(bookId.toString());
      expect(mockReservationRepository.create).toHaveBeenCalled();
      expect(mockUserService.deductFromWallet).toHaveBeenCalledWith(userId.toString(), 3);
    });
    
    it('should throw an error if user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      
      await expect(
        reservationService.createReservation(
          new ObjectId().toString(),
          new ObjectId().toString()
        )
      ).rejects.toThrow('User not found');
    });
    
    it('should throw an error if book not found', async () => {
      const mockUser: User = {
        _id: new ObjectId(),
        name: 'Test User',
        email: 'test@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockBookService.getBookById.mockResolvedValue(null);
      
      await expect(
        reservationService.createReservation(
          mockUser._id!.toString(),
          new ObjectId().toString()
        )
      ).rejects.toThrow('Book not found');
    });
  });
  
  describe('returnReservation', () => {
    it('should return a reservation', async () => {
      const userId = new ObjectId();
      const bookId = new ObjectId();
      const reservationId = new ObjectId();
      
      const mockReservation: Reservation = {
        _id: reservationId,
        userId,
        bookId,
        reservedAt: new Date(),
        dueDate: new Date(),
        returned: false,
        fee: 3,
        lateFee: 0,
        reminderSent: false,
        lateReminderSent: false
      };
      
      const mockUser: User = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        walletBalance: 50,
        borrowedBooks: [
          {
            bookId,
            borrowedAt: new Date(),
            dueDate: new Date(),
            returned: false
          }
        ]
      };
      
      const updatedReservation = {
        ...mockReservation,
        returned: true,
        returnedAt: expect.any(Date)
      };
      
      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockReservationRepository.update.mockResolvedValue(updatedReservation);
      
      const result = await reservationService.returnReservation(reservationId.toString());
      
      expect(result).toEqual(updatedReservation);
      expect(mockReservationRepository.findById).toHaveBeenCalledWith(reservationId);
      expect(mockBookService.returnBook).toHaveBeenCalledWith(bookId.toString());
      expect(mockReservationRepository.update).toHaveBeenCalled();
    });
    
    it('should throw an error if reservation not found', async () => {
      mockReservationRepository.findById.mockResolvedValue(null);
      
      await expect(
        reservationService.returnReservation(new ObjectId().toString())
      ).rejects.toThrow('Reservation not found');
    });
    
    it('should throw an error if book already returned', async () => {
      const mockReservation: Reservation = {
        _id: new ObjectId(),
        userId: new ObjectId(),
        bookId: new ObjectId(),
        reservedAt: new Date(),
        dueDate: new Date(),
        returned: true,
        returnedAt: new Date(),
        fee: 3,
        lateFee: 0,
        reminderSent: false,
        lateReminderSent: false
      };
      
      mockReservationRepository.findById.mockResolvedValue(mockReservation);
      
      await expect(
        reservationService.returnReservation(mockReservation._id!.toString())
      ).rejects.toThrow('Book already returned');
    });
  });
  
  describe('processReminders', () => {
    it('should process due reminders', async () => {
      const userId = new ObjectId();
      const bookId = new ObjectId();
      
      const mockReservation: Reservation = {
        _id: new ObjectId(),
        userId,
        bookId,
        reservedAt: new Date(),
        dueDate: new Date(),
        returned: false,
        fee: 3,
        lateFee: 0,
        reminderSent: false,
        lateReminderSent: false
      };
      
      const mockUser: User = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      const mockBook: Book = {
        _id: bookId,
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 20,
        totalCopies: 4,
        availableCopies: 3
      };
      
      mockReservationRepository.findPendingReminders.mockResolvedValue([mockReservation]);
      mockReservationRepository.findPendingLateReminders.mockResolvedValue([]);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockBookService.getBookById.mockResolvedValue(mockBook);
      
      await reservationService.processReminders();
      
      expect(mockReservationRepository.findPendingReminders).toHaveBeenCalled();
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId.toString());
      expect(mockBookService.getBookById).toHaveBeenCalledWith(bookId.toString());
      expect(mockEmailService.sendDueReminder).toHaveBeenCalledWith(mockUser, mockBook, mockReservation.dueDate);
      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        mockReservation._id,
        expect.objectContaining({
          reminderSent: true,
          lastReminderSentAt: expect.any(Date)
        })
      );
    });
    
    it('should process late reminders', async () => {
      const userId = new ObjectId();
      const bookId = new ObjectId();
      
      const mockReservation: Reservation = {
        _id: new ObjectId(),
        userId,
        bookId,
        reservedAt: new Date(),
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        returned: false,
        fee: 3,
        lateFee: 0,
        reminderSent: true,
        lateReminderSent: false
      };
      
      const mockUser: User = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      const mockBook: Book = {
        _id: bookId,
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 10, // Set lower than the late fee will be
        totalCopies: 4,
        availableCopies: 3
      };
      
      mockReservationRepository.findPendingReminders.mockResolvedValue([]);
      mockReservationRepository.findPendingLateReminders.mockResolvedValue([mockReservation]);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockBookService.getBookById.mockResolvedValue(mockBook);
      
      // Mock the returnReservation method to not throw an error
      const originalReturnReservation = reservationService.returnReservation;
      reservationService.returnReservation = jest.fn().mockResolvedValue({
        ...mockReservation,
        returned: true,
        returnedAt: new Date()
      });
      
      await reservationService.processReminders();
      
      // Restore the original method
      reservationService.returnReservation = originalReturnReservation;
      
      expect(mockReservationRepository.findPendingLateReminders).toHaveBeenCalled();
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId.toString());
      expect(mockBookService.getBookById).toHaveBeenCalledWith(bookId.toString());
      expect(mockReservationRepository.update).toHaveBeenCalledWith(
        mockReservation._id,
        expect.objectContaining({
          lateFee: expect.any(Number)
        })
      );
    });
  });
}); 