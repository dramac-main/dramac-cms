"use client";

import { useState, useTransition } from "react";
import { Bell, Mail, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateNotificationPreference } from "@/app/portal/settings/notifications/actions";

export interface PreferenceEvent {
  type: string;
  title: string;
}

export interface PreferenceGroup {
  label: string;
  events: PreferenceEvent[];
}

export interface ChannelState {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

interface Props {
  groups: PreferenceGroup[];
  initial: Record<string, ChannelState>;
}

export function NotificationPreferencesForm({ groups, initial }: Props) {
  const [state, setState] =
    useState<Record<string, ChannelState>>(initial);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(
    eventType: string,
    channel: keyof ChannelState,
    value: boolean,
  ) {
    const prev = state[eventType] ?? { inApp: true, email: true, push: true };
    const next = { ...prev, [channel]: value };
    setState((s) => ({ ...s, [eventType]: next }));
    const key = `${eventType}:${channel}`;
    setPendingKey(key);

    startTransition(async () => {
      const result = await updateNotificationPreference(eventType, null, {
        [channel]: value,
      });
      setPendingKey((p) => (p === key ? null : p));
      if (!result.ok) {
        // Roll back on failure
        setState((s) => ({ ...s, [eventType]: prev }));
        toast.error(`Failed to save: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.label}>
          <CardHeader>
            <CardTitle>{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Column header */}
            <div className="hidden md:grid grid-cols-[1fr_96px_96px_96px] px-4 py-2 border-b text-xs text-muted-foreground">
              <div>Event</div>
              <div className="flex items-center gap-1 justify-center">
                <Bell className="h-3 w-3" /> In-app
              </div>
              <div className="flex items-center gap-1 justify-center">
                <Mail className="h-3 w-3" /> Email
              </div>
              <div className="flex items-center gap-1 justify-center">
                <Smartphone className="h-3 w-3" /> Push
              </div>
            </div>
            <div className="divide-y">
              {group.events.map((ev) => {
                const channels = state[ev.type] ?? {
                  inApp: true,
                  email: true,
                  push: true,
                };
                return (
                  <div
                    key={ev.type}
                    className="grid grid-cols-[1fr_96px_96px_96px] px-4 py-3 items-center"
                  >
                    <div className="text-sm font-medium">{ev.title}</div>
                    <ChannelSwitch
                      checked={channels.inApp}
                      disabled={pendingKey === `${ev.type}:inApp`}
                      onChange={(v) => toggle(ev.type, "inApp", v)}
                    />
                    <ChannelSwitch
                      checked={channels.email}
                      disabled={pendingKey === `${ev.type}:email`}
                      onChange={(v) => toggle(ev.type, "email", v)}
                    />
                    <ChannelSwitch
                      checked={channels.push}
                      disabled={pendingKey === `${ev.type}:push`}
                      onChange={(v) => toggle(ev.type, "push", v)}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChannelSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex justify-center">
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
