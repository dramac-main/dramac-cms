"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PurchaseOrder, POStatus } from "../types";
import type { POFilters as POF } from "../actions/purchase-order-actions";
import { getPurchaseOrders } from "../actions/purchase-order-actions";
import { AmountDisplay } from "./amount-display";
import { PO_STATUS_LABELS, PO_STATUS_CONFIG } from "../lib/invoicing-constants";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Search, ClipboardList } from "lucide-react";

interface PurchaseOrderListProps {
  siteId: string;
}

export function PurchaseOrderList({ siteId }: PurchaseOrderListProps) {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    const filters: POF = {};
    if (search.trim()) filters.search = search.trim();
    if (statusFilter !== "all") filters.status = statusFilter as POStatus;

    getPurchaseOrders(siteId, filters, { page, pageSize })
      .then(({ purchaseOrders: data, total: count }) => {
        setPurchaseOrders(data);
        setTotal(count);
      })
      .catch(() => {
        setPurchaseOrders([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [siteId, search, statusFilter, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">
            {total} purchase order{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/sites/${siteId}/invoicing/purchase-orders/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search POs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(PO_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                    <p>No purchase orders found.</p>
                    <Link
                      href={`/dashboard/sites/${siteId}/invoicing/purchase-orders/new`}
                      className="text-primary underline text-sm"
                    >
                      Create your first purchase order
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => {
                const config = PO_STATUS_CONFIG[po.status];
                return (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/sites/${siteId}/invoicing/purchase-orders/${po.id}`,
                      )
                    }
                  >
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {(po as any).vendor?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={config?.color || ""}
                      >
                        {PO_STATUS_LABELS[po.status] || po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.issueDate}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {po.expectedDate || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <AmountDisplay
                        amount={po.total}
                        currency={po.currency}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
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
