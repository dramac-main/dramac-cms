/**
 * Social Connections Settings
 *
 * Phase MKT-12: Social Media Integration
 *
 * Client component for managing social media account connections.
 * Shows connection status, allows connect/disconnect, token refresh.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2Off,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSocialConnection,
  disconnectSocialConnection,
  deleteSocialConnection,
} from "@/modules/marketing/actions/social-actions";
import {
  SOCIAL_PLATFORM_LIMITS,
  type SocialConnection,
  type SocialPlatform,
  type SocialConnectionStatus,
} from "@/modules/marketing/types/social-types";

interface SocialConnectionsSettingsProps {
  siteId: string;
  connections: SocialConnection[];
}

const STATUS_CONFIG: Record<
  SocialConnectionStatus,
  { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" }
> = {
  active: { label: "Connected", icon: CheckCircle2, variant: "default" },
  expired: { label: "Token Expired", icon: AlertTriangle, variant: "secondary" },
  disconnected: { label: "Disconnected", icon: XCircle, variant: "destructive" },
};

export function SocialConnectionsSettings({
  siteId,
  connections,
}: SocialConnectionsSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  // Add connection form state
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("facebook");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccessToken, setNewAccessToken] = useState("");
  const [newProfileUrl, setNewProfileUrl] = useState("");

  function resetAddForm() {
    setNewPlatform("facebook");
    setNewAccountName("");
    setNewAccessToken("");
    setNewProfileUrl("");
    setShowAddDialog(false);
  }

  async function handleAddConnection() {
    if (!newAccountName.trim() || !newAccessToken.trim()) {
      toast.error("Account name and access token are required");
      return;
    }

    startTransition(async () => {
      try {
        await createSocialConnection({
          siteId,
          platform: newPlatform,
          accountName: newAccountName.trim(),
          accessToken: newAccessToken.trim(),
          profileUrl: newProfileUrl.trim() || undefined,
        });
        toast.success(
          `${SOCIAL_PLATFORM_LIMITS[newPlatform].label} connected successfully`,
        );
        resetAddForm();
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to add connection");
      }
    });
  }

  async function handleDisconnect(connectionId: string) {
    startTransition(async () => {
      try {
        await disconnectSocialConnection(connectionId, siteId);
        toast.success("Connection disconnected");
        setDisconnectId(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to disconnect");
      }
    });
  }

  async function handleDelete(connectionId: string) {
    startTransition(async () => {
      try {
        await deleteSocialConnection(connectionId, siteId);
        toast.success("Connection removed");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || "Failed to remove connection");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Social Connections</h2>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts for cross-channel posting
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Link2Off className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No social accounts connected yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your social accounts to start publishing posts
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => {
            const statusConfig = STATUS_CONFIG[connection.status];
            const StatusIcon = statusConfig.icon;
            const platformConfig =
              SOCIAL_PLATFORM_LIMITS[connection.platform];

            return (
              <Card key={connection.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {platformConfig.label}
                        </span>
                        <Badge variant={statusConfig.variant} className="text-xs">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {connection.accountName}
                      </span>
                      {connection.connectedAt && (
                        <span className="text-xs text-muted-foreground">
                          Connected{" "}
                          {new Date(connection.connectedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {connection.profileUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={connection.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {connection.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDisconnectId(connection.id)}
                        disabled={isPending}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(connection.id)}
                        disabled={isPending}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Connection Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Social Connection</DialogTitle>
            <DialogDescription>
              Connect a social media account. You&apos;ll need your API access
              token from the platform&apos;s developer portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={newPlatform}
                onValueChange={(v) => setNewPlatform(v as SocialPlatform)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(SOCIAL_PLATFORM_LIMITS) as [
                      SocialPlatform,
                      (typeof SOCIAL_PLATFORM_LIMITS)[SocialPlatform],
                    ][]
                  ).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                placeholder="@myaccount"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-token">Access Token</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="Your API access token"
                value={newAccessToken}
                onChange={(e) => setNewAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tokens are stored encrypted and used only for publishing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-url">Profile URL (optional)</Label>
              <Input
                id="profile-url"
                type="url"
                placeholder="https://twitter.com/myaccount"
                value={newProfileUrl}
                onChange={(e) => setNewProfileUrl(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetAddForm}>
              Cancel
            </Button>
            <Button onClick={handleAddConnection} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <Dialog
        open={!!disconnectId}
        onOpenChange={() => setDisconnectId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account?</DialogTitle>
            <DialogDescription>
              This will stop posting to this account. You can reconnect later.
              Existing posts will not be removed from the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisconnectId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => disconnectId && handleDisconnect(disconnectId)}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
