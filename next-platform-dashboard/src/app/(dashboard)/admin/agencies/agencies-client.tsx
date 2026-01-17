"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgencyManagementTable } from "@/components/admin/agency-management-table";
import { getAdminAgencies, updateAgencyStatus, type AdminAgency } from "@/lib/admin/admin-service";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminAgenciesPageClient() {
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const loadAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminAgencies({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setAgencies(result.agencies);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load agencies:", error);
      toast.error("Failed to load agencies");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  const handleStatusChange = async (agencyId: string, newStatus: string) => {
    const result = await updateAgencyStatus(agencyId, newStatus);
    if (result.success) {
      toast.success("Status updated successfully");
      loadAgencies();
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground">
            {total} total agencies
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAgencies} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select 
          value={statusFilter} 
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agencies Table */}
      {loading ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Loading agencies...
        </div>
      ) : (
        <AgencyManagementTable
          agencies={agencies}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
