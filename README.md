# Library Management System

A backend system for the Royal Library of Belgium to manage their book inventory, user accounts, and book reservations.

## Features

- **Book Management**: Add, update, delete, and search for books
- **User Management**: Create and manage user accounts with wallet functionality
- **Reservation System**: Allow users to borrow and return books
- **Catalog Search**: Search books by title, author, or publication year
- **Automated Reminders**: Send reminders for upcoming due dates and late returns
- **Late Fee System**: Apply late fees for overdue books

## Architecture

This project follows Domain-Driven Design (DDD) principles with a clean architecture approach:

- **Domain Layer**: Contains the core business logic, entities, and repository interfaces
- **Application Layer**: Implements use cases and orchestrates domain objects
- **Infrastructure Layer**: Provides implementations for repositories and external services
- **Interface Layer**: Handles HTTP requests and responses

## Tech Stack

- **Backend**: Node.js with TypeScript
- **API**: Express.js
- **Database**: MongoDB
- **Containerization**: Docker

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- MongoDB (if running without Docker)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/bolthorn91/accountabletest.git
   cd accountabletest
   ```

2. Create a `.env` file in the root directory (optional for Docker, as environment variables are set in docker-compose.yml):
   ```
   MONGO_URI=mongodb://mongo:27017/library
   PORT=3000
   ```

3. Start the mongoDB application using Docker Compose:
   ```bash
   docker-compose up
   ```

   This will start MongoDB

4. Build and start the application:
   ```bash
   npm run build
   npm start
   ```

   For development with hot-reload:
   ```bash
   npm run dev
   ```
   This will start MongoDB. The API will be available at http://localhost:3000.

## Database Seeding

To seed the database with sample data:

```bash
npm run seed
```

This will:
- Import books from the provided CSV file
- Create sample user accounts

## API Documentation

You have a postman collection in the root directory.

## Data Models

### Book

```typescript
interface Book {
  _id?: ObjectId;
  isbn: string;
  title: string;
  author: string;
  publicationYear: number;
  publisher: string;
  retailPrice: number;
  totalCopies: number; // Default to 4 as per requirements
  availableCopies: number;
}
```

### User

```typescript
interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  walletBalance: number;
  borrowedBooks: Array<{
    bookId: ObjectId;
    borrowedAt: Date;
    dueDate: Date;
    returned: boolean;
    returnedAt?: Date;
  }>;
}
```

### Reservation

```typescript
interface Reservation {
  _id?: ObjectId;
  userId: ObjectId;
  bookId: ObjectId;
  reservedAt: Date;
  dueDate: Date; // 14 days after reservation
  returned: boolean;
  returnedAt?: Date;
  fee: number; // 3 euros per reservation
  lateFee: number; // 0.2 euros per day for late returns
  reminderSent: boolean;
  lateReminderSent: boolean;
}
```

## Business Rules

- Each book reference has 4 copies available for borrowing
- Users can borrow up to 3 books at a time
- Users cannot borrow multiple copies of the same book
- Each book reservation costs 3 euros
- Late returns incur a fee of 0.2 euros per day
- If late fees reach the retail price of the book, the user is considered to have bought it
- Due date reminders are sent 2 days before the due date
- Late return reminders are sent 7 days after the due date

## Testing

Run the test suite:

```bash
npm test
```

## Linting

Run the linter:

```bash
npm run lint
```

## Project Structure

```
src/
├── application/        # Application services
├── domain/             # Domain models, entities, repositories
├── infrastructure/     # Repository implementations, external services
├── interfaces/         # Controllers, routes, middleware
├── scripts/            # Database seeding scripts
└── index.ts            # Application entry point
```

## License

This project is licensed under the ISC License. 