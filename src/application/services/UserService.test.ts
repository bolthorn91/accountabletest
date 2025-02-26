import { ObjectId } from 'mongodb';
import { UserService } from './UserService';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User } from '../../domain/models/User';

// Mock the UserRepository
const mockUserRepository: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn()
};

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService(mockUserRepository);
    jest.clearAllMocks();
  });
  
  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const mockUser: User = {
        _id: new ObjectId(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      
      const result = await userService.getUserById(mockUser._id!.toString());
      
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser._id);
    });
    
    it('should return null when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      const result = await userService.getUserById('123456789012');
      
      expect(result).toBeNull();
      expect(mockUserRepository.findById).toHaveBeenCalled();
    });
  });
  
  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData: Omit<User, '_id'> = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      const createdUser: User = {
        ...userData,
        _id: new ObjectId()
      };
      
      mockUserRepository.create.mockResolvedValue(createdUser);
      
      const result = await userService.createUser(userData);
      
      expect(result).toEqual(createdUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining(userData));
    });
  });
  
  describe('addToWallet', () => {
    it('should add amount to user wallet', async () => {
      const mockUser: User = {
        _id: new ObjectId(),
        name: 'John Doe',
        email: 'john.doe@example.com',
        walletBalance: 50,
        borrowedBooks: []
      };
      
      const updatedUser: User = {
        ...mockUser,
        walletBalance: 70
      };
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      
      const result = await userService.addToWallet(mockUser._id!.toString(), 20);
      
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser._id,
        expect.objectContaining({ walletBalance: 70 })
      );
    });
    
    it('should throw an error if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      await expect(userService.addToWallet('123456789012', 20)).rejects.toThrow('User not found');
    });
  });
}); 