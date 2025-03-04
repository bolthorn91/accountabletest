import { MongoClient, Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;
let db: Db;

// Setup before all tests
beforeAll(async () => {
  // Create an in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  db = mongoClient.db();
  
  // Set the global MongoDB URI for tests
  // console.log('mongoUri', mongoUri, process.env.MONGO_URI);
  process.env.MONGO_URI = mongoUri;
  
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
});

// Clean up after all tests
afterAll(async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Export the database instance for test helpers
export { db }; 