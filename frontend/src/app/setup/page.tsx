'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { 
  Code2, 
  GitBranch, 
  Zap, 
  Brain, 
  Rocket, 
  Copy, 
  Terminal, 
  Settings, 
  Star,
  CheckCircle,
  Play,
  Download,
  BookOpen,
  Layers,
  Globe
} from 'lucide-react'

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const codeExamples = {
    install: `npm install -g @templation/mcp-server`,
    config: `{
  "mcpServers": {
    "templation": {
      "command": "npx",
      "args": ["@templation/mcp-server"],
      "env": {
        "TEMPLATION_API_KEY": "your-api-key-here"
      }
    }
  }
}`,
    usage: `// Search for templates
await templation.searchTemplates("react portfolio")

// Convert repository to template
await templation.convertRepository({
  repoUrl: "https://github.com/user/awesome-project",
  description: "My portfolio template"
})`,
    curl: `curl -X POST https://templation-api.up.railway.app/api/search-exemplar \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"description": "react portfolio website"}'`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold">
            Templation Docs
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform any GitHub repository into a personalized, AI-guided template in minutes. 
            Built for modern development workflows with MCP integration.
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>MCP Compatible</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Globe className="h-4 w-4 text-green-500" />
              <span>Universal</span>
            </div>
          </div>
        </div>

        {/* What is Templation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-3">
              <Brain className="h-6 w-6 text-primary" />
              <span>What is Templation?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Templation revolutionizes how developers work with code templates. Instead of generic boilerplates, 
              get intelligent, personalized templates that understand your specific needs.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <GitBranch className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold">Any Repository</h3>
                <p className="text-sm text-muted-foreground">Works with any GitHub repository, any tech stack, any complexity level.</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">Deep code understanding generates personalized setup instructions.</p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold">Ready Template</h3>
                <p className="text-sm text-muted-foreground">Get step-by-step instructions tailored to your specific use case.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground">Four simple steps to transform any repository into your perfect template</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Paste Repository URL",
                description: "Any GitHub repository becomes a potential template",
                icon: GitBranch
              },
              {
                step: "02", 
                title: "AI Deep Analysis",
                description: "Our AI analyzes code structure, dependencies, and patterns",
                icon: Brain
              },
              {
                step: "03",
                title: "Generate Instructions",
                description: "Creates personalized setup and customization guides",
                icon: Code2
              },
              {
                step: "04",
                title: "Use Anywhere",
                description: "Access via web app, MCP server, or direct API",
                icon: Rocket
              }
            ].map((item, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary">{item.step}</div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* MCP Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary" />
              <span>MCP Server Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Templation is built on the Model Context Protocol (MCP), making it compatible with 
              Claude Desktop, Cursor, and other AI assistants.
            </p>

            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
                  Quick Setup Guide
                </h3>
                <ol className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                    <div>
                      <strong>Create an API Key:</strong> Go to your <Link href="/api-keys" className="underline hover:text-blue-600">profile settings</Link> and create a new API key
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                    <div>
                      <strong>Copy the Key:</strong> Copy the full API key that appears briefly at the top - this is shown only once! Save it securely
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                    <div>
                      <strong>Install Package:</strong> Run the npm install command below to download our latest package
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                    <div>
                      <strong>Update Configuration:</strong> Add your API key to your MCP config file (Cursor or Claude Desktop)
                    </div>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                    <div>
                      <strong>Restart:</strong> Close and reopen your editor - Templation functions are now loaded and ready to use!
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Download className="h-5 w-5 text-primary" />
                  <span>Step 3: Installation</span>
                </h3>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{codeExamples.install}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExamples.install, 'install')}
                  >
                    {copiedCode === 'install' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Step 4: Configuration</span>
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Replace <code className="bg-muted px-1 py-0.5 rounded">your-copied-api-key-here</code> with the API key you copied in Step 2:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">For Cursor (~/.cursor-mcp/config.json):</h4>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`{
  "templation": {
    "command": "mcp-server",
    "args": ["your-copied-api-key-here"]
  }
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "templation": {
    "command": "mcp-server",
    "args": ["your-copied-api-key-here"]
  }
}`, 'cursor-config')}
                      >
                        {copiedCode === 'cursor-config' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">For Claude Desktop (~/.claude_desktop_config.json):</h4>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`{
  "mcpServers": {
    "templation": {
      "command": "mcp-server",
      "args": ["your-copied-api-key-here"]
    }
  }
}`}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(`{
  "mcpServers": {
    "templation": {
      "command": "mcp-server",
      "args": ["your-copied-api-key-here"]
    }
  }
}`, 'claude-config')}
                      >
                        {copiedCode === 'claude-config' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  <span>Usage Example</span>
                </h3>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{codeExamples.usage}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(codeExamples.usage, 'usage')}
                  >
                    {copiedCode === 'usage' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-3">
              <Terminal className="h-6 w-6 text-primary" />
              <span>API Reference</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Use Templation directly via our REST API for custom integrations.
            </p>

            <div>
              <h3 className="text-lg font-semibold mb-3">Search Exemplar Repositories</h3>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{codeExamples.curl}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                >
                  {copiedCode === 'curl' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Started */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Transform your first repository into a template and experience the power of AI-driven development.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/templates">
                <Button size="lg" className="px-8">
                  <Play className="mr-2 h-5 w-5" />
                  Start Creating Templates
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" size="lg" className="px-8">
                  <Layers className="mr-2 h-5 w-5" />
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 