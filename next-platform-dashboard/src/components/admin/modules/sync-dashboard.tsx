"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Clock, 
  Package,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface SyncStatus {
  total: number;
  synced: number;
  needsSync: number;
  unpublished: number;
  modules: Array<{
    moduleId: string;
    name: string;
    status: string;
    synced: boolean;
    lastSynced?: string;
  }>;
}

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  details: Array<{
    moduleId: string;
    name: string;
    action: "created" | "updated" | "failed";
    error?: string;
  }>;
}

interface SyncDashboardProps {
  initialStatus: SyncStatus;
}

export function SyncDashboard({ initialStatus }: SyncDashboardProps) {
  const [status, setStatus] = useState<SyncStatus>(initialStatus);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [syncingModule, setSyncingModule] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/modules/sync", {
        method: "GET",
      });
      const data = await response.json();
      setStatus(data);
    } catch (_err) {
      toast.error("Failed to refresh status");
    }
    setRefreshing(false);
  }, []);

  const handleSyncAll = useCallback(async () => {
    setSyncing(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/admin/modules/sync", {
        method: "POST",
      });
      const result = await response.json();
      setLastResult(result);
      
      if (result.success) {
        toast.success(`Successfully synced ${result.synced} modules`);
      } else if (result.synced > 0) {
        toast.warning(`Synced ${result.synced} modules, ${result.failed} failed`);
      } else {
        toast.error(`Sync failed: ${result.errors?.[0] || "Unknown error"}`);
      }
      
      // Refresh status after sync
      await refreshStatus();
    } catch (_err) {
      toast.error("Sync operation failed");
    }
    setSyncing(false);
  }, [refreshStatus]);

  const handleSyncModule = useCallback(async (moduleId: string) => {
    setSyncingModule(moduleId);
    try {
      const response = await fetch(`/api/admin/modules/sync/${moduleId}`, {
        method: "POST",
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success(`Module synced: ${result.action}`);
        await refreshStatus();
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (_err) {
      toast.error("Failed to sync module");
    }
    setSyncingModule(null);
  }, [refreshStatus]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status.synced}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Sync</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{status.needsSync}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpublished</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{status.unpublished}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Catalog Sync</CardTitle>
          <CardDescription>
            Sync all published Studio modules to the marketplace catalog.
            This happens automatically on deployment but can be triggered manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleSyncAll} disabled={syncing || status.needsSync === 0}>
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {syncing ? "Syncing..." : "Sync All Modules"}
            </Button>
            
            <Button variant="outline" onClick={refreshStatus} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>

          {/* Last Sync Result */}
          {lastResult && (
            <Alert variant={lastResult.failed === 0 ? "default" : "destructive"}>
              {lastResult.failed === 0 ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                Sync Complete: {lastResult.synced} synced, {lastResult.failed} failed
              </AlertTitle>
              {lastResult.errors.length > 0 && (
                <AlertDescription>
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {lastResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {lastResult.errors.length > 5 && (
                      <li>...and {lastResult.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </AlertDescription>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Module List */}
      <Card>
        <CardHeader>
          <CardTitle>Module Status</CardTitle>
          <CardDescription>
            Overview of all studio modules and their sync status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.modules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No studio modules found. Create modules in Module Studio to see them here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Synced</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.modules.map((module) => (
                  <TableRow key={module.moduleId}>
                    <TableCell className="font-medium">{module.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          module.status === "published" ? "default" : 
                          module.status === "testing" ? "secondary" : 
                          "outline"
                        }
                      >
                        {module.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {module.synced ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : module.status === "published" ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(module.lastSynced)}
                    </TableCell>
                    <TableCell className="text-right">
                      {module.status === "published" && !module.synced && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncModule(module.moduleId)}
                          disabled={syncingModule === module.moduleId}
                        >
                          {syncingModule === module.moduleId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Sync"
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>About Module Sync</AlertTitle>
        <AlertDescription>
          <p className="mt-2">
            The sync process copies published Studio modules to the <code className="px-1 bg-muted rounded">modules_v2</code> catalog table, 
            making them visible in the Marketplace and available for installation.
          </p>
          <ul className="mt-2 list-disc list-inside text-sm">
            <li>Sync happens automatically when deploying to production</li>
            <li>Only published modules are synced to the catalog</li>
            <li>Module updates trigger automatic re-sync</li>
            <li>Manual sync is useful for recovery or initial migration</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
