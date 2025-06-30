/**
 * Gets the client IP address from the request object
 * @param {Object} req - Next.js request object
 * @returns {String} IP address
 */
export function getIpAddress(req) {
  // Check for forwarded IPs (when behind a proxy like Nginx)
  const forwarded = req.headers['x-forwarded-for'];
  
  // Get the IP from various possible headers
  const ip = forwarded
    ? forwarded.split(',')[0]
    : req.headers['x-real-ip'] || 
      req.socket.remoteAddress || 
      null;
      
  return ip;
} 