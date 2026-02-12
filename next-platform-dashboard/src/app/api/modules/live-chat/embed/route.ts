/**
 * Live Chat Embed Script API
 *
 * PHASE LC-04: Returns JavaScript embed snippet for customer sites
 * GET /api/modules/live-chat/embed?siteId=xxx
 *
 * Content-Type: application/javascript
 * The returned script creates an iframe + launcher button on the customer's site.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const siteId = searchParams.get('siteId')

  if (!siteId) {
    return new NextResponse('// Error: siteId is required', {
      status: 400,
      headers: { 'Content-Type': 'application/javascript' },
    })
  }

  // Determine the base URL for the widget
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host') || 'app.dramacagency.com'
  const baseUrl = `${protocol}://${host}`

  const script = `
(function() {
  'use strict';

  // Prevent double-loading
  if (window.__dramacChatLoaded) return;
  window.__dramacChatLoaded = true;

  var SITE_ID = '${siteId}';
  var BASE_URL = '${baseUrl}';
  var WIDGET_URL = BASE_URL + '/embed/chat-widget?siteId=' + SITE_ID;
  var SETTINGS_URL = BASE_URL + '/api/modules/live-chat/widget?siteId=' + SITE_ID;

  // Fetch widget settings first
  fetch(SETTINGS_URL)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.settings) return;
      createWidget(data.settings);
    })
    .catch(function(err) {
      console.warn('[DRAMAC Chat] Failed to load widget settings:', err);
    });

  function createWidget(settings) {
    var isOpen = false;
    var position = settings.position || 'bottom-right';
    var isRight = position === 'bottom-right';
    var primaryColor = settings.primaryColor || '#2563eb';
    var launcherSize = settings.launcherSize || 56;
    var zIndex = settings.zIndex || 9999;
    var borderRadius = settings.borderRadius || 16;

    // Create launcher button
    var launcher = document.createElement('div');
    launcher.id = 'dramac-chat-launcher';
    launcher.setAttribute('role', 'button');
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.setAttribute('tabindex', '0');
    launcher.style.cssText = [
      'position:fixed',
      'bottom:20px',
      isRight ? 'right:20px' : 'left:20px',
      'width:' + launcherSize + 'px',
      'height:' + launcherSize + 'px',
      'border-radius:50%',
      'background:' + primaryColor,
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:' + zIndex,
      'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
      'transition:transform 0.2s ease, box-shadow 0.2s ease',
    ].join(';');

    // Chat icon SVG
    launcher.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (settings.textColor || '#fff') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>';

    launcher.onmouseenter = function() {
      launcher.style.transform = 'scale(1.1)';
      launcher.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
    };
    launcher.onmouseleave = function() {
      launcher.style.transform = 'scale(1)';
      launcher.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    };

    // Unread badge
    var badge = document.createElement('span');
    badge.id = 'dramac-chat-badge';
    badge.style.cssText = [
      'position:absolute',
      'top:-2px',
      'right:-2px',
      'min-width:18px',
      'height:18px',
      'border-radius:9px',
      'background:#ef4444',
      'color:#fff',
      'font-size:11px',
      'font-weight:600',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'padding:0 5px',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
    ].join(';');
    launcher.appendChild(badge);

    // Create iframe container
    var container = document.createElement('div');
    container.id = 'dramac-chat-container';
    container.style.cssText = [
      'position:fixed',
      'bottom:' + (launcherSize + 30) + 'px',
      isRight ? 'right:20px' : 'left:20px',
      'width:380px',
      'height:520px',
      'max-height:calc(100vh - 100px)',
      'border-radius:' + borderRadius + 'px',
      'overflow:hidden',
      'z-index:' + (zIndex + 1),
      'box-shadow:0 8px 30px rgba(0,0,0,0.12)',
      'display:none',
      'opacity:0',
      'transform:translateY(10px) scale(0.95)',
      'transition:opacity 0.2s ease, transform 0.2s ease',
    ].join(';');

    // Mobile responsiveness
    if (window.innerWidth <= 480) {
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.maxHeight = '100vh';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.left = '0';
      container.style.borderRadius = '0';
    }

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.id = 'dramac-chat-iframe';
    iframe.src = WIDGET_URL;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.setAttribute('allow', 'microphone');
    iframe.setAttribute('title', 'Chat Widget');
    container.appendChild(iframe);

    document.body.appendChild(launcher);
    document.body.appendChild(container);

    // Toggle chat
    function toggleChat() {
      isOpen = !isOpen;
      if (isOpen) {
        container.style.display = 'block';
        // Trigger reflow for animation
        container.offsetHeight;
        container.style.opacity = '1';
        container.style.transform = 'translateY(0) scale(1)';
        launcher.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (settings.textColor || '#fff') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
        launcher.setAttribute('aria-label', 'Close chat');
        // Reset badge
        badge.style.display = 'none';
        badge.textContent = '0';
        // Notify iframe that widget is open
        try {
          iframe.contentWindow.postMessage({ type: 'dramac-chat-open' }, '*');
        } catch(e) {}
      } else {
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(function() { container.style.display = 'none'; }, 200);
        launcher.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (settings.textColor || '#fff') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>';
        launcher.appendChild(badge);
        launcher.setAttribute('aria-label', 'Open chat');
      }
    }

    launcher.onclick = toggleChat;
    launcher.onkeydown = function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleChat();
      }
    };

    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== BASE_URL) return;
      var msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'dramac-chat-close') {
        if (isOpen) toggleChat();
      } else if (msg.type === 'dramac-chat-unread') {
        var count = msg.count || 0;
        if (count > 0 && !isOpen) {
          badge.textContent = count > 9 ? '9+' : String(count);
          badge.style.display = 'flex';
        }
      } else if (msg.type === 'dramac-chat-resize') {
        if (msg.height) container.style.height = msg.height + 'px';
      }
    });

    // Auto-open after delay
    if (settings.autoOpenDelaySeconds > 0) {
      setTimeout(function() {
        if (!isOpen) toggleChat();
      }, settings.autoOpenDelaySeconds * 1000);
    }

    // Handle resize
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 480) {
        container.style.width = '100vw';
        container.style.height = '100vh';
        container.style.maxHeight = '100vh';
        container.style.bottom = '0';
        container.style.right = '0';
        container.style.left = '0';
        container.style.borderRadius = '0';
      } else {
        container.style.width = '380px';
        container.style.height = '520px';
        container.style.maxHeight = 'calc(100vh - 100px)';
        container.style.bottom = (launcherSize + 30) + 'px';
        container.style.right = isRight ? '20px' : '';
        container.style.left = isRight ? '' : '20px';
        container.style.borderRadius = borderRadius + 'px';
      }
    });
  }
})();
`

  return new NextResponse(script.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
