import mongoose from 'mongoose';

// Use environment variable or default to localhost if not provided
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log URI with hidden credentials
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error('MongoDB connection error:', e.message);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase; 