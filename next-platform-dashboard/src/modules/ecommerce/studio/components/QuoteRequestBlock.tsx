/**
 * QuoteRequestBlock - Quote request form
 *
 * Phase ECOM-25: Quotation Frontend
 *
 * Form for customers to submit quote requests.
 */
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Loader2,
  CircleCheck,
  ShoppingBag,
  AlertCircle,
  Download,
  MessageCircle,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useStorefront } from "../../context/storefront-context";
import { useStorefrontAuth } from "../../context/storefront-auth-context";
import { useStorefrontCart } from "../../hooks/useStorefrontCart";
import {
  useQuotations,
  QuoteBuilderItem,
  QuoteRequestData,
} from "../../hooks/useQuotations";
import { QuoteItemCard } from "./QuoteItemCard";
import { QuotePriceBreakdown } from "./QuotePriceBreakdown";
import { getImageUrl } from "../../lib/image-utils";
import { downloadQuotePDF } from "../../lib/quote-pdf-generator";
import type { QuotePDFOptions } from "../../lib/quote-pdf-generator";
import { getQuotePDFBranding } from "../../actions/quote-template-actions";
import type { Quote, QuoteItem } from "../../types/ecommerce-types";
import Link from "next/link";

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteRequestBlockProps {
  /** Display variant */
  variant?: "default" | "compact" | "sidebar";
  /** Pre-filled customer info */
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  companyName?: string;
  /** Show item management in form */
  showItems?: boolean;
  /** Show pricing summary */
  showPricing?: boolean;
  /** Required fields */
  requirePhone?: boolean;
  requireCompany?: boolean;
  /** Success callback */
  onSuccess?: (quoteId: string) => void;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  className?: string;
}

// ============================================================================
// ACCOUNT NUDGE (shown after quote submission for guest users)
// ============================================================================

