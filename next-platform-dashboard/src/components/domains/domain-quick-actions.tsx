"use client";

import Link from "next/link";
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
  Unlock
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
import { toast } from "sonner";

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
  const copyDomain = async () => {
    await navigator.clipboard.writeText(domainName);
    toast.success('Copied to clipboard');
  };
  
  return (
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
        
        <DropdownMenuItem>
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Transfer Out
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          {isLocked ? (
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
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Domain
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
