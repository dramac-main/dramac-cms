"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle, Archive } from "lucide-react";
import { toast } from "sonner";
import { deleteClientAction, updateClientAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import type { Client } from "@/types/client";
import type { Database } from "@/types/database";

type Site = Database["public"]["Tables"]["sites"]["Row"];

interface ClientDangerZoneProps {
  client: Client & { sites?: Site[] };
}

export function ClientDangerZone({ client }: ClientDangerZoneProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const hasSites = (client.sites?.length || 0) > 0;
  const canDelete = confirmText === client.name && !hasSites;

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const result = await updateClientAction(client.id, { status: "archived" });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client archived successfully");
        setArchiveDialogOpen(false);
        router.refresh();
      }
    } catch (_error) {
      toast.error("Failed to archive client");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async () => {
    setIsArchiving(true);
    try {
      const result = await updateClientAction(client.id, { status: "active" });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client restored successfully");
        router.refresh();
      }
    } catch (_error) {
      toast.error("Failed to restore client");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteClientAction(client.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Client deleted successfully");
        router.push("/dashboard/clients");
      }
    } catch (_error) {
      toast.error("Failed to delete client");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Archive / Restore */}
        {client.status === "archived" ? (
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Restore this client</p>
              <p className="text-sm text-muted-foreground">
                Move client back to active status.
              </p>
            </div>
            <Button variant="outline" onClick={handleRestore} disabled={isArchiving}>
              {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Restore
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Archive this client</p>
              <p className="text-sm text-muted-foreground">
                Hide from active clients. Can be restored later.
              </p>
            </div>
            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Client</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move &quot;{client.name}&quot; to archived clients.
                    Their sites will remain but won&apos;t be visible in the main list.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button onClick={handleArchive} disabled={isArchiving}>
                    {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Archive Client
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Delete */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
          <div>
            <p className="font-medium">Delete this client</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this client. Cannot be undone.
            </p>
            {hasSites && (
              <p className="text-sm text-destructive mt-1">
                ⚠️ Delete all sites first ({client.sites?.length} sites exist)
              </p>
            )}
          </div>
          <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setConfirmText("");
          }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={hasSites}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Client</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  <strong> &quot;{client.name}&quot;</strong> and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Type <strong>{client.name}</strong> to confirm:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={client.name}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canDelete || isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Client
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
