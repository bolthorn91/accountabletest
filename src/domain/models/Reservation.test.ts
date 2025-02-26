import { ObjectId } from 'mongodb';
import { Reservation, ReservationEntity } from './Reservation';

describe('ReservationEntity', () => {
  let reservationData: Reservation;
  let reservationEntity: ReservationEntity;

  beforeEach(() => {
    // Create a reservation that's not yet due
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    
    reservationData = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      bookId: new ObjectId(),
      reservedAt: now,
      dueDate: dueDate,
      returned: false,
      fee: 3,
      lateFee: 0,
      reminderSent: false,
      lateReminderSent: false
    };
    
    reservationEntity = new ReservationEntity(reservationData);
  });

  describe('constructor', () => {
    it('should create a reservation entity with the provided data', () => {
      expect(reservationEntity._id).toEqual(reservationData._id);
      expect(reservationEntity.userId).toEqual(reservationData.userId);
      expect(reservationEntity.bookId).toEqual(reservationData.bookId);
      expect(reservationEntity.reservedAt).toEqual(reservationData.reservedAt);
      expect(reservationEntity.dueDate).toEqual(reservationData.dueDate);
      expect(reservationEntity.returned).toEqual(reservationData.returned);
      expect(reservationEntity.fee).toEqual(reservationData.fee);
      expect(reservationEntity.lateFee).toEqual(reservationData.lateFee);
      expect(reservationEntity.reminderSent).toEqual(reservationData.reminderSent);
      expect(reservationEntity.lateReminderSent).toEqual(reservationData.lateReminderSent);
    });

    it('should set default values for missing properties', () => {
      const minimalReservationData = {
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
      
      const entity = new ReservationEntity(minimalReservationData as Reservation);
      
      expect(entity.reservedAt).toBeInstanceOf(Date);
      expect(entity.returned).toBe(false);
      expect(entity.fee).toBe(3);
      expect(entity.lateFee).toBe(0);
      expect(entity.reminderSent).toBe(false);
      expect(entity.lateReminderSent).toBe(false);
    });
  });

  describe('return', () => {
    it('should mark the reservation as returned', () => {
      reservationEntity.return();
      
      expect(reservationEntity.returned).toBe(true);
      expect(reservationEntity.returnedAt).toBeInstanceOf(Date);
    });

    it('should throw an error if already returned', () => {
      reservationEntity.returned = true;
      
      expect(() => reservationEntity.return()).toThrow('Reservation already returned');
    });
  });

  describe('isLate', () => {
    it('should return false if not past due date', () => {
      // Reservation is due in 7 days (from beforeEach)
      expect(reservationEntity.isLate()).toBe(false);
    });

    it('should return true if past due date', () => {
      // Set due date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      reservationEntity.dueDate = yesterday;
      
      expect(reservationEntity.isLate()).toBe(true);
    });

    it('should return false if already returned', () => {
      // Set due date to yesterday but mark as returned
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      reservationEntity.dueDate = yesterday;
      reservationEntity.returned = true;
      
      expect(reservationEntity.isLate()).toBe(false);
    });
  });

  describe('getDaysLate', () => {
    it('should return 0 if not late', () => {
      // Reservation is due in 7 days (from beforeEach)
      expect(reservationEntity.getDaysLate()).toBe(0);
    });

    it('should return the number of days late', () => {
      // Set due date to 3 days ago
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      reservationEntity.dueDate = threeDaysAgo;
      
      expect(reservationEntity.getDaysLate()).toBe(3);
    });
  });

  describe('shouldSendReminder', () => {
    it('should return true if 2 days before due date and reminder not sent', () => {
      // Set due date to 2 days from now
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      reservationEntity.dueDate = twoDaysFromNow;
      
      expect(reservationEntity.shouldSendReminder()).toBe(true);
    });

    it('should return false if reminder already sent', () => {
      // Set due date to 2 days from now but mark reminder as sent
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      reservationEntity.dueDate = twoDaysFromNow;
      reservationEntity.reminderSent = true;
      
      expect(reservationEntity.shouldSendReminder()).toBe(false);
    });

    it('should return false if already returned', () => {
      // Set due date to 2 days from now but mark as returned
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      reservationEntity.dueDate = twoDaysFromNow;
      reservationEntity.returned = true;
      
      expect(reservationEntity.shouldSendReminder()).toBe(false);
    });
  });

  describe('shouldSendLateReminder', () => {
    it('should return true if 7 days after due date and late reminder not sent', () => {
      // Set due date to 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      reservationEntity.dueDate = sevenDaysAgo;
      
      expect(reservationEntity.shouldSendLateReminder()).toBe(true);
    });

    it('should return false if late reminder already sent', () => {
      // Set due date to 7 days ago but mark late reminder as sent
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      reservationEntity.dueDate = sevenDaysAgo;
      reservationEntity.lateReminderSent = true;
      
      expect(reservationEntity.shouldSendLateReminder()).toBe(false);
    });

    it('should return false if already returned', () => {
      // Set due date to 7 days ago but mark as returned
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      reservationEntity.dueDate = sevenDaysAgo;
      reservationEntity.returned = true;
      
      expect(reservationEntity.shouldSendLateReminder()).toBe(false);
    });
  });

  describe('calculateLateFee', () => {
    it('should return 0 if not returned', () => {
      // Not returned yet
      expect(reservationEntity.calculateLateFee()).toBe(0);
    });

    it('should return 0 if returned before due date', () => {
      // Set returned and returnedAt to before due date
      reservationEntity.returned = true;
      reservationEntity.returnedAt = new Date(reservationEntity.dueDate);
      reservationEntity.returnedAt.setDate(reservationEntity.returnedAt.getDate() - 1);
      
      expect(reservationEntity.calculateLateFee()).toBe(0);
    });

    it('should calculate late fee based on days late in production', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Set returned and returnedAt to 5 days after due date
      reservationEntity.returned = true;
      reservationEntity.returnedAt = new Date(reservationEntity.dueDate);
      reservationEntity.returnedAt.setDate(reservationEntity.returnedAt.getDate() + 5);
      
      // 5 days * 0.2€ per day = 1€
      expect(reservationEntity.calculateLateFee()).toBe(1);
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should calculate late fee based on minutes late in non-production', () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Set returned and returnedAt to 60 minutes after due date
      reservationEntity.returned = true;
      reservationEntity.returnedAt = new Date(reservationEntity.dueDate);
      reservationEntity.returnedAt.setMinutes(reservationEntity.returnedAt.getMinutes() + 60);
      
      // 60 minutes * (0.2€ per day / (24 * 60) minutes per day) ≈ 0.0083€
      const expectedFee = 60 * (0.2 / (24 * 60));
      expect(reservationEntity.calculateLateFee()).toBeCloseTo(expectedFee);
      
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
}); 