"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus,
  Search,
  GitBranch,
  MoreHorizontal,
  Eye,
  Trash2,
  Play,
  Pause,
  Archive,
  Users,
  Mail,
  Clock,
  Loader2,
} from "lucide-react";
import {
  SEQUENCE_STATUS_LABELS,
  VALID_SEQUENCE_TRANSITIONS,
} from "../../lib/marketing-constants";
import {
  deleteSequence,
  updateSequenceStatus,
} from "../../actions/sequence-actions";
import type { Sequence, SequenceStatus, SequenceStep } from "../../types/sequence-types";

interface SequenceListClientProps {
  siteId: string;
  sequences: Sequence[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  archived: "bg-red-100 text-red-700",
};

const STATUS_ACTION_ICONS: Record<string, React.ReactNode> = {
  active: <Play className="mr-2 h-4 w-4" />,
  paused: <Pause className="mr-2 h-4 w-4" />,
  archived: <Archive className="mr-2 h-4 w-4" />,
  draft: <GitBranch className="mr-2 h-4 w-4" />,
};

function getStepSummary(steps: SequenceStep[] | undefined): {
  emails: number;
  delays: number;
  conditions: number;
} {
  const list = steps || [];
  return {
    emails: list.filter((s) => s.type === "email").length,
    delays: list.filter((s) => s.type === "delay").length,
    conditions: list.filter(
      (s) => s.type === "condition" || s.type === "split",
    ).length,
  };
}

export function SequenceListClient({
  siteId,
  sequences,
  total,
  page,
  limit,
}: SequenceListClientProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const basePath = `/dashboard/sites/${params.siteId}/marketing/sequences`;
  const totalPages = Math.ceil(total / limit);

  function handleSearch(value: string) {
    setSearch(value);
    const searchParams = new URLSearchParams();
    if (value) searchParams.set("search", value);
    if (statusFilter !== "all") searchParams.set("status", statusFilter);
    const qs = searchParams.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  }

  function handleStatusFilter(value: string) {
    setStatusFilter(value);
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    if (value !== "all") searchParams.set("status", value);
    const qs = searchParams.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  }

  function handleStatusChange(sequenceId: string, newStatus: SequenceStatus) {
    startTransition(async () => {
      try {
        await updateSequenceStatus(siteId, sequenceId, newStatus);
        router.refresh();
        toast.success(`Sequence ${newStatus}`);
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update sequence status",
        );
      }
    });
  }

  function handleDelete(sequenceId: string) {
    startTransition(async () => {
      try {
        await deleteSequence(siteId, sequenceId);
        router.refresh();
        toast.success("Sequence deleted");
      } catch (err: unknown) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete sequence",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sequences</h1>
          <p className="text-muted-foreground">
            Automate email drip campaigns and subscriber journeys
          </p>
        </div>
        <Button onClick={() => router.push(`${basePath}/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          New Sequence
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Search sequences..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(SEQUENCE_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sequence Grid */}
      {sequences.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitBranch className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-semibold">No sequences yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Create your first automated email sequence
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push(`${basePath}/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sequences.map((seq) => {
            const summary = getStepSummary(seq.steps as SequenceStep[] | undefined);
            const status = (seq.status || "draft") as SequenceStatus;
            const transitions = VALID_SEQUENCE_TRANSITIONS[status] || [];

            return (
              <Card
                key={seq.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`${basePath}/${seq.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CardTitle className="truncate text-base">
                              {seq.name}
                            </CardTitle>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{seq.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {seq.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {seq.description}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${seq.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`${basePath}/${seq.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {transitions.map((t) => (
                          <DropdownMenuItem
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(seq.id, t);
                            }}
                            disabled={isPending}
                          >
                            {STATUS_ACTION_ICONS[t]}
                            {SEQUENCE_STATUS_LABELS[t]}
                          </DropdownMenuItem>
                        ))}
                        {status === "draft" && (
                          <>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                  disabled={isPending}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete &ldquo;{seq.name}&rdquo;?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the sequence and
                                    all its steps. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(seq.id);
                                    }}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge variant="secondary" className={STATUS_COLORS[status]}>
                    {SEQUENCE_STATUS_LABELS[status] || status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {/* Step Summary */}
                  <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {summary.emails > 0 && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {summary.emails} email{summary.emails !== 1 ? "s" : ""}
                      </span>
                    )}
                    {summary.delays > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {summary.delays} delay{summary.delays !== 1 ? "s" : ""}
                      </span>
                    )}
                    {summary.conditions > 0 && (
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {summary.conditions}
                      </span>
                    )}
                    {(seq.steps || []).length === 0 && (
                      <span>No steps configured</span>
                    )}
                  </div>

                  {/* Enrollment Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="text-muted-foreground h-3.5 w-3.5" />
                      <span>{seq.total_enrolled || 0} enrolled</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {seq.total_completed || 0} completed
                      </span>
                    </div>
                  </div>

                  {/* Trigger */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Trigger: {(seq.trigger_type || "manual").replace(/_/g, " ")}
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
            disabled={page <= 1 || isPending}
            onClick={() => {
              startTransition(() => {
                const searchParams = new URLSearchParams();
                if (search) searchParams.set("search", search);
                if (statusFilter !== "all")
                  searchParams.set("status", statusFilter);
                searchParams.set("page", String(page - 1));
                router.push(`${basePath}?${searchParams.toString()}`);
              });
            }}
          >
            {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isPending}
            onClick={() => {
              startTransition(() => {
                const searchParams = new URLSearchParams();
                if (search) searchParams.set("search", search);
                if (statusFilter !== "all")
                  searchParams.set("status", statusFilter);
                searchParams.set("page", String(page + 1));
                router.push(`${basePath}?${searchParams.toString()}`);
              });
            }}
          >
            Next
            {isPending ? <Loader2 className="ml-1 h-3 w-3 animate-spin" /> : null}
          </Button>
        </div>
      )}
    </div>
  );
}
