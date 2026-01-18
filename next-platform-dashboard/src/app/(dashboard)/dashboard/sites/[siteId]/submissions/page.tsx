"use client";

import { useState, useEffect, use, useCallback } from "react";
import { 
  Mail, 
  Download, 
  Trash2, 
  Loader2, 
  Inbox, 
  Filter,
  RefreshCcw,
  FileSpreadsheet,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmissionTable } from "@/components/forms/submission-table";
import { SubmissionDetail } from "@/components/forms/submission-detail";
import {
  getSubmissions,
  getSubmissionStats,
  deleteSubmissions,
  getFormsWithSubmissions,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

export default function SubmissionsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, today: 0, thisWeek: 0 });
  const [forms, setForms] = useState<Array<{ formId: string; formName: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formFilter, setFormFilter] = useState<string>("all");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const filters = {
        status: statusFilter === "all" ? undefined : statusFilter as "new" | "read" | "archived" | "spam",
        formId: formFilter === "all" ? undefined : formFilter,
      };

      const [submissionsResult, statsResult, formsResult] = await Promise.all([
        getSubmissions(siteId, filters, page),
        getSubmissionStats(siteId),
        getFormsWithSubmissions(siteId),
      ]);

      setSubmissions(submissionsResult.submissions);
      setTotal(submissionsResult.total);
      setStats(statsResult);
      setForms(formsResult.forms);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [siteId, statusFilter, formFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? submissions.map((s) => s.id) : []);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} submission(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteSubmissions(selectedIds);
    setIsDeleting(false);

    if (result.success) {
      toast.success(`Deleted ${result.deleted || selectedIds.length} submission(s)`);
      setSelectedIds([]);
      loadData(true);
    } else {
      toast.error(result.error || "Failed to delete submissions");
    }
  };

  const handleExport = () => {
    if (total === 0) {
      toast.error("No submissions to export");
      return;
    }

    // Build export URL with filters
    const params = new URLSearchParams({ siteId });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (formFilter !== "all") params.set("formId", formFilter);

    // Trigger download
    window.open(`/api/forms/export?${params.toString()}`, "_blank");
    toast.success("Export started");
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setSelectedIds([]);
  };

  const handleFormFilterChange = (value: string) => {
    setFormFilter(value);
    setPage(1);
    setSelectedIds([]);
  };

  const handleViewSubmission = (submission: FormSubmission) => {
    setDetailSubmission(submission);
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${detailSubmission ? "mr-96" : ""}`}>
        {/* Header */}
        <div className="p-6 border-b bg-background">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Form Submissions
              </h1>
              <p className="text-muted-foreground mt-1">
                {total} total submission{total !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={total === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {selectedIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : `Delete (${selectedIds.length})`}
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
                </div>
                <p className="text-sm text-muted-foreground">New</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <p className="text-sm text-muted-foreground">Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
                <p className="text-sm text-muted-foreground">This Week</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>

            {forms.length > 1 && (
              <Select value={formFilter} onValueChange={handleFormFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form.formId} value={form.formId}>
                      {form.formName} ({form.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(statusFilter !== "all" || formFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setFormFilter("all");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading submissions...</p>
              </div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">
                {statusFilter !== "all" || formFilter !== "all" 
                  ? "No matching submissions" 
                  : "No submissions yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {statusFilter !== "all" || formFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Submissions will appear here when visitors submit forms on your published site."}
              </p>
              {(statusFilter !== "all" || formFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setStatusFilter("all");
                    setFormFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <SubmissionTable
              submissions={submissions}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onView={handleViewSubmission}
              onRefresh={() => loadData(true)}
            />
          )}
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="p-4 border-t bg-background flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 50 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel (Fixed position) */}
      {detailSubmission && (
        <div className="fixed right-0 top-0 h-full z-50 shadow-xl">
          <SubmissionDetail
            submission={detailSubmission}
            onClose={() => setDetailSubmission(null)}
            onUpdate={() => loadData(true)}
          />
        </div>
      )}
    </div>
  );
}
