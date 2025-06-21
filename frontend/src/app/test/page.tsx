export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Templation Test Page</h1>
      <p>If you can see this, Next.js is working correctly!</p>
      <p>Time: {new Date().toISOString()}</p>
      <style jsx>{`
        div {
          background: #1a1a1a;
          color: #ffffff;
          min-height: 100vh;
        }
        h1 {
          color: #3b82f6;
        }
      `}</style>
    </div>
  )
} 