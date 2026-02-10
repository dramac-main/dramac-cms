/**
 * Phase EM-31: Dramac Embed SDK
 * CDN-hosted script for embedding modules on external websites
 * 
 * Usage:
 * <script src="https://cdn.dramacagency.com/embed.js"></script>
 * <script>
 *   const widget = Dramac.embed({
 *     siteId: 'your-site-id',
 *     moduleId: 'your-module-id',
 *     type: 'widget',
 *     theme: 'light'
 *   });
 * </script>
 * 
 * Or with data attributes:
 * <div data-dramac-embed="module-id" data-site-id="site-id"></div>
 */

interface DramacEmbedConfig {
  siteId: string;
  moduleId: string;
  container?: string | HTMLElement;
  type?: 'widget' | 'popup' | 'inline';
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: string;
  height?: string;
  triggerText?: string;
  triggerIcon?: string;
  triggerColor?: string;
  zIndex?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (message: DramacMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface DramacMessage {
  type: string;
  payload: unknown;
}

interface DramacEmbed {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  send: (action: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler?: (data: unknown) => void) => void;
  destroy: () => void;
  getConfig: () => DramacEmbedConfig;
}

interface DramacSDK {
  embed: (config: DramacEmbedConfig) => DramacEmbed;
  version: string;
  instances: Map<string, DramacEmbed>;
}

(function(window: Window, document: Document) {
  'use strict';

  // Configuration
  const EMBED_API_URL = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : 'https://embed.dramacagency.com';
  const SDK_VERSION = '1.0.0';

  // Styles
  const EMBED_STYLES = `
    .dramac-embed-container {
      position: fixed;
      z-index: var(--dramac-z-index, 999999);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    .dramac-embed-container.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    .dramac-embed-container.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    .dramac-embed-container.top-right {
      top: 20px;
      right: 20px;
    }
    .dramac-embed-container.top-left {
      top: 20px;
      left: 20px;
    }
    .dramac-embed-widget {
      width: 400px;
      max-width: calc(100vw - 40px);
      height: 600px;
      max-height: calc(100vh - 100px);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      opacity: 0;
      transform: scale(0.9) translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      position: absolute;
      bottom: 70px;
      right: 0;
      background: white;
    }
    .dramac-embed-container.bottom-left .dramac-embed-widget,
    .dramac-embed-container.top-left .dramac-embed-widget {
      right: auto;
      left: 0;
    }
    .dramac-embed-container.top-right .dramac-embed-widget,
    .dramac-embed-container.top-left .dramac-embed-widget {
      bottom: auto;
      top: 70px;
    }
    .dramac-embed-widget.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }
    .dramac-embed-widget iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    .dramac-embed-trigger {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--dramac-trigger-color, #0066FF);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }
    .dramac-embed-trigger:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    .dramac-embed-trigger:active {
      transform: scale(0.95);
    }
    .dramac-embed-trigger svg {
      width: 28px;
      height: 28px;
      fill: white;
      transition: transform 0.2s ease;
    }
    .dramac-embed-trigger.open svg.icon-open {
      display: none;
    }
    .dramac-embed-trigger.open svg.icon-close {
      display: block;
    }
    .dramac-embed-trigger svg.icon-close {
      display: none;
    }
    .dramac-embed-trigger-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: #FF3B30;
      border-radius: 50%;
      color: white;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }
    .dramac-embed-inline {
      width: 100%;
      border: none;
      border-radius: 8px;
      overflow: hidden;
      background: white;
    }
    .dramac-embed-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: #f5f5f5;
    }
    .dramac-embed-loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #0066FF;
      border-radius: 50%;
      animation: dramac-spin 1s linear infinite;
    }
    @keyframes dramac-spin {
      to { transform: rotate(360deg); }
    }
    .dramac-embed-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 24px;
      text-align: center;
      background: #fff5f5;
      color: #c53030;
    }
    .dramac-embed-error-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    @media (max-width: 480px) {
      .dramac-embed-widget {
        width: 100vw;
        height: calc(100vh - 80px);
        max-width: none;
        max-height: none;
        border-radius: 16px 16px 0 0;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
      }
      .dramac-embed-container.bottom-right .dramac-embed-widget,
      .dramac-embed-container.bottom-left .dramac-embed-widget {
        left: 0;
        right: 0;
      }
    }
    @media (prefers-color-scheme: dark) {
      .dramac-embed-widget[data-theme="auto"] {
        background: #1a1a1a;
      }
      .dramac-embed-loading[data-theme="auto"] {
        background: #2d2d2d;
      }
    }
  `;

  // Icons
  const ICONS = {
    chat: `<svg class="icon-open" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
      <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
    </svg>
    <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>`,
    error: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`
  };

  // Queue for commands before SDK is ready
  const commandQueue: Array<{ method: string; args: unknown[] }> = [];
  const instances = new Map<string, DramacEmbed>();

  /**
   * Main Embed SDK Class
   */
  class DramacEmbedSDK implements DramacEmbed {
    private config: Required<Pick<DramacEmbedConfig, 'siteId' | 'moduleId' | 'type' | 'theme' | 'position' | 'zIndex'>> & DramacEmbedConfig;
    private iframe: HTMLIFrameElement | null = null;
    private container: HTMLElement | null = null;
    private trigger: HTMLButtonElement | null = null;
    private widgetWrapper: HTMLElement | null = null;
    private _isOpen: boolean = false;
    private messageHandlers: Map<string, Set<(data: unknown) => void>> = new Map();
    private ready: boolean = false;
    private instanceId: string;
    private boundHandleMessage: (event: MessageEvent) => void;

    constructor(config: DramacEmbedConfig) {
      // Validate required config
      if (!config.siteId) {
        throw new Error('[Dramac] siteId is required');
      }
      if (!config.moduleId) {
        throw new Error('[Dramac] moduleId is required');
      }

      this.config = {
        type: 'widget',
        theme: 'light',
        position: 'bottom-right',
        zIndex: 999999,
        ...config
      };

      this.instanceId = `dramac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.boundHandleMessage = this.handleMessage.bind(this);

      this.init();
    }

    private async init(): Promise<void> {
      try {
        // Verify origin is allowed
        const allowed = await this.checkOrigin();
        if (!allowed) {
          throw new Error('This domain is not authorized to embed this module');
        }

        // Inject styles
        this.injectStyles();

        // Create container
        this.createContainer();

        // Create iframe
        this.createIframe();

        // Setup message handler
        window.addEventListener('message', this.boundHandleMessage);

        // Store instance
        instances.set(this.instanceId, this);

        this.ready = true;
        this.config.onReady?.();

        // Process queued commands
        this.processQueue();
      } catch (error) {
        this.handleError(error as Error);
      }
    }

    private async checkOrigin(): Promise<boolean> {
      try {
        const response = await fetch(`${EMBED_API_URL}/api/embed/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: this.config.siteId,
            moduleId: this.config.moduleId,
            origin: window.location.origin
          })
        });

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        return data.allowed === true;
      } catch (error) {
        console.warn('[Dramac] Failed to verify origin:', error);
        // In development, allow if verification fails
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('[Dramac] Allowing localhost for development');
          return true;
        }
        return false;
      }
    }

    private injectStyles(): void {
      if (document.getElementById('dramac-embed-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'dramac-embed-styles';
      styles.textContent = EMBED_STYLES;
      document.head.appendChild(styles);
    }

    private createContainer(): void {
      if (this.config.type === 'inline') {
        // Use provided container
        if (typeof this.config.container === 'string') {
          this.container = document.querySelector(this.config.container);
          if (!this.container) {
            throw new Error(`[Dramac] Container not found: ${this.config.container}`);
          }
        } else if (this.config.container instanceof HTMLElement) {
          this.container = this.config.container;
        } else {
          throw new Error('[Dramac] Container is required for inline embeds');
        }
      } else {
        // Create floating container
        this.container = document.createElement('div');
        this.container.className = `dramac-embed-container ${this.config.position}`;
        this.container.style.setProperty('--dramac-z-index', String(this.config.zIndex));
        if (this.config.triggerColor) {
          this.container.style.setProperty('--dramac-trigger-color', this.config.triggerColor);
        }
        this.container.setAttribute('data-dramac-instance', this.instanceId);
        document.body.appendChild(this.container);
      }
    }

    private createIframe(): void {
      const iframeUrl = new URL(`${EMBED_API_URL}/embed/${this.config.moduleId}`);
      iframeUrl.searchParams.set('site', this.config.siteId);
      iframeUrl.searchParams.set('origin', window.location.origin);
      iframeUrl.searchParams.set('theme', this.config.theme);
      iframeUrl.searchParams.set('type', this.config.type);
      iframeUrl.searchParams.set('instanceId', this.instanceId);

      this.iframe = document.createElement('iframe');
      this.iframe.src = iframeUrl.toString();
      this.iframe.allow = 'clipboard-write; payment; camera; microphone; geolocation';
      this.iframe.setAttribute('loading', 'lazy');
      this.iframe.setAttribute('title', 'Dramac Embed');
      
      if (this.config.type === 'inline') {
        this.iframe.className = 'dramac-embed-inline';
        this.iframe.style.width = this.config.width || '100%';
        this.iframe.style.height = this.config.height || '500px';
        this.container?.appendChild(this.iframe);
      } else {
        // Create widget wrapper
        this.widgetWrapper = document.createElement('div');
        this.widgetWrapper.className = 'dramac-embed-widget';
        this.widgetWrapper.setAttribute('data-theme', this.config.theme);
        
        // Add loading state
        const loading = document.createElement('div');
        loading.className = 'dramac-embed-loading';
        loading.setAttribute('data-theme', this.config.theme);
        loading.innerHTML = '<div class="dramac-embed-loading-spinner"></div>';
        this.widgetWrapper.appendChild(loading);
        
        this.iframe.onload = () => {
          loading.remove();
        };
        
        this.widgetWrapper.appendChild(this.iframe);

        // Create trigger button
        this.trigger = document.createElement('button');
        this.trigger.className = 'dramac-embed-trigger';
        this.trigger.setAttribute('aria-label', this.config.triggerText || 'Open widget');
        this.trigger.innerHTML = this.config.triggerIcon || ICONS.chat;
        this.trigger.onclick = () => this.toggle();

        this.container?.appendChild(this.widgetWrapper);
        this.container?.appendChild(this.trigger);
      }
    }

    private handleMessage(event: MessageEvent): void {
      // Verify origin - must be from Dramac
      const allowedOrigins = [
        EMBED_API_URL,
        'https://dramacagency.com',
        'https://embed.dramacagency.com'
      ];

      // Also allow same origin for development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        allowedOrigins.push(window.location.origin);
      }

      if (!allowedOrigins.some(origin => event.origin.includes(new URL(origin).hostname))) {
        return;
      }

      // Verify instance ID if present
      if (event.data.instanceId && event.data.instanceId !== this.instanceId) {
        return;
      }

      const { type, payload } = event.data;
      if (!type) return;

      // Handle built-in messages
      switch (type) {
        case 'dramac:ready':
          this.ready = true;
          break;
        case 'dramac:close':
          this.close();
          break;
        case 'dramac:open':
          this.open();
          break;
        case 'dramac:resize':
          if (this.iframe && payload?.height) {
            this.iframe.style.height = `${payload.height}px`;
          }
          break;
        case 'dramac:badge':
          this.updateBadge(payload?.count);
          break;
        case 'dramac:error':
          this.handleError(new Error(payload?.message || 'Unknown error'));
          break;
      }

      // Call custom handler
      this.config.onMessage?.({ type, payload });

      // Call registered handlers
      const handlers = this.messageHandlers.get(type);
      handlers?.forEach(handler => handler(payload));
    }

    private handleError(error: Error): void {
      console.error('[Dramac] Embed error:', error);
      this.config.onError?.(error);

      // Show error state in widget
      if (this.widgetWrapper) {
        this.widgetWrapper.innerHTML = `
          <div class="dramac-embed-error">
            <div class="dramac-embed-error-icon">${ICONS.error}</div>
            <div><strong>Unable to load</strong></div>
            <div style="font-size: 14px; margin-top: 8px;">${error.message}</div>
          </div>
        `;
      }
    }

    private updateBadge(count?: number): void {
      if (!this.trigger) return;

      let badge = this.trigger.querySelector('.dramac-embed-trigger-badge');
      
      if (!count || count <= 0) {
        badge?.remove();
        return;
      }

      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'dramac-embed-trigger-badge';
        this.trigger.appendChild(badge);
      }

      badge.textContent = count > 9 ? '9+' : String(count);
    }

    private processQueue(): void {
      while (commandQueue.length > 0) {
        const cmd = commandQueue.shift();
        if (cmd && cmd.method in this && typeof (this as any)[cmd.method] === 'function') {
          (this as any)[cmd.method](...cmd.args);
        }
      }
    }

    // Public API
    open(): void {
      if (this.config.type === 'inline') return;
      if (this._isOpen) return;
      
      this.widgetWrapper?.classList.add('open');
      this.trigger?.classList.add('open');
      this._isOpen = true;
      this.send('open');
      this.config.onOpen?.();
    }

    close(): void {
      if (this.config.type === 'inline') return;
      if (!this._isOpen) return;
      
      this.widgetWrapper?.classList.remove('open');
      this.trigger?.classList.remove('open');
      this._isOpen = false;
      this.send('close');
      this.config.onClose?.();
    }

    toggle(): void {
      if (this._isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    isOpen(): boolean {
      return this._isOpen;
    }

    send(action: string, data?: unknown): void {
      if (!this.iframe?.contentWindow) return;
      
      this.iframe.contentWindow.postMessage({
        type: `dramac:${action}`,
        payload: data,
        instanceId: this.instanceId
      }, EMBED_API_URL);
    }

    on(event: string, handler: (data: unknown) => void): void {
      if (!this.messageHandlers.has(event)) {
        this.messageHandlers.set(event, new Set());
      }
      this.messageHandlers.get(event)!.add(handler);
    }

    off(event: string, handler?: (data: unknown) => void): void {
      if (!handler) {
        this.messageHandlers.delete(event);
      } else {
        this.messageHandlers.get(event)?.delete(handler);
      }
    }

    getConfig(): DramacEmbedConfig {
      return { ...this.config };
    }

    destroy(): void {
      window.removeEventListener('message', this.boundHandleMessage);
      
      if (this.config.type !== 'inline') {
        this.container?.remove();
      } else {
        this.iframe?.remove();
      }
      
      instances.delete(this.instanceId);
      this.iframe = null;
      this.container = null;
      this.trigger = null;
      this.widgetWrapper = null;
      this.messageHandlers.clear();
    }
  }

  /**
   * Auto-initialize embeds from data attributes
   */
  function autoInit(): void {
    const autoEmbeds = document.querySelectorAll('[data-dramac-embed]');
    
    autoEmbeds.forEach(el => {
      const moduleId = el.getAttribute('data-dramac-embed');
      const siteId = el.getAttribute('data-site-id');
      
      if (!moduleId || !siteId) {
        console.warn('[Dramac] Missing data-dramac-embed or data-site-id attribute');
        return;
      }

      const config: DramacEmbedConfig = {
        siteId,
        moduleId,
        container: el as HTMLElement,
        type: 'inline',
        theme: (el.getAttribute('data-theme') as 'light' | 'dark' | 'auto') || 'light',
        width: el.getAttribute('data-width') || '100%',
        height: el.getAttribute('data-height') || '500px'
      };

      try {
        new DramacEmbedSDK(config);
      } catch (error) {
        console.error('[Dramac] Failed to auto-initialize embed:', error);
      }
    });
  }

  // Expose to window
  const DramacAPI: DramacSDK = {
    embed: (config: DramacEmbedConfig): DramacEmbed => {
      return new DramacEmbedSDK(config);
    },
    version: SDK_VERSION,
    instances
  };

  (window as unknown as { Dramac: typeof DramacAPI }).Dramac = DramacAPI;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})(window, document);

// TypeScript declarations for external use
declare global {
  interface Window {
    Dramac: {
      embed: (config: DramacEmbedConfig) => DramacEmbed;
      version: string;
      instances: Map<string, DramacEmbed>;
    };
  }
}

export {};
