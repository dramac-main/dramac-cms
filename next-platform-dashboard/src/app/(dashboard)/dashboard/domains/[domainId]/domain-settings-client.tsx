"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  updateDomainAutoRenew, 
  updateDomainPrivacy, 
  deleteDomain 
} from "@/lib/actions/domains";
import type { DomainWithDetails } from "@/types/domain";

interface DomainSettingsClientProps {
  domain: DomainWithDetails;
}

export function DomainSettingsClient({ domain }: DomainSettingsClientProps) {
  const router = useRouter();
  const [autoRenew, setAutoRenew] = useState(domain.auto_renew);
  const [privacy, setPrivacy] = useState(domain.whois_privacy);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleAutoRenewChange = async (checked: boolean) => {
    setIsUpdating('autoRenew');
    try {
      const result = await updateDomainAutoRenew(domain.id, checked);
      if (result.success) {
        setAutoRenew(checked);
        toast.success(`Auto-renewal ${checked ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(result.error || 'Failed to update auto-renewal');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  const handlePrivacyChange = async (checked: boolean) => {
    setIsUpdating('privacy');
    try {
      const result = await updateDomainPrivacy(domain.id, checked);
      if (result.success) {
        setPrivacy(checked);
        toast.success(`WHOIS privacy ${checked ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(result.error || 'Failed to update privacy');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async () => {
    setIsUpdating('delete');
    try {
      const result = await deleteDomain(domain.id);
      if (result.success) {
        toast.success('Domain cancelled successfully');
        router.push('/dashboard/domains');
      } else {
        toast.error(result.error || 'Failed to cancel domain');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage domain settings and protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Renewal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Auto-Renewal
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically renew before expiry
            </p>
          </div>
          <Switch
            checked={autoRenew}
            onCheckedChange={handleAutoRenewChange}
            disabled={isUpdating === 'autoRenew'}
          />
        </div>
        
        <Separator />
        
        {/* WHOIS Privacy */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              WHOIS Privacy
            </Label>
            <p className="text-xs text-muted-foreground">
              Hide contact info from public WHOIS
            </p>
          </div>
          <Switch
            checked={privacy}
            onCheckedChange={handlePrivacyChange}
            disabled={isUpdating === 'privacy'}
          />
        </div>
        
        <Separator />
        
        {/* Danger Zone */}
        <div className="pt-4">
          <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={isUpdating === 'delete'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Domain
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel the domain {domain.domain_name}. 
                  This action cannot be undone. The domain may become available 
                  for others to register.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Cancel Domain
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
