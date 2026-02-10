import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Fast screenshot proxy using Edge Runtime
 * Fetches the actual site and returns as iframe-embeddable content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return new Response('Missing url parameter', { status: 400 })
    }

    const hostname = new URL(url).hostname
    
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="0" y="0" width="1200" height="1" fill="#e2e8f0" />
  <rect x="0" y="629" width="1200" height="1" fill="#e2e8f0" />
  <!-- Monitor icon -->
  <rect x="500" y="180" width="200" height="150" rx="8" fill="none" stroke="#94a3b8" stroke-width="3" />
  <rect x="510" y="190" width="180" height="120" rx="4" fill="#e2e8f0" />
  <rect x="570" y="330" width="60" height="12" rx="2" fill="#94a3b8" />
  <rect x="540" y="342" width="120" height="6" rx="3" fill="#94a3b8" />
  <!-- Diagonal line through screen -->
  <line x1="520" y1="300" x2="690" y2="200" stroke="#cbd5e1" stroke-width="2" />
  <text x="600" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#475569" text-anchor="middle" font-weight="600">Preview not available</text>
  <text x="600" y="435" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">${hostname}</text>
</svg>`
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[Screenshot] Error:', error)
    
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f8fafc" />
  <rect x="500" y="220" width="200" height="150" rx="8" fill="none" stroke="#cbd5e1" stroke-width="3" />
  <rect x="510" y="230" width="180" height="120" rx="4" fill="#f1f5f9" />
  <rect x="570" y="370" width="60" height="12" rx="2" fill="#cbd5e1" />
  <rect x="540" y="382" width="120" height="6" rx="3" fill="#cbd5e1" />
  <text x="600" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle">Preview unavailable</text>
</svg>`
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
}
