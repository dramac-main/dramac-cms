"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating Ask Chiko button.
 *
 * Renders a branded pill-style FAB anchored to the bottom-right of the portal
 * viewport. Visible on every portal page EXCEPT:
 * - The Ask Chiko page itself (`/portal/ask-chiko`)
 * - Public portal routes (`/portal/login`, `/portal/verify`)
 *
 * Uses the agency's primary brand color via the `--primary` CSS variable set
 * by `ServerBrandingStyle`, so branding stays consistent across agencies.
 *
 * Positioning: `bottom-6 right-6` on desktop; shifts up on mobile when the
 * portal bottom nav is present (handled via `bottom-24` breakpoint class).
 */
export function PortalChikoFab() {
  const pathname = usePathname();

  if (!pathname?.startsWith("/portal")) return null;
  if (pathname === "/portal/ask-chiko") return null;
  if (pathname === "/portal/login" || pathname === "/portal/verify") {
    return null;
  }

  return (
    <Link
      href="/portal/ask-chiko"
      aria-label="Ask Chiko"
      className={cn(
        "fixed right-4 z-40 flex items-center gap-2 rounded-full",
        "bg-primary px-4 py-3 text-primary-foreground shadow-lg",
        "transition-transform hover:scale-105 hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        // Sit above the mobile bottom nav (mobile) and free space (desktop)
        "bottom-24 md:bottom-6 md:right-6",
      )}
    >
      <Sparkles className="h-5 w-5" />
      <span className="text-sm font-semibold">Ask Chiko</span>
    </Link>
  );
}
