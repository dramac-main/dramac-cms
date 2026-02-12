"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DomainList, DomainFiltersComponent } from "@/components/domains";
import type { DomainWithDetails, DomainFilters } from "@/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { renewDomain } from "@/lib/actions/domains";
import { toast } from "sonner";

interface DomainListClientProps {
  initialDomains: DomainWithDetails[];
}

export function DomainListClient({ initialDomains }: DomainListClientProps) {
  const router = useRouter();
  const [domains] = useState(initialDomains);
  const [filters, setFilters] = useState<DomainFilters>({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [renewDialog, setRenewDialog] = useState<DomainWithDetails | null>(null);
  const [renewYears, setRenewYears] = useState("1");
  const [isRenewing, setIsRenewing] = useState(false);

  // Filter domains client-side for immediate feedback
  const filteredDomains = domains.filter(domain => {
    if (filters.search && !(domain.domain_name ?? '').toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && domain.status !== filters.status) {
      return false;
    }
    if (filters.tld && domain.tld !== filters.tld) {
      return false;
    }
    return true;
  });

  // Sort domains
  const sortedDomains = [...filteredDomains].sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case 'domain_name':
        comparison = a.domain_name.localeCompare(b.domain_name);
        break;
      case 'expiry_date':
        comparison = new Date(a.expiry_date || 0).getTime() - new Date(b.expiry_date || 0).getTime();
        break;
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleManage = (domain: DomainWithDetails) => {
    router.push(`/dashboard/domains/${domain.id}`);
  };

  const handleRenew = (domain: DomainWithDetails) => {
    setRenewDialog(domain);
  };

  const handleConfirmRenew = async () => {
    if (!renewDialog) return;
    
    setIsRenewing(true);
    try {
      const result = await renewDomain(renewDialog.id, parseInt(renewYears));
      if (result.success) {
        toast.success(`Domain renewed successfully! New expiry: ${result.data?.newExpiryDate}`);
        setRenewDialog(null);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to renew domain');
      }
    } catch (error) {
      toast.error('An error occurred while renewing the domain');
      console.error(error);
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="space-y-4">
      <DomainFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
      />
      
      <DomainList
        domains={sortedDomains}
        onManage={handleManage}
        onRenew={handleRenew}
      />

      {/* Renew Dialog */}
      <Dialog open={!!renewDialog} onOpenChange={() => setRenewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Domain</DialogTitle>
            <DialogDescription>
              Extend the registration period for {renewDialog?.domain_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Renewal Period</Label>
              <Select value={renewYears} onValueChange={setRenewYears}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Current expiry: {renewDialog?.expiry_date 
                ? new Date(renewDialog.expiry_date).toLocaleDateString() 
                : 'Unknown'}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRenew} disabled={isRenewing}>
              {isRenewing ? 'Renewing...' : 'Renew Domain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
