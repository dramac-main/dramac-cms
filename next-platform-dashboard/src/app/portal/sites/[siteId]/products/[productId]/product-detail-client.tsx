"use client";

/**
 * Portal Products — detail client (Session 6A).
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Boxes, AlertTriangle } from "lucide-react";
import { PortalStatusPill } from "@/components/portal/patterns/portal-status-pill";
import type { PortalProductDetail } from "@/lib/portal/commerce-data-access";
import { formatPortalCurrency } from "@/lib/portal/format";
import { adjustInventoryAction } from "../_actions";

export function ProductDetailClient({
  siteId,
  product,
}: {
  siteId: string;
  product: PortalProductDetail;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [variantId, setVariantId] = useState<string>("");
  const [delta, setDelta] = useState<string>("");
  const [reason, setReason] = useState("");

  function openAdjust(target: string) {
    setVariantId(target);
    setDelta("");
    setReason("");
    setAdjustOpen(true);
  }

  function handleAdjust() {
    const parsed = Number.parseInt(delta, 10);
    if (!Number.isFinite(parsed) || parsed === 0) {
      toast.error("Enter a non-zero whole number");
      return;
    }
    startTransition(async () => {
      const res = await adjustInventoryAction(siteId, product.id, {
        variantId: variantId || null,
        delta: parsed,
        reason,
      });
      if (res.ok) {
        toast.success(
          `Stock updated to ${res.newStock ?? "?"}${
            res.lowStockTriggered ? " · low stock alert triggered" : ""
          }`,
        );
        setAdjustOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/portal/sites/${siteId}/products`}>
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Back to products
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">{product.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {product.sku ? `SKU ${product.sku} · ` : ""}
              {product.slug ? `/${product.slug}` : ""}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <PortalStatusPill status={product.status ?? "draft"} />
              {product.isLowStock ? (
                <PortalStatusPill status="low_stock" />
              ) : null}
            </div>
          </div>
        </div>
        <Button onClick={() => openAdjust("")}>
          <Boxes className="mr-2 h-4 w-4" aria-hidden /> Adjust inventory
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {product.description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variants</CardTitle>
            </CardHeader>
            <CardContent>
              {product.variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No variants. Adjustments apply to the base product.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="sr-only">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((v) => {
                      const label = v.optionValues
                        ? Object.entries(v.optionValues)
                            .map(([k, val]) => `${k}: ${String(val)}`)
                            .join(", ")
                        : "Variant";
                      return (
                        <TableRow key={v.id}>
                          <TableCell className="text-sm">{label}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {v.sku ?? "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPortalCurrency(v.priceCents, product.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {v.stockQuantity ?? 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjust(v.id)}
                            >
                              Adjust
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Base price"
                value={formatPortalCurrency(
                  product.basePriceCents,
                  product.currency,
                )}
              />
              {product.comparePriceCents > 0 && (
                <Row
                  label="Compare at"
                  value={formatPortalCurrency(
                    product.comparePriceCents,
                    product.currency,
                  )}
                />
              )}
              {product.costPriceCents > 0 && (
                <Row
                  label="Cost"
                  value={formatPortalCurrency(
                    product.costPriceCents,
                    product.currency,
                  )}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Quantity" value={String(product.stockQuantity ?? 0)} />
              <Row
                label="Low-stock threshold"
                value={String(product.lowStockThreshold ?? "—")}
              />
              <Row
                label="Track inventory"
                value={product.trackInventory ? "Yes" : "No"}
              />
              <Row
                label="Allow backorder"
                value={product.allowBackorder ? "Yes" : "No"}
              />
              {product.isLowStock ? (
                <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/30">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Below low-stock threshold
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust inventory</DialogTitle>
            <DialogDescription>
              Use a positive number to add stock, negative to remove. The reason
              is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="delta">Delta (±)</Label>
              <Input
                id="delta"
                inputMode="numeric"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g. 10 or -3"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is stock being adjusted?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAdjustOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={isPending || reason.trim().length < 2}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
