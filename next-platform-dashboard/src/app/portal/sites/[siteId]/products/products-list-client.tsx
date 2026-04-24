"use client";

/**
 * Portal Products — list client component (Session 6A).
 */

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import { PortalEmptyState } from "@/components/portal/patterns/portal-empty-state";
import { Package, ArrowRight, AlertTriangle } from "lucide-react";
import type { PortalProductListItem } from "@/lib/portal/commerce-data-access";
import {
  formatPortalCurrency,
  formatPortalRelative,
} from "@/lib/portal/format";

interface Props {
  siteId: string;
  products: PortalProductListItem[];
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  activeStatus: string;
  activeSearch: string;
  lowStockOnly: boolean;
}

const PRODUCT_STATUSES = ["all", "active", "draft", "archived"] as const;

export function ProductsListClient({
  siteId,
  products,
  currentPage,
  pageSize,
  hasMore,
  activeStatus,
  activeSearch,
  lowStockOnly,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function push(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all" || v === "false") params.delete(k);
      else params.set(k, v);
    }
    if (!("page" in next)) params.delete("page");
    startTransition(() => {
      router.push(`/portal/sites/${siteId}/products?${params.toString()}`);
    });
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    push({ q: q || null });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={onSearchSubmit}
          className="flex w-full gap-2 md:max-w-sm"
          role="search"
          aria-label="Search products"
        >
          <Input
            name="q"
            defaultValue={activeSearch}
            placeholder="Search products or SKU…"
            aria-label="Search products"
            className="h-9"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            Search
          </Button>
        </form>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="product-status" className="text-xs text-muted-foreground">
              Status
            </label>
            <Select
              value={activeStatus}
              onValueChange={(v) => push({ status: v })}
            >
              <SelectTrigger id="product-status" className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={lowStockOnly}
              onCheckedChange={(c) => push({ lowStock: c ? "true" : "false" })}
            />
            Low stock only
          </label>
        </div>
      </div>

      {products.length === 0 ? (
        <PortalEmptyState
          icon={Package}
          title="No products"
          description={
            activeSearch || activeStatus !== "all" || lowStockOnly
              ? "Nothing matches your filters."
              : "Products added to this site will appear here."
          }
        />
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-2 md:hidden">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex gap-3 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/portal/sites/${siteId}/products/${p.id}`}
                      className="block truncate text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.sku ?? ""}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <PortalStatusPill status={p.status ?? "draft"} />
                      {p.isLowStock ? (
                        <PortalStatusPill status="low_stock" />
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {formatPortalCurrency(p.basePriceCents, p.currency)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.stockQuantity ?? 0} in stock
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 sr-only">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10 sr-only">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="relative h-10 w-10 overflow-hidden rounded-md bg-muted">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/portal/sites/${siteId}/products/${p.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PortalStatusPill status={p.status ?? "draft"} />
                        {p.isLowStock ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"
                            aria-label="Low stock"
                          >
                            <AlertTriangle className="h-3 w-3" aria-hidden /> Low
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPortalCurrency(p.basePriceCents, p.currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.stockQuantity ?? 0}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatPortalRelative(p.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/portal/sites/${siteId}/products/${p.id}`}
                          aria-label={`Open product ${p.name}`}
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {(currentPage > 1 || hasMore) && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Page {currentPage}
            {products.length > 0 ? ` · showing ${products.length} of up to ${pageSize}` : ""}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() =>
                push({ page: currentPage <= 2 ? null : String(currentPage - 1) })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore || isPending}
              onClick={() => push({ page: String(currentPage + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
