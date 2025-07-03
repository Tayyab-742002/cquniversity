import { NextResponse } from 'next/server';

// Admin configuration - these should be in environment variables in production
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'psyco-admin-secure-2024-x9k7m';
const ADMIN_IPS = process.env.ADMIN_IPS?.split(',') || []; // Optional IP restriction

/**
 * Get client IP address from request
 */
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('remote-address');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddress || 'unknown';
}

/**
 * Verify admin authentication
 */
export function verifyAdminAuth(request) {
  try {
    // Get token from Authorization header or request body
    let token = null;
    
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, this might be a login request
    if (!token) {
      return { valid: false, reason: 'No token provided' };
    }
    
    // Verify token
    if (token !== ADMIN_TOKEN) {
      return { valid: false, reason: 'Invalid token' };
    }
    
    // Optional: Check IP restrictions if configured
    if (ADMIN_IPS.length > 0) {
      const clientIP = getClientIP(request);
      if (!ADMIN_IPS.includes(clientIP)) {
        console.log(`Admin access denied for IP: ${clientIP}`);
        return { valid: false, reason: 'IP not authorized' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { valid: false, reason: 'Authentication failed' };
  }
}

/**
 * Middleware wrapper for admin routes
 */
export function withAdminAuth(handler) {
  return async function(request) {
    const auth = verifyAdminAuth(request);
    
    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Unauthorized', reason: auth.reason },
        { status: 401 }
      );
    }
    
    return handler(request);
  };
}

/**
 * Verify login token (for login endpoint)
 */
export function verifyLoginToken(token) {
  return token === ADMIN_TOKEN;
} 