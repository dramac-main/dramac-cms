// src/app/(dashboard)/dashboard/domains/transfer/new/page.tsx
// New domain transfer wizard page

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TransferWizard } from "@/components/domains/transfer";
import { PLATFORM } from "@/lib/constants/platform";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: `Transfer Domain | ${PLATFORM.name}`,
  description: "Transfer a domain to your account",
};

async function getContacts() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.agency_id) return [];
    
    // Try to fetch from domain_contacts table
    const { data: contacts } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Array<{ id: string; name: string; email: string }> | null }> } } } })
      .from('domain_contacts')
      .select('id, name, email')
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: false });
    
    return contacts || [];
  } catch {
    // Table may not exist yet — return empty gracefully
    return [];
  }
}

export default async function NewTransferPage() {
  const contacts = await getContacts();

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
