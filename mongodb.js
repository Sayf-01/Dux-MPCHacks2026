const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Get MongoDB URI from environment variable
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  // Create a new MongoClient
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Connect to the cluster
    await client.connect();

    // Get the database (you can specify your database name here)
    const db = client.db('montreal_attractions'); // Change this to your DB name

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    // Ensure the client is closed on error
    await client.close();
    throw error;
  }
}

async function getPlacesCollection() {
  const { db } = await connectToDatabase();
  return db.collection('places'); // Change this to your collection name
}

async function loadPlacesFromMongoDB() {
  try {
    const collection = await getPlacesCollection();
    const places = await collection.find({}).toArray();
    return places;
  } catch (error) {
    console.error('Error loading places from MongoDB:', error);
    // Return empty array as fallback
    return [];
  }
}

// Function to find places matching criteria (for more advanced querying)
async function findPlacesFromMongoDB(query = {}) {
  try {
    const collection = await getPlacesCollection();
    const places = await collection.find(query).toArray();
    return places;
  } catch (error) {
    console.error('Error finding places from MongoDB:', error);
    return [];
  }
}

module.exports = {
  connectToDatabase,
  getPlacesCollection,
  loadPlacesFromMongoDB,
  findPlacesFromMongoDB
};