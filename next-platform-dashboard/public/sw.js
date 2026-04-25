// DRAMAC Client Portal Service Worker
// Handles: install/activate cache lifecycle, push notifications, click-routing,
// offline-friendly fetch strategy. Authenticated HTML is NEVER cached.
//
// Bump CACHE_VERSION whenever the precache list or strategy changes.

const CACHE_VERSION = "v3";
const STATIC_CACHE = `dramac-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `dramac-runtime-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-maskable.svg",
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(PRECACHE_ASSETS);
      } catch {
        // Precache best-effort — never fail install on a single missing asset
      }
      await self.skipWaiting();
    })(),
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("dramac-") && !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
// Strategy:
//  - Same-origin GET only (everything else passes through to network)
//  - Never cache authenticated HTML or API
//  - Static assets: stale-while-revalidate
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/portal/verify") ||
    url.pathname.startsWith("/portal/login") ||
    url.pathname === "/login" ||
    url.pathname.startsWith("/auth")
  ) {
    return;
  }

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:js|css|png|jpg|jpeg|webp|svg|woff|woff2|ttf)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.status === 200 && res.type !== "opaque") {
        cache.put(request, res.clone()).catch(() => {});
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

// ─── Push ────────────────────────────────────────────────────────────────────
// Payload contract (JSON):
// {
//   title, body, icon, badge, image,
//   tag, renotify, requireInteraction, silent,
//   url, type ('chat'|'order'|'booking'|'invoice'|'quote'|'general'),
//   conversationId, orderId, bookingId, invoiceId, quoteId, userId,
//   actions: [{action, title, icon}]
// }
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notification", body: event.data.text() };
  }

  const type = data.type || "general";
  const baseTag =
    data.tag ||
    `${type}:${data.conversationId || data.orderId || data.bookingId || data.invoiceId || "default"}`;
  const userTag = data.userId ? `${baseTag}:${data.userId}` : baseTag;

  const criticalTypes = new Set([
    "chat",
    "order",
    "booking",
    "invoice",
    "payment",
    "quote",
  ]);
  const requireInteraction =
    data.requireInteraction !== undefined
      ? !!data.requireInteraction
      : criticalTypes.has(type);

  const defaultActions = (() => {
    switch (type) {
      case "chat":
        return [
          { action: "open", title: "Reply" },
          { action: "dismiss", title: "Dismiss" },
        ];
      case "order":
        return [
          { action: "open", title: "View order" },
          { action: "dismiss", title: "Dismiss" },
        ];
      case "booking":
        return [
          { action: "open", title: "View booking" },
          { action: "dismiss", title: "Dismiss" },
        ];
      case "quote":
        return [
          { action: "open", title: "Review quote" },
          { action: "dismiss", title: "Dismiss" },
        ];
      case "invoice":
        return [
          { action: "open", title: "View invoice" },
          { action: "dismiss", title: "Dismiss" },
        ];
      default:
        return [];
    }
  })();

  const title = data.title || "DRAMAC";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icons/icon.svg",
    badge: data.badge || "/icons/icon.svg",
    image: data.image || undefined,
    tag: userTag,
    renotify: data.renotify !== undefined ? !!data.renotify : true,
    requireInteraction,
    silent: !!data.silent,
    vibrate: data.silent ? [] : [200, 100, 200],
    timestamp: Date.now(),
    data: {
      url: data.url || "/portal/notifications",
      type,
      conversationId: data.conversationId || null,
      orderId: data.orderId || null,
      bookingId: data.bookingId || null,
      invoiceId: data.invoiceId || null,
      quoteId: data.quoteId || null,
      userId: data.userId || null,
    },
    actions: data.actions || defaultActions,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ──────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/portal";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const portalClient =
        allClients.find((c) => c.url.includes("/portal")) || allClients[0];

      if (portalClient) {
        try {
          await portalClient.focus();
          portalClient.postMessage({
            type: "notification-click",
            url: targetUrl,
            data: event.notification.data,
          });
          setTimeout(() => {
            try {
              portalClient.navigate?.(targetUrl);
            } catch {
              /* unsupported in some browsers */
            }
          }, 100);
          return;
        } catch {
          /* fallthrough */
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

self.addEventListener("notificationclose", (event) => {
  try {
    const data = event.notification.data || {};
    if (data.type) {
      fetch("/api/push/dismissed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: data.type, tag: event.notification.tag }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
