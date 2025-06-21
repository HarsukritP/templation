'use client'

import { useState } from 'react'
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
  Globe, 
  Settings, 
  Star,
  ArrowRight,
  CheckCircle,
  Play,
  Download
} from 'lucide-react'
import { ProtectedRoute } from '../../components/auth/protected-route'
import { DashboardLayout } from '../../components/layout/dashboard-layout'

export default function ReadmePage() {
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
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-16 pb-16">
          {/* Header - README Style */}
          <div className="text-center space-y-6 pt-8">
            <div className="inline-flex items-center space-x-3 bg-gray-900 text-green-400 px-6 py-3 rounded-lg font-mono text-sm">
              <Terminal className="h-4 w-4" />
              <span>README.md</span>
        </div>
        
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              # Templation
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              🚀 The first <strong>MCP-powered</strong> repository template system. Transform any GitHub repository into a personalized, AI-guided template in minutes.
            </p>

            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>MCP Compatible</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span>Universal</span>
              </div>
            </div>
          </div>

          {/* What is Templation */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Brain className="h-6 w-6 text-blue-600" />
                <span>## What is Templation?</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Templation revolutionizes how developers work with code templates. Instead of generic boilerplates, 
                get <strong>intelligent, personalized templates</strong> that understand your specific needs.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <GitBranch className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Any Repository</h3>
                  <p className="text-sm text-muted-foreground">Works with any GitHub repository, any tech stack, any complexity level.</p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">Deep code understanding generates personalized setup instructions.</p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Rocket className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Ready Template</h3>
                  <p className="text-sm text-muted-foreground">Get step-by-step instructions tailored to your specific use case.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">## How It Works</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Paste Repository URL",
                  description: "Any GitHub repository becomes a potential template",
                  icon: GitBranch,
                  color: "blue"
                },
                {
                  step: "02", 
                  title: "AI Deep Analysis",
                  description: "Our AI analyzes code structure, dependencies, and patterns",
                  icon: Brain,
                  color: "purple"
                },
                {
                  step: "03",
                  title: "Generate Instructions",
                  description: "Creates personalized setup and customization guides",
                  icon: Code2,
                  color: "green"
                },
                {
                  step: "04",
                  title: "Use Anywhere",
                  description: "Access via web app, MCP server, or direct API",
                  icon: Rocket,
                  color: "orange"
                }
              ].map((item, index) => (
                <Card key={index} className={`relative overflow-hidden border-2 border-${item.color}-100 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100`}>
                  <CardContent className="p-6 text-center space-y-4">
                    <div className={`w-12 h-12 bg-${item.color}-100 rounded-full flex items-center justify-center mx-auto`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <div className={`text-2xl font-bold text-${item.color}-600`}>{item.step}</div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* MCP Integration */}
          <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Settings className="h-6 w-6 text-purple-600" />
                <span>## MCP Server Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Templation is built on the <strong>Model Context Protocol (MCP)</strong>, making it compatible with 
                Claude Desktop, VS Code, and other AI assistants.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">### Installation</h3>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <code className="text-green-400 font-mono text-sm">{codeExamples.install}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(codeExamples.install, 'install')}
                  >
                    {copiedCode === 'install' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">### Configuration</h3>
                <div className="bg-gray-900 rounded-lg p-4 relative">
                  <pre className="text-green-400 font-mono text-sm overflow-x-auto">{codeExamples.config}</pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={() => copyToClipboard(codeExamples.config, 'config')}
                  >
                    {copiedCode === 'config' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Examples */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">## Usage Examples</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code2 className="h-5 w-5" />
                    <span>MCP Functions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <pre className="text-green-400 font-mono text-sm overflow-x-auto">{codeExamples.usage}</pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-gray-400 hover:text-white"
                      onClick={() => copyToClipboard(codeExamples.usage, 'usage')}
                    >
                      {copiedCode === 'usage' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5" />
                    <span>Direct API</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <pre className="text-green-400 font-mono text-sm overflow-x-auto">{codeExamples.curl}</pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-gray-400 hover:text-white"
                      onClick={() => copyToClipboard(codeExamples.curl, 'curl')}
                    >
                      {copiedCode === 'curl' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Use Cases */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">## Use Cases</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Portfolio Websites",
                  description: "Transform any portfolio into your personal brand",
                  example: "React → Your Portfolio",
                  color: "blue"
                },
                {
                  title: "Starter Projects", 
                  description: "Learning-focused templates with guided setup",
                  example: "Next.js → Learning Project",
                  color: "green"
                },
                {
                  title: "Enterprise Templates",
                  description: "Team productivity with standardized setups",
                  example: "Microservice → Team Standard",
                  color: "purple"
                }
              ].map((useCase, index) => (
                <Card key={index} className={`border-2 border-${useCase.color}-100 hover:shadow-lg transition-all duration-300`}>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">{useCase.title}</h3>
                    <p className="text-muted-foreground">{useCase.description}</p>
                    <div className={`inline-flex items-center space-x-2 bg-${useCase.color}-50 text-${useCase.color}-700 px-3 py-1 rounded-full text-sm`}>
                      <Play className="h-3 w-3" />
                      <span>{useCase.example}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Get Started */}
          <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center space-x-3">
                <Rocket className="h-6 w-6 text-green-600" />
                <span>## Get Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground">
                Choose your preferred way to start using Templation:
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-2 border-blue-200 hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center space-y-4">
                    <Globe className="h-8 w-8 text-blue-600 mx-auto" />
                    <h3 className="font-semibold">Web Application</h3>
                    <p className="text-sm text-muted-foreground">Use the full-featured web interface</p>
                    <Button className="w-full" onClick={() => window.location.href = '/templates'}>
                      Open Templates <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-200 hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center space-y-4">
                    <Settings className="h-8 w-8 text-purple-600 mx-auto" />
                    <h3 className="font-semibold">MCP Server</h3>
                    <p className="text-sm text-muted-foreground">Integrate with Claude Desktop & AI assistants</p>
                    <Button variant="outline" className="w-full" onClick={() => copyToClipboard(codeExamples.install, 'get-started')}>
                      <Download className="mr-2 h-4 w-4" />
                      {copiedCode === 'get-started' ? 'Copied!' : 'Copy Install'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 hover:shadow-md transition-all">
                  <CardContent className="p-6 text-center space-y-4">
                    <Code2 className="h-8 w-8 text-green-600 mx-auto" />
                    <h3 className="font-semibold">Direct API</h3>
                    <p className="text-sm text-muted-foreground">Build custom integrations</p>
                    <Button variant="outline" className="w-full" onClick={() => window.location.href = '/api-keys'}>
                      Get API Key <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-4 pt-8 border-t">
            <p className="text-muted-foreground">
              Built with ❤️ for the developer community
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <span>🚀 AI-Powered</span>
              <span>⚡ Lightning Fast</span>
              <span>🔧 Developer-First</span>
              <span>🌍 Open Source Ready</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
} 