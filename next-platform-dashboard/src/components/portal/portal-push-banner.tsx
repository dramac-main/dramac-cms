"use client";

/**
 * Portal Push Permission Banner
 *
 * Surfaces a persistent (but dismissible) banner inviting the portal user to
 * enable browser notifications. Hides itself if push is unsupported, already
 * granted, or the user dismissed it within the last 30 days.
 */

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
} from "@/lib/push-client";
import { toast } from "sonner";

const DISMISS_KEY = "portal_push_banner_dismissed_until";
const DISMISS_DAYS = 30;

export function PortalPushBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPushSupported()) return;
    if (getPushPermission() !== "default") return;

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedUntil > Date.now()) return;

    // If already subscribed (e.g. permission granted in another tab), skip.
    navigator.serviceWorker
      ?.getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => {
        if (!sub) setVisible(true);
      })
      .catch(() => setVisible(true));
  }, []);

  const dismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      /* storage may be blocked */
    }
    setVisible(false);
  };

  const enable = async () => {
    setLoading(true);
    try {
      const result = await subscribeToPush("portal");
      if (result.success) {
        toast.success("Notifications enabled");
        setVisible(false);
      } else {
        toast.error(result.error || "Could not enable notifications");
        if (getPushPermission() === "denied") setVisible(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="border-b bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
        <Bell className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <span className="flex-1 text-amber-900 dark:text-amber-200">
          Notifications are off. Turn them on to be alerted instantly when
          orders, bookings, payments and chats arrive.
        </span>
        <Button size="sm" variant="default" onClick={enable} disabled={loading}>
          {loading ? "Enabling…" : "Enable"}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
