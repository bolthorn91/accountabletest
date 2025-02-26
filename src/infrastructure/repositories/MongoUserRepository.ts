import { Collection, Db, ObjectId } from 'mongodb';
import { User } from '../../domain/models/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class MongoUserRepository implements UserRepository {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>('users');
  }

  async findById(id: ObjectId): Promise<User | null> {
    return this.collection.findOne({ _id: id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<User[]> {
    return this.collection
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }

  async create(user: User): Promise<User> {
    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async update(id: ObjectId, user: Partial<User>): Promise<User | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: user },
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
} 