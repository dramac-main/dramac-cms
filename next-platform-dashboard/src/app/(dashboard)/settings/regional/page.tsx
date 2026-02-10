/**
 * Regional Settings Page — Phase FIX-01 Task 5
 * 
 * Allows agency admins to configure currency, locale, timezone,
 * date format, tax rate, and unit preferences.
 */
"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Globe2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import {
  SUPPORTED_CURRENCIES,
  ALL_TIMEZONES,
  getCurrencySymbol,
  formatCurrency,
} from "@/lib/locale-config";

const LOCALE_OPTIONS = [
  { value: "en-ZM", label: "English (Zambia)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-ZA", label: "English (South Africa)" },
  { value: "en-KE", label: "English (Kenya)" },
  { value: "en-NG", label: "English (Nigeria)" },
  { value: "fr-CD", label: "French (DR Congo)" },
  { value: "pt-MZ", label: "Portuguese (Mozambique)" },
  { value: "sw-TZ", label: "Swahili (Tanzania)" },
];

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", example: "10/02/2026" },
  { value: "MM/DD/YYYY", example: "02/10/2026" },
  { value: "YYYY-MM-DD", example: "2026-02-10" },
];

interface RegionalSettings {
  default_currency: string;
  default_locale: string;
  default_timezone: string;
  date_format: string;
  tax_rate: number;
  tax_inclusive: boolean;
  weight_unit: string;
  dimension_unit: string;
}

export default function RegionalSettingsPage() {
  const [settings, setSettings] = useState<RegionalSettings>({
    default_currency: "ZMW",
    default_locale: "en-ZM",
    default_timezone: "Africa/Lusaka",
    date_format: "DD/MM/YYYY",
    tax_rate: 16,
    tax_inclusive: true,
    weight_unit: "kg",
    dimension_unit: "cm",
  });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get agency_id from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("agency_id")
          .eq("id", user.id)
          .single();

        if (!profile?.agency_id) return;

        const { data: agency } = await (supabase as any)
          .from("agencies")
          .select("default_currency, default_locale, default_timezone, date_format, tax_rate, tax_inclusive, weight_unit, dimension_unit")
          .eq("id", profile.agency_id)
          .single();

        if (agency) {
          setSettings({
            default_currency: agency.default_currency || "ZMW",
            default_locale: agency.default_locale || "en-ZM",
            default_timezone: agency.default_timezone || "Africa/Lusaka",
            date_format: agency.date_format || "DD/MM/YYYY",
            tax_rate: agency.tax_rate != null ? Number(agency.tax_rate) : 16,
            tax_inclusive: agency.tax_inclusive ?? true,
            weight_unit: agency.weight_unit || "kg",
            dimension_unit: agency.dimension_unit || "cm",
          });
        }
      } catch {
        // Use defaults if fetch fails
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave() {
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Not authenticated");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("agency_id")
          .eq("id", user.id)
          .single();

        if (!profile?.agency_id) {
          toast.error("No agency found");
          return;
        }

        const { error } = await (supabase as any)
          .from("agencies")
          .update({
            default_currency: settings.default_currency,
            default_locale: settings.default_locale,
            default_timezone: settings.default_timezone,
            date_format: settings.date_format,
            tax_rate: settings.tax_rate,
            tax_inclusive: settings.tax_inclusive,
            weight_unit: settings.weight_unit,
            dimension_unit: settings.dimension_unit,
          })
          .eq("id", profile.agency_id);

        if (error) throw error;

        const symbol = getCurrencySymbol(settings.default_currency);
        const preview = formatCurrency(1250, settings.default_currency, settings.default_locale);
        toast.success(`Regional settings saved! Preview: ${preview}`, {
          description: `Currency: ${settings.default_currency} (${symbol}) • Timezone: ${settings.default_timezone}`,
        });
      } catch (err) {
        toast.error("Failed to save settings");
        console.error(err);
      }
    });
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Globe2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Regional Settings</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const currencyPreview = formatCurrency(1250, settings.default_currency, settings.default_locale);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Globe2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Regional Settings</h1>
          <p className="text-muted-foreground">
            Configure currency, timezone, and locale for your agency. These settings apply globally.
          </p>
        </div>
      </div>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set your default currency for pricing and invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Currency</Label>
            <Select
              value={settings.default_currency}
              onValueChange={(v) => setSettings((s) => ({ ...s, default_currency: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name} ({c.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <span className="text-muted-foreground">Preview: </span>
            <span className="font-semibold">{currencyPreview}</span>
          </div>
        </CardContent>
      </Card>

      {/* Locale */}
      <Card>
        <CardHeader>
          <CardTitle>Locale</CardTitle>
          <CardDescription>Controls number and date formatting</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.default_locale}
            onValueChange={(v) => setSettings((s) => ({ ...s, default_locale: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALE_OPTIONS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.value} — {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>Used for scheduling and date display</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.default_timezone}
            onValueChange={(v) => setSettings((s) => ({ ...s, default_timezone: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Date Format */}
      <Card>
        <CardHeader>
          <CardTitle>Date Format</CardTitle>
          <CardDescription>Choose how dates are displayed</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.date_format}
            onValueChange={(v) => setSettings((s) => ({ ...s, date_format: v }))}
            className="space-y-2"
          >
            {DATE_FORMAT_OPTIONS.map((fmt) => (
              <div key={fmt.value} className="flex items-center gap-3">
                <RadioGroupItem value={fmt.value} id={fmt.value} />
                <Label htmlFor={fmt.value} className="font-normal cursor-pointer">
                  {fmt.value} <span className="text-muted-foreground">({fmt.example})</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Tax */}
      <Card>
        <CardHeader>
          <CardTitle>Tax</CardTitle>
          <CardDescription>Default tax settings for products and services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <Label>Default Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.tax_rate}
                onChange={(e) => setSettings((s) => ({ ...s, tax_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tax-inclusive">Prices include tax</Label>
            <Switch
              id="tax-inclusive"
              checked={settings.tax_inclusive}
              onCheckedChange={(checked) => setSettings((s) => ({ ...s, tax_inclusive: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Units */}
      <Card>
        <CardHeader>
          <CardTitle>Units</CardTitle>
          <CardDescription>Weight and dimension units for products</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Weight</Label>
            <Select
              value={settings.weight_unit}
              onValueChange={(v) => setSettings((s) => ({ ...s, weight_unit: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lb">Pounds (lb)</SelectItem>
                <SelectItem value="g">Grams (g)</SelectItem>
                <SelectItem value="oz">Ounces (oz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dimensions</Label>
            <Select
              value={settings.dimension_unit}
              onValueChange={(v) => setSettings((s) => ({ ...s, dimension_unit: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
                <SelectItem value="ft">Feet (ft)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
