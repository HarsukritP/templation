export default function TestPage() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: '#1a1a1a',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#3b82f6' }}>Templation Test Page</h1>
      <p>If you can see this, Next.js is working correctly!</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  )
} 