"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { saveAskChikoSettings } from "@/modules/ask-chiko/actions";
import type { AskChikoSettings } from "@/modules/ask-chiko/actions";

const DATA_SOURCE_OPTIONS = [
  { id: "products", label: "Products & Catalog" },
  { id: "orders", label: "Orders & Sales" },
  { id: "bookings", label: "Bookings & Appointments" },
  { id: "customers", label: "Customers & CRM" },
  { id: "invoices", label: "Invoices & Finance" },
  { id: "analytics", label: "Analytics & Insights" },
  { id: "marketing", label: "Marketing Campaigns" },
];

interface Props {
  initial: AskChikoSettings;
  siteId: string;
}

export function AskChikoSettingsForm({ initial, siteId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [isEnabled, setIsEnabled] = useState(initial.isEnabled);
  const [tone, setTone] = useState<AskChikoSettings["tone"]>(initial.tone);
  const [customInstructions, setCustomInstructions] = useState(
    initial.customInstructions,
  );
  const [allowedSources, setAllowedSources] = useState<string[]>(
    initial.allowedDataSources,
  );
  const [quota, setQuota] = useState(String(initial.monthlyMessageQuota));

  function toggleSource(id: string, checked: boolean) {
    setAllowedSources((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id),
    );
  }

  function handleSave() {
    setStatus("idle");
    startTransition(async () => {
      const result = await saveAskChikoSettings(siteId, {
        isEnabled,
        tone,
        customInstructions,
        allowedDataSources: allowedSources,
        monthlyMessageQuota: Math.max(0, parseInt(quota, 10) || 0),
      });
      if (result.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Unknown error");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Enable / Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ask Chiko AI
            {isEnabled ? (
              <Badge variant="default" className="ml-auto">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto">
                Disabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configure the AI business assistant available to portal clients on
            this site. Chiko answers questions about revenue, orders, bookings,
            customers, and more using live data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="chiko-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="chiko-enabled">
              {isEnabled
                ? "Chiko is enabled for portal clients"
                : "Chiko is disabled"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {isEnabled && (
        <>
          {/* Tone */}
          <Card>
            <CardHeader>
              <CardTitle>Response Tone</CardTitle>
              <CardDescription>
                How Chiko communicates with your portal clients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={tone}
                onValueChange={(v) => setTone(v as AskChikoSettings["tone"])}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    Professional — formal and precise
                  </SelectItem>
                  <SelectItem value="friendly">
                    Friendly — warm and approachable
                  </SelectItem>
                  <SelectItem value="casual">
                    Casual — conversational and relaxed
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Custom instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Instructions</CardTitle>
              <CardDescription>
                Optional context injected into every Chiko conversation on this
                site. Use this to tell Chiko about your business, brand voice,
                products, or anything else clients might ask about. Max 2,000
                characters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. We are a Lusaka-based beauty studio. Our flagship treatment is the Hydra Glow Facial at K850. We offer loyalty points on every booking. Do not discuss competitor pricing."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                maxLength={2000}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customInstructions.length} / 2,000 characters
              </p>
            </CardContent>
          </Card>

          {/* Data sources */}
          <Card>
            <CardHeader>
              <CardTitle>Allowed Data Sources</CardTitle>
              <CardDescription>
                Which categories of data Chiko can access when answering client
                questions. Uncheck sources to restrict Chiko&apos;s scope.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DATA_SOURCE_OPTIONS.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`source-${opt.id}`}
                      checked={allowedSources.includes(opt.id)}
                      onCheckedChange={(checked) =>
                        toggleSource(opt.id, !!checked)
                      }
                    />
                    <Label htmlFor={`source-${opt.id}`} className="font-normal">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly quota */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Message Quota</CardTitle>
              <CardDescription>
                Maximum number of Ask Chiko messages allowed per month across
                all portal users on this site. Set to 0 for unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={100000}
                  step={100}
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-36"
                />
                <span className="text-sm text-muted-foreground">
                  messages / month
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
        {status === "success" && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Saved successfully
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}
