/**
 * Quote Email Verification Gate
 *
 * Shown before the quote portal. Customer must verify their email
 * to prove they are the intended recipient before viewing quote details.
 *
 * If the customer is already logged in to the storefront and their email
 * matches the quote recipient, auto-verifies without prompting.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, AlertCircle, FileText } from "lucide-react";
import { verifyQuoteAccess } from "../../actions/quote-portal-auth";

interface QuoteEmailGateProps {
  token: string;
  quoteNumber: string;
  /** Site ID — used to check for existing storefront login and auto-verify */
  siteId?: string;
}

export function QuoteEmailGate({ token, quoteNumber, siteId }: QuoteEmailGateProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoVerifying, setAutoVerifying] = useState(false);

  // Auto-verify if the customer is already logged into the storefront
  useEffect(() => {
    if (!siteId) return;

    const savedToken = localStorage.getItem(`dramac_customer_token_${siteId}`);
    if (!savedToken) return;

    setAutoVerifying(true);

    // Validate the session and get the customer email
    fetch(`${window.location.origin}/api/modules/ecommerce/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session", token: savedToken, siteId }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data?.customer?.email) {
          // Try to auto-verify with the customer's email
          const result = await verifyQuoteAccess(token, data.customer.email);
          if (result.success) {
            router.refresh();
            return;
          }
        }
        // Auto-verify failed — show the manual form
        setAutoVerifying(false);
      })
      .catch(() => {
        setAutoVerifying(false);
      });
  }, [siteId, token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyQuoteAccess(token, email.trim());

      if (result.success) {
        // Cookie is set server-side — refresh the page to re-render with portal
        router.refresh();
      } else {
        setError(result.error || "Verification failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {autoVerifying ? (
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Verifying your identity...</p>
          </CardContent>
        </Card>
      ) : (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Verify Your Identity</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            For your security, please enter the email address associated with
            this quote to view its details.
          </p>
        </CardHeader>

        <CardContent>
          {/* Quote Reference */}
          <div className="mb-6 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Quote Reference</p>
              <p className="font-medium">{quoteNumber}</p>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-email">Your Email Address</Label>
              <Input
                id="verify-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter the email this quote was sent to"
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify & View Quote
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            This is a one-time verification. You won&apos;t need to re-enter
            your email for 7 days on this device.
          </p>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
