/**
 * Chat Widget Layout
 *
 * PHASE LC-04: Minimal layout for embeddable chat widget
 * No dashboard chrome — just the widget content
 *
 * NOTE: This is a NESTED layout under app/layout.tsx (root).
 * The root layout already provides <html>, <body>, and globals.css.
 * We must NOT redefine <html>/<body> here — that causes double nesting.
 * Instead, we wrap children in a styled container that overrides the
 * root layout's background and theme to keep the widget transparent.
 */

export default function ChatWidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      id="dramac-chat-widget-root"
      style={{
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: 'transparent',
        colorScheme: 'light',
      }}
    >
      {/* Override root layout's bg-background on body and force light mode */}
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          background: transparent !important;
          background-color: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          height: 100% !important;
          min-height: 100% !important;
        }
        /* Force light mode CSS variables regardless of system preference */
        html.dark body, html body {
          background: transparent !important;
        }
        /* Ensure full height chain for widget content */
        #dramac-chat-widget-root {
          height: 100%;
        }
        /* Hide any Providers UI that leaks in (toaster, etc.) */
        [data-sonner-toaster] { display: none !important; }
      ` }} />
      {children}
    </div>
  )
}
