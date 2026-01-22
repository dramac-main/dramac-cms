/**
 * DRAMAC Module Web Component
 * 
 * A custom element that embeds DRAMAC modules on any website.
 * 
 * Usage:
 * <script src="https://app.dramac.com/embed/dramac-embed.js"></script>
 * <dramac-module 
 *   module-id="your-module-id" 
 *   site-id="your-site-id"
 *   token="your-embed-token"
 *   theme="auto"
 * ></dramac-module>
 */
(function() {
  'use strict';

  // Define the custom element
  class DramacModule extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._iframe = null;
      this._ready = false;
      this._messageHandler = null;
    }

    static get observedAttributes() {
      return ['module-id', 'site-id', 'token', 'theme', 'width', 'height', 'base-url'];
    }

    connectedCallback() {
      this.render();
      this.setupMessageListener();
    }

    disconnectedCallback() {
      if (this._messageHandler) {
        window.removeEventListener('message', this._messageHandler);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.shadowRoot.innerHTML) {
        this.render();
      }
    }

    render() {
      const moduleId = this.getAttribute('module-id');
      const siteId = this.getAttribute('site-id');
      const token = this.getAttribute('token');
      const theme = this.getAttribute('theme') || 'auto';
      const width = this.getAttribute('width') || '100%';
      const height = this.getAttribute('height') || '500px';

      if (!moduleId || !siteId || !token) {
        this.shadowRoot.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #ef4444; font-family: system-ui, sans-serif;">
            <svg style="width: 48px; height: 48px; margin: 0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <p style="margin: 0; font-weight: 500;">Missing Required Attributes</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
              Please provide: module-id, site-id, and token
            </p>
          </div>
        `;
        return;
      }

      const baseUrl = this.getAttribute('base-url') || 'https://app.dramac.com';
      const embedUrl = `${baseUrl}/embed/${moduleId}/${siteId}?token=${encodeURIComponent(token)}&theme=${theme}`;

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: ${width};
            min-height: ${height};
          }
          .container {
            width: 100%;
            height: 100%;
            min-height: ${height};
            position: relative;
          }
          iframe {
            width: 100%;
            height: 100%;
            min-height: ${height};
            border: none;
            background: transparent;
            display: block;
          }
          .loading {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: ${height};
            color: #6b7280;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .loading.hidden {
            display: none;
          }
          .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 12px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .error {
            padding: 20px;
            text-align: center;
            color: #ef4444;
            font-family: system-ui, sans-serif;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
          }
        </style>
        <div class="container">
          <div class="loading" id="loading">
            <div class="spinner"></div>
            <span>Loading module...</span>
          </div>
          <iframe 
            src="${embedUrl}"
            allow="clipboard-write; clipboard-read"
            loading="lazy"
            title="DRAMAC Module"
          ></iframe>
        </div>
      `;

      this._iframe = this.shadowRoot.querySelector('iframe');
    }

    setupMessageListener() {
      this._messageHandler = (event) => {
        // Only handle messages from our iframe
        if (this._iframe && event.source === this._iframe.contentWindow) {
          const data = event.data;
          
          switch (data.type) {
            case 'DRAMAC_MODULE_READY':
              this._ready = true;
              const loading = this.shadowRoot.getElementById('loading');
              if (loading) {
                loading.classList.add('hidden');
              }
              
              // Dispatch custom event
              this.dispatchEvent(new CustomEvent('ready', { 
                detail: { 
                  moduleId: data.moduleId,
                  siteId: data.siteId
                },
                bubbles: true,
                composed: true
              }));
              break;

            case 'DRAMAC_RESIZE':
              if (this._iframe && data.height) {
                this._iframe.style.height = data.height + 'px';
              }
              break;

            case 'DRAMAC_EVENT':
              this.dispatchEvent(new CustomEvent('module-event', {
                detail: {
                  event: data.event,
                  payload: data.payload,
                  moduleId: data.moduleId
                },
                bubbles: true,
                composed: true
              }));
              break;

            case 'DRAMAC_ERROR':
              this.dispatchEvent(new CustomEvent('module-error', {
                detail: {
                  message: data.message,
                  moduleId: data.moduleId
                },
                bubbles: true,
                composed: true
              }));
              break;
          }
        }
      };

      window.addEventListener('message', this._messageHandler);
    }

    // ========== Public API ==========

    /**
     * Update module settings
     * @param {Object} settings - Settings object to merge with current settings
     */
    updateSettings(settings) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage({
          type: 'DRAMAC_SETTINGS_UPDATE',
          settings: settings
        }, '*');
      } else {
        console.warn('DramacModule: Cannot update settings - module not ready');
      }
    }

    /**
     * Change the module theme
     * @param {'light' | 'dark' | 'auto'} theme - The theme to apply
     */
    setTheme(theme) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage({
          type: 'DRAMAC_THEME_CHANGE',
          theme: theme
        }, '*');
      }
    }

    /**
     * Send a custom message to the module
     * @param {string} type - Message type
     * @param {*} payload - Message payload
     */
    sendMessage(type, payload) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage({
          type: 'DRAMAC_CUSTOM_MESSAGE',
          customType: type,
          payload: payload
        }, '*');
      }
    }

    /**
     * Check if the module is ready
     * @returns {boolean}
     */
    isReady() {
      return this._ready;
    }

    /**
     * Refresh/reload the module
     */
    refresh() {
      if (this._iframe) {
        this._ready = false;
        const loading = this.shadowRoot.getElementById('loading');
        if (loading) {
          loading.classList.remove('hidden');
        }
        this._iframe.src = this._iframe.src;
      }
    }
  }

  // Register the custom element
  if (!customElements.get('dramac-module')) {
    customElements.define('dramac-module', DramacModule);
  }

  // Also expose on window for programmatic access
  if (typeof window !== 'undefined') {
    window.DramacModule = DramacModule;
  }
})();
