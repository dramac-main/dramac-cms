"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Preferences {
  email_marketing: boolean;
  email_security: boolean;
  email_updates: boolean;
  email_team: boolean;
  email_billing: boolean;
}

export function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>({
    email_marketing: true,
    email_security: true,
    email_updates: true,
    email_team: true,
    email_billing: true,
  });

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    fetch(`/api/email-preferences?uid=${uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      })
      .catch(() => {
        // Default preferences on error
      })
      .finally(() => setLoading(false));
  }, [uid]);

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, preferences: prefs }),
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Email preferences updated");
      } else {
        toast.error("Failed to update preferences");
      }
    } catch {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    const allOff: Preferences = {
      email_marketing: false,
      email_security: true, // Always keep security emails
      email_updates: false,
      email_team: false,
      email_billing: false,
    };
    setPrefs(allOff);
    if (!uid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, preferences: allOff }),
      });
      if (res.ok) {
        setSaved(true);
        toast.success("Unsubscribed from all non-essential emails");
      } else {
        toast.error("Failed to update preferences");
      }
    } catch {
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (!uid) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
          <p className="text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  if (saved) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preferences Updated</h2>
          <p className="text-muted-foreground">
            Your email preferences have been saved.
          </p>
        </CardContent>
      </Card>
    );
  }

  const prefItems = [
    { key: "email_updates" as const, label: "Product Updates", desc: "Notifications about your sites, bookings, and orders" },
    { key: "email_team" as const, label: "Team Activity", desc: "Team invitations and member updates" },
    { key: "email_billing" as const, label: "Billing & Payments", desc: "Payment confirmations, failures, and subscription updates" },
    { key: "email_marketing" as const, label: "Marketing", desc: "Tips, feature announcements, and promotional content" },
    { key: "email_security" as const, label: "Security Alerts", desc: "Password changes and security notifications (always on)" },
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Email Preferences</CardTitle>
        <CardDescription>
          Choose which emails you&apos;d like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {prefItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4">
            <div>
              <Label className="font-medium">{item.label}</Label>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={prefs[item.key]}
              disabled={item.key === "email_security"}
              onCheckedChange={(checked) =>
                setPrefs((prev) => ({ ...prev, [item.key]: checked }))
              }
            />
          </div>
        ))}

        <div className="pt-4 space-y-2">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Preferences
          </Button>
          <Button
            variant="outline"
            onClick={handleUnsubscribeAll}
            disabled={saving}
            className="w-full text-destructive hover:text-destructive"
          >
            Unsubscribe from All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
