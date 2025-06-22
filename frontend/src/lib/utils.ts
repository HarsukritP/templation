import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Ensure HTTPS in production
const getApiBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Force HTTPS in production if HTTP is accidentally set
  if (process.env.NODE_ENV === 'production') {
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    // Fallback to production URL if no env var
    if (url === 'https://localhost:8000') {
      url = 'https://templation-api.up.railway.app';
    }
  }
  
  return url;
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