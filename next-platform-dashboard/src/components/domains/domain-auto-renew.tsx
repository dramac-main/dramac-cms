"use client";

import { useState } from "react";
import { RefreshCw, AlertTriangle, CircleCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, addDays, isAfter } from "date-fns";
import { toast } from "sonner";
import { updateDomainAutoRenew } from "@/lib/actions/domains";

interface DomainAutoRenewProps {
  domainId: string;
  enabled: boolean | null;
  expiryDate: string | null;
}

export function DomainAutoRenew({ domainId, enabled, expiryDate }: DomainAutoRenewProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(enabled ?? false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Calculate expiry status
  const expiry = expiryDate ? new Date(expiryDate) : null;
  const now = new Date();
  const isExpiringSoon = expiry ? !isAfter(expiry, addDays(now, 30)) : false;
  const isExpiringVerySoon = expiry ? !isAfter(expiry, addDays(now, 7)) : false;
  const isExpired = expiry ? !isAfter(expiry, now) : false;
  
  const handleToggle = async (newValue: boolean) => {
    setIsUpdating(true);
    try {
      const result = await updateDomainAutoRenew(domainId, newValue);
      if (result.success) {
        setIsEnabled(newValue);
        toast.success(
          newValue 
            ? 'Auto-renewal enabled' 
            : 'Auto-renewal disabled'
        );
      } else {
        toast.error(result.error || 'Failed to update auto-renewal');
      }
    } catch (error) {
      toast.error('Failed to update auto-renewal');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="auto-renew" className="text-sm font-medium">
            Auto-Renewal
          </Label>
          <p className="text-xs text-muted-foreground">
            Automatically renew before expiry
          </p>
        </div>
        <Switch
          id="auto-renew"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isUpdating || isExpired}
        />
      </div>
      
      {/* Status */}
      <div className="flex items-center gap-2">
        {isEnabled ? (
          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-200">
            <CircleCheck className="h-3 w-3" />
            Protected
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-200">
            <AlertTriangle className="h-3 w-3" />
            Manual Renewal
          </Badge>
        )}
      </div>
      
      {/* Expiry Info */}
      {expiry && (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {isExpired ? (
              <span className="text-red-600">Expired on {format(expiry, 'MMM dd, yyyy')}</span>
            ) : (
              <span>Expires on {format(expiry, 'MMM dd, yyyy')}</span>
            )}
          </div>
          
          {isEnabled && !isExpired && (
            <p className="text-xs text-muted-foreground pl-6">
              Will renew automatically ~7 days before expiry
            </p>
          )}
        </div>
      )}
      
      {/* Warnings */}
      {!isEnabled && isExpiringSoon && !isExpired && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {isExpiringVerySoon 
              ? 'Domain expires in less than 7 days! Enable auto-renewal or renew manually.'
              : 'Domain expires soon. Consider enabling auto-renewal.'}
          </AlertDescription>
        </Alert>
      )}
      
      {isExpired && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This domain has expired. Contact support to renew or restore.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
