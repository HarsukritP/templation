import type { NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    // Only protect these specific routes
    "/dashboard/:path*",
    "/api-keys/:path*",
    // Auth routes are handled by Auth0
    "/auth/:path*"
  ]
}; 