"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MoreVertical, 
  RefreshCw, 
  Settings, 
  Mail, 
  Server,
  ExternalLink,
  ArrowRightLeft,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
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
import { toast } from "sonner";
import { setTransferLock } from "@/lib/actions/transfers";
import { deleteDomain } from "@/lib/actions/domains";

interface DomainQuickActionsProps {
  domainId: string;
  domainName: string;
  isLocked?: boolean;
  onRenew?: () => void;
  onDelete?: () => void;
}

export function DomainQuickActions({ 
  domainId, 
  domainName,
  isLocked = true,
  onRenew,
  onDelete
}: DomainQuickActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lockState, setLockState] = useState(isLocked);

  const copyDomain = async () => {
    await navigator.clipboard.writeText(domainName);
    toast.success('Copied to clipboard');
  };

  const handleToggleLock = () => {
    startTransition(async () => {
      const result = await setTransferLock(domainId, !lockState);
      if (result.success) {
        setLockState(!lockState);
        toast.success(lockState ? 'Domain unlocked for transfer' : 'Domain locked');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update transfer lock');
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDomain(domainId);
      if (result.success) {
        toast.success('Domain deleted');
        onDelete?.();
        router.push('/dashboard/domains');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete domain');
      }
      setShowDeleteDialog(false);
    });
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={copyDomain}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Domain
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <a 
              href={`https://${domainName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/domains/${domainId}/dns`}>
              <Server className="h-4 w-4 mr-2" />
              DNS Settings
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/domains/${domainId}/email`}>
              <Mail className="h-4 w-4 mr-2" />
              Email Setup
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/domains/${domainId}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Domain Settings
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onRenew}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Renew Now
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/domains/transfer?domainId=${domainId}`}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Out
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleToggleLock} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : lockState ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Domain
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock Domain
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Domain
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{domainName}</strong> from your account. 
              The domain registration at the registrar will remain active until it expires. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Domain'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
