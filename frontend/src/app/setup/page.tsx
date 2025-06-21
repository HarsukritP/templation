export default function SetupPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Setup Guide</h1>
          <p className="text-xl text-muted-foreground">
            Get started with Templation in just a few simple steps
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">1. Create Account</h3>
            <p className="text-muted-foreground">
              Sign up for a free Templation account to get started
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">2. Get API Key</h3>
            <p className="text-muted-foreground">
              Generate your API key from the dashboard to authenticate requests
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">3. Install MCP</h3>
            <p className="text-muted-foreground">
              Add the Templation MCP server to your Cursor/Claude Desktop
            </p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-muted-foreground">Detailed setup instructions coming soon...</p>
        </div>
      </div>
    </div>
  )
} 