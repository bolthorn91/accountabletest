import { ObjectId } from 'mongodb';

export interface Reservation {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  reservedAt: Date;
  dueDate: Date;
  returned: boolean;
  returnedAt?: Date;
  fee: number;
  lateFee: number;
  reminderSent: boolean;
  lateReminderSent: boolean;
  lastReminderSentAt?: Date;
  lastLateFeeUpdate?: Date;
  bookRetailPrice?: number;
}

export class ReservationEntity implements Reservation {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  reservedAt: Date;
  dueDate: Date;
  returned: boolean;
  returnedAt?: Date;
  fee: number;
  lateFee: number;
  reminderSent: boolean;
  lateReminderSent: boolean;
  lastReminderSentAt?: Date;
  lastLateFeeUpdate?: Date;
  bookRetailPrice?: number;

  constructor(reservation: Reservation) {
    this._id = reservation._id;
    this.userId = reservation.userId;
    this.bookId = reservation.bookId;
    this.reservedAt = reservation.reservedAt || new Date();
    this.dueDate = reservation.dueDate;
    this.returned = reservation.returned || false;
    this.returnedAt = reservation.returnedAt;
    this.fee = reservation.fee || 3; // 3€ per reservation
    this.lateFee = reservation.lateFee || 0;
    this.reminderSent = reservation.reminderSent || false;
    this.lateReminderSent = reservation.lateReminderSent || false;
    this.lastReminderSentAt = reservation.lastReminderSentAt;
    this.lastLateFeeUpdate = reservation.lastLateFeeUpdate;
    this.bookRetailPrice = reservation.bookRetailPrice;
  }

  return(): void {
    if (this.returned) {
      throw new Error('Reservation already returned');
    }
    
    this.returned = true;
    this.returnedAt = new Date();
    this.lateFee = this.calculateLateFee();
  }

  isLate(): boolean {
    if (this.returned) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  getDaysLate(): number {
    if (!this.isLate()) {
      return 0;
    }
    
    const now = new Date();
    return Math.ceil((now.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  shouldSendReminder(): boolean {
    if (this.returned || this.reminderSent) {
      return false;
    }
    
    const twoDaysBeforeDue = new Date(this.dueDate);
    twoDaysBeforeDue.setDate(twoDaysBeforeDue.getDate() - 2);
    
    const now = new Date();
    return now >= twoDaysBeforeDue && now <= this.dueDate;
  }

  shouldSendLateReminder(): boolean {
    if (this.returned || this.lateReminderSent) {
      return false;
    }
    
    const sevenDaysAfterDue = new Date(this.dueDate);
    sevenDaysAfterDue.setDate(sevenDaysAfterDue.getDate() + 7);
    
    const now = new Date();
    return now >= sevenDaysAfterDue;
  }

  calculateLateFee(): number {
    if (!this.returned || !this.returnedAt || this.returnedAt <= this.dueDate) {
      return 0;
    }
    
    let lateFee: number;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: charge by day
      const daysLate = Math.ceil(
        (this.returnedAt.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      lateFee = daysLate * 0.2; // 0.2€ per day
    } else {
      // Non-production: charge by minute
      const minutesLate = Math.ceil(
        (this.returnedAt.getTime() - this.dueDate.getTime()) / (1000 * 60)
      );
      lateFee = minutesLate * (0.2 / (24 * 60)); // 0.2€ per day converted to per minute
    }
    
    return lateFee;
  }
} 