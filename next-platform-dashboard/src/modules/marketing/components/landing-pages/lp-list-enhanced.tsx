/**
 * LP List Enhanced
 * Phase LPB-02: Studio LP Editor
 *
 * Enhanced landing page list with analytics columns, quick actions,
 * and integrated template picker for new LP creation.
 */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  FileEdit,
  Trash2,
  Copy,
  Globe,
  Archive,
  BarChart3,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LP_STATUS_CONFIG } from "../../lib/lp-builder-constants";
import {
  deleteLandingPage,
  duplicateLandingPage,
  updateLandingPageStatus,
} from "../../actions/landing-page-actions";
import type { LandingPageStudio } from "../../types/lp-builder-types";

// ─── Types ─────────────────────────────────────────────────────

interface LPListEnhancedProps {
  landingPages: LandingPageStudio[];
  total: number;
  currentPage: number;
  pageSize: number;
  siteId: string;
  siteName: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
  currentStatus?: string;
  currentSearch?: string;
}

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function getLpUrl(
  slug: string,
  siteSubdomain?: string,
  siteCustomDomain?: string | null,
): string | null {
  const domain =
    siteCustomDomain || (siteSubdomain ? `${siteSubdomain}.dramac.app` : null);
  return domain ? `https://${domain}/lp/${slug}` : null;
}

// ─── Component ─────────────────────────────────────────────────

export function LPListEnhanced({
  landingPages,
  total,
  currentPage,
  pageSize,
  siteId,
  siteName,
  siteSubdomain,
  siteCustomDomain,
  currentStatus,
  currentSearch,
}: LPListEnhancedProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch || "");

  const basePath = `/dashboard/sites/${siteId}/marketing/landing-pages`;
  const totalPages = Math.ceil(total / pageSize);

  function applyFilters(status?: string, searchVal?: string) {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (searchVal) params.set("search", searchVal);
    const qs = params.toString();
    startTransition(() => {
      router.push(`${basePath}${qs ? `?${qs}` : ""}`);
    });
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateLandingPage(id);
      router.refresh();
      toast.success("Landing page duplicated");
    } catch {
      toast.error("Failed to duplicate landing page");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteLandingPage(id);
      router.refresh();
      toast.success("Landing page deleted");
    } catch {
      toast.error("Failed to delete landing page");
    }
  }

  async function handleStatusChange(
    id: string,
    status: "published" | "draft" | "archived",
  ) {
    try {
      await updateLandingPageStatus(id, status);
      router.refresh();
      toast.success(
        `Landing page ${status === "published" ? "published" : status === "archived" ? "archived" : "unpublished"}`,
      );
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Landing Pages</h2>
          <p className="text-sm text-muted-foreground">
            {total} page{total !== 1 ? "s" : ""} &middot; {siteName}
          </p>
        </div>
        <Link href={`${basePath}/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Landing Page
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search landing pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters(currentStatus, search);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={currentStatus || "all"}
          onValueChange={(v) => applyFilters(v, search)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {landingPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No landing pages found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStatus || currentSearch
                ? "Try adjusting your filters"
                : "Create your first landing page to start capturing leads"}
            </p>
            {!currentStatus && !currentSearch && (
              <Link href={`${basePath}/new`} className="mt-4">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Landing Page
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">URL</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">
                    Visits
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-right">
                    Conversions
                  </TableHead>
                  <TableHead className="hidden xl:table-cell text-right">
                    Rate
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Updated
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {landingPages.map((lp) => {
                  const statusConfig =
                    LP_STATUS_CONFIG[
                      lp.status as keyof typeof LP_STATUS_CONFIG
                    ] || LP_STATUS_CONFIG.draft;
                  const url = getLpUrl(
                    lp.slug,
                    siteSubdomain,
                    siteCustomDomain,
                  );

                  return (
                    <TableRow key={lp.id}>
                      <TableCell>
                        <Link
                          href={`${basePath}/${lp.id}`}
                          className="font-medium hover:underline"
                        >
                          {lp.title}
                        </Link>
                        {lp.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {lp.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusConfig.color}
                        >
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground truncate max-w-[180px] inline-block">
                          /lp/{lp.slug}
                        </span>
                        {url && lp.status === "published" && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex"
                          >
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums">
                        {(lp.totalVisits || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right tabular-nums">
                        {(lp.totalConversions || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-right tabular-nums">
                        {formatRate(lp.conversionRate || 0)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-xs text-muted-foreground">
                        {formatDate(lp.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`${basePath}/${lp.id}/edit`}>
                                <FileEdit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`${basePath}/${lp.id}`}>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Analytics
                              </Link>
                            </DropdownMenuItem>
                            {url && (
                              <DropdownMenuItem
                                onClick={() => window.open(url, "_blank")}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {lp.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(lp.id, "published")
                                }
                              >
                                <Globe className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {lp.status === "published" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(lp.id, "draft")
                                }
                              >
                                <FileEdit className="mr-2 h-4 w-4" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(lp.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {lp.status !== "archived" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(lp.id, "archived")
                                }
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(lp.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (currentStatus && currentStatus !== "all")
                      params.set("status", currentStatus);
                    if (currentSearch) params.set("search", currentSearch);
                    params.set("page", String(currentPage - 1));
                    router.push(`${basePath}?${params.toString()}`);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (currentStatus && currentStatus !== "all")
                      params.set("status", currentStatus);
                    if (currentSearch) params.set("search", currentSearch);
                    params.set("page", String(currentPage + 1));
                    router.push(`${basePath}?${params.toString()}`);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