function QuoteAccountNudge({
  email,
  siteId,
  setPassword,
  sendVerificationCode,
  verifyEmailCode,
  openAuthDialog,
}: {
  email: string;
  siteId: string;
  setPassword: (
    password: string,
    email?: string,
    verificationToken?: string,
  ) => Promise<{ error: string | null }>;
  sendVerificationCode: (email: string) => Promise<{ error: string | null }>;
  verifyEmailCode: (
    email: string,
    code: string,
  ) => Promise<{ error: string | null; verificationToken?: string }>;
  openAuthDialog?: (mode?: "login" | "register" | "set-password") => void;
}) {
  const [step, setStep] = React.useState<
    "send" | "verify" | "password" | "done"
  >("send");
  const [code, setCode] = React.useState("");
  const [verificationToken, setVerificationToken] = React.useState("");
  const [password, setPass] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    setLoading(true);
    setError("");
    const result = await sendVerificationCode(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep("verify");
      setCooldown(60);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    const result = await verifyEmailCode(email, code);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.verificationToken) {
      setVerificationToken(result.verificationToken);
      setStep("password");
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError("");
    const result = await setPassword(password, email, verificationToken);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep("done");
    }
  };

  if (step === "done") {
    return (
      <div className="mt-5 rounded-lg border border-success/30 bg-success/5 p-4 text-left">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">
              Account created!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You&apos;re now signed in as <strong>{email}</strong>. Your quotes
              will be linked to your account automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 text-left rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-1.5 flex-shrink-0 mt-0.5">
          <Mail className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm">
            Create an account to track your quotes
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Verify <strong>{email}</strong> to create your account and sign in
            anytime to view your quotes, orders, and more.
          </p>

          {/* Step 1: Send verification code */}
          {step === "send" && (
            <div className="space-y-2 max-w-sm">
              <Button
                type="button"
                size="sm"
                onClick={handleSendCode}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send Verification Code
              </Button>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}

          {/* Step 2: Enter verification code */}
          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-2 max-w-sm">
              <p className="text-xs text-muted-foreground">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(v);
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground tracking-widest text-center font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                maxLength={6}
                required
                autoComplete="one-time-code"
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center gap-3">
                <Button type="submit" size="sm" disabled={loading}>
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Verify
                </Button>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || cooldown > 0}
                  className="text-xs text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Set password */}
          {step === "password" && (
            <form
              onSubmit={handleSetPassword}
              className="space-y-2 max-w-sm"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-success font-medium">
                  Email verified
                </span>
              </div>
              <input
                type="password"
                placeholder="Create a password (min 8 chars)"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                minLength={8}
                required
                autoComplete="new-password"
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                minLength={8}
                required
                autoComplete="new-password"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={loading}>
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Create Account
              </Button>
            </form>
          )}

          {openAuthDialog && (
            <p className="text-xs text-muted-foreground mt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => openAuthDialog("login")}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuoteRequestBlock({
  variant: variantProp = "default",
  customerName: initialName = "",
  customerEmail: initialEmail = "",
  customerPhone: initialPhone = "",
  companyName: initialCompany = "",
  showItems = true,
  showPricing = true,
  requirePhone = false,
  requireCompany = false,
  onSuccess,
  title = "Submit Your Quote",
  description = "Review your quote items below and fill in your details to receive a customized quote.",
  className,
}: QuoteRequestBlockProps) {
  const {
    siteId,
    formatPrice,
    settings,
    quotationModeEnabled,
    quotationHidePrices,
    taxRate,
    isInitialized,
  } = useStorefront();
  const auth = useStorefrontAuth();
  const agencyId = settings?.agency_id;
  const searchParams = useSearchParams();

  // When hide prices is on, override showPricing to false
  const effectiveHidePrices = quotationHidePrices;
  const effectiveShowPricing = showPricing && !effectiveHidePrices;

  // Cart integration — items may be in the cart (from "Add to Quote" buttons)
  const {
    items: cartItems,
    clearCart,
    isLoading: isCartLoading,
  } = useStorefrontCart(siteId, undefined, taxRate);

  // Move hooks before conditional returns to satisfy React rules of hooks
  const {
    builderItems,
    addToBuilder,
    updateBuilderItem,
    removeFromBuilder,
    builderCount,
    submitQuoteRequest,
    isSubmitting,
    submitError,
  } = useQuotations(siteId, agencyId);

  const [formData, setFormData] = React.useState<QuoteRequestData>({
    customer_name: initialName,
    customer_email: initialEmail,
    customer_phone: initialPhone,
    company_name: initialCompany,
    notes: "",
  });

  // Auto-fill form from logged-in customer data
  React.useEffect(() => {
    if (!auth.isLoggedIn || !auth.customer) return;
    setFormData((prev) => ({
      ...prev,
      customer_name:
        prev.customer_name ||
        [auth.customer!.firstName, auth.customer!.lastName]
          .filter(Boolean)
          .join(" "),
      customer_email: prev.customer_email || auth.customer!.email,
      customer_phone: prev.customer_phone || auth.customer!.phone || "",
    }));
  }, [auth.isLoggedIn, auth.customer]);

  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<
    Partial<Record<keyof QuoteRequestData, string>>
  >({});
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);
  const [cartItemsLoaded, setCartItemsLoaded] = React.useState(false);

  // Auto-populate builder from cart items (quotation mode uses the cart as a quote builder)
  React.useEffect(() => {
    if (cartItemsLoaded || isCartLoading || !quotationModeEnabled) return;
    if (!cartItems || cartItems.length === 0) return;
    if (builderItems.length > 0) return; // Already has items

    for (const item of cartItems) {
      addToBuilder({
        product_id: item.product_id,
        product_name: item.product?.name || "Product",
        product_image: getImageUrl(item.product?.images?.[0]) || undefined,
        list_price: item.unit_price,
        quantity: item.quantity,
      });
    }
    setCartItemsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cartItems,
    isCartLoading,
    quotationModeEnabled,
    cartItemsLoaded,
    builderItems.length,
  ]);

  // Auto-load product from ?product= URL parameter
  const productIdParam = searchParams?.get("product");
  React.useEffect(() => {
    if (!productIdParam || !siteId || !quotationModeEnabled) return;
    // Don't re-add if already in builder
    if (builderItems.some((item) => item.product_id === productIdParam)) return;

    let cancelled = false;
    setIsLoadingProduct(true);
    (async () => {
      try {
        const { getPublicProduct } =
          await import("../../actions/public-ecommerce-actions");
        const product = await getPublicProduct(siteId, productIdParam);
        if (cancelled || !product) return;
        addToBuilder({
          product_id: product.id,
          product_name: product.name,
          product_image: getImageUrl(product.images?.[0]) || undefined,
          list_price: product.base_price,
          quantity: 1,
        });
      } catch (err) {
        console.error(
          "[QuoteRequestBlock] Failed to load product from URL:",
          err,
        );
      } finally {
        if (!cancelled) setIsLoadingProduct(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIdParam, siteId, quotationModeEnabled]);

  // Guard: If quotation mode is not enabled, don't show the quote form
  if (isInitialized && !quotationModeEnabled) {
    return (
      <Card className={cn("text-center", className)}>
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Quotations Not Available
          </h3>
          <p className="mt-2 text-muted-foreground">
            This store does not currently accept quote requests. Please browse
            our products and purchase directly.
          </p>
          <Link href="/shop">
            <Button className="mt-4" variant="default">
              <ShoppingBag className="mr-2 h-4 w-4" /> Browse Shop
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const variant = variantProp || "default";

  // Update field
  const updateField = (field: keyof QuoteRequestData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const errors: Partial<Record<keyof QuoteRequestData, string>> = {};

    if (!formData.customer_name.trim()) {
      errors.customer_name = "Name is required";
    }

    if (!formData.customer_email.trim()) {
      errors.customer_email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      errors.customer_email = "Invalid email address";
    }

    if (requirePhone && !formData.customer_phone?.trim()) {
      errors.customer_phone = "Phone number is required";
    }

    if (requireCompany && !formData.company_name?.trim()) {
      errors.company_name = "Company name is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const [submittedQuote, setSubmittedQuote] = React.useState<Quote | null>(
    null,
  );
  const chatAutoOpenedRef = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Snapshot builder items before submission (for PDF download later)
    const snapshotItems = [...builderItems];
    const result = await submitQuoteRequest(formData);

    if (result) {
      // Attach items to the quote for PDF download
      // NOTE: list_price/requested_price are in CENTS (from cart/product base_price).
      // Quote items store in main currency unit, so divide by 100.
      const mappedItems = snapshotItems.map((item, idx) => {
        const unitPrice = (item.requested_price || item.list_price) / 100;
        return {
          id: `temp-${idx}`,
          quote_id: result.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          name: item.product_name,
          description: null,
          image_url: item.product_image || null,
          sku: null,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount_percent: 0,
          tax_rate: 0,
          line_total: unitPrice * item.quantity,
          options: {},
          sort_order: idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      const quoteWithItems: Quote = {
        ...result,
        items: mappedItems as QuoteItem[],
      };
      setSubmittedQuote(quoteWithItems);
      setIsSubmitted(true);

      // Sync phone back to customer profile if logged in and phone was provided
      if (auth.isLoggedIn && auth.customer && formData.customer_phone?.trim()) {
        const needsPhoneUpdate =
          !auth.customer.phone && formData.customer_phone.trim();
        const needsNameUpdate =
          !auth.customer.firstName && formData.customer_name.trim();
        if (needsPhoneUpdate || needsNameUpdate) {
          const nameParts = formData.customer_name.trim().split(/\s+/);
          fetch(`/api/modules/ecommerce/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update-profile",
              token: auth.token,
              siteId,
              ...(needsPhoneUpdate
                ? { phone: formData.customer_phone.trim() }
                : {}),
              ...(needsNameUpdate
                ? {
                    firstName: nameParts[0],
                    lastName: nameParts.slice(1).join(" "),
                  }
                : {}),
            }),
          }).catch(() => {
            /* best effort */
          });
        }
      }

      // Clear cart items since they've been converted to a quote
      if (cartItems && cartItems.length > 0) {
        try {
          await clearCart();
        } catch {
          /* best effort */
        }
      }
      onSuccess?.(result.id);
    }
  };

  // Auto-open chat widget after quote submission (same pattern as OrderConfirmation)
  React.useEffect(() => {
    if (!isSubmitted || !submittedQuote || chatAutoOpenedRef.current) return;
    chatAutoOpenedRef.current = true;

    const timer = setTimeout(() => {
      window.postMessage(
        {
          type: "dramac-chat-open",
          quoteContext: {
            quoteNumber: submittedQuote.quote_number,
            itemCount: submittedQuote.items?.length || 0,
            email: formData.customer_email,
          },
        },
        window.location.origin,
      );
    }, 2000); // 2s delay so user can see the confirmation first
    return () => clearTimeout(timer);
  }, [isSubmitted, submittedQuote, formData.customer_email]);

  // Success state
  if (isSubmitted) {
    const handleDownloadQuote = async () => {
      if (!submittedQuote) return;
      let branding: QuotePDFOptions = {
        documentType: "quote",
        hidePricing: true,
      };
      if (siteId && agencyId) {
        try {
          branding = {
            ...(await getQuotePDFBranding(siteId, agencyId)),
            documentType: "quote",
            hidePricing: true,
          };
        } catch {
          // Fallback to store name only
          branding = {
            documentType: "quote",
            companyName: settings?.store_name || undefined,
            hidePricing: true,
          };
        }
      }
      downloadQuotePDF(submittedQuote, branding);
    };

    const handleOpenChat = () => {
      window.postMessage(
        {
          type: "dramac-chat-open",
          quoteContext: {
            quoteNumber: submittedQuote?.quote_number || "",
            itemCount: submittedQuote?.items?.length || 0,
            email: formData.customer_email,
          },
        },
        window.location.origin,
      );
    };

    return (
      <Card className={cn("text-center", className)}>
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CircleCheck className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Quote Request Submitted!
          </h3>
          <p className="mt-2 text-muted-foreground">
            We&apos;ve received your request and will send your quote to{" "}
            <strong>{formData.customer_email}</strong> shortly.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ll use this email to securely view and respond to your
            quote when it&apos;s ready.
          </p>
          {submittedQuote?.quote_number && (
            <p className="mt-1 text-sm text-muted-foreground">
              Reference: <strong>{submittedQuote.quote_number}</strong>
            </p>
          )}

          {/* What happens next */}
          <div className="mt-5 text-left bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">What happens next:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Our team reviews your request</li>
              <li>We prepare a detailed quote with pricing</li>
              <li>
                You&apos;ll receive an email with a link to view your quote
              </li>
              <li>
                Click the link and enter your email to verify it&apos;s you
              </li>
              <li>Accept, request changes, or decline — all online</li>
            </ol>
          </div>

          {/* Account creation card for guest users */}
          {!auth.isLoggedIn && formData.customer_email && (
            <QuoteAccountNudge
              email={formData.customer_email}
              siteId={siteId}
              setPassword={auth.setPassword}
              sendVerificationCode={auth.sendVerificationCode}
              verifyEmailCode={auth.verifyEmailCode}
              openAuthDialog={auth.openAuthDialog}
            />
          )}

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {submittedQuote?.access_token && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  window.open(
                    `${window.location.origin}/quote/${submittedQuote.access_token}`,
                    "_blank",
                  );
                }}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Track Your Quote
              </Button>
            )}
            {submittedQuote && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQuote}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Request Summary
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenChat}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Chat With Us
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading product from URL or cart
  if (isLoadingProduct || (isCartLoading && builderCount === 0)) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">
              Loading quote items...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No items warning
  if (builderCount === 0 && showItems) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No Items Selected
            </h3>
            <p className="mt-2 text-muted-foreground">
              Add products to your quote request before submitting.
            </p>
            <Link href="/shop">
              <Button className="mt-4" variant="outline">
                <ShoppingBag className="mr-2 h-4 w-4" /> Browse Products
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              placeholder="Your Name *"
              value={formData.customer_name}
              onChange={(e) => updateField("customer_name", e.target.value)}
              className={
                validationErrors.customer_name ? "border-destructive" : ""
              }
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email *"
              value={formData.customer_email}
              onChange={(e) => updateField("customer_email", e.target.value)}
              className={
                validationErrors.customer_email ? "border-destructive" : ""
              }
            />
          </div>
        </div>

        <Textarea
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={2}
        />

        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" /> Submit Quote Request
            </>
          )}
        </Button>
      </form>
    );
  }

  // Sidebar variant
  if (variant === "sidebar") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {effectiveShowPricing && (
            <QuotePriceBreakdown
              builderItems={builderItems}
              formatPrice={formatPrice}
              variant="compact"
            />
          )}

          <form
            id="quote-form-sidebar"
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <Input
              placeholder="Your Name *"
              value={formData.customer_name}
              onChange={(e) => updateField("customer_name", e.target.value)}
              className={
                validationErrors.customer_name ? "border-destructive" : ""
              }
            />
            <Input
              type="email"
              placeholder="Email *"
              value={formData.customer_email}
              onChange={(e) => updateField("customer_email", e.target.value)}
              className={
                validationErrors.customer_email ? "border-destructive" : ""
              }
            />
            <Textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={2}
            />
          </form>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            form="quote-form-sidebar"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Request Quote
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form id="quote-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Items section */}
          {showItems && builderItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">
                Items ({builderCount})
              </h4>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {builderItems.map((item) => (
                  <QuoteItemCard
                    key={`${item.product_id}-${item.variant_id || ""}`}
                    builderItem={item}
                    variant="editable"
                    formatPrice={formatPrice}
                    onQuantityChange={(qty) =>
                      updateBuilderItem(item.product_id, { quantity: qty })
                    }
                    onNotesChange={(notes) =>
                      updateBuilderItem(item.product_id, { notes })
                    }
                    onRequestedPriceChange={(price) =>
                      updateBuilderItem(item.product_id, {
                        requested_price: price,
                      })
                    }
                    onRemove={() => removeFromBuilder(item.product_id)}
                    hidePrices={effectiveHidePrices}
                  />
                ))}
              </div>

              {effectiveShowPricing && (
                <div className="border-t pt-3">
                  <QuotePriceBreakdown
                    builderItems={builderItems}
                    formatPrice={formatPrice}
                    variant="default"
                  />
                </div>
              )}
            </div>
          )}

          {/* Customer info */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Your Information</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => updateField("customer_name", e.target.value)}
                  placeholder="Your full name"
                  className={
                    validationErrors.customer_name ? "border-destructive" : ""
                  }
                />
                {validationErrors.customer_name && (
                  <p className="text-sm text-destructive">
                    {validationErrors.customer_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_email">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) =>
                    updateField("customer_email", e.target.value)
                  }
                  placeholder="email@example.com"
                  className={
                    validationErrors.customer_email ? "border-destructive" : ""
                  }
                />
                {validationErrors.customer_email && (
                  <p className="text-sm text-destructive">
                    {validationErrors.customer_email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_phone">
                  Phone {requirePhone ? "*" : "(optional)"}
                </Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    updateField("customer_phone", e.target.value)
                  }
                  placeholder="+260 97 1234567"
                  className={
                    validationErrors.customer_phone ? "border-destructive" : ""
                  }
                />
                {validationErrors.customer_phone && (
                  <p className="text-sm text-destructive">
                    {validationErrors.customer_phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Company {requireCompany ? "*" : "(optional)"}
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                  placeholder="Your company name"
                  className={
                    validationErrors.company_name ? "border-destructive" : ""
                  }
                />
                {validationErrors.company_name && (
                  <p className="text-sm text-destructive">
                    {validationErrors.company_name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Any special requirements or questions..."
                rows={3}
              />
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-muted-foreground">
            We&apos;ll send your quote to the email address above. You&apos;ll
            use it to securely view and respond to your quote.
          </p>
        </form>
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button type="submit" form="quote-form" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" /> Submit Quote Request
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
