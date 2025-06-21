import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
} 