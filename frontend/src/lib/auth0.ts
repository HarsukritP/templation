import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Initialize the Auth0 client with proper v4 configuration
export const auth0 = new Auth0Client({
  // Options are loaded from environment variables by default
  // but we need to explicitly pass scope and audience for v4
  authorizationParameters: {
    // In v4, the AUTH0_SCOPE and AUTH0_AUDIENCE environment variables 
    // are no longer automatically picked up by the SDK.
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  }
}); 