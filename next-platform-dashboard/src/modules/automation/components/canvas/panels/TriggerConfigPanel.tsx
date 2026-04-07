/**
 * TriggerConfigPanel — Right sidebar for configuring the workflow trigger.
 *
 * Phase 4: Canvas trigger configuration. Shows when the trigger node is
 * selected in the canvas. Reuses the same pattern as the legacy TriggerPanel
 * but styled for the canvas sidebar context.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Zap, Clock, Globe, MousePointer, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { EVENT_REGISTRY } from "../../../lib/event-types";
import type { TriggerConfig, TriggerType } from "../../../types/automation-types";

// ============================================================================
// TYPES
// ============================================================================

interface TriggerConfigPanelProps {
  trigger?: TriggerConfig;
  triggerType?: TriggerType;
  onTriggerChange: (trigger: TriggerConfig, type: TriggerType) => void;
  onClose: () => void;
}

const TRIGGER_TYPES = [
  { id: "event" as TriggerType, name: "Event", icon: Zap },
  { id: "schedule" as TriggerType, name: "Schedule", icon: Clock },
  { id: "webhook" as TriggerType, name: "Webhook", icon: Globe },
  { id: "manual" as TriggerType, name: "Manual", icon: MousePointer },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TriggerConfigPanel({
  trigger,
  triggerType,
  onTriggerChange,
  onClose,
}: TriggerConfigPanelProps) {
  const [selectedType, setSelectedType] = useState<TriggerType>(
    triggerType || "event",
  );
  const [copied, setCopied] = useState(false);

  const handleTypeChange = (type: TriggerType) => {
    setSelectedType(type);
    onTriggerChange({ ...trigger }, type);
  };

  const update = (key: string, value: unknown) => {
    onTriggerChange({ ...trigger, [key]: value }, selectedType);
  };

  const copyWebhookUrl = async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/automation/webhook/${trigger?.endpoint_path || "configure-me"}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Webhook URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col border-l bg-background w-80">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Trigger
        </h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Trigger Type Grid */}
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_TYPES.map((t) => {
              const Icon = t.icon;
              const active = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-md border text-xs transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.name}
                </button>
              );
            })}
          </div>

          {/* ---- Event Config ---- */}
          {selectedType === "event" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Event Type</Label>
                <Select
                  value={(trigger?.event_type as string) || ""}
                  onValueChange={(v) => update("event_type", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select event..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                      CRM
                    </div>
                    {Object.entries(EVENT_REGISTRY.crm.contact).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Contact {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}
                    {Object.entries(EVENT_REGISTRY.crm.deal).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Deal {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}

                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground mt-1">
                      Booking
                    </div>
                    {Object.entries(EVENT_REGISTRY.booking.appointment).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Appointment {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}

                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground mt-1">
                      Forms
                    </div>
                    {Object.entries(EVENT_REGISTRY.form.submission).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Form {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}

                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground mt-1">
                      E-Commerce
                    </div>
                    {Object.entries(EVENT_REGISTRY.ecommerce.order).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Order {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}
                    {Object.entries(EVENT_REGISTRY.ecommerce.cart).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Cart {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}

                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground mt-1">
                      Accounting
                    </div>
                    {Object.entries(EVENT_REGISTRY.accounting.invoice).map(
                      ([key, value]) => (
                        <SelectItem key={value} value={value}>
                          Invoice {key.replace(/_/g, " ")}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Filter (Optional)</Label>
                <Input
                  placeholder='{"status": "active"}'
                  value={JSON.stringify(trigger?.filter || {})}
                  onChange={(e) => {
                    try {
                      update("filter", JSON.parse(e.target.value));
                    } catch {
                      /* invalid */
                    }
                  }}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* ---- Schedule Config ---- */}
          {selectedType === "schedule" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Frequency</Label>
                <Select
                  value={(trigger?.schedule_type as string) || "daily"}
                  onValueChange={(v) => update("schedule_type", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Every Day</SelectItem>
                    <SelectItem value="weekly">Every Week</SelectItem>
                    <SelectItem value="monthly">Every Month</SelectItem>
                    <SelectItem value="custom">Custom (Cron)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {trigger?.schedule_type === "custom" && (
                <div className="space-y-2">
                  <Label className="text-xs">Cron Expression</Label>
                  <Input
                    placeholder="0 9 * * 1-5"
                    value={(trigger?.cron as string) || ""}
                    onChange={(e) => update("cron", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}

              {(trigger?.schedule_type === "daily" ||
                trigger?.schedule_type === "weekly") && (
                <div className="space-y-2">
                  <Label className="text-xs">Time</Label>
                  <Input
                    type="time"
                    value={(trigger?.time as string) || "09:00"}
                    onChange={(e) => update("time", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Timezone</Label>
                <Select
                  value={(trigger?.timezone as string) || "UTC"}
                  onValueChange={(v) => update("timezone", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ---- Webhook Config ---- */}
          {selectedType === "webhook" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Endpoint Path</Label>
                <Input
                  placeholder="my-webhook"
                  value={(trigger?.endpoint_path as string) || ""}
                  onChange={(e) =>
                    update(
                      "endpoint_path",
                      e.target.value
                        .replace(/[^a-z0-9-]/gi, "-")
                        .toLowerCase(),
                    )
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="p-2 bg-muted rounded-md">
                <code className="text-[10px] break-all">
                  {`${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/automation/webhook/${trigger?.endpoint_path || "..."}`}
                </code>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={copyWebhookUrl}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy URL
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <Label className="text-xs">Secret Key</Label>
                <Input
                  type="password"
                  placeholder="For signature verification"
                  value={(trigger?.secret_key as string) || ""}
                  onChange={(e) => update("secret_key", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* ---- Manual ---- */}
          {selectedType === "manual" && (
            <div className="p-4 border border-dashed rounded-md text-center space-y-2">
              <MousePointer className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Manually triggered via dashboard or API.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
