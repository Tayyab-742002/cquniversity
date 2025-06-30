import { NextResponse } from 'next/server';

/**
 * API endpoint to check environment variables
 * @returns {Promise<NextResponse>} Response with environment variables status
 */
export async function GET() {
  // Only return whether the variables are set, not their values
  const envStatus = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL
  };
  
  // Log for debugging
  console.log('Environment variables status:', envStatus);
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 
    process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 
    'Not set');
  
  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    variables: envStatus
  });
} 