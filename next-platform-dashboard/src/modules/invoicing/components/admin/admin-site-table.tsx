"use client";

/**
 * Admin Site Invoicing Table (INV-12)
 *
 * Table of sites with invoicing stats — sortable, paginated.
 */

import { useEffect, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { getInvoicingSiteOverview } from "../../actions/admin-actions";
import type { SiteInvoicingOverview } from "../../types";

function formatCurrency(cents: number): string {
  return `K ${(cents / 100).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 10;

export function AdminSiteInvoicingTable() {
  const [sites, setSites] = useState<SiteInvoicingOverview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("name");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getInvoicingSiteOverview(
        { page, pageSize: PAGE_SIZE },
        sortBy,
      );
      setSites(result.sites);
      setTotal(result.total);
    });
  }, [page, sortBy]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleSort(field: string) {
    setSortBy((prev) => (prev === field ? "name" : field));
    setPage(1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sites Using Invoicing</CardTitle>
        <CardDescription>
          {total} site{total !== 1 ? "s" : ""} with invoicing enabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Site</th>
                <th className="text-left py-3 font-medium">Agency</th>
                <th className="text-right py-3 font-medium">
                  <button
                    onClick={() => handleSort("invoices")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Invoices
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right py-3 font-medium">
                  <button
                    onClick={() => handleSort("revenue")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Revenue
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right py-3 font-medium">
                  <button
                    onClick={() => handleSort("outstanding")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Outstanding
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-center py-3 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Last Invoice</th>
              </tr>
            </thead>
            <tbody>
              {isPending && sites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : sites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No sites with invoicing enabled
                  </td>
                </tr>
              ) : (
                sites.map((site) => (
                  <tr
                    key={site.siteId}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 font-medium">{site.siteName}</td>
                    <td className="py-3 text-muted-foreground">
                      {site.agencyName}
                    </td>
                    <td className="py-3 text-right">{site.invoiceCount}</td>
                    <td className="py-3 text-right">
                      {formatCurrency(site.totalRevenue)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(site.totalOutstanding)}
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={site.isActive ? "default" : "secondary"}
                      >
                        {site.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {site.lastInvoiceDate
                        ? new Date(site.lastInvoiceDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
