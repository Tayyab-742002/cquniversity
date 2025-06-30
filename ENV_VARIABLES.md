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