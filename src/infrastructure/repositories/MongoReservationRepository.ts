import { Collection, Db, ObjectId } from 'mongodb';
import { Reservation } from '../../domain/models/Reservation';
import { ReservationRepository } from '../../domain/repositories/ReservationRepository';

export class MongoReservationRepository implements ReservationRepository {
  private collection: Collection<Reservation>;

  constructor(db: Db) {
    this.collection = db.collection<Reservation>('reservations');
  }

  async findById(id: ObjectId): Promise<Reservation | null> {
    return this.collection.findOne({ _id: id });
  }

  async findByUserId(userId: ObjectId, page: number = 1, limit: number = 10): Promise<Reservation[]> {
    return this.collection
      .find({ userId })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }

  async findByBookId(bookId: ObjectId, page: number = 1, limit: number = 10): Promise<Reservation[]> {
    return this.collection
      .find({ bookId })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }

  async findActiveByUserId(userId: ObjectId): Promise<Reservation[]> {
    return this.collection
      .find({ userId, returned: false })
      .toArray();
  }

  async findPendingReminders(): Promise<Reservation[]> {
    const futureDate = new Date();
    
    if (process.env.NODE_ENV === 'production') {
      futureDate.setDate(futureDate.getDate() + 2);
    } else {
      futureDate.setMinutes(futureDate.getMinutes() + 2);
    }
    
    return this.collection
      .find({
        returned: false,
        reminderSent: false,
        dueDate: {
          $gte: new Date(),
          $lte: futureDate
        }
      })
      .toArray();
  }


  async findPendingLateReminders(): Promise<Reservation[]> {
    const pastDate = new Date();
    
    if (process.env.NODE_ENV === 'development') {
      pastDate.setDate(pastDate.getDate() - 7);
    } else {
      pastDate.setMinutes(pastDate.getMinutes() - 2);
    }
    
    const results = await this.collection
      .find({
        returned: false,
        dueDate: {
          $lte: pastDate
        }
      })
      .toArray();
      
    return results;
  }

  async create(reservation: Reservation): Promise<Reservation> {
    const result = await this.collection.insertOne(reservation);
    return { ...reservation, _id: result.insertedId };
  }

  async update(id: ObjectId, reservation: Partial<Reservation>): Promise<Reservation | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: reservation },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async delete(id: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  async count(): Promise<number> {
    return this.collection.countDocuments();
  }

  async findAllOverdue(): Promise<Reservation[]> {
    const now = new Date();
    
    return this.collection
      .find({
        returned: false,
        dueDate: { $lt: now }
      })
      .toArray();
  }
} 