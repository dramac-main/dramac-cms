/**
 * Campaign List Client Component
 * Phase MKT-02: Email Campaign Engine (UI)
 *
 * Renders campaign cards with status filtering, search, and pagination.
 */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Mail,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  Send,
  Plus,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_STATUS_LABELS,
} from "../../lib/marketing-constants";
import {
  deleteCampaign,
  duplicateCampaign,
} from "../../actions/campaign-actions";
import type { Campaign, CampaignStatus } from "../../types";

interface CampaignListClientProps {
  siteId: string;
  campaigns: Campaign[];
  total: number;
  currentPage: number;
  pageSize: number;
  currentStatus?: string;
  currentSearch?: string;
}

export function CampaignListClient({
  siteId,
  campaigns,
  total,
  currentPage,
  pageSize,
  currentStatus,
  currentSearch,
}: CampaignListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch || "");
  const basePath = `/dashboard/sites/${siteId}/marketing/campaigns`;
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

  async function handleDuplicate(campaignId: string) {
    try {
      await duplicateCampaign(siteId, campaignId);
      router.refresh();
      toast.success("Campaign duplicated");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate campaign";
      toast.error(msg);
    }
  }

  async function handleDelete(campaignId: string) {
    try {
      await deleteCampaign(siteId, campaignId);
      router.refresh();
      toast.success("Campaign deleted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete campaign";
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            {total} campaign{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href={`${basePath}/new`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
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
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No campaigns found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStatus || currentSearch
                ? "Try adjusting your filters"
                : "Create your first email campaign"}
            </p>
            {!currentStatus && !currentSearch && (
              <Link href={`${basePath}/new`} className="mt-4">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => {
            const status = (campaign.status as CampaignStatus) || "draft";
            const config = CAMPAIGN_STATUS_CONFIG[status];
            const c = campaign as Record<string, unknown>;
            const totalSent = Number(c.total_sent) || 0;
            const totalOpened = Number(c.total_opened) || 0;
            return (
              <Card
                key={campaign.id}
                className="hover:border-primary/30 transition-colors"
              >
                <CardContent className="flex items-center justify-between p-4">
                  <Link
                    href={`${basePath}/${campaign.id}`}
                    className="flex-1 min-w-0"
                  >
                    <TooltipProvider>
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm font-medium truncate">
                                {campaign.name}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              {campaign.name}
                            </TooltipContent>
                          </Tooltip>
                          <p className="text-xs text-muted-foreground truncate">
                            {String(c.subject_line || "No subject line")}
                          </p>
                        </div>
                      </div>
                    </TooltipProvider>
                  </Link>

                  <div className="flex items-center gap-3 ml-4">
                    {totalSent > 0 && (
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-muted-foreground">
                          <Send className="inline h-3 w-3 mr-1" />
                          {totalSent.toLocaleString()} sent
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Eye className="inline h-3 w-3 mr-1" />
                          {totalOpened.toLocaleString()} opened
                        </p>
                      </div>
                    )}

                    <Badge
                      variant="secondary"
                      className={`${config?.bgColor} ${config?.color}`}
                    >
                      {config?.label || status}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${campaign.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`${basePath}/${campaign.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(campaign.id)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {status === "draft" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete &ldquo;{campaign.name}&rdquo;?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this draft campaign.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(campaign.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isPending}
            onClick={() => {
              const params = new URLSearchParams();
              if (currentStatus) params.set("status", currentStatus);
              if (currentSearch) params.set("search", currentSearch);
              params.set("page", String(currentPage - 1));
              startTransition(() => {
                router.push(`${basePath}?${params.toString()}`);
              });
            }}
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isPending}
            onClick={() => {
              const params = new URLSearchParams();
              if (currentStatus) params.set("status", currentStatus);
              if (currentSearch) params.set("search", currentSearch);
              params.set("page", String(currentPage + 1));
              startTransition(() => {
                router.push(`${basePath}?${params.toString()}`);
              });
            }}
          >
            Next
            {isPending ? <Loader2 className="h-3 w-3 animate-spin ml-1" /> : null}
          </Button>
        </div>
      )}
    </div>
  );
}
