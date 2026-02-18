import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailPurchaseWizard } from "@/components/email/email-purchase-wizard";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Purchase Email | ${PLATFORM.name}`,
  description: "Purchase business email for your domain",
};

export default function PurchaseEmailPage() {
  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/email">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Purchase Email</h1>
          <p className="text-sm text-muted-foreground">
            Professional email for your domain — powered by Titan
          </p>
        </div>
      </div>

      {/* Purchase Wizard */}
      <EmailPurchaseWizard />
    </div>
  );
}

