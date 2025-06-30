import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const errorCode = searchParams.get('code');
  
  let errorMessage = 'An unknown error occurred';
  let statusCode = 500;
  
  switch (errorCode) {
    case 'config_error':
      errorMessage = 'Application configuration error. Please check environment variables.';
      statusCode = 500;
      break;
    default:
      errorMessage = 'An unknown error occurred';
      statusCode = 500;
  }
  
  return NextResponse.json({ error: errorMessage }, { status: statusCode });
} 