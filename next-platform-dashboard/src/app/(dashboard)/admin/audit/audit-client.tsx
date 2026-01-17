"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, FileText, User, Building2, Globe, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuditLogs, type AuditLogEntry } from "@/lib/admin/audit-service";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

const RESOURCE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "user", label: "Users" },
  { value: "agency", label: "Agencies" },
  { value: "site", label: "Sites" },
  { value: "module", label: "Modules" },
];

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  agency: <Building2 className="h-4 w-4" />,
  site: <Globe className="h-4 w-4" />,
  module: <Package className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  updated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  published: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

function getActionColor(action: string): string {
  if (action.includes("created")) return ACTION_COLORS.created;
  if (action.includes("updated") || action.includes("changed")) return ACTION_COLORS.updated;
  if (action.includes("deleted") || action.includes("suspended") || action.includes("cancelled")) return ACTION_COLORS.deleted;
  if (action.includes("published")) return ACTION_COLORS.published;
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        page,
        limit: 50,
        resourceType: resourceFilter !== "all" ? resourceFilter : undefined,
      });
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [resourceFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = debouncedSearch
    ? logs.filter(
        (log) =>
          log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          log.userEmail.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (log.userName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ?? false)
      )
    : logs;

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            System activity and change history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              User Events
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.resourceType === "user").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agency Events
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.resourceType === "agency").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Site Events
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <div className="text-2xl font-bold">
              {logs.filter((l) => l.resourceType === "site").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={resourceFilter}
          onValueChange={(value) => {
            setResourceFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action.replace(".", " ").replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {RESOURCE_ICONS[log.resourceType] || <FileText className="h-4 w-4" />}
                      <span className="capitalize">{log.resourceType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{log.userName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {Object.entries(log.details)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
