import { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Purchase Successful | ${PLATFORM.name}`,
  description: "Your module purchase was successful",
};

interface MarketplaceSuccessPageProps {
  searchParams: Promise<{
    module?: string;
    site?: string;
  }>;
}

export default async function MarketplaceSuccessPage({ searchParams }: MarketplaceSuccessPageProps) {
  const params = await searchParams;
  const _moduleId = params.module; // Available for future use to display module-specific info
  const siteId = params.site;

  return (
    <div className="container max-w-2xl py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CircleCheck className="h-10 w-10 text-success" />
          </div>
          <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
          <CardDescription>
            Your module has been activated and is ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Thank you for your purchase. The module is now available on your site.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            {siteId && (
              <Link href={`/dashboard/sites/${siteId}/settings?tab=modules`}>
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  View Site Modules
                </Button>
              </Link>
            )}
            <Link href="/marketplace">
              <Button variant="outline">
                Browse More Modules
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
