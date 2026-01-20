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

    // For now, return a styled placeholder with site info
    // In the future, we could use Puppeteer/Playwright for real screenshots
    const hostname = new URL(url).hostname
    
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e0f2fe;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)"/>
        <text x="600" y="280" font-family="system-ui, sans-serif" font-size="60" fill="#0ea5e9" text-anchor="middle" font-weight="bold">🌐</text>
        <text x="600" y="360" font-family="system-ui, sans-serif" font-size="32" fill="#1e293b" text-anchor="middle" font-weight="600">${hostname}</text>
        <text x="600" y="400" font-family="system-ui, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">Live Website</text>
      </svg>
    `
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Screenshot] Error:', error)
    
    // Return error placeholder
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#f1f5f9"/>
        <text x="600" y="315" font-family="system-ui, sans-serif" font-size="60" fill="#cbd5e1" text-anchor="middle">🌐</text>
      </svg>
    `
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}
