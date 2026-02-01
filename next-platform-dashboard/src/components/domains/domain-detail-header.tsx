"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  MoreVertical, 
  RefreshCw, 
  Trash2,
  Lock,
  Unlock,
  ArrowRightLeft,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DomainStatusBadge } from "./domain-status-badge";
import { DomainExpiryBadge } from "./domain-expiry-badge";
import { toast } from "sonner";
import { deleteDomain } from "@/lib/actions/domains";
import { useRouter } from "next/navigation";
import type { DomainWithDetails } from "@/types/domain";

interface DomainDetailHeaderProps {
  domain: DomainWithDetails;
}

export function DomainDetailHeader({ domain }: DomainDetailHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  
  const copyDomain = async () => {
    await navigator.clipboard.writeText(domain.domain_name);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDomain(domain.id);
      if (result.success) {
        toast.success('Domain deleted successfully');
        router.push('/dashboard/domains');
      } else {
        toast.error(result.error || 'Failed to delete domain');
      }
    } catch (error) {
      toast.error('Failed to delete domain');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{domain.domain_name}</h1>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyDomain}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <a 
                href={`https://${domain.domain_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <DomainStatusBadge status={domain.status} />
              <DomainExpiryBadge expiryDate={domain.expiry_date} />
              {domain.auto_renew && (
                <Badge variant="outline" className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Auto-Renew
                </Badge>
              )}
              {domain.whois_privacy && (
                <Badge variant="outline" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-200">
                  <Lock className="h-3 w-3" />
                  Privacy
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/dashboard/domains/${domain.id}/renew`}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew Domain
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/domains/${domain.id}/settings`}>
                  <User className="h-4 w-4 mr-2" />
                  Update Contacts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer Out
              </DropdownMenuItem>
              <DropdownMenuItem>
                {domain.transfer_lock ? (
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
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{domain.domain_name}</strong>? 
              This will mark the domain as cancelled. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
