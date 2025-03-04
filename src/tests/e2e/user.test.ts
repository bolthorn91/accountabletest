import request from 'supertest';
import { createTestApp } from '../testApp';
import { MongoClient } from 'mongodb';

describe('User API', () => {
  let app: Express.Application;
  let client: MongoClient;
  let userId: string;
  
  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    client = testApp.client;
  });
  
  afterAll(async () => {
    await client.close();
  });
  
  it('should create a new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      walletBalance: 50
    };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);
    
    expect(response.body).toHaveProperty('_id');
    expect(response.body.name).toBe(userData.name);
    expect(response.body.email).toBe(userData.email);
    expect(response.body.walletBalance).toBe(userData.walletBalance);
    
    userId = response.body._id;
  });
  
  it('should get a user by ID', async () => {
    const response = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);
    
    expect(response.body._id).toBe(userId);
    expect(response.body.name).toBe('John Doe');
  });
  
  it('should get all users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta).toHaveProperty('total');
  });
  
  it('should add money to user wallet', async () => {
    const response = await request(app)
      .post(`/api/users/${userId}/wallet`)
      .send({ amount: 25 })
      .expect(200);
    
    expect(response.body.walletBalance).toBe(75); // 50 + 25
  });
  
  it('should update a user', async () => {
    const updateData = {
      name: 'John Updated'
    };
    
    const response = await request(app)
      .put(`/api/users/${userId}`)
      .send(updateData)
      .expect(200);
    
    expect(response.body.name).toBe(updateData.name);
  });
  
  it('should delete a user', async () => {
    await request(app)
      .delete(`/api/users/${userId}`)
      .expect(204);
    
    // Verify the user is deleted
    await request(app)
      .get(`/api/users/${userId}`)
      .expect(404);
  });
}); 