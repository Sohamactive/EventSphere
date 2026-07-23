const mongoose = require('mongoose');

// Global cache variable to track and reuse the active database connection
let isConnected = false; 

const connectDB = async () => {
  // If already connected, resolve immediately without requesting a new path
  if (isConnected) {
    console.log('=> Using existing database connection cache');
    return;
  }

  console.log('=> Initializing a fresh MongoDB connection...');
  
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      // Force Mongoose client to fail quickly (in 5s) instead of letting Vercel hit its 10s ceiling
      serverSelectionTimeoutMS: 5000, 
    });

    // Check if connection state evaluates to connected (value of 1)
    isConnected = db.connections[0].readyState === 1;
    console.log(`MongoDB connected successfully: ${db.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    // DO NOT use process.exit(1). Throw the error natively so Express can catch and report it.
    throw err; 
  }
};

module.exports = connectDB;
