import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';

/**
 * API endpoint to check MongoDB connection
 * @returns {Promise<NextResponse>} Response with MongoDB connection status
 */
export async function GET() {
  try {
    // Try to connect to the database
    const mongoose = await connectToDatabase();
    
    // Check connection status
    const isConnected = mongoose.connection.readyState === 1;
    
    if (isConnected) {
      return NextResponse.json({
        status: 'ok',
        message: 'MongoDB connected successfully',
        connection: {
          host: mongoose.connection.host,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState
        }
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'MongoDB connection is not ready',
        readyState: mongoose.connection.readyState
      }, { status: 500 });
    }
  } catch (error) {
    console.error('MongoDB connection check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to MongoDB',
      error: error.message
    }, { status: 500 });
  }
} 