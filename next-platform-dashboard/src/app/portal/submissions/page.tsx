"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Mail, 
  Download, 
  Loader2, 
  Inbox, 
  Globe, 
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
  getPortalAccessibleSites,
  getFormsWithSubmissions,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

export default function PortalSubmissionsPage() {
  const [sites, setSites] = useState<Array<{ id: string; name: string; subdomain: string }>>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, today: 0, thisWeek: 0 });
  const [forms, setForms] = useState<Array<{ formId: string; formName: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // View state
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formFilter, setFormFilter] = useState<string>("all");

  // Load accessible sites on mount
  useEffect(() => {
    async function loadSites() {
      setLoadingSites(true);
      try {
        const result = await getPortalAccessibleSites();
        setSites(result.sites);
        if (result.sites.length > 0) {
          setSelectedSiteId(result.sites[0].id);
        }
      } catch (error) {
        console.error("Failed to load sites:", error);
        toast.error("Failed to load your sites");
      } finally {
        setLoadingSites(false);
      }
    }
    loadSites();
  }, []);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (!selectedSiteId) return;
    
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
        getSubmissions(selectedSiteId, filters, page),
        getSubmissionStats(selectedSiteId),
        getFormsWithSubmissions(selectedSiteId),
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
  }, [selectedSiteId, statusFilter, formFilter, page]);

  // Load submissions when site changes
  useEffect(() => {
    if (selectedSiteId) {
      loadData();
    }
  }, [loadData, selectedSiteId]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setPage(1);
    setStatusFilter("all");
    setFormFilter("all");
    setDetailSubmission(null);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleFormFilterChange = (value: string) => {
    setFormFilter(value);
    setPage(1);
  };

  const handleExport = () => {
    if (total === 0) {
      toast.error("No submissions to export");
      return;
    }

    // Build export URL with filters
    const params = new URLSearchParams({ siteId: selectedSiteId });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (formFilter !== "all") params.set("formId", formFilter);

    // Trigger download
    window.open(`/api/forms/export?${params.toString()}`, "_blank");
    toast.success("Export started");
  };

  // Loading sites state
  if (loadingSites) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading your sites...</p>
        </div>
      </div>
    );
  }

  // No sites available
  if (sites.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Sites Available</h2>
          <p className="text-muted-foreground">
            You don&apos;t have access to any sites yet. Please contact your agency to get access to your website(s).
          </p>
        </div>
      </div>
    );
  }

  const currentSite = sites.find(s => s.id === selectedSiteId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-background">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Form Submissions
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage form submissions from your website{sites.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing || !selectedSiteId}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={total === 0 || !selectedSiteId}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Site Selector */}
        {sites.length > 1 && (
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Select Website</label>
            <Select value={selectedSiteId} onValueChange={handleSiteChange}>
              <SelectTrigger className="w-72">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    <div className="flex items-center gap-2">
                      <span>{site.name}</span>
                      <span className="text-muted-foreground text-xs">({site.subdomain})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Current Site Info */}
        {sites.length === 1 && currentSite && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{currentSite.name}</span>
            <span className="text-muted-foreground text-sm">({currentSite.subdomain})</span>
          </div>
        )}

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
                : "Submissions will appear here when visitors submit forms on your website."}
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
            selectedIds={[]} // Portal users can't select/delete
            onSelect={() => {}} // No-op for portal
            onSelectAll={() => {}} // No-op for portal
            onView={setDetailSubmission}
            onRefresh={() => loadData(true)}
            readOnly // Portal users can only view
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

      {/* Detail Panel (Fixed position) */}
      {detailSubmission && (
        <div className="fixed right-0 top-0 h-full z-50 shadow-xl">
          <SubmissionDetail
            submission={detailSubmission}
            onClose={() => setDetailSubmission(null)}
            onUpdate={() => loadData(true)}
            readOnly // Portal users can only view
          />
        </div>
      )}
    </div>
  );
}
