import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CartPageClient } from "./cart-page-client";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata = {
  title: `Domain Cart | ${PLATFORM.name}`,
  description: "Review and complete your domain registration",
};

export default function DomainCartPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/domains/search">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Domain Checkout</h1>
          <p className="text-muted-foreground">
            Review your domains and complete registration
          </p>
        </div>
      </div>
      
      {/* Cart Content */}
      <CartPageClient />
    </div>
  );
}
