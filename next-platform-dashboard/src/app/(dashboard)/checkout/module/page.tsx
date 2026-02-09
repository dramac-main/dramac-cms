import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { moduleRegistry } from "@/lib/modules/module-registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/lib/locale-config";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Checkout | ${PLATFORM.name}`,
  description: "Complete your module purchase",
};

interface CheckoutModulePageProps {
  searchParams: Promise<{
    module?: string;
    site?: string;
    return?: string;
  }>;
}

export default async function CheckoutModulePage({ searchParams }: CheckoutModulePageProps) {
  const params = await searchParams;
  const moduleId = params.module;
  const siteId = params.site;
  const returnUrl = params.return || "/marketplace";

  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/checkout/module?module=${moduleId}&site=${siteId}`)}`);
  }

  if (!moduleId || !siteId) {
    notFound();
  }

  // Get module from registry
  const moduleData = moduleRegistry.get(moduleId) || moduleRegistry.getBySlug(moduleId);
  
  if (!moduleData) {
    notFound();
  }

  // Get site info
  const { data: site } = await supabase
    .from("sites")
    .select("id, name, subdomain")
    .eq("id", siteId)
    .single();

  if (!site) {
    notFound();
  }

  const formatPrice = (amount?: number, currency = DEFAULT_CURRENCY) => {
    if (!amount) return "Free";
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link href={returnUrl} className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>
            Review your order and proceed to payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="font-medium">Order Summary</h3>
            
            <div className="flex items-start justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{moduleData.name}</span>
                  <Badge variant="secondary">{moduleData.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{moduleData.description}</p>
                <p className="text-xs text-muted-foreground">
                  Installing to: <span className="font-medium">{site.name}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold">
                  {formatPrice(moduleData.pricing.amount, moduleData.pricing.currency)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(moduleData.pricing.amount, moduleData.pricing.currency)}</span>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <span>
              Your payment is secured and processed through our trusted payment provider.
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" size="lg">
            Proceed to Payment
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
