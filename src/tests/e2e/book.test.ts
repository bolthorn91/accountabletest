import request from 'supertest';
import { createTestApp } from '../testApp';
import { MongoClient } from 'mongodb';

describe('Book API', () => {
  let app: Express.Application;
  let client: MongoClient;
  let bookId: string;
  
  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    client = testApp.client;
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  it('should create a new book', async () => {
    const bookData = {
      isbn: '9781234567897',
      title: 'Test Book',
      author: 'Test Author',
      publicationYear: 2023,
      publisher: 'Test Publisher',
      retailPrice: 29.99,
      totalCopies: 5,
      availableCopies: 5
    };
    
    const response = await request(app)
      .post('/api/books')
      .send(bookData)
      .expect(201);
    
    expect(response.body).toHaveProperty('_id');
    expect(response.body.isbn).toBe(bookData.isbn);
    expect(response.body.title).toBe(bookData.title);
    
    bookId = response.body._id;
  });
  
  it('should get a book by ID', async () => {
    const response = await request(app)
      .get(`/api/books/${bookId}`)
      .expect(200);
    
    expect(response.body._id).toBe(bookId);
    expect(response.body.title).toBe('Test Book');
  });
  
  it('should get all books', async () => {
    const response = await request(app)
      .get('/api/books')
      .expect(200);
    
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta).toHaveProperty('total');
  });
  
  it('should search books by title', async () => {
    const response = await request(app)
      .get('/api/books/search?title=Test')
      .expect(200);
    
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].title).toContain('Test');
  });
  
  it('should update a book', async () => {
    const updateData = {
      retailPrice: 39.99,
      totalCopies: 10
    };
    
    const response = await request(app)
      .put(`/api/books/${bookId}`)
      .send(updateData)
      .expect(200);
    
    expect(response.body.retailPrice).toBe(updateData.retailPrice);
    expect(response.body.totalCopies).toBe(updateData.totalCopies);
  });
  
  it('should delete a book', async () => {
    await request(app)
      .delete(`/api/books/${bookId}`)
      .expect(204);
    
    // Verify the book is deleted
    await request(app)
      .get(`/api/books/${bookId}`)
      .expect(404);
  });
}); 