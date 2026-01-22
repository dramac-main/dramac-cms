import { getModuleForEmbed } from '@/lib/modules/embed/embed-service'
import { ModuleEmbedRenderer } from '@/components/modules/embed/module-embed-renderer'
import { validateEmbedToken } from '@/lib/modules/embed/embed-auth'

interface EmbedPageProps {
  params: Promise<{ moduleId: string; siteId: string }>
  searchParams: Promise<{ 
    token?: string
    theme?: 'light' | 'dark' | 'auto'
    width?: string
    height?: string
  }>
}

export default async function ModuleEmbedPage({ params, searchParams }: EmbedPageProps) {
  const { moduleId, siteId } = await params
  const { token, theme = 'auto', width, height } = await searchParams

  // Validate embed token
  const isValid = await validateEmbedToken(token || '', siteId, moduleId)
  if (!isValid) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Access Denied</title>
          <style>{`
            html, body { 
              margin: 0; 
              padding: 0; 
              font-family: system-ui, -apple-system, sans-serif;
              background: #fafafa;
            }
          `}</style>
        </head>
        <body>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            padding: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                Access Denied
              </h1>
              <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                Invalid or expired embed token
              </p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Load module and settings
  const { module, installation, error } = await getModuleForEmbed(moduleId, siteId)

  if (error || !module) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Module Not Available</title>
          <style>{`
            html, body { 
              margin: 0; 
              padding: 0; 
              font-family: system-ui, -apple-system, sans-serif;
              background: #fafafa;
            }
          `}</style>
        </head>
        <body>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh',
            padding: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                Module Not Available
              </h1>
              <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                {error || 'Module not found'}
              </p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  const themeClass = theme === 'dark' ? 'dark' : theme === 'light' ? '' : ''

  return (
    <html lang="en" className={themeClass}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>{module.name} - Embedded</title>
        <style>{`
          :root {
            --background: 255 255 255;
            --foreground: 9 9 11;
            --muted: 244 244 245;
            --muted-foreground: 113 113 122;
            --border: 228 228 231;
            --primary: 59 130 246;
          }
          .dark {
            --background: 9 9 11;
            --foreground: 250 250 250;
            --muted: 39 39 42;
            --muted-foreground: 161 161 170;
            --border: 39 39 42;
          }
          html, body { 
            margin: 0; 
            padding: 0; 
            background: rgb(var(--background));
            color: rgb(var(--foreground));
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ${width ? `width: ${width};` : ''}
            ${height ? `min-height: ${height};` : 'min-height: 100vh;'}
          }
          #embed-root {
            width: 100%;
            height: 100%;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
        {/* Module-specific styles */}
        {module.styles && <style>{module.styles}</style>}
      </head>
      <body>
        <div id="embed-root">
          <ModuleEmbedRenderer
            module={module}
            settings={installation?.settings || {}}
            siteId={siteId}
            theme={theme}
          />
        </div>
        {/* PostMessage bridge for parent communication */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            'use strict';
            
            // Notify parent that module is ready
            window.parent.postMessage({
              type: 'DRAMAC_MODULE_READY',
              moduleId: '${moduleId}',
              siteId: '${siteId}'
            }, '*');

            // Listen for messages from parent
            window.addEventListener('message', function(event) {
              if (event.data.type === 'DRAMAC_SETTINGS_UPDATE') {
                // Handle settings update
                window.dispatchEvent(new CustomEvent('dramac:settings', { 
                  detail: event.data.settings 
                }));
              }
              if (event.data.type === 'DRAMAC_THEME_CHANGE') {
                document.documentElement.className = event.data.theme === 'dark' ? 'dark' : '';
              }
              if (event.data.type === 'DRAMAC_CUSTOM_MESSAGE') {
                window.dispatchEvent(new CustomEvent('dramac:message', {
                  detail: {
                    type: event.data.customType,
                    payload: event.data.payload
                  }
                }));
              }
            });

            // Auto-resize iframe - notify parent of height changes
            var resizeObserver = new ResizeObserver(function(entries) {
              var height = entries[0].contentRect.height;
              window.parent.postMessage({
                type: 'DRAMAC_RESIZE',
                moduleId: '${moduleId}',
                height: height
              }, '*');
            });
            resizeObserver.observe(document.body);

            // Provide a way for modules to send events to parent
            window.DRAMAC = window.DRAMAC || {};
            window.DRAMAC.sendEvent = function(eventName, payload) {
              window.parent.postMessage({
                type: 'DRAMAC_EVENT',
                event: eventName,
                payload: payload,
                moduleId: '${moduleId}'
              }, '*');
            };

            // Error handling
            window.onerror = function(msg, url, lineNo, columnNo, error) {
              window.parent.postMessage({
                type: 'DRAMAC_ERROR',
                message: msg,
                moduleId: '${moduleId}'
              }, '*');
              return false;
            };
          })();
        `}} />
      </body>
    </html>
  )
}

// Configure for embedding - disable layout wrapping
export const dynamic = 'force-dynamic'

// Allow embedding from any origin
export async function generateMetadata() {
  return {
    other: {
      'X-Frame-Options': 'ALLOWALL',
    },
  }
}
