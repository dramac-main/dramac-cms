"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Globe, 
  MoreHorizontal, 
  ExternalLink, 
  Settings, 
  RefreshCw, 
  Mail,
  Shield,
  AlertCircle,
  Check,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DomainWithDetails, DomainStatus } from "@/types/domain";

interface DomainListProps {
  domains: DomainWithDetails[];
  onManage: (domain: DomainWithDetails) => void;
  onRenew: (domain: DomainWithDetails) => void;
  isLoading?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<DomainStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Check }> = {
  active: { label: 'Active', variant: 'default', icon: Check },
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  expired: { label: 'Expired', variant: 'destructive', icon: AlertCircle },
  suspended: { label: 'Suspended', variant: 'destructive', icon: AlertCircle },
  transferred: { label: 'Transferred', variant: 'outline', icon: ExternalLink },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: AlertCircle },
  redemption: { label: 'Redemption', variant: 'destructive', icon: AlertCircle },
};

export function DomainList({
  domains,
  onManage,
  onRenew,
  isLoading,
  className,
}: DomainListProps) {
  const router = useRouter();
  const [sortColumn, setSortColumn] = useState<'domain_name' | 'expiry_date' | 'status'>('domain_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleRowClick = (domain: DomainWithDetails) => {
    router.push(`/dashboard/domains/${domain.id}`);
  };

  const handleSort = (column: 'domain_name' | 'expiry_date' | 'status') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedDomains = [...domains].sort((a, b) => {
    let comparison = 0;
    
    switch (sortColumn) {
      case 'domain_name':
        comparison = a.domain_name.localeCompare(b.domain_name);
        break;
      case 'expiry_date':
        comparison = new Date(a.expiry_date || 0).getTime() - new Date(b.expiry_date || 0).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-lg border">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className={cn("text-center py-12 border-2 border-dashed rounded-lg", className)}>
        <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No domains yet</h3>
        <p className="text-muted-foreground mt-1">
          Register your first domain to get started
        </p>
        <Button className="mt-4" onClick={() => window.location.href = '/dashboard/domains/search'}>
          Search for Domains
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('domain_name')}
            >
              Domain {sortColumn === 'domain_name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status')}
            >
              Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('expiry_date')}
            >
              Expiry {sortColumn === 'expiry_date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Features</TableHead>
            <TableHead>Site</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDomains.map(domain => {
            const statusConfig = STATUS_CONFIG[domain.status];
            const expiringSoon = isExpiringSoon(domain.expiry_date);
            
            return (
              <TableRow 
                key={domain.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(domain)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{domain.domain_name}</p>
                      <p className="text-xs text-muted-foreground">{domain.tld}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>
                    <statusConfig.icon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {domain.expiry_date ? (
                    <div className={cn(expiringSoon && "text-amber-600")}>
                      <p className="text-sm">
                        {format(new Date(domain.expiry_date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(domain.expiry_date), { addSuffix: true })}
                      </p>
                      {expiringSoon && (
                        <Badge variant="outline" className="mt-1 text-amber-600 border-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {domain.whois_privacy && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Privacy
                      </Badge>
                    )}
                    {domain.auto_renew && (
                      <Badge variant="outline" className="text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Auto-Renew
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {domain.site ? (
                    <a 
                      href={`/dashboard/${domain.site.id}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {domain.site.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">Not connected</span>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onManage(domain)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Domain
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/domains/${domain.id}/dns`)}>
                        <Globe className="h-4 w-4 mr-2" />
                        DNS Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/domains/${domain.id}/email`)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email Accounts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/domains/${domain.id}/settings`)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Domain Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onRenew(domain)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renew Domain
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
