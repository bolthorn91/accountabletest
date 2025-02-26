import { ObjectId } from 'mongodb';
import { User } from '../models/User';

export interface UserRepository {
  findById(id: ObjectId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(page: number, limit: number): Promise<User[]>;
  create(user: User): Promise<User>;
  update(id: ObjectId, user: Partial<User>): Promise<User | null>;
  delete(id: ObjectId): Promise<boolean>;
  count(): Promise<number>;
} 