// src/app/(dashboard)/dashboard/domains/transfer/new/page.tsx
// New domain transfer wizard page

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TransferWizard } from "@/components/domains/transfer";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata = {
  title: `Transfer Domain | ${PLATFORM.name}`,
  description: "Transfer a domain to your account",
};

export default async function NewTransferPage() {
  // Contacts feature will be added when domain_contacts table exists
  // For now, pass empty array and the wizard handles it gracefully
  const contacts: { id: string; name: string; email: string }[] = [];

  return (
    <div className="container py-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/domains/transfer">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Transfer Domain</h1>
          <p className="text-muted-foreground">
            Move a domain from another registrar to your account
          </p>
        </div>
      </div>

      {/* Transfer Wizard */}
      <TransferWizard contacts={contacts} />

      {/* Help Text */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p className="font-medium">Need help?</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Contact your current registrar to unlock your domain and get the auth code
          </li>
          <li>
            Make sure the admin email for the domain is accessible - you&apos;ll need to approve the transfer
          </li>
          <li>
            Transfers typically take 5-7 days and include a 1-year extension
          </li>
        </ul>
      </div>
    </div>
  );
}
