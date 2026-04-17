"use client";

import { useState, useEffect } from "react";
import type { InvoicingSettings, TaxRate } from "../types";
import {
  getInvoicingSettings,
  updateInvoicingSettings,
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getAutoPopulateData,
  uploadInvoiceLogo,
} from "../actions/settings-actions";
import type { CreateTaxRateInput } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, Wand2, Info, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { CurrencySelector } from "./currency-selector";

interface InvoicingSettingsFormProps {
  siteId: string;
}

export function InvoicingSettingsForm({ siteId }: InvoicingSettingsFormProps) {
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Editable fields
  const [form, setForm] = useState({
    invoicePrefix: "INV",
    invoiceNumberFormat: "{prefix}-{year}-{number}",
    invoicePadding: 4,
    defaultCurrency: "ZMW",
    defaultPaymentTermsDays: 30,
    defaultPaymentTermsLabel: "Net 30",
    defaultNotes: "",
    defaultTerms: "",
    lateFeeEnabled: false,
    lateFeeType: "percentage" as "percentage" | "fixed",
    lateFeeAmount: 0,
    lateFeeGraceDays: 0,
    overdueReminderEnabled: false,
    companyName: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
    companyTaxId: "",
    brandColor: "#000000",
    brandLogoUrl: "",
    paymentInstructions: "",
    timezone: "Africa/Lusaka",
  });

  // Tax rate creation
  const [newTax, setNewTax] = useState({
    name: "",
    rate: "",
    isCompound: false,
    isDefault: false,
  });
  const [addingTax, setAddingTax] = useState(false);

  useEffect(() => {
    Promise.all([getInvoicingSettings(siteId), getTaxRates(siteId)])
      .then(([s, rates]) => {
        if (s) {
          setSettings(s);
          setForm({
            invoicePrefix: s.invoicePrefix,
            invoiceNumberFormat: s.invoiceNumberFormat,
            invoicePadding: s.invoicePadding,
            defaultCurrency: s.defaultCurrency,
            defaultPaymentTermsDays: s.defaultPaymentTermsDays,
            defaultPaymentTermsLabel: s.defaultPaymentTermsLabel,
            defaultNotes: s.defaultNotes ?? "",
            defaultTerms: s.defaultTerms ?? "",
            lateFeeEnabled: s.lateFeeEnabled,
            lateFeeType: s.lateFeeType,
            lateFeeAmount: s.lateFeeAmount,
            lateFeeGraceDays: s.lateFeeGraceDays,
            overdueReminderEnabled: s.overdueReminderEnabled,
            companyName: s.companyName ?? "",
            companyAddress: s.companyAddress ?? "",
            companyPhone: s.companyPhone ?? "",
            companyEmail: s.companyEmail ?? "",
            companyWebsite: s.companyWebsite ?? "",
            companyTaxId: s.companyTaxId ?? "",
            brandColor: s.brandColor,
            brandLogoUrl: s.brandLogoUrl ?? "",
            paymentInstructions: s.paymentInstructions ?? "",
            timezone: s.timezone,
          });
        }
        setTaxRates(rates);
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleAutoPopulate = async () => {
    setAutoPopulating(true);
    try {
      const data = await getAutoPopulateData(siteId);
      if (!data) {
        toast.error("Could not load site branding data");
        return;
      }
      setForm((prev) => ({
        ...prev,
        companyName: prev.companyName || data.companyName,
        companyEmail: prev.companyEmail || data.companyEmail,
        companyPhone: prev.companyPhone || data.companyPhone,
        companyWebsite: prev.companyWebsite || data.companyWebsite,
        companyAddress: prev.companyAddress || data.companyAddress,
        companyTaxId: prev.companyTaxId || data.companyTaxId,
        brandColor:
          prev.brandColor === "#000000" && data.brandColor !== "#000000"
            ? data.brandColor
            : prev.brandColor,
        brandLogoUrl: prev.brandLogoUrl || data.brandLogoUrl,
      }));
      toast.success("Populated empty fields from site branding");
    } catch {
      toast.error("Failed to auto-populate");
    } finally {
      setAutoPopulating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("siteId", siteId);
      const result = await uploadInvoiceLogo(fd);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        setForm((prev) => ({ ...prev, brandLogoUrl: result.url! }));
        toast.success("Logo uploaded");
      }
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const result = await updateInvoicingSettings(siteId, {
        invoicePrefix: form.invoicePrefix,
        invoiceNumberFormat: form.invoiceNumberFormat,
        invoicePadding: form.invoicePadding,
        defaultCurrency: form.defaultCurrency,
        defaultPaymentTermsDays: form.defaultPaymentTermsDays,
        defaultPaymentTermsLabel: form.defaultPaymentTermsLabel,
        defaultNotes: form.defaultNotes || null,
        defaultTerms: form.defaultTerms || null,
        lateFeeEnabled: form.lateFeeEnabled,
        lateFeeType: form.lateFeeType,
        lateFeeAmount: form.lateFeeAmount,
        lateFeeGraceDays: form.lateFeeGraceDays,
        overdueReminderEnabled: form.overdueReminderEnabled,
        companyName: form.companyName || null,
        companyAddress: form.companyAddress || null,
        companyPhone: form.companyPhone || null,
        companyEmail: form.companyEmail || null,
        companyWebsite: form.companyWebsite || null,
        companyTaxId: form.companyTaxId || null,
        brandColor: form.brandColor,
        brandLogoUrl: form.brandLogoUrl || null,
        paymentInstructions: form.paymentInstructions || null,
        timezone: form.timezone,
      });
      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.error ?? "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTaxRate = async () => {
    if (!newTax.name || !newTax.rate) return;
    setAddingTax(true);
    try {
      const input: CreateTaxRateInput = {
        name: newTax.name,
        rate: parseFloat(newTax.rate),
        isCompound: newTax.isCompound,
        isDefault: newTax.isDefault,
      };
      const rate = await createTaxRate(siteId, input);
      if (rate) {
        setTaxRates((prev) => [...prev, rate]);
        setNewTax({ name: "", rate: "", isCompound: false, isDefault: false });
        toast.success("Tax rate created");
      }
    } catch {
      toast.error("Failed to create tax rate");
    } finally {
      setAddingTax(false);
    }
  };

  const handleDeleteTaxRate = async (taxRateId: string) => {
    try {
      await deleteTaxRate(siteId, taxRateId);
      setTaxRates((prev) => prev.filter((t) => t.id !== taxRateId));
      toast.success("Tax rate deleted");
    } catch {
      toast.error("Failed to delete tax rate");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure invoicing preferences, branding, and tax rates.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="tax">Tax Rates</TabsTrigger>
          <TabsTrigger value="late-fees">Late Fees</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Numbering</CardTitle>
              <CardDescription>
                Configure how invoice numbers are generated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="prefix">Prefix</Label>
                  <Input
                    id="prefix"
                    value={form.invoicePrefix}
                    onChange={(e) =>
                      setForm({ ...form, invoicePrefix: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="padding">Number Padding</Label>
                  <Input
                    id="padding"
                    type="number"
                    min={1}
                    max={10}
                    value={form.invoicePadding}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        invoicePadding: parseInt(e.target.value) || 4,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="format">Number Format</Label>
                <Input
                  id="format"
                  value={form.invoiceNumberFormat}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumberFormat: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tokens: {"{prefix}"}, {"{year}"}, {"{number}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <CurrencySelector
                    value={form.defaultCurrency}
                    onValueChange={(v) =>
                      setForm({ ...form, defaultCurrency: v })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="terms-days">Payment Terms (days)</Label>
                  <Input
                    id="terms-days"
                    type="number"
                    min={0}
                    value={form.defaultPaymentTermsDays}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        defaultPaymentTermsDays: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="terms-label">Payment Terms Label</Label>
                <Input
                  id="terms-label"
                  value={form.defaultPaymentTermsLabel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      defaultPaymentTermsLabel: e.target.value,
                    })
                  }
                  placeholder="e.g., Net 30"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) =>
                    setForm({ ...form, timezone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="default-notes">Default Notes</Label>
                <Textarea
                  id="default-notes"
                  value={form.defaultNotes}
                  onChange={(e) =>
                    setForm({ ...form, defaultNotes: e.target.value })
                  }
                  placeholder="Appears on every new invoice"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="default-terms">Default Terms</Label>
                <Textarea
                  id="default-terms"
                  value={form.defaultTerms}
                  onChange={(e) =>
                    setForm({ ...form, defaultTerms: e.target.value })
                  }
                  placeholder="Default terms and conditions"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="payment-instructions">
                  Payment Instructions
                </Label>
                <Textarea
                  id="payment-instructions"
                  value={form.paymentInstructions}
                  onChange={(e) =>
                    setForm({ ...form, paymentInstructions: e.target.value })
                  }
                  placeholder="Bank details, payment methods, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Company details can be auto-filled from your site branding
              settings. Only empty fields will be updated.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Appears on invoices sent to clients.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoPopulate}
                  disabled={autoPopulating}
                >
                  {autoPopulating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Auto-populate
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={form.companyEmail}
                    onChange={(e) =>
                      setForm({ ...form, companyEmail: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="company-phone">Phone</Label>
                  <Input
                    id="company-phone"
                    value={form.companyPhone}
                    onChange={(e) =>
                      setForm({ ...form, companyPhone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="company-website">Website</Label>
                  <Input
                    id="company-website"
                    value={form.companyWebsite}
                    onChange={(e) =>
                      setForm({ ...form, companyWebsite: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company-address">Address</Label>
                <Textarea
                  id="company-address"
                  value={form.companyAddress}
                  onChange={(e) =>
                    setForm({ ...form, companyAddress: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="company-tax-id">Tax ID / Registration #</Label>
                <Input
                  id="company-tax-id"
                  value={form.companyTaxId}
                  onChange={(e) =>
                    setForm({ ...form, companyTaxId: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4 mt-1">
                  {form.brandLogoUrl ? (
                    <img
                      src={form.brandLogoUrl}
                      alt="Invoice logo"
                      className="h-12 w-auto max-w-[120px] rounded border object-contain"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded border border-dashed flex items-center justify-center text-muted-foreground">
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <Label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        asChild
                      >
                        <span>
                          {uploadingLogo ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-3 w-3" />
                          )}
                          {form.brandLogoUrl ? "Change" : "Upload"}
                        </span>
                      </Button>
                    </Label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP or SVG. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="brand-color">Brand Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="brand-color"
                    type="color"
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm({ ...form, brandColor: e.target.value })
                    }
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.brandColor}
                    onChange={(e) =>
                      setForm({ ...form, brandColor: e.target.value })
                    }
                    className="w-28"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Rates Tab */}
        <TabsContent value="tax" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax Rates</CardTitle>
              <CardDescription>
                Define tax rates to apply to invoice line items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRates.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          No tax rates configured yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {taxRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell className="font-medium">
                          {rate.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {rate.rate}%
                        </TableCell>
                        <TableCell>
                          {rate.isCompound ? (
                            <Badge variant="outline">Compound</Badge>
                          ) : (
                            <Badge variant="secondary">Simple</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rate.isDefault && <Badge>Default</Badge>}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete tax rate?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will deactivate the &quot;{rate.name}
                                  &quot; tax rate. Existing invoices using this
                                  rate will not be affected.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTaxRate(rate.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />

              {/* Add new tax rate */}
              <div className="grid gap-3 sm:grid-cols-5 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newTax.name}
                    onChange={(e) =>
                      setNewTax({ ...newTax, name: e.target.value })
                    }
                    placeholder="e.g., VAT"
                  />
                </div>
                <div>
                  <Label>Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTax.rate}
                    onChange={(e) =>
                      setNewTax({ ...newTax, rate: e.target.value })
                    }
                    placeholder="16"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTax.isCompound}
                    onCheckedChange={(v) =>
                      setNewTax({ ...newTax, isCompound: v })
                    }
                  />
                  <Label>Compound</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newTax.isDefault}
                    onCheckedChange={(v) =>
                      setNewTax({ ...newTax, isDefault: v })
                    }
                  />
                  <Label>Default</Label>
                </div>
                <Button
                  onClick={handleAddTaxRate}
                  disabled={addingTax || !newTax.name || !newTax.rate}
                >
                  {addingTax ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1.5" />
                  )}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Late Fees Tab */}
        <TabsContent value="late-fees" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Late Fees</CardTitle>
              <CardDescription>
                Automatically apply late fees to overdue invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.lateFeeEnabled}
                  onCheckedChange={(v) =>
                    setForm({ ...form, lateFeeEnabled: v })
                  }
                />
                <Label>Enable late fees</Label>
              </div>
              {form.lateFeeEnabled && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label>Fee Type</Label>
                    <Select
                      value={form.lateFeeType}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          lateFeeType: v as "percentage" | "fixed",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Amount{" "}
                      {form.lateFeeType === "percentage" ? "(%)" : "(cents)"}
                    </Label>
                    <Input
                      type="number"
                      value={form.lateFeeAmount}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lateFeeAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Grace Period (days)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.lateFeeGraceDays}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lateFeeGraceDays: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.overdueReminderEnabled}
                  onCheckedChange={(v) =>
                    setForm({ ...form, overdueReminderEnabled: v })
                  }
                />
                <Label>Enable overdue reminders</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
