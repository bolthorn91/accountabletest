import { ObjectId } from 'mongodb';
import { Reservation } from '../models/Reservation';

export interface ReservationRepository {
  findById(id: ObjectId): Promise<Reservation | null>;
  findByUserId(userId: ObjectId, page: number, limit: number): Promise<Reservation[]>;
  findByBookId(bookId: ObjectId, page: number, limit: number): Promise<Reservation[]>;
  findActiveByUserId(userId: ObjectId): Promise<Reservation[]>;
  findPendingReminders(): Promise<Reservation[]>;
  findPendingLateReminders(): Promise<Reservation[]>;
  create(reservation: Reservation): Promise<Reservation>;
  update(id: ObjectId, reservation: Partial<Reservation>): Promise<Reservation | null>;
  delete(id: ObjectId): Promise<boolean>;
  count(): Promise<number>;
} 