"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, BellRing, CheckCircle } from "lucide-react";
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

export function PushNotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sup = isPushSupported();
    setSupported(sup);
    if (sup) {
      setPermission(getPushPermission());
      // Check if already subscribed
      navigator.serviceWorker?.getRegistration().then((reg) => {
        reg?.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await subscribeToPush("agent");
      if (result.success) {
        setSubscribed(true);
        setPermission("granted");
      } else {
        setPermission(getPushPermission());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <BellOff className="h-5 w-5" />
        <div>
          <p className="text-sm font-medium">Not supported</p>
          <p className="text-xs">Your browser does not support push notifications</p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <BellOff className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-sm font-medium">Notifications blocked</p>
          <p className="text-xs">
            Push notifications have been blocked. Please enable them in your browser settings.
          </p>
        </div>
      </div>
    );
  }

  if (subscribed) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellRing className="h-5 w-5 text-green-500" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Push notifications enabled</p>
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <CheckCircle className="h-3 w-3 mr-1" /> Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll receive browser notifications for new chat messages, assignments, and alerts
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisable} disabled={loading}>
          {loading ? "Disabling..." : "Disable"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Enable push notifications</p>
          <p className="text-xs text-muted-foreground">
            Get notified about new chats, messages, and alerts even when the dashboard isn&apos;t open
          </p>
        </div>
      </div>
      <Button size="sm" onClick={handleEnable} disabled={loading}>
        {loading ? "Enabling..." : "Enable"}
      </Button>
    </div>
  );
}
