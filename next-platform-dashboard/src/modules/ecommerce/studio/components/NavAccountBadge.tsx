/**
 * NavAccountBadge — Account icon for the published site navbar
 *
 * Shows a user icon that opens the auth dialog when clicked.
 * When the customer is logged in, shows their initials or a filled icon.
 *
 * Usage: Embed in the site's navbar HTML next to the cart icon.
 *
 * Phase ECOM-ACCOUNTS
 */
"use client";

import { useEffect } from "react";
import { useStorefrontAuth } from "../../context/storefront-auth-context";

interface NavAccountBadgeProps {
  /** Href to navigate to when user is logged in (e.g. "/account") */
  accountHref?: string;
  /** Icon color */
  color?: string;
  /** Show text label next to icon (default: true) */
  showLabel?: boolean;
  className?: string;
}

/**
 * A small SVG user icon — inline so no icon library dependency is needed.
 */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className || "w-6 h-6"}
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function NavAccountBadge({
  accountHref = "/account",
  color,
  showLabel = true,
  className = "",
}: NavAccountBadgeProps) {
  const { customer, isLoading, openAuthDialog } = useStorefrontAuth();

  // Prefetch the account page on hover for snappy navigation
  useEffect(() => {
    if (customer && typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = accountHref;
      document.head.appendChild(link);
    }
  }, [customer, accountHref]);

  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center justify-center opacity-40 ${className}`}
        style={color ? { color } : undefined}
      >
        <UserIcon className="w-6 h-6" />
      </span>
    );
  }

  if (customer) {
    // Logged in — link to account page, show initials
    const initials =
      (customer.firstName?.[0] || "") + (customer.lastName?.[0] || "") ||
      customer.email[0].toUpperCase();
    return (
      <a
        href={accountHref}
        className={`inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold w-8 h-8 hover:opacity-90 ${className}`}
        style={color ? { background: color } : undefined}
        title={`My Account — ${customer.displayName || customer.email}`}
        aria-label="Go to my account"
      >
        {initials}
      </a>
    );
  }

  // Guest — click to sign in
  return (
    <button
      type="button"
      onClick={() => openAuthDialog("login")}
      className={`inline-flex items-center justify-center gap-1.5 hover:opacity-70 transition-opacity ${className}`}
      style={color ? { color } : undefined}
      title="Sign in or create an account"
      aria-label="Sign in or create an account"
    >
      <UserIcon className="w-5 h-5" />
      {showLabel && (
        <span className="text-sm font-medium hidden sm:inline">Sign In</span>
      )}
    </button>
  );
}
