"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Vendor } from "../types";
import type { VendorFilters as VFilters } from "../actions/vendor-actions";
import { getVendors } from "../actions/vendor-actions";
import { AmountDisplay } from "./amount-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
} from "lucide-react";

interface VendorListProps {
  siteId: string;
}

export function VendorList({ siteId }: VendorListProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    const filters: VFilters = {};
    if (search.trim()) filters.search = search.trim();

    getVendors(siteId, filters, { page, pageSize })
      .then(({ vendors: data, total: count }) => {
        setVendors(data);
        setTotal(count);
      })
      .catch(() => {
        setVendors([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [siteId, search, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Vendors</h2>
          <p className="text-sm text-muted-foreground">
            {total} vendor{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/vendors/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Vendor
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/50" />
                    <p>No vendors found.</p>
                    <Link
                      href={`/dashboard/sites/${siteId}/invoicing/vendors/new`}
                      className="text-primary underline text-sm"
                    >
                      Add your first vendor
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/sites/${siteId}/invoicing/vendors/${vendor.id}`,
                    )
                  }
                >
                  <TableCell>
                    <span className="font-medium">{vendor.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vendor.email || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vendor.phone || "—"}
                  </TableCell>
                  <TableCell>
                    {vendor.paymentTermsDays ? (
                      <Badge variant="secondary">
                        {vendor.paymentTermsDays === 0
                          ? "Due on Receipt"
                          : `Net ${vendor.paymentTermsDays}`}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <AmountDisplay
                      amount={
                        (vendor.totalBilled || 0) - (vendor.totalPaid || 0)
                      }
                      currency={vendor.currency || "ZMW"}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
