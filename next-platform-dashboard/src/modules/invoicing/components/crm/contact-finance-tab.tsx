"use client";

/**
 * Contact Finance Tab (INV-13)
 *
 * Financial profile tab for CRM contact detail sheet.
 * Shows outstanding balance, invoices, payments, and risk score.
 */

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  FileText,
  CreditCard,
  AlertTriangle,
  Plus,
  Loader2,
} from "lucide-react";
import {
  getContactFinancialProfile,
  createInvoiceFromContact,
  type ContactFinancialProfile,
} from "@/modules/invoicing/actions/crm-integration-actions";
import { useRouter } from "next/navigation";

function formatCurrency(cents: number): string {
  return `K ${(cents / 100).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const riskColors = {
  low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  viewed:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  partial:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled:
    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

interface ContactFinanceTabProps {
  contactId: string;
  siteId: string;
}

export function ContactFinanceTab({
  contactId,
  siteId,
}: ContactFinanceTabProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ContactFinancialProfile | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getContactFinancialProfile(contactId);
      setProfile(data);
    });
  }, [contactId]);

  async function handleCreateInvoice() {
    const result = await createInvoiceFromContact(contactId, siteId);
    router.push(result.redirectUrl);
  }

  if (isPending && !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-3.5 w-3.5" />
              Total Invoiced
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(profile.totalInvoiced)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-3.5 w-3.5" />
              Total Paid
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(profile.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Outstanding
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(profile.totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Risk Rating
            </div>
            <Badge className={riskColors[profile.riskRating]}>
              {profile.riskRating.charAt(0).toUpperCase() +
                profile.riskRating.slice(1)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>{profile.invoiceCount} invoices</span>
        <span>Avg {profile.averageDaysToPay} days to pay</span>
        {profile.totalCredits > 0 && (
          <span>Credits: {formatCurrency(profile.totalCredits)}</span>
        )}
      </div>

      {/* Create Invoice Button */}
      <Button
        size="sm"
        className="w-full"
        onClick={handleCreateInvoice}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Invoice
      </Button>

      {/* Recent Invoices */}
      {profile.recentInvoices.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Recent Invoices</h4>
          <div className="space-y-2">
            {profile.recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{inv.invoiceNumber}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-2 text-xs ${statusColors[inv.status] || ""}`}
                  >
                    {inv.status}
                  </Badge>
                </div>
                <span className="font-medium">
                  {formatCurrency(inv.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {profile.recentPayments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Recent Payments</h4>
          <div className="space-y-2">
            {profile.recentPayments.map((pmt) => (
              <div
                key={pmt.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <span className="text-muted-foreground">
                    {pmt.invoiceNumber}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {pmt.method}
                  </span>
                </div>
                <span className="font-medium text-green-600">
                  +{formatCurrency(pmt.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.recentInvoices.length === 0 &&
        profile.recentPayments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No financial history yet
          </p>
        )}
    </div>
  );
}
