import fetch from 'node-fetch';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8000';

interface UserContext {
  project_name?: string;
  preferred_style?: string;
  additional_features?: string[];
}

interface ConversionResult {
  conversion_steps: string[];
  files_to_modify: string[];
  customization_points: string[];
  setup_commands: string[];
  expected_outcome: string;
  template_id?: string;
}

export async function templateConverter(
  repo_url: string,
  template_description: string,
  user_context?: UserContext
): Promise<ConversionResult> {
  try {
    const apiKey = process.env.API_KEY;
    
    const response = await fetch(`${SERVER_URL}/api/template-converter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo_url,
        template_description,
        user_context: user_context || {},
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as ConversionResult;
    return result;
  } catch (error) {
    console.error('Template conversion failed:', error);
    throw new Error(`Failed to convert template: ${error}`);
  }
} 