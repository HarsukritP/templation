import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';

interface SearchFilters {
  language?: string;
  min_stars?: number;
  max_age_days?: number;
}

interface RepoResult {
  name: string;
  url: string;
  demo_url?: string;
  screenshot_url?: string;
  metrics: {
    stars: number;
    forks: number;
    updated: string;
  };
  visual_summary: string;
  tech_stack: string[];
  customization_difficulty: 'easy' | 'medium' | 'hard';
}

interface SearchResult {
  repos: RepoResult[];
  total_found: number;
  search_time_ms: number;
}

export async function searchExemplar(
  description: string,
  filters?: SearchFilters
): Promise<SearchResult> {
  try {
    const apiKey = process.env.API_KEY;
    
    const response = await fetch(`${SERVER_URL}/api/search-exemplar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        filters: filters || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as SearchResult;
    return result;
  } catch (error) {
    console.error('Search exemplar failed:', error);
    throw new Error(`Failed to search for exemplars: ${error}`);
  }
} 