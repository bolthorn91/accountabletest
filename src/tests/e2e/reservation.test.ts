import request from 'supertest';
import { createTestApp } from '../testApp';
import { MongoClient } from 'mongodb';

describe('Reservation API', () => {
  let app: Express.Application;
  let client: MongoClient;
  let userId: string;
  let bookId: string;
  let reservationId: string;
  
  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    client = testApp.client;
    
    // Create a test user
    const userData = {
      name: 'Test User',
      email: 'test.user@example.com',
      walletBalance: 100
    };
    
    const userResponse = await request(app)
      .post('/api/users')
      .send(userData);
    
    userId = userResponse.body._id;
    
    // Create a test book
    const bookData = {
      isbn: '9781234567890',
      title: 'Reservation Test Book',
      author: 'Test Author',
      publicationYear: 2023,
      publisher: 'Test Publisher',
      retailPrice: 19.99,
      totalCopies: 5,
      availableCopies: 5
    };
    
    const bookResponse = await request(app)
      .post('/api/books')
      .send(bookData);
    
    bookId = bookResponse.body._id;
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  it('should create a new reservation', async () => {
    const reservationData = {
      userId,
      bookId
    };
    
    const response = await request(app)
      .post('/api/reservations')
      .send(reservationData)
      .expect(201);
    
    expect(response.body).toHaveProperty('_id');
    expect(response.body.userId).toBe(userId);
    expect(response.body.bookId).toBe(bookId);
    expect(response.body.returned).toBe(false);
    expect(response.body.fee).toBe(3);
    
    reservationId = response.body._id;
  });
  
  it('should get a reservation by ID', async () => {
    const response = await request(app)
      .get(`/api/reservations/${reservationId}`)
      .expect(200);
    
    expect(response.body._id).toBe(reservationId);
    expect(response.body.userId).toBe(userId);
    expect(response.body.bookId).toBe(bookId);
  });
  
  it('should get reservations by user ID', async () => {
    const response = await request(app)
      .get(`/api/reservations?userId=${userId}`)
      .expect(200);
    
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].userId).toBe(userId);
  });
  
  it('should return a book', async () => {
    const response = await request(app)
      .post(`/api/reservations/${reservationId}/return`)
      .expect(200);
    
    expect(response.body.returned).toBe(true);
    expect(response.body.returnedAt).toBeTruthy();
  });
  
  it('should not allow creating a reservation for a non-existent book', async () => {
    const reservationData = {
      userId,
      bookId: '60b9b4b7e6c7a50b5e8b4567' // Non-existent book ID
    };
    
    await request(app)
      .post('/api/reservations')
      .send(reservationData)
      .expect(400);
  });
  
  it('should not allow creating a reservation for a non-existent user', async () => {
    const reservationData = {
      userId: '60b9b4b7e6c7a50b5e8b4567', // Non-existent user ID
      bookId
    };
    
    await request(app)
      .post('/api/reservations')
      .send(reservationData)
      .expect(400);
  });
}); 