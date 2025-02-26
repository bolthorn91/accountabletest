import { ObjectId } from 'mongodb';
import { BookService } from './BookService';
import { BookRepository } from '../../domain/repositories/BookRepository';
import { Book } from '../../domain/models/Book';

const mockBookRepository: jest.Mocked<BookRepository> = {
  findById: jest.fn(),
  findByIsbn: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn()
};

describe('BookService', () => {
  let bookService: BookService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    bookService = new BookService(mockBookRepository);
  });
  
  describe('getBookById', () => {
    it('should return a book when found', async () => {
      const mockBook: Book = {
        _id: new ObjectId(),
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 20,
        totalCopies: 4,
        availableCopies: 4
      };
      
      mockBookRepository.findById.mockResolvedValue(mockBook);
      
      const result = await bookService.getBookById(mockBook._id!.toString());
      
      expect(result).toEqual(mockBook);
      expect(mockBookRepository.findById).toHaveBeenCalledWith(mockBook._id);
    });
    
    it('should return null when book is not found', async () => {
      mockBookRepository.findById.mockResolvedValue(null);
      
      const result = await bookService.getBookById('123456789012');
      
      expect(result).toBeNull();
      expect(mockBookRepository.findById).toHaveBeenCalled();
    });
  });
  
  describe('createBook', () => {
    it('should create a book successfully', async () => {
      const bookData: Omit<Book, '_id'> = {
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 20,
        totalCopies: 4,
        availableCopies: 4
      };
      
      const createdBook: Book = {
        ...bookData,
        _id: new ObjectId()
      };
      
      mockBookRepository.create.mockResolvedValue(createdBook);
      
      const result = await bookService.createBook(bookData);
      
      expect(result).toEqual(createdBook);
      expect(mockBookRepository.create).toHaveBeenCalledWith(expect.objectContaining(bookData));
    });
  });
  
  describe('borrowBook', () => {
    it('should throw an error if book is not found', async () => {
      mockBookRepository.findById.mockResolvedValue(null);
      
      await expect(bookService.borrowBook('123456789012')).rejects.toThrow('Book not found');
    });
    
    it('should throw an error if book is not available', async () => {
      const mockBook: Book = {
        _id: new ObjectId(),
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 20,
        totalCopies: 4,
        availableCopies: 0
      };
      
      mockBookRepository.findById.mockResolvedValue(mockBook);
      mockBookRepository.update.mockImplementation(() => {
        throw new Error('Book is not available');
      });
      
      await expect(bookService.borrowBook(mockBook._id!.toString())).rejects.toThrow('Book is not available');
    });
    
    it('should decrease available copies when borrowing a book', async () => {
      const mockBook: Book = {
        _id: new ObjectId(),
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publicationYear: 2023,
        publisher: 'Test Publisher',
        retailPrice: 20,
        totalCopies: 4,
        availableCopies: 4
      };
      
      const updatedBook: Book = {
        ...mockBook,
        availableCopies: 3
      };
      
      mockBookRepository.findById.mockResolvedValue(mockBook);
      mockBookRepository.update.mockResolvedValue(updatedBook);
      
      const result = await bookService.borrowBook(mockBook._id!.toString());
      
      expect(result).toEqual(updatedBook);
      expect(mockBookRepository.update).toHaveBeenCalledWith(
        mockBook._id,
        expect.objectContaining({ availableCopies: 3 })
      );
    });
  });
}); 