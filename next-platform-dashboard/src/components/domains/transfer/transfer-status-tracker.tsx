"use client";

// src/components/domains/transfer/transfer-status-tracker.tsx
// Transfer status and progress tracking component

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  CircleX,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TransferStatus } from "@/lib/resellerclub/transfers";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

interface TransferStatusTrackerProps {
  status: TransferStatus;
  domainName: string;
  transferType: 'in' | 'out';
  currentStep: number;
  totalSteps: number;
  initiatedAt: string;
  completedAt?: string | null;
  failureReason?: string | null;
}

const TRANSFER_IN_STEPS = [
  { label: 'Initiated', description: 'Transfer request submitted' },
  { label: 'Auth Verified', description: 'Authorization code validated' },
  { label: 'Pending Approval', description: 'Awaiting registrar approval' },
  { label: 'Processing', description: 'Transfer in progress' },
  { label: 'Complete', description: 'Domain transferred successfully' },
];

const TRANSFER_OUT_STEPS = [
  { label: 'Unlocked', description: 'Transfer lock disabled' },
  { label: 'Auth Code Sent', description: 'Authorization code generated' },
  { label: 'Complete', description: 'Domain transferred out' },
];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'muted';

const STATUS_CONFIG: Record<TransferStatus, {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
}> = {
  'pending': { label: 'Pending', variant: 'secondary', icon: Clock },
  'awaiting-auth': { label: 'Awaiting Auth', variant: 'secondary', icon: Clock },
  'auth-submitted': { label: 'Auth Submitted', variant: 'secondary', icon: Clock },
  'in-progress': { label: 'In Progress', variant: 'info', icon: Loader2 },
  'completed': { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  'failed': { label: 'Failed', variant: 'destructive', icon: CircleX },
  'cancelled': { label: 'Cancelled', variant: 'outline', icon: CircleX },
};

export function TransferStatusTracker({
  status,
  domainName,
  transferType,
  currentStep,
  totalSteps,
  initiatedAt,
  completedAt,
  failureReason,
}: TransferStatusTrackerProps) {
  const steps = transferType === 'in' ? TRANSFER_IN_STEPS : TRANSFER_OUT_STEPS;
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-mono">{domainName}</CardTitle>
            <CardDescription>
              Transfer {transferType === 'in' ? 'In' : 'Out'} •
              Started {formatDistanceToNow(new Date(initiatedAt), { addSuffix: true })}
            </CardDescription>
          </div>
          <div className={cn(badgeVariants({ variant: statusConfig.variant }), "flex items-center gap-1")}>
            <StatusIcon className={`h-3 w-3 ${status === 'in-progress' ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep - 1;
            const isFailed = status === 'failed' && isCurrent;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCompleted
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : isCurrent
                      ? isFailed
                        ? 'bg-red-50 dark:bg-red-950/20'
                        : 'bg-blue-50 dark:bg-blue-950/20'
                      : 'bg-muted/50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? isFailed
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent && !isFailed ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFailed ? (
                    <CircleX className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isCompleted || isCurrent ? '' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        {/* Failure Reason */}
        {status === 'failed' && failureReason && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-400">Transfer Failed</p>
              <p className="text-sm text-red-600 dark:text-red-300">{failureReason}</p>
            </div>
          </div>
        )}

        {/* Completion Info */}
        {status === 'completed' && completedAt && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">Transfer Complete</p>
              <p className="text-sm text-green-600 dark:text-green-300">
                Completed {formatDistanceToNow(new Date(completedAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
