"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Vendor, CreateVendorInput } from "../types";
import { createVendor, updateVendor, getVendor } from "../actions/vendor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface VendorFormProps {
  siteId: string;
  vendorId?: string;
}

export function VendorForm({ siteId, vendorId }: VendorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!!vendorId);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("ZM");
  const [currency, setCurrencyState] = useState("ZMW");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankBranchCode, setBankBranchCode] = useState("");
  const [notes, setNotes] = useState("");

  // Load vendor for edit mode
  useEffect(() => {
    if (!vendorId) return;
    getVendor(vendorId).then((v) => {
      setVendor(v);
      setName(v.name || "");
      setEmail(v.email || "");
      setPhone(v.phone || "");
      setWebsite(v.website || "");
      setTaxId(v.taxId || "");
      setAddress(v.address || "");
      setCity(v.city || "");
      setState(v.state || "");
      setPostalCode(v.postalCode || "");
      setCountry(v.country || "ZM");
      setCurrencyState(v.currency || "ZMW");
      setPaymentTermsDays(String(v.paymentTermsDays || 30));
      setBankName(v.bankName || "");
      setBankAccountNumber(v.bankAccountNumber || "");
      setBankBranchCode(v.bankBranchCode || "");
      setNotes(v.notes || "");
      setLoading(false);
    });
  }, [vendorId]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    const input: CreateVendorInput = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      website: website.trim() || undefined,
      taxId: taxId.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      country: country || undefined,
      currency,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankBranchCode: bankBranchCode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (!vendorId) {
          const created = await createVendor(siteId, input);
          toast.success(`Vendor "${created.name}" created`);
          router.push(
            `/dashboard/sites/${siteId}/invoicing/vendors/${created.id}`,
          );
        } else {
          await updateVendor(vendorId, input);
          toast.success("Vendor updated");
          router.push(
            `/dashboard/sites/${siteId}/invoicing/vendors/${vendorId}`,
          );
        }
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to save vendor");
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/sites/${siteId}/invoicing/vendors`}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Vendors
        </Link>
      </Button>

      <h2 className="text-xl font-semibold">
        {!vendorId ? "New Vendor" : `Edit ${vendor?.name || "Vendor"}`}
      </h2>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vendor or contact name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+260..."
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID / TPIN</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="TPIN"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Street Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lusaka"
              />
            </div>
            <div>
              <Label htmlFor="state">Province / State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Lusaka"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="10101"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="ZM"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Banking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment & Banking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select value={currency} onValueChange={setCurrencyState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ZMW">ZMW - Zambian Kwacha</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentTerms">Default Payment Terms</Label>
              <Select
                value={paymentTermsDays}
                onValueChange={setPaymentTermsDays}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Due on Receipt</SelectItem>
                  <SelectItem value="7">Net 7</SelectItem>
                  <SelectItem value="14">Net 14</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="60">Net 60</SelectItem>
                  <SelectItem value="90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank name"
              />
            </div>
            <div>
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Account number"
              />
            </div>
            <div>
              <Label htmlFor="bankBranchCode">Branch Code</Label>
              <Input
                id="bankBranchCode"
                value={bankBranchCode}
                onChange={(e) => setBankBranchCode(e.target.value)}
                placeholder="Branch / sort code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes about this vendor"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/vendors`}>
            Cancel
          </Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          {!vendorId ? "Create Vendor" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
