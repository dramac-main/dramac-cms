export default function SiteNotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: '#666' }}>
        Site not found or not published yet
      </p>
      <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '2rem' }}>
        If you're the site owner, make sure your site is published.
      </p>
    </div>
  );
}
