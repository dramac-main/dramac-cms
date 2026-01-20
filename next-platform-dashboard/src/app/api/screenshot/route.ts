import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

/**
 * Fast screenshot generation using Edge Runtime
 * Similar to Vercel's OG image generation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return new Response('Missing url parameter', { status: 400 })
    }

    // Fetch the actual site HTML
    const siteResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DRAMAC-Screenshot/1.0)',
      },
    })

    if (!siteResponse.ok) {
      // Return placeholder on error
      return generatePlaceholder(url)
    }

    const html = await siteResponse.text()
    
    // Extract title and basic styling
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1] : new URL(url).hostname

    // Generate a preview image using @vercel/og
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                color: '#0ea5e9',
              }}
            >
              🌐
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: '#1e293b',
                maxWidth: '80%',
                textAlign: 'center',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 18,
                color: '#64748b',
                maxWidth: '70%',
                textAlign: 'center',
              }}
            >
              {new URL(url).hostname}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('[Screenshot] Error:', error)
    return generatePlaceholder('')
  }
}

function generatePlaceholder(url: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f1f5f9',
        }}
      >
        <div
          style={{
            fontSize: 60,
            color: '#cbd5e1',
          }}
        >
          🌐
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
