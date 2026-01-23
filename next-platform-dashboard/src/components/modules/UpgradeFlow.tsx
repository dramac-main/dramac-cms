'use client';

/**
 * Phase EM-41: Module Upgrade Flow UI
 * 
 * A step-by-step wizard for upgrading module versions:
 * - Shows upgrade plan and breaking changes
 * - Creates backup before upgrade
 * - Runs migrations with progress
 * - Verifies installation
 * - Provides rollback option on failure
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Loader2,
  Database,
  Shield,
  Clock,
  ChevronRight,
  XCircle
} from 'lucide-react';

// =============================================================
// TYPES
// =============================================================

interface UpgradeFlowProps {
  siteId: string;
  moduleId: string;
  moduleSourceId: string;
  currentVersion: string;
  targetVersion: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface UpgradePlan {
  migrations: Array<{
    id: string;
    description: string | null;
    to_version: string;
    is_reversible: boolean;
    estimated_duration_seconds: number;
  }>;
  totalDuration: number;
  hasBreakingChanges: boolean;
  breakingVersions: string[];
  warnings: string[];
  requiresMaintenance: boolean;
}

type UpgradeStep = 'plan' | 'backup' | 'migrate' | 'verify' | 'complete' | 'error';

// =============================================================
// COMPONENT
// =============================================================

export function UpgradeFlow({
  siteId,
  moduleId,
  moduleSourceId,
  currentVersion,
  targetVersion,
  onComplete,
  onCancel
}: UpgradeFlowProps) {
  // State
  const [step, setStep] = useState<UpgradeStep>('plan');
  const [upgradePlan, setUpgradePlan] = useState<UpgradePlan | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentMigration, setCurrentMigration] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [backupId, setBackupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationsCompleted, setMigrationsCompleted] = useState(0);

  // Load upgrade plan on mount
  useEffect(() => {
    loadUpgradePlan();
  }, [moduleSourceId, currentVersion, targetVersion]);

  // =============================================================
  // API CALLS
  // =============================================================

  const loadUpgradePlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/modules/${moduleId}/versions/upgrade-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          moduleSourceId,
          fromVersion: currentVersion,
          toVersion: targetVersion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load upgrade plan');
      }

      const plan = await response.json();
      setUpgradePlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upgrade plan');
    } finally {
      setLoading(false);
    }
  }, [moduleId, siteId, moduleSourceId, currentVersion, targetVersion]);

  const startUpgrade = async () => {
    if (!upgradePlan) return;

    try {
      // Step 1: Create backup
      setStep('backup');
      setProgress(10);

      const backupResponse = await fetch(`/api/modules/${moduleId}/versions/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          moduleSourceId,
          type: 'pre_upgrade'
        })
      });

      if (!backupResponse.ok) {
        const errorData = await backupResponse.json();
        throw new Error(errorData.error || 'Failed to create backup');
      }

      const { backupId: newBackupId } = await backupResponse.json();
      setBackupId(newBackupId);
      setProgress(25);

      // Step 2: Run migrations
      setStep('migrate');

      for (let i = 0; i < upgradePlan.migrations.length; i++) {
        const migration = upgradePlan.migrations[i];
        setCurrentMigration(migration.description || `Migrating to ${migration.to_version}`);

        const migrateResponse = await fetch(`/api/modules/${moduleId}/versions/migrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId,
            migrationId: migration.id,
            direction: 'up'
          })
        });

        if (!migrateResponse.ok) {
          const errorData = await migrateResponse.json();
          throw new Error(errorData.error || `Migration failed: ${migration.to_version}`);
        }

        setMigrationsCompleted(i + 1);
        setProgress(25 + ((i + 1) / upgradePlan.migrations.length) * 50);
      }

      // Step 3: Verify
      setStep('verify');
      setProgress(80);

      const verifyResponse = await fetch(`/api/modules/${moduleId}/versions/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          moduleSourceId,
          version: targetVersion
        })
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      setProgress(100);
      setStep('complete');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed');
      setStep('error');
    }
  };

  const rollback = async () => {
    if (!backupId) {
      setError('No backup available for rollback');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/modules/${moduleId}/versions/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          backupId,
          restoreData: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rollback failed');
      }

      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // RENDER HELPERS
  // =============================================================

  const getStepIndex = (s: UpgradeStep): number => {
    const steps: UpgradeStep[] = ['plan', 'backup', 'migrate', 'verify', 'complete'];
    return steps.indexOf(s);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'plan', label: 'Plan' },
      { id: 'backup', label: 'Backup' },
      { id: 'migrate', label: 'Migrate' },
      { id: 'verify', label: 'Verify' },
      { id: 'complete', label: 'Complete' }
    ];

    return (
      <div className="flex gap-1 mb-6">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`flex-1 h-2 rounded ${
              step === 'error' ? 'bg-red-200' :
              step === s.id ? 'bg-blue-500' :
              getStepIndex(step) > i ? 'bg-green-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  // =============================================================
  // ERROR STATE
  // =============================================================

  if (step === 'error' || (error && step !== 'plan')) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Upgrade Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          {migrationsCompleted > 0 && (
            <p className="text-sm text-muted-foreground">
              {migrationsCompleted} of {upgradePlan?.migrations.length || 0} migrations were completed before the error.
            </p>
          )}

          <div className="flex gap-4 pt-4">
            {backupId && (
              <Button variant="outline" onClick={rollback} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Rollback to Previous Version
              </Button>
            )}
            <Button variant="ghost" onClick={onCancel}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =============================================================
  // LOADING STATE
  // =============================================================

  if (loading && step === 'plan') {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // =============================================================
  // MAIN RENDER
  // =============================================================

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Upgrade Module
          <Badge variant="outline">{currentVersion}</Badge>
          <ArrowRight className="h-4 w-4" />
          <Badge>{targetVersion}</Badge>
        </CardTitle>
        <CardDescription>
          {step === 'plan' && 'Review the upgrade plan before proceeding'}
          {step === 'backup' && 'Creating a backup of your data...'}
          {step === 'migrate' && 'Running database migrations...'}
          {step === 'verify' && 'Verifying the installation...'}
          {step === 'complete' && 'Upgrade completed successfully!'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Progress bar */}
        {step !== 'plan' && step !== 'complete' && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{currentMigration || 'Processing...'}</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Plan view */}
        {step === 'plan' && upgradePlan && (
          <div className="space-y-4">
            {/* Breaking changes warning */}
            {upgradePlan.hasBreakingChanges && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Breaking Changes</AlertTitle>
                <AlertDescription>
                  This upgrade includes breaking changes in versions:{' '}
                  {upgradePlan.breakingVersions.join(', ')}. Please review the changelog carefully.
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {upgradePlan.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {upgradePlan.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Maintenance window */}
            {upgradePlan.requiresMaintenance && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>Maintenance Required</AlertTitle>
                <AlertDescription>
                  This upgrade requires a maintenance window. Your module will be temporarily unavailable.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Migrations list */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Migrations to run ({upgradePlan.migrations.length})
              </h4>
              <ScrollArea className="h-48 rounded border p-3">
                <ul className="space-y-2">
                  {upgradePlan.migrations.map((migration, i) => (
                    <li key={migration.id} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{migration.to_version}</span>
                          {!migration.is_reversible && (
                            <Badge variant="outline" className="text-xs">
                              Non-reversible
                            </Badge>
                          )}
                        </div>
                        {migration.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {migration.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>A backup will be created before upgrade</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>~{Math.ceil(upgradePlan.totalDuration / 60)} min</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button onClick={startUpgrade}>
                Start Upgrade
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Complete view */}
        {step === 'complete' && (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium">Upgrade Complete!</h3>
            <p className="text-muted-foreground mb-6">
              Module has been successfully upgraded to version {targetVersion}
            </p>
            <Button onClick={onComplete}>
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UpgradeFlow;
