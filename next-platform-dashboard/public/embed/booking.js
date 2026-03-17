/**
 * DRAMAC Booking Widget - Embed Script
 *
 * Usage:
 *   <script src="https://your-domain.com/embed/booking.js"></script>
 *   <script>
 *     DramacBooking.init({
 *       siteId: 'your-site-id',
 *       primaryColor: '#8B5CF6',
 *       borderRadius: 8,
 *       buttonText: 'Book Now',
 *       showHeader: true,
 *       showServiceSelector: true,
 *       showStaffSelector: true,
 *     });
 *   </script>
 *   <button data-dramac-booking>Book Now</button>
 */
(function () {
  "use strict";

  var DramacBooking = {
    _config: null,
    _overlay: null,
    _iframe: null,

    init: function (config) {
      if (!config || !config.siteId) {
        console.error("[DramacBooking] siteId is required");
        return;
      }
      this._config = config;
      this._bindButtons();
      this._listenForMessages();
    },

    _buildUrl: function () {
      var c = this._config;
      var origin = this._getScriptOrigin();
      var params = [];
      if (c.primaryColor)
        params.push(
          "color=" + encodeURIComponent(c.primaryColor.replace("#", "")),
        );
      if (c.borderRadius != null)
        params.push("radius=" + encodeURIComponent(c.borderRadius));
      if (c.showHeader === false) params.push("hideHeader=1");
      if (c.showServiceSelector === false) params.push("hideServices=1");
      if (c.showStaffSelector === false) params.push("hideStaff=1");

      return (
        origin +
        "/embed/booking/" +
        encodeURIComponent(c.siteId) +
        (params.length ? "?" + params.join("&") : "")
      );
    },

    _getScriptOrigin: function () {
      try {
        var scripts = document.querySelectorAll("script[src]");
        for (var i = 0; i < scripts.length; i++) {
          if (scripts[i].src && scripts[i].src.indexOf("booking.js") !== -1) {
            var url = new URL(scripts[i].src);
            return url.origin;
          }
        }
      } catch (e) {
        // fallback
      }
      return window.location.origin;
    },

    _bindButtons: function () {
      var self = this;
      document.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-dramac-booking]");
        if (btn) {
          e.preventDefault();
          self.open();
        }
      });
    },

    _listenForMessages: function () {
      var self = this;
      window.addEventListener("message", function (e) {
        if (!e.data || typeof e.data !== "object") return;
        if (e.data.type === "DRAMAC_BOOKING_COMPLETE") {
          self.close();
        }
        if (e.data.type === "DRAMAC_RESIZE" && self._iframe && e.data.height) {
          self._iframe.style.height =
            Math.min(e.data.height, window.innerHeight * 0.85) + "px";
        }
      });
    },

    open: function () {
      if (this._overlay) return;

      var overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;";

      var container = document.createElement("div");
      container.style.cssText =
        "background:#fff;border-radius:12px;width:100%;max-width:640px;max-height:90vh;overflow:hidden;position:relative;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);";

      var closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&times;";
      closeBtn.style.cssText =
        "position:absolute;top:8px;right:12px;z-index:10;background:none;border:none;font-size:24px;cursor:pointer;color:#6b7280;line-height:1;padding:4px 8px;";
      closeBtn.setAttribute("aria-label", "Close booking widget");
      var self = this;
      closeBtn.addEventListener("click", function () {
        self.close();
      });

      var iframe = document.createElement("iframe");
      iframe.src = this._buildUrl();
      iframe.style.cssText =
        "width:100%;height:600px;border:none;display:block;";
      iframe.setAttribute("title", "Booking Widget");
      iframe.setAttribute("allow", "payment");

      container.appendChild(closeBtn);
      container.appendChild(iframe);
      overlay.appendChild(container);

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) self.close();
      });

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      this._overlay = overlay;
      this._iframe = iframe;
    },

    close: function () {
      if (this._overlay) {
        document.body.removeChild(this._overlay);
        document.body.style.overflow = "";
        this._overlay = null;
        this._iframe = null;
      }
    },
  };

  window.DramacBooking = DramacBooking;
})();
