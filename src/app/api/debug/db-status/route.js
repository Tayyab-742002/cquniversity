import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * Debug API endpoint to check MongoDB connection and database status
 * @returns {Promise<NextResponse>} Response with database status
 */
export async function GET() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get connection status
    const isConnected = mongoose.connection.readyState === 1;
    
    // Get collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(collection => collection.name);
    
    // Get counts for each collection
    const counts = {};
    for (const collectionName of collectionNames) {
      counts[collectionName] = await mongoose.connection.db.collection(collectionName).countDocuments();
    }
    
    // Get MongoDB URI (hide credentials)
    const mongodbUri = process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')
      : 'Not set';
    
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      databaseName: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      mongodbUri,
      collections: collectionNames,
      documentCounts: counts,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error in debug db-status route:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get database status: ' + error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 