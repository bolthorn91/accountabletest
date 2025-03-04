import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import { MongoBookRepository } from '../infrastructure/repositories/MongoBookRepository';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';
import { MongoReservationRepository } from '../infrastructure/repositories/MongoReservationRepository';
import { BookService } from '../application/services/BookService';
import { UserService } from '../application/services/UserService';
import { ReservationService } from '../application/services/ReservationService';
import { EmailService } from '../infrastructure/services/EmailService';
import { BookController } from '../interfaces/controllers/BookController';
import { UserController } from '../interfaces/controllers/UserController';
import { ReservationController } from '../interfaces/controllers/ReservationController';
import { bookRoutes } from '../interfaces/routes/bookRoutes';
import { userRoutes } from '../interfaces/routes/userRoutes';
import { reservationRoutes } from '../interfaces/routes/reservationRoutes';
import { healthRoutes } from '../interfaces/routes/healthRoutes';
import { errorHandler } from '../interfaces/middleware/errorHandler';

export async function createTestApp() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }
  // Connect to MongoDB
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  
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
  
  // Create controllers
  const bookController = new BookController(bookService);
  const userController = new UserController(userService);
  const reservationController = new ReservationController(reservationService);
  
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  app.use('/api/books', bookRoutes(bookController));
  app.use('/api/users', userRoutes(userController));
  app.use('/api/reservations', reservationRoutes(reservationController));
  app.use('/api/health', healthRoutes());
  
  app.use(errorHandler);
  
  return { app, client, bookService, userService, reservationService };
} 