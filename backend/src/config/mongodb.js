/**
 * MongoDB Connection Configuration
 * Used for storing media files (images, documents) using GridFS
 */

const { MongoClient, GridFSBucket } = require('mongodb');

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://smartfactory:smartfactory123@localhost:27017/smartfactory_media?authSource=admin';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'smartfactory_media';

let mongoClient = null;
let db = null;
let gridFSBucket = null;

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) {
    console.log('✅ MongoDB already connected');
    return { client: mongoClient, db, gridFSBucket };
  }

  try {
    // Create MongoDB client with connection pooling
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    });

    // Connect to MongoDB
    await mongoClient.connect();
    console.log('✅ MongoDB connected successfully');

    // Get database instance
    db = mongoClient.db(MONGODB_DB_NAME);

    // Initialize GridFS bucket for file storage
    gridFSBucket = new GridFSBucket(db, {
      bucketName: 'media', // Collection prefix: media.files, media.chunks
    });

    console.log('✅ GridFS Bucket initialized for media storage');

    // Create indexes for better performance
    await createIndexes();

    return { client: mongoClient, db, gridFSBucket };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Create indexes for GridFS collections
 */
async function createIndexes() {
  try {
    // Index for files collection
    await db.collection('media.files').createIndex({ filename: 1 });
    await db.collection('media.files').createIndex({ uploadDate: -1 });
    await db.collection('media.files').createIndex({ 'metadata.type': 1 });
    await db.collection('media.files').createIndex({ 'metadata.relatedId': 1 });
    
    console.log('✅ MongoDB indexes created');
  } catch (error) {
    console.error('⚠️ Error creating indexes:', error.message);
  }
}

/**
 * Get MongoDB database instance
 */
function getDB() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return db;
}

/**
 * Get GridFS bucket instance
 */
function getGridFSBucket() {
  if (!gridFSBucket) {
    throw new Error('GridFS Bucket not initialized. Call connectMongoDB() first.');
  }
  return gridFSBucket;
}

/**
 * Close MongoDB connection
 */
async function closeMongoDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    gridFSBucket = null;
    console.log('✅ MongoDB connection closed');
  }
}

/**
 * Check MongoDB connection health
 */
async function checkMongoDBHealth() {
  try {
    if (!mongoClient) {
      return { status: 'disconnected', message: 'MongoDB client not initialized' };
    }

    // Ping the database
    await db.admin().ping();
    
    return {
      status: 'connected',
      message: 'MongoDB is healthy',
      database: MONGODB_DB_NAME,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}

module.exports = {
  connectMongoDB,
  getDB,
  getGridFSBucket,
  closeMongoDB,
  checkMongoDBHealth,
};
