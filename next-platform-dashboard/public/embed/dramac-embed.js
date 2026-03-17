/**
 * DRAMAC Module Embed Script
 *
 * Supports three embed patterns:
 *
 * 1. Web Component:
 *    <script src="https://app.dramacagency.com/embed/dramac-embed.js"></script>
 *    <dramac-module module-id="..." site-id="..." token="..." theme="auto"></dramac-module>
 *
 * 2. Auto-init via DRAMAC_CONFIG (used by E-Commerce embed generator):
 *    <div id="my-container"></div>
 *    <script src="https://app.dramacagency.com/embed/dramac-embed.js" defer></script>
 *    <script>
 *      window.DRAMAC_CONFIG = { siteId: '...', type: 'product-grid', container: '#my-container', ... };
 *    </script>
 *
 * 3. Buy-button data attributes:
 *    <button class="dramac-buy-button" data-site-id="..." data-product-id="...">Buy Now</button>
 *    <script src="https://app.dramacagency.com/embed/dramac-embed.js" defer></script>
 */
(function () {
  "use strict";

  // ========== Auto-detect script origin ==========
  function getScriptOrigin() {
    try {
      var scripts = document.querySelectorAll("script[src]");
      for (var i = 0; i < scripts.length; i++) {
        if (
          scripts[i].src &&
          scripts[i].src.indexOf("dramac-embed.js") !== -1
        ) {
          return new URL(scripts[i].src).origin;
        }
      }
    } catch (e) {
      /* fallback */
    }
    return window.location.origin;
  }

  var SCRIPT_ORIGIN = getScriptOrigin();

  // ========== Web Component ==========
  class DramacModule extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._iframe = null;
      this._ready = false;
      this._messageHandler = null;
    }

    static get observedAttributes() {
      return [
        "module-id",
        "site-id",
        "token",
        "theme",
        "width",
        "height",
        "base-url",
      ];
    }

    connectedCallback() {
      this.render();
      this.setupMessageListener();
    }

    disconnectedCallback() {
      if (this._messageHandler) {
        window.removeEventListener("message", this._messageHandler);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue && this.shadowRoot.innerHTML) {
        this.render();
      }
    }

    render() {
      const moduleId = this.getAttribute("module-id");
      const siteId = this.getAttribute("site-id");
      const token = this.getAttribute("token");
      const theme = this.getAttribute("theme") || "auto";
      const width = this.getAttribute("width") || "100%";
      const height = this.getAttribute("height") || "500px";

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

      const baseUrl = this.getAttribute("base-url") || SCRIPT_ORIGIN;
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

      this._iframe = this.shadowRoot.querySelector("iframe");
    }

    setupMessageListener() {
      this._messageHandler = (event) => {
        // Only handle messages from our iframe
        if (this._iframe && event.source === this._iframe.contentWindow) {
          const data = event.data;

          switch (data.type) {
            case "DRAMAC_MODULE_READY":
              this._ready = true;
              const loading = this.shadowRoot.getElementById("loading");
              if (loading) {
                loading.classList.add("hidden");
              }

              // Dispatch custom event
              this.dispatchEvent(
                new CustomEvent("ready", {
                  detail: {
                    moduleId: data.moduleId,
                    siteId: data.siteId,
                  },
                  bubbles: true,
                  composed: true,
                }),
              );
              break;

            case "DRAMAC_RESIZE":
              if (this._iframe && data.height) {
                this._iframe.style.height = data.height + "px";
              }
              break;

            case "DRAMAC_EVENT":
              this.dispatchEvent(
                new CustomEvent("module-event", {
                  detail: {
                    event: data.event,
                    payload: data.payload,
                    moduleId: data.moduleId,
                  },
                  bubbles: true,
                  composed: true,
                }),
              );
              break;

            case "DRAMAC_ERROR":
              this.dispatchEvent(
                new CustomEvent("module-error", {
                  detail: {
                    message: data.message,
                    moduleId: data.moduleId,
                  },
                  bubbles: true,
                  composed: true,
                }),
              );
              break;
          }
        }
      };

      window.addEventListener("message", this._messageHandler);
    }

    // ========== Public API ==========

    /**
     * Update module settings
     * @param {Object} settings - Settings object to merge with current settings
     */
    updateSettings(settings) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage(
          {
            type: "DRAMAC_SETTINGS_UPDATE",
            settings: settings,
          },
          "*",
        );
      } else {
        console.warn("DramacModule: Cannot update settings - module not ready");
      }
    }

    /**
     * Change the module theme
     * @param {'light' | 'dark' | 'auto'} theme - The theme to apply
     */
    setTheme(theme) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage(
          {
            type: "DRAMAC_THEME_CHANGE",
            theme: theme,
          },
          "*",
        );
      }
    }

    /**
     * Send a custom message to the module
     * @param {string} type - Message type
     * @param {*} payload - Message payload
     */
    sendMessage(type, payload) {
      if (this._iframe && this._ready) {
        this._iframe.contentWindow.postMessage(
          {
            type: "DRAMAC_CUSTOM_MESSAGE",
            customType: type,
            payload: payload,
          },
          "*",
        );
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
        const loading = this.shadowRoot.getElementById("loading");
        if (loading) {
          loading.classList.remove("hidden");
        }
        this._iframe.src = this._iframe.src;
      }
    }
  }

  // Register the custom element
  if (!customElements.get("dramac-module")) {
    customElements.define("dramac-module", DramacModule);
  }

  // Expose on window for programmatic access
  if (typeof window !== "undefined") {
    window.DramacModule = DramacModule;
  }

  // ========== DRAMAC_CONFIG auto-init ==========
  // Used by E-Commerce embed code generator: product-grid, product-card,
  // cart-widget, collection, checkout patterns.
  function autoInitFromConfig() {
    var cfg = window.DRAMAC_CONFIG;
    if (!cfg || !cfg.siteId || !cfg.type) return;

    var container =
      typeof cfg.container === "string"
        ? document.querySelector(cfg.container)
        : cfg.container;
    if (!container) return;

    var baseUrl = cfg.baseUrl || SCRIPT_ORIGIN;
    var params = new URLSearchParams();
    params.set("siteId", cfg.siteId);
    if (cfg.theme) params.set("theme", cfg.theme);
    if (cfg.columns) params.set("columns", String(cfg.columns));
    if (cfg.limit) params.set("limit", String(cfg.limit));
    if (cfg.source) params.set("source", cfg.source);
    if (cfg.categoryId) params.set("category", cfg.categoryId);
    if (cfg.productId) params.set("productId", cfg.productId);
    if (cfg.showPrice === false) params.set("showPrice", "false");
    if (cfg.showAddToCart === false) params.set("showAddToCart", "false");
    if (cfg.buttonText) params.set("buttonText", cfg.buttonText);
    if (cfg.buttonColor) params.set("buttonColor", cfg.buttonColor);
    if (cfg.cardStyle) params.set("style", cfg.cardStyle);

    var iframeSrc =
      baseUrl +
      "/api/embed/" +
      cfg.siteId +
      "/" +
      cfg.type +
      "?" +
      params.toString();

    var wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative;width:100%;min-height:400px;";

    var loader = document.createElement("div");
    loader.style.cssText =
      "position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f9fafb;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;color:#6b7280;";
    loader.innerHTML =
      '<div style="width:24px;height:24px;border:2px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:dramac-spin 0.8s linear infinite;margin-right:12px;"></div><span>Loading...</span>';

    if (!document.getElementById("dramac-embed-styles")) {
      var style = document.createElement("style");
      style.id = "dramac-embed-styles";
      style.textContent =
        "@keyframes dramac-spin{to{transform:rotate(360deg)}}";
      document.head.appendChild(style);
    }

    var iframe = document.createElement("iframe");
    iframe.src = iframeSrc;
    iframe.style.cssText =
      "width:100%;min-height:400px;border:none;background:transparent;display:block;";
    iframe.allow = "clipboard-write";
    iframe.loading = "lazy";
    iframe.title = "DRAMAC " + cfg.type + " Widget";

    iframe.addEventListener("load", function () {
      loader.style.display = "none";
    });

    wrapper.appendChild(loader);
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    // Listen for resize messages
    window.addEventListener("message", function (event) {
      if (
        event.source === iframe.contentWindow &&
        event.data &&
        event.data.type === "DRAMAC_RESIZE" &&
        event.data.height
      ) {
        iframe.style.height = event.data.height + "px";
      }
    });
  }

  // ========== Buy-button data-attribute support ==========
  function initBuyButtons() {
    var buttons = document.querySelectorAll(
      ".dramac-buy-button[data-site-id][data-product-id]",
    );
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var siteId = btn.getAttribute("data-site-id");
        var productId = btn.getAttribute("data-product-id");
        var theme = btn.getAttribute("data-theme") || "auto";
        var baseUrl = SCRIPT_ORIGIN;

        // Open checkout in a modal overlay
        var overlay = document.createElement("div");
        overlay.style.cssText =
          "position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;";

        var modal = document.createElement("div");
        modal.style.cssText =
          "background:#fff;border-radius:12px;width:100%;max-width:640px;max-height:90vh;overflow:hidden;position:relative;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);";

        var closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cssText =
          "position:absolute;top:8px;right:12px;z-index:10;background:none;border:none;font-size:24px;cursor:pointer;color:#6b7280;line-height:1;padding:4px 8px;";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.addEventListener("click", function () {
          document.body.removeChild(overlay);
        });

        var iframe = document.createElement("iframe");
        iframe.src =
          baseUrl +
          "/api/embed/" +
          encodeURIComponent(siteId) +
          "/buy-button?productId=" +
          encodeURIComponent(productId) +
          "&theme=" +
          encodeURIComponent(theme);
        iframe.style.cssText =
          "width:100%;height:600px;border:none;display:block;";
        iframe.title = "DRAMAC Buy Now";
        iframe.allow = "payment";

        modal.appendChild(closeBtn);
        modal.appendChild(iframe);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener("click", function (ev) {
          if (ev.target === overlay) document.body.removeChild(overlay);
        });
      });
    });
  }

  // ========== Run auto-init when DOM is ready ==========
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    autoInitFromConfig();
    initBuyButtons();
  });
})();
