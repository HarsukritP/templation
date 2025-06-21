"use client"

import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState<string | null>(null)
  const [apiKeys] = useState([
    {
      id: '1',
      name: 'Production API Key',
      key: 'tk_prod_1234567890abcdef',
      created: '2024-01-15',
      lastUsed: '2024-01-20'
    },
    {
      id: '2', 
      name: 'Development API Key',
      key: 'tk_dev_abcdef1234567890',
      created: '2024-01-10',
      lastUsed: '2024-01-19'
    }
  ])

  const toggleKeyVisibility = (keyId: string) => {
    setShowKey(showKey === keyId ? null : keyId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your Templation API keys for accessing the service
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Key
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About API Keys</CardTitle>
          <CardDescription>
            Use these API keys to authenticate your requests to the Templation API. 
            Keep your keys secure and never share them publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• API keys are used to authenticate requests to the Templation API</p>
            <p>• Each key has full access to your account - treat them like passwords</p>
            <p>• You can revoke keys at any time if they're compromised</p>
            <p>• Keys are prefixed with 'tk_prod_' for production or 'tk_dev_' for development</p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your API Keys</h2>
        
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  <CardDescription>
                    Created {apiKey.created} • Last used {apiKey.lastUsed}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="flex-1 font-mono text-sm bg-muted p-2 rounded">
                  {showKey === apiKey.id ? apiKey.key : '•'.repeat(apiKey.key.length - 8) + apiKey.key.slice(-8)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleKeyVisibility(apiKey.id)}
                >
                  {showKey === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiKey.key)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
          <CardDescription>
            How to use your API keys with the Templation API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Authentication Header</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>Authorization: Bearer your_api_key_here</code>
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Example cURL Request</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`curl -X GET "https://api.templation.com/v1/templates" \\
  -H "Authorization: Bearer your_api_key_here" \\
  -H "Content-Type: application/json"`}</code>
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">JavaScript Example</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                <code>{`const response = await fetch('https://api.templation.com/v1/templates', {
  headers: {
    'Authorization': 'Bearer your_api_key_here',
    'Content-Type': 'application/json'
  }
});`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 