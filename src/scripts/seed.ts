import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import { MongoClient } from 'mongodb';
import { CsvImportService } from '../infrastructure/services/CsvImportService';
import { BookService } from '../application/services/BookService';
import { MongoBookRepository } from '../infrastructure/repositories/MongoBookRepository';
import { UserService } from '../application/services/UserService';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';
import path from 'path';

// Sample users to seed
const sampleUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    walletBalance: 50,
    borrowedBooks: []
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    walletBalance: 30,
    borrowedBooks: []
  },
  {
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    walletBalance: 20,
    borrowedBooks: []
  }
];

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }
  console.log('Starting database seeding...');
  
  // MongoDB connection string
  const MONGO_URI = process.env.MONGO_URI;
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Create repositories and services
    const bookRepository = new MongoBookRepository(db);
    const bookService = new BookService(bookRepository);
    const userRepository = new MongoUserRepository(db);
    const userService = new UserService(userRepository);
    const csvImportService = new CsvImportService(bookService);
    
    // Check if books collection is empty
    const booksCount = await bookService.getTotalBooks();
    if (booksCount === 0) {
      console.log('Importing books from CSV...');
      const csvPath = path.resolve(__dirname, '../../books_sample_technical_challenge.csv');
      const importedCount = await csvImportService.importBooksFromCsv(csvPath);
      console.log(`Imported ${importedCount} books from CSV`);
    } else {
      console.log(`Books collection already has ${booksCount} books. Skipping import.`);
    }
    
    // Check if users collection is empty
    const usersCount = await userService.getTotalUsers();
    if (usersCount === 0) {
      console.log('Creating sample users...');
      for (const userData of sampleUsers) {
        await userService.createUser(userData);
      }
      console.log(`Created ${sampleUsers.length} sample users`);
    } else {
      console.log(`Users collection already has ${usersCount} users. Skipping creation.`);
    }
    
    console.log('Database seeding completed successfully!');
    await client.close();
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seed().catch(console.error); 