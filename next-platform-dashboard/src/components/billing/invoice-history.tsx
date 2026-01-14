"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBilling } from "@/lib/hooks/use-billing";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Download, ExternalLink, Receipt } from "lucide-react";

interface InvoiceHistoryProps {
  agencyId: string;
}

export function InvoiceHistory({ agencyId }: InvoiceHistoryProps) {
  const { data: billing, isLoading } = useBilling(agencyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const invoices = billing?.invoices || [];

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    open: "bg-blue-100 text-blue-800",
    draft: "bg-gray-100 text-gray-800",
    uncollectible: "bg-red-100 text-red-800",
    void: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoice History
        </CardTitle>
        <CardDescription>View and download your past invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No invoices yet. Your first invoice will appear after your trial ends.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{formatDate(invoice.created_at)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.period_start && invoice.period_end
                      ? `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.amount_due / 100)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status] || ""}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.invoice_pdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {invoice.hosted_invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
