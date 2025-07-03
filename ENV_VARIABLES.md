# Environment Variables

This file contains the required environment variables for the PsycoTest application.

## Required Variables

### Database Configuration
```bash
MONGODB_URI=mongodb://localhost:27017/psycotest
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/psycotest
```

### Admin Dashboard Security (Production)
```bash
# Secure admin token - CHANGE THIS IN PRODUCTION!
ADMIN_TOKEN=psyco-admin-secure-2024-x9k7m

# Example production setup:
# ADMIN_TOKEN=Adm1n_Psyc0T3st_2024_Secure_Token_x9K7mP3qR8
```

### Application Configuration
```bash
NODE_ENV=production
# or NODE_ENV=development for local development
```

## Admin Dashboard Access

### Development (Default)
- **Path**: `/admin`
- **Token**: `psyco-admin-secure-2024-x9k7m`

### Production Setup
1. **Change the admin token** in your environment variables
2. **Use HTTPS** in production
3. **Monitor access logs** for security

### Security Features
- **Always require login**: No auto-login, token required every time
- **No session persistence**: Must enter token for each session
- **Token-based authentication**: Secure token required for all operations
- **Simple authentication**: Form-based token entry
- **Data export**: CSV export functionality included

## Example .env.local file
```bash
MONGODB_URI=mongodb://localhost:27017/psycotest
ADMIN_TOKEN=psyco-admin-secure-2024-x9k7m
NODE_ENV=development
```

## Notes
- Never commit the `.env.local` file to version control
- Use strong, unique tokens in production
- Consider using environment variable management services for production
- The admin token should be at least 32 characters long with mixed case, numbers, and symbols
- Access the admin dashboard at `/admin` with the configured token 