"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Key, Shield } from "lucide-react";
import { toast } from "sonner";
import { inviteClientToPortal, revokeClientPortalAccess } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Client } from "@/types/client";

interface ClientPortalSettingsProps {
  client: Client;
}

export function ClientPortalSettings({ client }: ClientPortalSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const handleInvite = async () => {
    if (!client.email) {
      toast.error("Client must have an email address to receive portal access");
      return;
    }

    setIsLoading(true);
    try {
      const result = await inviteClientToPortal(client.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation sent! The client will receive an email with login instructions.");
        router.refresh();
      }
    } catch (_error) {
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    setIsLoading(true);
    try {
      const result = await revokeClientPortalAccess(client.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Portal access revoked");
        setRevokeDialogOpen(false);
        router.refresh();
      }
    } catch (_error) {
      toast.error("Failed to revoke access");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client Portal Access
          </CardTitle>
          <CardDescription>
            Allow your client to log in and view their sites directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {client.has_portal_access ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">Portal Access Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    {client.email} can log in to view their sites
                  </p>
                </div>
                <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Revoke Access
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Portal Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately prevent {client.name} from logging in to view their sites.
                        You can re-enable access at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button variant="destructive" onClick={handleRevoke} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Revoke Access
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                <Label>Portal Permissions</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">View Sites</p>
                      <p className="text-xs text-muted-foreground">Client can see their website previews</p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Edit Content</p>
                      <p className="text-xs text-muted-foreground">Client can make basic content changes</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Client can see site analytics</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Portal Access Disabled</p>
                  <p className="text-sm text-muted-foreground">
                    {client.email 
                      ? "Send an invitation to enable client login"
                      : "Add an email address to enable portal access"
                    }
                  </p>
                </div>
              </div>

              {client.email ? (
                <Button onClick={handleInvite} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Mail className="mr-2 h-4 w-4" />
                  Send Portal Invitation
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please add an email address in the client details to enable portal access.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Portal Features
          </CardTitle>
          <CardDescription>
            What clients can do when they log in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              View their website in preview mode
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              See site statistics and analytics
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Submit content change requests
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted" />
              Make direct content edits (optional)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
