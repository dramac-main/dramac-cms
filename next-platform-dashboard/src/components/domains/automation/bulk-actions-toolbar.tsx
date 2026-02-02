"use client";

// src/components/domains/automation/bulk-actions-toolbar.tsx
// Bulk actions toolbar for domain management

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  RefreshCw,
  Shield,
  Activity,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { bulkSetAutoRenew, bulkRunHealthCheck } from "@/lib/actions/automation";
import { toast } from "sonner";

interface BulkActionsToolbarProps {
  selectedDomainIds: string[];
  onClearSelection?: () => void;
}

type BulkAction = 'enable-auto-renew' | 'disable-auto-renew' | 'health-check';

export function BulkActionsToolbar({ selectedDomainIds, onClearSelection }: BulkActionsToolbarProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: BulkAction | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: '',
    description: '',
  });

  const selectedCount = selectedDomainIds.length;

  const handleAction = (action: BulkAction) => {
    const actionConfig = {
      'enable-auto-renew': {
        title: 'Enable Auto-Renewal',
        description: `Enable auto-renewal for ${selectedCount} domain${selectedCount > 1 ? 's' : ''}?`,
      },
      'disable-auto-renew': {
        title: 'Disable Auto-Renewal',
        description: `Disable auto-renewal for ${selectedCount} domain${selectedCount > 1 ? 's' : ''}? Your domains will not renew automatically.`,
      },
      'health-check': {
        title: 'Run Health Checks',
        description: `Run health checks on ${selectedCount} domain${selectedCount > 1 ? 's' : ''}?`,
      },
    };

    setConfirmDialog({
      open: true,
      action,
      ...actionConfig[action],
    });
  };

  const executeAction = () => {
    if (!confirmDialog.action) return;

    startTransition(async () => {
      let result: { success: boolean; data?: { successful: number; failed: number; total: number }; error?: string };

      switch (confirmDialog.action) {
        case 'enable-auto-renew':
          result = await bulkSetAutoRenew(selectedDomainIds, true);
          break;
        case 'disable-auto-renew':
          result = await bulkSetAutoRenew(selectedDomainIds, false);
          break;
        case 'health-check':
          result = await bulkRunHealthCheck(selectedDomainIds);
          break;
        default:
          result = { success: false, error: 'Unknown action' };
      }

      if (result.success && result.data) {
        const { successful, failed, total } = result.data;
        if (failed === 0) {
          toast.success(`Successfully updated ${successful} domain${successful > 1 ? 's' : ''}`);
        } else {
          toast.warning(`Updated ${successful}/${total} domains. ${failed} failed.`);
        }
        onClearSelection?.();
      } else {
        toast.error(result.error || 'Bulk action failed');
      }

      setConfirmDialog({ open: false, action: null, title: '', description: '' });
    });
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 flex-1">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {selectedCount} domain{selectedCount > 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 px-2 text-muted-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Bulk Actions
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction('enable-auto-renew')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Enable Auto-Renewal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('disable-auto-renew')}>
              <RefreshCw className="h-4 w-4 mr-2 opacity-50" />
              Disable Auto-Renewal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAction('health-check')}>
              <Activity className="h-4 w-4 mr-2" />
              Run Health Checks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
