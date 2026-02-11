/**
 * Live Chat Widget Injector
 *
 * Automatically injects the DRAMAC Live Chat embed script into published sites
 * when the live-chat module is enabled.
 *
 * This is a server component that renders a <script> tag pointing to the
 * embed API endpoint. The embed script handles:
 * - Fetching widget settings (colors, position, branding)
 * - Creating the floating launcher button
 * - Creating the iframe container with the chat widget
 * - Open/close toggle, unread badge, mobile responsiveness
 * - PostMessage communication between parent page and iframe
 *
 * @phase LC-04 / LC-08 - Widget injection into published sites
 */

import Script from "next/script";

interface LiveChatWidgetInjectorProps {
  siteId: string;
}

/**
 * Server component that injects the live chat widget embed script.
 * Uses Next.js Script component for optimal loading (afterInteractive strategy).
 */
export function LiveChatWidgetInjector({ siteId }: LiveChatWidgetInjectorProps) {
  // The embed endpoint dynamically determines the base URL from the request headers,
  // so we use a relative path. On Vercel, this resolves to the correct domain.
  const embedUrl = `/api/modules/live-chat/embed?siteId=${encodeURIComponent(siteId)}`;

  return (
    <Script
      id="dramac-live-chat-widget"
      src={embedUrl}
      strategy="afterInteractive"
    />
  );
}
