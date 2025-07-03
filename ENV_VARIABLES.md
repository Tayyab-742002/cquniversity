# Environment Variables

This file contains the required environment variables for the PsycoTest application.

## Required Variables

### Clerk Authentication (Required)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# For development (use pk_test_ and sk_test_ keys):
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/tests
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

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

## Setting Up Clerk Authentication

### 1. Create a Clerk Application
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose "Google" as your social provider
4. Copy your publishable key and secret key

### 2. Configure Domain Settings
For production deployment:
1. In your Clerk dashboard, go to "Domains"
2. Add your Vercel domain (e.g., `yourapp.vercel.app`)
3. Add your custom domain if you have one

### 3. Configure OAuth Settings
1. In Clerk dashboard, go to "Social Connections" → "Google"
2. Enable Google authentication
3. Add your authorized domains in Google Cloud Console
4. Set redirect URIs to include your domain + `/sso-callback`

### 4. Environment Variables for Production
- Use `pk_live_` and `sk_live_` keys for production
- Use `pk_test_` and `sk_test_` keys for development
- Never commit secret keys to version control

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
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/tests
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Database
MONGODB_URI=mongodb://localhost:27017/psycotest

# Admin
ADMIN_TOKEN=psyco-admin-secure-2024-x9k7m

# App
NODE_ENV=development
```

## Notes
- Never commit the `.env.local` file to version control
- Use strong, unique tokens in production
- For production, upgrade to Clerk Pro plan to remove development mode banner
- Consider using environment variable management services for production
- The admin token should be at least 32 characters long with mixed case, numbers, and symbols
- Access the admin dashboard at `/admin` with the configured token

## Troubleshooting

### "Development mode" banner showing
- Make sure you're using production keys (`pk_live_` and `sk_live_`)
- Upgrade to Clerk Pro plan for production use
- Use custom authentication pages (already implemented)

### Authentication not working
- Check that your domain is added to Clerk dashboard
- Verify OAuth redirect URIs include `/sso-callback`
- Ensure environment variables are properly set 