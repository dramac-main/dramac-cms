/**
 * DRAMAC Studio Canvas Iframe
 *
 * Renders an isolated iframe for canvas content — the industry-standard
 * approach used by Webflow, Wix, Squarespace, and Framer.
 *
 * Why iframe?
 * 1. CSS ISOLATION — Dashboard dark mode, panel styles, etc. cannot bleed into page content
 * 2. TRUE RESPONSIVE — Tailwind @media queries respond to iframe width, not browser viewport
 * 3. ACCURATE RENDERING — Components render identically to preview/published site
 * 4. THEME ISOLATION — iframe has its own <html class="light"> context
 *
 * Architecture:
 * - Same-origin iframe (about:blank) for direct DOM access
 * - Parent stylesheets cloned into iframe <head> for Tailwind/shadcn classes
 * - Brand CSS variables injected for site-specific theming
 * - Google Fonts loaded inside iframe
 * - React content rendered via createPortal into iframe body
 * - Keyboard/wheel events forwarded to parent for shortcuts/zoom
 */

"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";

// =============================================================================
// CONTEXT
// =============================================================================

interface CanvasIframeContextValue {
  /** The iframe's document (null until loaded) */
  iframeDocument: Document | null;
  /** The iframe's window (null until loaded) */
  iframeWindow: Window | null;
}

const CanvasIframeContext = createContext<CanvasIframeContextValue>({
  iframeDocument: null,
  iframeWindow: null,
});

export function useCanvasIframe() {
  return useContext(CanvasIframeContext);
}

// =============================================================================
// TYPES
// =============================================================================

interface CanvasIframeProps {
  /** React content to render inside the iframe */
  children: React.ReactNode;
  /** Brand CSS custom properties (e.g., { "--primary": "210 100% 50%", ... }) */
  brandCSSVars?: Record<string, string>;
  /** Background color for the iframe body */
  backgroundColor?: string;
  /** Foreground (text) color for the iframe body */
  foregroundColor?: string;
  /** Google Font families to load */
  fontFamilies?: string[];
  /** Width of the iframe viewport */
  width: number;
  /** Fixed height of the iframe viewport (creates a real scrollable viewport) */
  height: number;
  /** CSS class for the iframe element */
  className?: string;
  /** Callback when iframe is ready */
  onReady?: () => void;
}

// =============================================================================
// STYLESHEET CLONING
// =============================================================================

/**
 * Clone all stylesheets from the parent document into the iframe head.
 * This ensures Tailwind, shadcn, and global CSS classes work inside.
 */
function cloneParentStyles(iframeDoc: Document): void {
  // Clone <link rel="stylesheet"> elements
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    const clone = link.cloneNode(true) as HTMLLinkElement;
    iframeDoc.head.appendChild(clone);
  });

  // Clone <style> elements (Tailwind/Next.js generated styles)
  const styles = document.querySelectorAll("style");
  styles.forEach((style) => {
    // Skip studio-specific styles that shouldn't be in the iframe
    if (
      style.hasAttribute("data-studio-state-styles") ||
      style.hasAttribute("data-studio-responsive-overrides")
    ) {
      return;
    }
    const clone = style.cloneNode(true) as HTMLStyleElement;
    iframeDoc.head.appendChild(clone);
  });
}

/**
 * Inject brand CSS variables into the iframe as a <style> tag.
 * These override the default shadcn/Tailwind CSS variables.
 */
