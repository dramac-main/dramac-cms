/**
 * LP Migration Panel — Status + Controls for Block → Studio Migration
 *
 * Phase LPB-11: Shows migration progress and provides per-LP migration controls.
 */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Undo2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MigrationStatus,
  BlockMigrationResult,
} from "../../types/lp-builder-types";
import {
  getMigrationStatus,
  migrateLP,
  migrateSiteLPs,
  revertMigration,
} from "../../actions/lp-migration";
import { LPMigrationPreviewDialog } from "./lp-migration-preview-dialog";

interface LPMigrationPanelProps {
  siteId: string;
  legacyLPs: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    useStudioFormat: boolean;
    migratedAt: string | null;
  }>;
}

export function LPMigrationPanel({ siteId, legacyLPs }: LPMigrationPanelProps) {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [results, setResults] = useState<BlockMigrationResult[]>([]);
  const [previewLpId, setPreviewLpId] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();
  const [migratingIds, setMigratingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    startTransition(async () => {
      const s = await getMigrationStatus(siteId);
      setStatus(s);
    });
  }, [siteId]);

  function handleMigrateAll() {
    startTransition(async () => {
      const progress = await migrateSiteLPs(siteId);
      setResults(progress.results);
      const s = await getMigrationStatus(siteId);
      setStatus(s);
      if (progress.failed === 0) {
        toast.success(
          `Migrated ${progress.migrated} landing page(s) to Studio format.`,
        );
      } else {
        toast.warning(
          `Migrated ${progress.migrated}, failed ${progress.failed}. Check results below.`,
        );
      }
    });
  }

  function handleMigrateSingle(lpId: string) {
    setMigratingIds((prev) => new Set(prev).add(lpId));
    startTransition(async () => {
      const result = await migrateLP(lpId);
      setResults((prev) => [...prev.filter((r) => r.lpId !== lpId), result]);
      const s = await getMigrationStatus(siteId);
      setStatus(s);
      setMigratingIds((prev) => {
        const next = new Set(prev);
        next.delete(lpId);
        return next;
      });
      if (result.success) {
        toast.success(`Migrated "${result.lpTitle}" to Studio format.`);
      } else {
        toast.error(`Failed to migrate "${result.lpTitle}": ${result.error}`);
      }
    });
  }

  function handleRevert(lpId: string, title: string) {
    startTransition(async () => {
      const { success, error } = await revertMigration(lpId);
      if (success) {
        toast.success(`Reverted "${title}" to legacy format.`);
        const s = await getMigrationStatus(siteId);
        setStatus(s);
      } else {
        toast.error(`Failed to revert: ${error}`);
      }
    });
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (status.legacy === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="text-lg font-medium">
            All landing pages use Studio format
          </p>
          <p className="text-muted-foreground text-sm">
            No migration needed — {status.total} page(s) fully migrated.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Migration Status
          </CardTitle>
          <Button onClick={handleMigrateAll} disabled={isLoading} size="sm">
            {isLoading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="mr-1 h-4 w-4" />
            )}
            Migrate All ({status.legacy})
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>
              {status.migrated} of {status.total} migrated
            </span>
            <span className="text-muted-foreground">{status.percentage}%</span>
          </div>
          <Progress value={status.percentage} />
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              {status.migrated} Studio
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {status.legacy} Legacy
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Legacy LPs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Landing Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {legacyLPs.map((lp) => {
                const result = results.find((r) => r.lpId === lp.id);
                const isMigrating = migratingIds.has(lp.id);
                const isStudio = lp.useStudioFormat || result?.success;

                return (
                  <TableRow key={lp.id}>
                    <TableCell className="font-medium">{lp.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      /{lp.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lp.status === "published" ? "default" : "secondary"
                        }
                      >
                        {lp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isStudio ? (
                        <Badge variant="default" className="bg-green-500">
                          Studio
                        </Badge>
                      ) : (
                        <Badge variant="outline">Legacy</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isStudio && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewLpId(lp.id)}
                              disabled={isLoading}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMigrateSingle(lp.id)}
                              disabled={isMigrating || isLoading}
                            >
                              {isMigrating ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowRightLeft className="mr-1 h-3.5 w-3.5" />
                              )}
                              Migrate
                            </Button>
                          </>
                        )}
                        {isStudio && lp.migratedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevert(lp.id, lp.title)}
                            disabled={isLoading}
                          >
                            <Undo2 className="mr-1 h-3.5 w-3.5" />
                            Revert
                          </Button>
                        )}
                        {result && !result.success && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="h-3.5 w-3.5" />
                            {result.error}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewLpId && (
        <LPMigrationPreviewDialog
          lpId={previewLpId}
          open={!!previewLpId}
          onClose={() => setPreviewLpId(null)}
          onMigrate={() => {
            handleMigrateSingle(previewLpId);
            setPreviewLpId(null);
          }}
        />
      )}
    </div>
  );
}
