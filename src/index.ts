import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';

// Repositories
import { MongoBookRepository } from './infrastructure/repositories/MongoBookRepository';
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { MongoReservationRepository } from './infrastructure/repositories/MongoReservationRepository';

// Services
import { BookService } from './application/services/BookService';
import { UserService } from './application/services/UserService';
import { ReservationService } from './application/services/ReservationService';
import { EmailService } from './infrastructure/services/EmailService';
import { CsvImportService } from './infrastructure/services/CsvImportService';

// Controllers
import { BookController } from './interfaces/controllers/BookController';
import { UserController } from './interfaces/controllers/UserController';
import { ReservationController } from './interfaces/controllers/ReservationController';

// Routes
import { bookRoutes } from './interfaces/routes/bookRoutes';
import { userRoutes } from './interfaces/routes/userRoutes';
import { reservationRoutes } from './interfaces/routes/reservationRoutes';
import { healthRoutes } from './interfaces/routes/healthRoutes';

// Middleware
import { errorHandler } from './interfaces/middleware/errorHandler';

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;


async function bootstrap() {
  if (!MONGO_URI || !PORT) {
    throw new Error('MONGO_URI and PORT must be set');
  }
  
  // Connect to MongoDB
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('Connected to MongoDB');
  
  const db = client.db();
  
  // Create repositories
  const bookRepository = new MongoBookRepository(db);
  const userRepository = new MongoUserRepository(db);
  const reservationRepository = new MongoReservationRepository(db);
  
  // Create services
  const bookService = new BookService(bookRepository);
  const userService = new UserService(userRepository);
  const emailService = new EmailService();
  const reservationService = new ReservationService(
    reservationRepository,
    bookService,
    userService,
    emailService
  );
  const csvImportService = new CsvImportService(bookService);
  
  // Create controllers
  const bookController = new BookController(bookService);
  const userController = new UserController(userService);
  const reservationController = new ReservationController(reservationService);
  
  // Create Express app
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/api/books', bookRoutes(bookController));
  app.use('/api/users', userRoutes(userController));
  app.use('/api/reservations', reservationRoutes(reservationController));
  app.use('/api/health', healthRoutes());
  
  // Import books from CSV if database is empty
  const booksCount = await bookService.getTotalBooks();
  if (booksCount === 0) {
    console.log('Importing books from CSV...');
    try {
      const csvPath = path.resolve(__dirname, '../books_sample_technical_challenge.csv');
      const importedCount = await csvImportService.importBooksFromCsv(csvPath);
      console.log(`Imported ${importedCount} books from CSV`);
    } catch (error) {
      console.error('Failed to import books from CSV:', error);
    }
  }
  
  // Schedule reminders - run every minute in development, daily at midnight in production
  const reminderSchedule = process.env.NODE_ENV === 'production' ? '0 0 * * *' : '* * * * *';
  cron.schedule(reminderSchedule, async () => {
    console.log('Running scheduled reminders...');
    await reservationService.processReminders();
  });
  
  // Add error handling middleware
  app.use(errorHandler);
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap().catch(console.error); 