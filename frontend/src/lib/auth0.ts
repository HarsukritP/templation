import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Validate required environment variables
const requiredEnvVars = {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
  AUTH0_SECRET: process.env.AUTH0_SECRET,
  APP_BASE_URL: process.env.APP_BASE_URL,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required Auth0 environment variables:', missingVars);
  // In development, we might want to continue with warnings
  // In production, we should fail fast
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required Auth0 environment variables: ${missingVars.join(', ')}`);
  }
}

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  },
}); 