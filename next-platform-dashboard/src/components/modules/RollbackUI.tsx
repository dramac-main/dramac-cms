'use client';

/**
 * Phase EM-41: Module Rollback UI
 * 
 * Interface for rolling back module versions:
 * - Shows available rollback points
 * - Displays warnings and blockers
 * - Executes rollback with progress
 * - Option to restore from backup
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Loader2,
  Database,
  Clock,
  Archive,
  XCircle,
  History
} from 'lucide-react';
import { format } from 'date-fns';

// =============================================================
// TYPES
// =============================================================

interface RollbackUIProps {
  siteId: string;
  moduleId: string;
  moduleSourceId: string;
  currentVersion: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface RollbackPoint {
  version: {
    id: string;
    version: string;
    changelog: string | null;
    is_breaking_change: boolean;
  };
  installedAt: string;
  hasBackup: boolean;
  backupId: string | null;
  canRollback: boolean;
  blockers: string[];
}

interface RollbackPlan {
  currentVersion: { version: string };
  targetVersion: { version: string };
  migrations: Array<{
    to_version: string;
    is_reversible: boolean;
    down_sql: string | null;
  }>;
  estimatedDuration: number;
  requiresMaintenance: boolean;
  canRollback: boolean;
  blockers: string[];
  warnings: string[];
  hasBackup: boolean;
}

// =============================================================
// COMPONENT
// =============================================================

export function RollbackUI({
  siteId,
  moduleId,
  moduleSourceId,
  currentVersion,
  onComplete,
  onCancel
}: RollbackUIProps) {
  // State
  const [rollbackPoints, setRollbackPoints] = useState<RollbackPoint[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [rollbackPlan, setRollbackPlan] = useState<RollbackPlan | null>(null);
  const [restoreData, setRestoreData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load rollback points on mount
  useEffect(() => {
    loadRollbackPoints();
  }, []);

  // Load rollback plan when version selected
  useEffect(() => {
    if (selectedVersion) {
      loadRollbackPlan(selectedVersion);
    } else {
      setRollbackPlan(null);
    }
  }, [selectedVersion]);

  // =============================================================
  // API CALLS
  // =============================================================

  const loadRollbackPoints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/modules/${moduleId}/versions/rollback-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          moduleSourceId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load rollback points');
      }

      const points = await response.json();
      setRollbackPoints(points);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rollback points');
    } finally {
      setLoading(false);
    }
  }, [moduleId, siteId, moduleSourceId]);

  const loadRollbackPlan = async (versionId: string) => {
    try {
      const response = await fetch(`/api/modules/${moduleId}/versions/rollback-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          moduleSourceId,
          targetVersionId: versionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load rollback plan');
      }

      const plan = await response.json();
      setRollbackPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rollback plan');
    }
  };

  const executeRollback = async () => {
    if (!selectedVersion) return;

    setExecuting(true);
    setError(null);

    try {
      const response = await fetch(`/api/modules/${moduleId}/versions/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          moduleSourceId,
          targetVersionId: selectedVersion,
          restoreData,
          createBackup: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rollback failed');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
      } else {
        throw new Error(result.error || 'Rollback failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setExecuting(false);
    }
  };

  // =============================================================
  // RENDER
  // =============================================================

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Rollback Complete!</h3>
          <p className="text-muted-foreground mb-6">
            Module has been rolled back to version{' '}
            {rollbackPlan?.targetVersion.version || selectedVersion}
          </p>
          <Button onClick={onComplete}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No rollback points
  if (rollbackPoints.length === 0) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Previous Versions</AlertTitle>
            <AlertDescription>
              There are no previous versions available to roll back to. This module has only been installed at the current version.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="ghost" onClick={onCancel}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          Rollback Module
        </CardTitle>
        <CardDescription>
          Current version: <Badge variant="outline">{currentVersion}</Badge>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Rollback points list */}
        <div>
          <h4 className="font-medium mb-3">Select a version to roll back to:</h4>
          <div className="space-y-2">
            {rollbackPoints.map((point) => (
              <div
                key={point.version.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedVersion === point.version.id
                    ? 'border-blue-500 bg-blue-50'
                    : point.canRollback
                    ? 'hover:border-gray-400'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (point.canRollback) {
                    setSelectedVersion(point.version.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          v{point.version.version}
                        </span>
                        {point.version.is_breaking_change && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            Breaking
                          </Badge>
                        )}
                        {point.hasBackup && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            <Archive className="h-3 w-3 mr-1" />
                            Backup
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Installed {format(new Date(point.installedAt), 'PPp')}
                      </p>
                    </div>
                  </div>

                  {!point.canRollback && point.blockers.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      Cannot rollback
                    </Badge>
                  )}
                </div>

                {!point.canRollback && point.blockers.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    {point.blockers.map((blocker, i) => (
                      <p key={i}>• {blocker}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rollback plan details */}
        {rollbackPlan && (
          <>
            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Rollback Plan</h4>

              {/* Warnings */}
              {rollbackPlan.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {rollbackPlan.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Blockers */}
              {!rollbackPlan.canRollback && rollbackPlan.blockers.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Cannot Rollback</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {rollbackPlan.blockers.map((blocker, i) => (
                        <li key={i}>{blocker}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Migrations to reverse */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>{rollbackPlan.migrations.length} migrations will be reversed</span>
              </div>

              {/* Duration estimate */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Estimated time: ~{Math.ceil(rollbackPlan.estimatedDuration / 60)} min
                </span>
              </div>

              {/* Restore data option */}
              {rollbackPlan.hasBackup && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restore-data"
                    checked={restoreData}
                    onCheckedChange={(checked) => setRestoreData(checked as boolean)}
                  />
                  <label
                    htmlFor="restore-data"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Restore data from backup
                  </label>
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            onClick={executeRollback}
            disabled={!selectedVersion || !rollbackPlan?.canRollback || executing}
            variant="destructive"
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rolling back...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rollback
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={executing}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default RollbackUI;
