import { NextResponse } from 'next/server';

export function middleware(request) {
  // Check if MongoDB URI is set
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set');
    
    // Only show the error page in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.rewrite(new URL('/api/error?code=config_error', request.url));
    }
  }
  
  return NextResponse.next();
}

// Only run the middleware on specific paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/error).*)',
  ],
}; 