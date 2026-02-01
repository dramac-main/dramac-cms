"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  Trash2,
  Save,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DomainSettingsFormProps {
  domainId: string;
  domainName: string;
  transferLock: boolean | null;
  whoisPrivacy: boolean | null;
  autoRenew: boolean | null;
  contact: {
    name: string;
    organization: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  };
}

export function DomainSettingsForm({
  domainId,
  domainName,
  transferLock,
  whoisPrivacy,
  autoRenew,
  contact: initialContact,
}: DomainSettingsFormProps) {
  const router = useRouter();
  const [isTransferLocked, setIsTransferLocked] = useState(transferLock ?? true);
  const [hasWhoisPrivacy, setHasWhoisPrivacy] = useState(whoisPrivacy ?? false);
  const [hasAutoRenew, setHasAutoRenew] = useState(autoRenew ?? true);
  const [contact, setContact] = useState(initialContact);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const handleTransferLockToggle = async (checked: boolean) => {
    const prevValue = isTransferLocked;
    setIsTransferLocked(checked);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success(checked ? "Transfer lock enabled" : "Transfer lock disabled", {
      description: checked 
        ? "Your domain is now protected from unauthorized transfers"
        : "Your domain can now be transferred to another registrar",
    });
  };

  const handleWhoisPrivacyToggle = async (checked: boolean) => {
    setHasWhoisPrivacy(checked);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success(checked ? "WHOIS privacy enabled" : "WHOIS privacy disabled", {
      description: checked 
        ? "Your contact information is now hidden from public WHOIS lookups"
        : "Your contact information is now visible in public WHOIS lookups",
    });
  };

  const handleAutoRenewToggle = async (checked: boolean) => {
    setHasAutoRenew(checked);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success(checked ? "Auto-renewal enabled" : "Auto-renewal disabled", {
      description: checked 
        ? "Your domain will be automatically renewed before expiry"
        : "Remember to manually renew your domain before it expires",
    });
  };

  const handleSaveContact = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    toast.success("Contact information saved", {
      description: "Your registrant contact details have been updated",
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsDeleting(false);
    toast.success("Domain deleted", {
      description: `${domainName} has been removed from your account`,
    });
    
    router.push("/dashboard/domains");
  };

  const handleStartTransfer = async () => {
    setTransferDialogOpen(false);
    toast.info("Transfer initiated", {
      description: "You will receive an email with further instructions to complete the transfer",
    });
  };

  return (
    <div className="space-y-6">
      {/* Domain Lock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Domain Lock
          </CardTitle>
          <CardDescription>
            Protect your domain from unauthorized transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Transfer Lock</p>
              <p className="text-sm text-muted-foreground">
                When enabled, the domain cannot be transferred to another registrar
              </p>
            </div>
            <Switch 
              checked={isTransferLocked} 
              onCheckedChange={handleTransferLockToggle}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* WHOIS Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            WHOIS Privacy
          </CardTitle>
          <CardDescription>
            Hide your personal information from public WHOIS lookups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Privacy Protection</p>
              <p className="text-sm text-muted-foreground">
                Replace your contact info with privacy service details
              </p>
            </div>
            <Switch 
              checked={hasWhoisPrivacy} 
              onCheckedChange={handleWhoisPrivacyToggle}
            />
          </div>
          
          {hasWhoisPrivacy && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Privacy Enabled</AlertTitle>
              <AlertDescription>
                Your personal information is hidden from public WHOIS lookups.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Auto-Renewal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Auto-Renewal
          </CardTitle>
          <CardDescription>
            Automatically renew your domain before it expires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Auto-Renew</p>
              <p className="text-sm text-muted-foreground">
                Domain will be renewed 7 days before expiry
              </p>
            </div>
            <Switch 
              checked={hasAutoRenew} 
              onCheckedChange={handleAutoRenewToggle}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registrant Contact
          </CardTitle>
          <CardDescription>
            Contact information associated with this domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input 
                id="organization" 
                value={contact.organization}
                onChange={(e) => setContact({ ...contact, organization: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={contact.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                value={contact.city}
                onChange={(e) => setContact({ ...contact, city: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input 
                id="state" 
                value={contact.state}
                onChange={(e) => setContact({ ...contact, state: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                value={contact.country}
                onChange={(e) => setContact({ ...contact, country: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipcode">Postal Code</Label>
              <Input 
                id="zipcode" 
                value={contact.zipcode}
                onChange={(e) => setContact({ ...contact, zipcode: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveContact} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Contact'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for this domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Domain</p>
              <p className="text-sm text-muted-foreground">
                Remove this domain from your account. This cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {domainName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The domain will be removed from your 
                    account and may become available for others to register.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Domain
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Transfer Domain Out</p>
              <p className="text-sm text-muted-foreground">
                Transfer this domain to another registrar
              </p>
            </div>
            <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
              Start Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer {domainName}</DialogTitle>
            <DialogDescription>
              Initiate a transfer of this domain to another registrar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Before you transfer</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Transfer lock must be disabled</li>
                  <li>Domain must not be within 60 days of registration or last transfer</li>
                  <li>You will receive an authorization code via email</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartTransfer}>
              Get Authorization Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
