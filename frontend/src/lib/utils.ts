import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ensure HTTPS in production - BULLETPROOF VERSION
const getApiBaseUrl = () => {
  // BULLETPROOF: Always use HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    return 'https://templation-api.up.railway.app';
  }
  
  // Development fallback
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export async function fetcher(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
} 