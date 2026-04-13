/**
 * LP Admin Table — Per-Site Stats Table
 *
 * Phase LPB-10: Super Admin Health View
 */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Archive,
  ExternalLink,
  MoreHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { LPAdminSiteStats } from "../../types/lp-builder-types";
import {
  getLPAdminSiteStats,
  adminArchiveLP,
} from "../../actions/admin-landing-pages";

interface LPAdminTableProps {
  initialStats: LPAdminSiteStats[];
  search: string;
}

export function LPAdminTable({ initialStats, search }: LPAdminTableProps) {
  const [stats, setStats] = useState(initialStats);
  const [sortBy, setSortBy] = useState("total_visits");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialStats.length);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getLPAdminSiteStats({
        search: search || undefined,
        sortBy,
        sortDir,
        page,
        pageSize: 25,
      });
      setStats(result.stats);
      setTotal(result.total);
    });
  }, [search, sortBy, sortDir, page]);

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  }

  function SortHeader({
    col,
    children,
  }: {
    col: string;
    children: React.ReactNode;
  }) {
    return (
      <TableHead>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => toggleSort(col)}
        >
          {children}
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      </TableHead>
    );
  }

  if (stats.length === 0 && !isPending) {
    return (
      <div className="text-muted-foreground rounded-lg border p-8 text-center">
        {search
          ? "No sites match your search."
          : "No landing pages found across the platform."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Agency</TableHead>
              <SortHeader col="total_lps">LPs</SortHeader>
              <SortHeader col="published_lps">Published</SortHeader>
              <SortHeader col="total_visits">Visits</SortHeader>
              <SortHeader col="total_conversions">Conversions</SortHeader>
              <SortHeader col="avg_conversion_rate">CVR</SortHeader>
              <TableHead>Studio %</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((row) => {
              const studioPercent =
                row.totalLps > 0
                  ? Math.round((row.studioLps / row.totalLps) * 100)
                  : 0;

              return (
                <TableRow key={row.siteId}>
                  <TableCell className="font-medium">{row.siteName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.agencyName}
                  </TableCell>
                  <TableCell>{row.totalLps}</TableCell>
                  <TableCell>{row.publishedLps}</TableCell>
                  <TableCell>{row.totalVisits.toLocaleString()}</TableCell>
                  <TableCell>{row.totalConversions.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.avgConversionRate >= 5
                          ? "default"
                          : row.avgConversionRate >= 2
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {row.avgConversionRate}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={studioPercent === 100 ? "default" : "outline"}
                    >
                      {studioPercent}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/admin/landing-pages?siteId=${row.siteId}`,
                              "_self",
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View LPs
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(
                              `/dashboard/sites/${row.siteId}`,
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Site Dashboard
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
      {total > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of{" "}
            {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
