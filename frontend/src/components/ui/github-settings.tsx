'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from './button';
import { Card } from './card';

interface GitHubStatus {
  connected: boolean;
  username: string | null;
  has_access_token: boolean;
}

interface GitHubSettingsProps {
  onStatusChange?: (status: GitHubStatus) => void;
}

export default function GitHubSettings({ onStatusChange }: GitHubSettingsProps) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const fetchGitHubStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/github/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        onStatusChange?.(data);
      }
    } catch (error) {
      console.error('Failed to fetch GitHub status:', error);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchGitHubStatus();
  }, [fetchGitHubStatus]);

  const connectGitHub = async () => {
    if (!githubUsername.trim() || !accessToken.trim()) {
      alert('Please enter both GitHub username and access token');
      return;
    }

    try {
      setConnecting(true);
      const response = await fetch('/api/users/github/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          github_username: githubUsername.trim(),
          access_token: accessToken.trim(),
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchGitHubStatus();
        setGithubUsername('');
        setAccessToken('');
        alert(`Successfully connected GitHub account: ${data.github_username}`);
      } else {
        alert(`Failed to connect GitHub: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Connection failed: ${error}`);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return;
    }

    try {
      setConnecting(true);
      const response = await fetch('/api/users/github/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchGitHubStatus();
        alert('Successfully disconnected GitHub account');
      } else {
        alert(`Failed to disconnect GitHub: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Disconnection failed: ${error}`);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">GitHub Account</h3>
            <p className="text-sm text-muted-foreground">
              Connect your GitHub account to access repository templates
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs ${
            status?.connected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status?.connected ? 'Connected' : 'Not Connected'}
          </div>
        </div>

        {status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">@{status.username}</p>
                  <p className="text-sm text-green-600">GitHub account connected</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={disconnectGitHub} 
                disabled={connecting}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {connecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Username</label>
              <input
                type="text"
                placeholder="Enter your GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Access Token</label>
              <input
                type="password"
                placeholder="Enter your GitHub personal access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Create a token at{' '}
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  github.com/settings/tokens
                </a>
              </p>
            </div>
            
            <Button 
              onClick={connectGitHub} 
              disabled={connecting || !githubUsername.trim() || !accessToken.trim()}
              className="w-full"
            >
              {connecting ? 'Connecting...' : 'Connect GitHub Account'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
} 