/**
 * Quote Accept Form Component
 *
 * Phase ECOM-12: Quote Workflow & Customer Portal
 *
 * Form for customer to accept a quote — includes delivery address collection
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CircleCheck, Eraser, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { acceptQuote } from "../../actions/quote-workflow-actions";
import { getCountryList } from "../../lib/settings-utils";
import type { Address } from "../../types/ecommerce-types";

// ============================================================================
// TYPES
// ============================================================================

interface QuoteAcceptFormProps {
  token: string;
  quoteName: string;
  verifiedEmail?: string;
  onAccepted: () => void;
  onCancel: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COUNTRIES = getCountryList();

const ZM_PROVINCES = [
  "Central",
  "Copperbelt",
  "Eastern",
  "Luapula",
  "Lusaka",
  "Muchinga",
  "Northern",
  "North-Western",
  "Southern",
  "Western",
];

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteAcceptForm({
  token,
  quoteName,
  verifiedEmail,
  onAccepted,
  onCancel,
}: QuoteAcceptFormProps) {
  const [loading, setLoading] = useState(false);
  const [acceptedBy, setAcceptedBy] = useState(quoteName);
  const [acceptedEmail, setAcceptedEmail] = useState(verifiedEmail || "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Address state
  const [noDelivery, setNoDelivery] = useState(false);
  const [address, setAddress] = useState<Partial<Address>>({
    first_name: quoteName?.split(" ")[0] || "",
    last_name: quoteName?.split(" ").slice(1).join(" ") || "",
    country: "ZM",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // Drawing handlers
  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x: number, y: number;

    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x: number, y: number;

    if ("touches" in e) {
      e.preventDefault();
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;

    isDrawing.current = false;

    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Form validation
  const addressValid =
    noDelivery ||
    (!!address.first_name?.trim() &&
      !!address.last_name?.trim() &&
      !!address.address_line_1?.trim() &&
      !!address.city?.trim() &&
      !!address.country?.trim());

  const isValid =
    acceptedBy.trim() !== "" &&
    acceptedEmail.trim() !== "" &&
    acceptedTerms &&
    signatureData !== null &&
    addressValid;

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Please complete all required fields");
      return;
    }

    setLoading(true);

    try {
      const result = await acceptQuote({
        token,
        accepted_by_name: acceptedBy.trim(),
        accepted_by_email: acceptedEmail.trim(),
        signature_data: signatureData || undefined,
        shipping_address: noDelivery
          ? undefined
          : {
              first_name: address.first_name?.trim() || "",
              last_name: address.last_name?.trim() || "",
              company: address.company?.trim() || "",
              address_line_1: address.address_line_1?.trim() || "",
              address_line_2: address.address_line_2?.trim() || "",
              city: address.city?.trim() || "",
              state: address.state?.trim() || "",
              postal_code: address.postal_code?.trim() || "",
              country: address.country || "ZM",
              phone: address.phone?.trim() || "",
            },
      });

      if (result.success) {
        toast.success("Quote accepted successfully!");
        onAccepted();
      } else {
        toast.error(result.error || "Failed to accept quote");
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-green-200 dark:border-green-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-300">
          <CircleCheck className="h-5 w-5" />
          Accept Quote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="acceptedBy">Your Name *</Label>
            <Input
              id="acceptedBy"
              value={acceptedBy}
              onChange={(e) => setAcceptedBy(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="acceptedEmail">Your Email *</Label>
            <div className="relative">
              <Input
                id="acceptedEmail"
                type="email"
                value={acceptedEmail}
                onChange={(e) => setAcceptedEmail(e.target.value)}
                placeholder="Enter your email"
                required
                readOnly={!!verifiedEmail}
                className={verifiedEmail ? "pr-24 bg-muted/50" : ""}
              />
              {verifiedEmail && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium flex items-center gap-1">
                  <CircleCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* ── Delivery Address Section ─────────────────────────── */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Delivery Address
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="noDelivery"
                  checked={noDelivery}
                  onCheckedChange={(checked) => setNoDelivery(checked === true)}
                />
                <Label
                  htmlFor="noDelivery"
                  className="text-sm font-normal cursor-pointer flex items-center gap-1"
                >
                  <Package className="h-3.5 w-3.5" />
                  No delivery needed (services only)
                </Label>
              </div>
            </div>

            {!noDelivery && (
              <div className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addr_first_name">First name *</Label>
                    <Input
                      id="addr_first_name"
                      value={address.first_name || ""}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          first_name: e.target.value,
                        }))
                      }
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr_last_name">Last name *</Label>
                    <Input
                      id="addr_last_name"
                      value={address.last_name || ""}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          last_name: e.target.value,
                        }))
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Company (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="addr_company">Company</Label>
                  <Input
                    id="addr_company"
                    value={address.company || ""}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, company: e.target.value }))
                    }
                    placeholder="Company name (optional)"
                  />
                </div>

                {/* Address line 1 */}
                <div className="space-y-2">
                  <Label htmlFor="addr_line1">Street address *</Label>
                  <Input
                    id="addr_line1"
                    value={address.address_line_1 || ""}
                    onChange={(e) =>
                      setAddress((a) => ({
                        ...a,
                        address_line_1: e.target.value,
                      }))
                    }
                    placeholder="123 Main St"
                  />
                </div>

                {/* Address line 2 */}
                <div className="space-y-2">
                  <Label htmlFor="addr_line2">Apartment, suite, etc.</Label>
                  <Input
                    id="addr_line2"
                    value={address.address_line_2 || ""}
                    onChange={(e) =>
                      setAddress((a) => ({
                        ...a,
                        address_line_2: e.target.value,
                      }))
                    }
                    placeholder="Apt 4B (optional)"
                  />
                </div>

                {/* City + State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addr_city">City *</Label>
                    <Input
                      id="addr_city"
                      value={address.city || ""}
                      onChange={(e) =>
                        setAddress((a) => ({ ...a, city: e.target.value }))
                      }
                      placeholder="Lusaka"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr_state">
                      {(address.country || "ZM") === "ZM"
                        ? "Province"
                        : "State / Province"}
                    </Label>
                    {(address.country || "ZM") === "ZM" ? (
                      <Select
                        value={address.state || ""}
                        onValueChange={(v) =>
                          setAddress((a) => ({ ...a, state: v }))
                        }
                      >
                        <SelectTrigger id="addr_state">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {ZM_PROVINCES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="addr_state"
                        value={address.state || ""}
                        onChange={(e) =>
                          setAddress((a) => ({ ...a, state: e.target.value }))
                        }
                        placeholder="State / Province"
                      />
                    )}
                  </div>
                </div>

                {/* Postal + Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addr_postal">Postal code</Label>
                    <Input
                      id="addr_postal"
                      value={address.postal_code || ""}
                      onChange={(e) =>
                        setAddress((a) => ({
                          ...a,
                          postal_code: e.target.value,
                        }))
                      }
                      placeholder="10101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr_country">Country *</Label>
                    <Select
                      value={address.country || "ZM"}
                      onValueChange={(v) =>
                        setAddress((a) => ({ ...a, country: v, state: "" }))
                      }
                    >
                      <SelectTrigger id="addr_country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="addr_phone">Phone</Label>
                  <Input
                    id="addr_phone"
                    type="tel"
                    value={address.phone || ""}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, phone: e.target.value }))
                    }
                    placeholder="+260 77 123 4567"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Signature Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Signature *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSignature}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden bg-white dark:bg-muted">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Please sign above using your mouse or touch screen
            </p>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="acceptedTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            />
            <Label
              htmlFor="acceptedTerms"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              I have read and agree to the terms and conditions. I understand
              that by accepting this quote, I am authorizing the work to
              proceed.
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={!isValid || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Accepting..." : "Accept & Authorize"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