function injectBrandStyles(
  iframeDoc: Document,
  brandCSSVars: Record<string, string>,
  bgColor: string,
  fgColor: string
): HTMLStyleElement {
  // Remove existing brand style if any
  const existing = iframeDoc.querySelector("[data-studio-brand-vars]");
  if (existing) existing.remove();

  const style = iframeDoc.createElement("style");
  style.setAttribute("data-studio-brand-vars", "true");

  const cssVarDeclarations = Object.entries(brandCSSVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  style.textContent = `
    /* DRAMAC Studio — Brand CSS Variables */
    :root, .light, body {
      ${cssVarDeclarations}
      color-scheme: light;
    }
    html {
      color-scheme: light;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      color: ${fgColor};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    /* Override any dark mode styles that might be in the cloned CSS */
    .dark {
      color-scheme: light;
    }
  `;

  iframeDoc.head.appendChild(style);
  return style;
}

/**
 * Load Google Fonts inside the iframe
 */
function loadGoogleFonts(
  iframeDoc: Document,
  fontFamilies: string[]
): HTMLLinkElement | null {
  if (fontFamilies.length === 0) return null;

  // Remove existing font link
  const existing = iframeDoc.querySelector("[data-studio-fonts]");
  if (existing) existing.remove();

  const families = fontFamilies
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
    .join("&");
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;

  const link = iframeDoc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-studio-fonts", "true");
  iframeDoc.head.appendChild(link);
  return link;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CanvasIframe({
  children,
  brandCSSVars = {},
  backgroundColor = "#ffffff",
  foregroundColor = "#111827",
  fontFamilies = [],
  width,
  height,
  className,
  onReady,
}: CanvasIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [iframeDoc, setIframeDoc] = useState<Document | null>(null);
  const [iframeWin, setIframeWin] = useState<Window | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Track if we've done initial setup
  const initializedRef = useRef(false);

  // ── IFRAME INITIALIZATION ──────────────────────────────────────────────
  const initIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || initializedRef.current) return;

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) return;

    initializedRef.current = true;

    // Write the base HTML structure.
    // NO overflow restrictions on html/body — let the iframe viewport scroll naturally.
    // This ensures: window.scrollY works, position:sticky works, scroll events fire.
    // The iframe element's fixed height creates the viewport boundary.
    doc.open();
    doc.write(
      '<!DOCTYPE html><html class="light" style="color-scheme:light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:0}::-webkit-scrollbar{width:6px;background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,0,0,.18);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.3)}@supports(scrollbar-width:thin){html{scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.18) transparent}}</style></head><body></body></html>'
    );
    doc.close();

    // Clone parent stylesheets
    cloneParentStyles(doc);

    // Inject brand CSS variables
    injectBrandStyles(doc, brandCSSVars, backgroundColor, foregroundColor);

    // Load Google Fonts
    if (fontFamilies.length > 0) {
      loadGoogleFonts(doc, fontFamilies);
    }

    // Set state
    setIframeDoc(doc);
    setIframeWin(win);
    setPortalTarget(doc.body);
    setIsReady(true);
    onReady?.();
  }, [brandCSSVars, backgroundColor, foregroundColor, fontFamilies, onReady]);

  // Initial setup on mount
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // For about:blank, contentDocument is available immediately
    initIframe();

    // Also listen for load event as fallback
    iframe.addEventListener("load", initIframe);
    return () => {
      iframe.removeEventListener("load", initIframe);
    };
  }, [initIframe]);

  // ── UPDATE BRAND STYLES WHEN VARS CHANGE ──────────────────────────────
  useEffect(() => {
    if (!iframeDoc || !isReady) return;
    injectBrandStyles(iframeDoc, brandCSSVars, backgroundColor, foregroundColor);
  }, [iframeDoc, isReady, brandCSSVars, backgroundColor, foregroundColor]);

  // ── UPDATE FONTS WHEN THEY CHANGE ─────────────────────────────────────
  useEffect(() => {
    if (!iframeDoc || !isReady) return;
    loadGoogleFonts(iframeDoc, fontFamilies);
  }, [iframeDoc, isReady, fontFamilies]);

  // ── SYNC NEW PARENT STYLES ─────────────────────────────────────────────
  // Watch for dynamically added stylesheets in parent (e.g., HMR, lazy CSS)
  useEffect(() => {
    if (!iframeDoc || !isReady) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLLinkElement && node.rel === "stylesheet") {
            const clone = node.cloneNode(true) as HTMLLinkElement;
            iframeDoc.head.appendChild(clone);
          }
          if (
            node instanceof HTMLStyleElement &&
            !node.hasAttribute("data-studio-state-styles") &&
            !node.hasAttribute("data-studio-responsive-overrides") &&
            !node.hasAttribute("data-studio-brand-vars") &&
            !node.hasAttribute("data-studio-fonts")
          ) {
            const clone = node.cloneNode(true) as HTMLStyleElement;
            iframeDoc.head.appendChild(clone);
          }
        }
      }
    });

    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, [iframeDoc, isReady]);

  // ── EVENT FORWARDING ──────────────────────────────────────────────────
  // Forward keyboard events from iframe to parent for shortcuts
  useEffect(() => {
    if (!iframeDoc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Forward to parent document for shortcut handling
      const syntheticEvent = new KeyboardEvent("keydown", {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        bubbles: true,
        cancelable: true,
      });
      const dispatched = window.document.dispatchEvent(syntheticEvent);

      // If the parent handler prevented default, prevent it in iframe too
      if (!dispatched || syntheticEvent.defaultPrevented) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      window.document.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: e.key,
          code: e.code,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          bubbles: true,
        })
      );
    };

    iframeDoc.addEventListener("keydown", handleKeyDown);
    iframeDoc.addEventListener("keyup", handleKeyUp);
    return () => {
      iframeDoc.removeEventListener("keydown", handleKeyDown);
      iframeDoc.removeEventListener("keyup", handleKeyUp);
    };
  }, [iframeDoc]);

  // Forward wheel events from iframe to parent for zoom (Ctrl+wheel)
  useEffect(() => {
    if (!iframeDoc) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Dispatch on the canvas container in parent
        const canvasContainer = document.querySelector("[data-canvas-container]");
        if (canvasContainer) {
          canvasContainer.dispatchEvent(
            new WheelEvent("wheel", {
              deltaX: e.deltaX,
              deltaY: e.deltaY,
              ctrlKey: e.ctrlKey,
              metaKey: e.metaKey,
              bubbles: true,
            })
          );
        }
      }
    };

    iframeDoc.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      iframeDoc.removeEventListener("wheel", handleWheel);
    };
  }, [iframeDoc]);

  // ── CONTEXT VALUE ──────────────────────────────────────────────────────
  const contextValue = useMemo<CanvasIframeContextValue>(
    () => ({
      iframeDocument: iframeDoc,
      iframeWindow: iframeWin,
    }),
    [iframeDoc, iframeWin]
  );

  return (
    <>
      <iframe
        ref={iframeRef}
        src="about:blank"
        title="Studio Canvas"
        className={className}
        style={{
          border: "none",
          width,
          height,
          display: "block",
          background: backgroundColor,
        }}
        // Security: same-origin, no sandbox (need full DOM access)
        // The iframe is same-origin (about:blank) so scripts run in parent context
      />

      {/* Render React content via portal into iframe body */}
      {portalTarget &&
        isReady &&
        createPortal(
          <CanvasIframeContext.Provider value={contextValue}>
            {children}
          </CanvasIframeContext.Provider>,
          portalTarget
        )}
    </>
  );
}
