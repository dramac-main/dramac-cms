/**
 * DRAMAC Module JavaScript SDK
 * 
 * A powerful SDK for embedding DRAMAC modules with full control over
 * initialization, events, and settings.
 * 
 * Usage:
 * <script src="https://app.dramac.com/embed/dramac-sdk.js"></script>
 * <script>
 *   const module = DramacSDK.init({
 *     moduleId: 'your-module-id',
 *     siteId: 'your-site-id',
 *     token: 'your-embed-token',
 *     container: '#container',
 *     onReady: (info) => console.log('Ready!', info),
 *     onEvent: (event, data) => console.log('Event:', event, data)
 *   });
 * </script>
 */
(function(global) {
  'use strict';

  var DramacSDK = {
    _instances: {},
    _baseUrl: 'https://app.dramac.com',
    _version: '1.0.0',
    _debug: false,

    /**
     * Initialize a new module instance
     * @param {Object} options - Configuration options
     * @param {string} options.moduleId - The module ID
     * @param {string} options.siteId - The site ID
     * @param {string} options.token - The embed token
     * @param {string|HTMLElement} options.container - Container selector or element
     * @param {string} [options.theme='auto'] - Theme: 'light', 'dark', or 'auto'
     * @param {string} [options.width='100%'] - Width of the embed
     * @param {string} [options.height='500px'] - Minimum height of the embed
     * @param {Function} [options.onReady] - Called when module is ready
     * @param {Function} [options.onEvent] - Called when module emits an event
     * @param {Function} [options.onError] - Called on error
     * @param {Function} [options.onResize] - Called when module resizes
     * @returns {Object|null} Module instance API or null on error
     */
    init: function(options) {
      var self = this;

      // Validate required options
      if (!options.moduleId || !options.siteId || !options.token) {
        this._log('error', 'Missing required options: moduleId, siteId, and token are required');
        if (options.onError) {
          options.onError(new Error('Missing required options: moduleId, siteId, token'));
        }
        return null;
      }

      // Get container element
      var container = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;

      if (!container) {
        this._log('error', 'Container not found:', options.container);
        if (options.onError) {
          options.onError(new Error('Container not found'));
        }
        return null;
      }

      // Generate unique instance ID
      var instanceId = 'dramac_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Create instance object
      var instance = {
        id: instanceId,
        moduleId: options.moduleId,
        siteId: options.siteId,
        container: container,
        iframe: null,
        ready: false,
        destroyed: false,
        callbacks: {
          onReady: options.onReady,
          onEvent: options.onEvent,
          onError: options.onError,
          onResize: options.onResize
        }
      };

      // Build embed URL
      var embedUrl = this._baseUrl + '/embed/' + options.moduleId + '/' + options.siteId +
        '?token=' + encodeURIComponent(options.token) +
        '&theme=' + (options.theme || 'auto');

      // Create wrapper div
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'position: relative; width: ' + (options.width || '100%') + '; min-height: ' + (options.height || '500px') + ';';
      wrapper.id = instanceId + '_wrapper';

      // Create loading indicator
      var loader = document.createElement('div');
      loader.id = instanceId + '_loader';
      loader.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: #f9fafb; border-radius: 8px; font-family: system-ui, sans-serif; font-size: 14px; color: #6b7280;';
      loader.innerHTML = '<div style="width: 24px; height: 24px; border: 2px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: dramac-spin 0.8s linear infinite; margin-right: 12px;"></div><span>Loading module...</span>';

      // Add CSS animation if not already added
      if (!document.getElementById('dramac-sdk-styles')) {
        var style = document.createElement('style');
        style.id = 'dramac-sdk-styles';
        style.textContent = '@keyframes dramac-spin { to { transform: rotate(360deg); } }';
        document.head.appendChild(style);
      }

      // Create iframe
      var iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.id = instanceId;
      iframe.style.cssText = 'width: 100%; min-height: ' + (options.height || '500px') + '; border: none; background: transparent; display: block;';
      iframe.allow = 'clipboard-write; clipboard-read';
      iframe.loading = 'lazy';
      iframe.title = 'DRAMAC Module';

      instance.iframe = iframe;

      // Assemble and add to DOM
      wrapper.appendChild(loader);
      wrapper.appendChild(iframe);
      container.appendChild(wrapper);

      // Store instance
      this._instances[instanceId] = instance;

      // Setup message listener
      this._setupMessageListener(instance);

      this._log('info', 'Module initialized:', instanceId);

      // Return public API for this instance
      return {
        id: instanceId,

        /**
         * Update module settings
         * @param {Object} settings - Settings to merge
         */
        updateSettings: function(settings) {
          self.updateSettings(instanceId, settings);
        },

        /**
         * Change module theme
         * @param {'light'|'dark'|'auto'} theme
         */
        setTheme: function(theme) {
          self.setTheme(instanceId, theme);
        },

        /**
         * Send custom message to module
         * @param {string} type - Message type
         * @param {*} payload - Message payload
         */
        sendMessage: function(type, payload) {
          self.sendMessage(instanceId, type, payload);
        },

        /**
         * Check if module is ready
         * @returns {boolean}
         */
        isReady: function() {
          return self._instances[instanceId] ? self._instances[instanceId].ready : false;
        },

        /**
         * Refresh the module
         */
        refresh: function() {
          self.refresh(instanceId);
        },

        /**
         * Destroy the module instance
         */
        destroy: function() {
          self.destroy(instanceId);
        },

        /**
         * Get instance info
         * @returns {Object}
         */
        getInfo: function() {
          var inst = self._instances[instanceId];
          return inst ? {
            id: inst.id,
            moduleId: inst.moduleId,
            siteId: inst.siteId,
            ready: inst.ready,
            destroyed: inst.destroyed
          } : null;
        }
      };
    },

    /**
     * Setup message listener for an instance
     * @private
     */
    _setupMessageListener: function(instance) {
      var self = this;

      var handler = function(event) {
        // Only handle messages from our iframe
        if (!instance.iframe || event.source !== instance.iframe.contentWindow) {
          return;
        }

        var data = event.data;

        switch (data.type) {
          case 'DRAMAC_MODULE_READY':
            instance.ready = true;
            
            // Hide loader
            var loader = document.getElementById(instance.id + '_loader');
            if (loader) {
              loader.style.display = 'none';
            }

            self._log('info', 'Module ready:', instance.id);

            if (instance.callbacks.onReady) {
              instance.callbacks.onReady({
                moduleId: data.moduleId,
                siteId: data.siteId
              });
            }
            break;

          case 'DRAMAC_RESIZE':
            if (instance.iframe && data.height) {
              instance.iframe.style.height = data.height + 'px';
              
              if (instance.callbacks.onResize) {
                instance.callbacks.onResize({
                  height: data.height,
                  moduleId: data.moduleId
                });
              }
            }
            break;

          case 'DRAMAC_EVENT':
            self._log('info', 'Module event:', data.event, data.payload);
            
            if (instance.callbacks.onEvent) {
              instance.callbacks.onEvent(data.event, data.payload);
            }
            break;

          case 'DRAMAC_ERROR':
            self._log('error', 'Module error:', data.message);
            
            if (instance.callbacks.onError) {
              instance.callbacks.onError(new Error(data.message));
            }
            break;
        }
      };

      window.addEventListener('message', handler);
      instance._messageHandler = handler;
    },

    /**
     * Update module settings
     * @param {string} instanceId
     * @param {Object} settings
     */
    updateSettings: function(instanceId, settings) {
      var instance = this._instances[instanceId];
      if (instance && instance.ready && instance.iframe && !instance.destroyed) {
        instance.iframe.contentWindow.postMessage({
          type: 'DRAMAC_SETTINGS_UPDATE',
          settings: settings
        }, '*');
        this._log('info', 'Settings updated:', instanceId);
      } else {
        this._log('warn', 'Cannot update settings - module not ready or destroyed');
      }
    },

    /**
     * Set module theme
     * @param {string} instanceId
     * @param {'light'|'dark'|'auto'} theme
     */
    setTheme: function(instanceId, theme) {
      var instance = this._instances[instanceId];
      if (instance && instance.ready && instance.iframe && !instance.destroyed) {
        instance.iframe.contentWindow.postMessage({
          type: 'DRAMAC_THEME_CHANGE',
          theme: theme
        }, '*');
        this._log('info', 'Theme changed:', theme);
      }
    },

    /**
     * Send custom message to module
     * @param {string} instanceId
     * @param {string} type
     * @param {*} payload
     */
    sendMessage: function(instanceId, type, payload) {
      var instance = this._instances[instanceId];
      if (instance && instance.ready && instance.iframe && !instance.destroyed) {
        instance.iframe.contentWindow.postMessage({
          type: 'DRAMAC_CUSTOM_MESSAGE',
          customType: type,
          payload: payload
        }, '*');
        this._log('info', 'Message sent:', type);
      }
    },

    /**
     * Refresh a module instance
     * @param {string} instanceId
     */
    refresh: function(instanceId) {
      var instance = this._instances[instanceId];
      if (instance && instance.iframe && !instance.destroyed) {
        instance.ready = false;
        
        // Show loader
        var loader = document.getElementById(instance.id + '_loader');
        if (loader) {
          loader.style.display = 'flex';
        }
        
        // Reload iframe
        instance.iframe.src = instance.iframe.src;
        this._log('info', 'Module refreshed:', instanceId);
      }
    },

    /**
     * Destroy a module instance
     * @param {string} instanceId
     */
    destroy: function(instanceId) {
      var instance = this._instances[instanceId];
      if (instance) {
        instance.destroyed = true;
        
        // Remove message listener
        if (instance._messageHandler) {
          window.removeEventListener('message', instance._messageHandler);
        }
        
        // Remove wrapper from DOM
        var wrapper = document.getElementById(instanceId + '_wrapper');
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
        
        // Clean up instance
        delete this._instances[instanceId];
        this._log('info', 'Module destroyed:', instanceId);
      }
    },

    /**
     * Get all active instances
     * @returns {Object}
     */
    getInstances: function() {
      var result = {};
      for (var id in this._instances) {
        if (this._instances.hasOwnProperty(id) && !this._instances[id].destroyed) {
          result[id] = {
            moduleId: this._instances[id].moduleId,
            siteId: this._instances[id].siteId,
            ready: this._instances[id].ready
          };
        }
      }
      return result;
    },

    /**
     * Configure SDK global settings
     * @param {Object} options
     * @param {string} [options.baseUrl] - Override base URL
     * @param {boolean} [options.debug] - Enable debug logging
     */
    configure: function(options) {
      if (options.baseUrl) {
        this._baseUrl = options.baseUrl;
      }
      if (typeof options.debug === 'boolean') {
        this._debug = options.debug;
      }
      this._log('info', 'SDK configured:', options);
    },

    /**
     * Get SDK version
     * @returns {string}
     */
    getVersion: function() {
      return this._version;
    },

    /**
     * Internal logging
     * @private
     */
    _log: function(level, message) {
      if (this._debug || level === 'error') {
        var args = ['[DramacSDK]'].concat(Array.prototype.slice.call(arguments, 1));
        if (level === 'error') {
          console.error.apply(console, args);
        } else if (level === 'warn') {
          console.warn.apply(console, args);
        } else {
          console.log.apply(console, args);
        }
      }
    }
  };

  // Export to global
  if (typeof global !== 'undefined') {
    global.DramacSDK = DramacSDK;
  }

  // Also support AMD/CommonJS if available
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DramacSDK;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return DramacSDK; });
  }

})(typeof window !== 'undefined' ? window : this);
