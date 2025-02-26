import { ObjectId } from 'mongodb';
import { User, UserEntity } from '../../domain/models/User';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(new ObjectId(id));
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async getAllUsers(page: number = 1, limit: number = 10): Promise<User[]> {
    return this.userRepository.findAll(page, limit);
  }

  async createUser(userData: Omit<User, '_id'>): Promise<User> {
    const user = new UserEntity({
      ...userData,
      walletBalance: userData.walletBalance || 0,
      borrowedBooks: userData.borrowedBooks || []
    });
    
    return this.userRepository.create(user);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    return this.userRepository.update(new ObjectId(id), userData);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(new ObjectId(id));
  }

  async addToWallet(id: string, amount: number): Promise<User | null> {
    const user = await this.userRepository.findById(new ObjectId(id));
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userEntity = new UserEntity(user);
    userEntity.addToWallet(amount);
    
    return this.userRepository.update(new ObjectId(id), {
      walletBalance: userEntity.walletBalance
    });
  }

  async deductFromWallet(id: string, amount: number): Promise<User | null> {
    const user = await this.userRepository.findById(new ObjectId(id));
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const userEntity = new UserEntity(user);
    
    try {
      userEntity.deductFromWallet(amount);
    } catch (error) {
      throw new Error('Insufficient balance');
    }
    
    return this.userRepository.update(new ObjectId(id), {
      walletBalance: userEntity.walletBalance
    });
  }

  async getTotalUsers(): Promise<number> {
    return this.userRepository.count();
  }
} 