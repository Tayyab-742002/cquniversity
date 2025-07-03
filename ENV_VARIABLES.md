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
ADMIN_TOKEN=your-super-secure-admin-token-here-2024

# Optional: Restrict admin access to specific IP addresses (comma-separated)
ADMIN_IPS=192.168.1.100,203.0.113.10,10.0.0.5

# Example production setup:
# ADMIN_TOKEN=Adm1n_Psyc0T3st_2024_Secure_Token_x9K7mP3qR8
# ADMIN_IPS=203.0.113.10,198.51.100.20
```

### Application Configuration
```bash
NODE_ENV=production
# or NODE_ENV=development for local development
```

## Admin Dashboard Access

### Development (Default)
- **Path**: `/sys-analytics-db7f9e2a`
- **Token**: `psyco-admin-secure-2024-x9k7m`
- **IP Restriction**: Disabled

### Production Setup
1. **Change the admin token** in your environment variables
2. **Set ADMIN_IPS** if you want IP restrictions
3. **Use HTTPS** in production
4. **Monitor access logs** for security

### Security Features
- **Unpredictable path**: `/sys-analytics-db7f9e2a` (hard to guess)
- **Token-based authentication**: Secure token required
- **Optional IP whitelisting**: Restrict to specific IPs
- **Session management**: Token stored in browser session
- **Secure headers**: Authorization header validation

## Example .env.local file
```bash
MONGODB_URI=mongodb://localhost:27017/psycotest
ADMIN_TOKEN=your-secure-admin-token-2024
ADMIN_IPS=192.168.1.100,10.0.0.5
NODE_ENV=development
```

## Notes
- Never commit the `.env.local` file to version control
- Use strong, unique tokens in production
- Consider using environment variable management services for production
- The admin token should be at least 32 characters long with mixed case, numbers, and symbols

# Required Environment Variables for PsycoTest

Create a `.env.local` file in the root directory of your project with the following variables:

```
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/psycotest
# Replace with your actual MongoDB connection string
# Example for MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/psycotest?retryWrites=true&w=majority

# Next.js Environment
NODE_ENV=development
# Set to 'production' when deploying

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Replace with your actual deployment URL in production

# IP Address API Key (if using a different IP service than ipify)
# NEXT_PUBLIC_IP_API_KEY=your_api_key_here
```

## How to Set Up

1. Create a file named `.env.local` in the root directory of your project
2. Copy the variables above into the file
3. Replace the placeholder values with your actual configuration
4. Make sure to add `.env.local` to your `.gitignore` file to prevent committing sensitive information

## Required Variables Explanation

- **MONGODB_URI**: Connection string for your MongoDB database. This is required for storing participant data and test results.
- **NODE_ENV**: Environment setting for Next.js. Use 'development' for local development and 'production' for deployment.
- **NEXT_PUBLIC_APP_URL**: The base URL of your application. Used for generating absolute URLs.

## Optional Variables

- **NEXT_PUBLIC_IP_API_KEY**: If you decide to use a different IP address service that requires authentication. 