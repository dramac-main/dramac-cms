"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Key, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  inviteClientToPortal,
  revokeClientPortalAccess,
} from "@/lib/actions/clients";
import { updatePortalPermissions } from "@/lib/portal/portal-auth";
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

interface PermissionToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function PermissionToggle({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: PermissionToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function ClientPortalSettings({ client }: ClientPortalSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  // Permission state — initialize from client record
  const [permissions, setPermissions] = useState({
    canViewAnalytics: client.can_view_analytics ?? true,
    canEditContent: client.can_edit_content ?? false,
    canViewInvoices: client.can_view_invoices ?? true,
    canManageLiveChat: client.can_manage_live_chat ?? false,
    canManageAgents: client.can_manage_agents ?? false,
    canManageOrders: client.can_manage_orders ?? false,
    canManageProducts: client.can_manage_products ?? false,
    canManageBookings: client.can_manage_bookings ?? false,
    canManageCrm: client.can_manage_crm ?? false,
    canManageAutomation: client.can_manage_automation ?? false,
    canManageQuotes: client.can_manage_quotes ?? false,
    canManageCustomers: client.can_manage_customers ?? false,
  });

  const handlePermissionChange = useCallback(
    async (key: keyof typeof permissions, checked: boolean) => {
      const prev = permissions[key];
      setPermissions((p) => ({ ...p, [key]: checked }));

      const result = await updatePortalPermissions(client.id, {
        [key]: checked,
      });
      if (!result.success) {
        setPermissions((p) => ({ ...p, [key]: prev }));
        toast.error(result.error || "Failed to update permission");
      }
    },
    [client.id, permissions],
  );

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
        toast.success(
          "Invitation sent! The client will receive an email with login instructions.",
        );
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

  const portalEnabled = !!client.has_portal_access;

  return (
    <div className="space-y-6">
      {/* Portal Access Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Client Portal Access
          </CardTitle>
          <CardDescription>
            Allow your client to log in and manage their business operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {portalEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30">
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Portal Access Enabled
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {client.email} can log in to view their sites
                  </p>
                </div>
                <AlertDialog
                  open={revokeDialogOpen}
                  onOpenChange={setRevokeDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Revoke Access
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke Portal Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately prevent {client.name} from logging
                        in to view their sites. You can re-enable access at any
                        time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleRevoke}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Revoke Access
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                      : "Add an email address to enable portal access"}
                  </p>
                </div>
              </div>

              {client.email ? (
                <Button onClick={handleInvite} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Mail className="mr-2 h-4 w-4" />
                  Send Portal Invitation
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please add an email address in the client details to enable
                  portal access.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            General Permissions
          </CardTitle>
          <CardDescription>
            Control what the client can see and do in the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PermissionToggle
              label="View Sites"
              description="Client can see their website previews"
              checked
              disabled
              onCheckedChange={() => {}}
            />
            <PermissionToggle
              label="View Analytics"
              description="Client can see site analytics and traffic data"
              checked={permissions.canViewAnalytics}
              onCheckedChange={(v) =>
                handlePermissionChange("canViewAnalytics", v)
              }
            />
            <PermissionToggle
              label="Edit Content"
              description="Client can make basic content changes to their sites"
              checked={permissions.canEditContent}
              onCheckedChange={(v) =>
                handlePermissionChange("canEditContent", v)
              }
            />
            <PermissionToggle
              label="View Invoices"
              description="Client can see billing history and invoices"
              checked={permissions.canViewInvoices}
              onCheckedChange={(v) =>
                handlePermissionChange("canViewInvoices", v)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Module Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
          <CardDescription>
            Enable access to specific operational modules in the portal. Only
            modules installed on the client&apos;s site(s) will appear in their
            navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <PermissionToggle
              label="Manage Live Chat"
              description="Client can view and respond to live chat conversations on their site"
              checked={permissions.canManageLiveChat}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageLiveChat", v)
              }
            />
            <PermissionToggle
              label="Manage Chat Agents"
              description="Client can add and manage their own live chat agents"
              checked={permissions.canManageAgents}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageAgents", v)
              }
            />
            <PermissionToggle
              label="Manage Orders"
              description="Client can view and fulfill e-commerce orders"
              checked={permissions.canManageOrders}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageOrders", v)
              }
            />
            <PermissionToggle
              label="Manage Products"
              description="Client can manage product catalog, categories, and inventory"
              checked={permissions.canManageProducts}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageProducts", v)
              }
            />
            <PermissionToggle
              label="Manage Quotes"
              description="Client can create and manage price quotes and proposals"
              checked={permissions.canManageQuotes}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageQuotes", v)
              }
            />
            <PermissionToggle
              label="Manage Customers"
              description="Client can view their e-commerce customer list and history"
              checked={permissions.canManageCustomers}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageCustomers", v)
              }
            />
            <PermissionToggle
              label="Manage Bookings"
              description="Client can view and manage booking calendar and appointments"
              checked={permissions.canManageBookings}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageBookings", v)
              }
            />
            <PermissionToggle
              label="Manage CRM"
              description="Client can access contacts, companies, and deals pipeline"
              checked={permissions.canManageCrm}
              onCheckedChange={(v) => handlePermissionChange("canManageCrm", v)}
            />
            <PermissionToggle
              label="Manage Automation"
              description="Client can view and manage automation workflows"
              checked={permissions.canManageAutomation}
              onCheckedChange={(v) =>
                handlePermissionChange("canManageAutomation", v)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
