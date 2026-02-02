"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Key,
  ExternalLink,
  Mail,
  Clock,
} from "lucide-react";
import { EmailAccountForm } from "./email-account-form";
import { deleteBusinessEmailAccount } from "@/lib/actions/business-email";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { EmailAccount } from "@/lib/resellerclub/email/types";

interface EmailAccountsTableProps {
  accounts: EmailAccount[];
  orderId: string;
  maxAccounts: number;
  compact?: boolean;
}

export function EmailAccountsTable({ 
  accounts, 
  orderId, 
  maxAccounts,
  compact = false,
}: EmailAccountsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<EmailAccount | null>(null);

  const canAddMore = accounts.length < maxAccounts;
  const displayAccounts = compact ? accounts.slice(0, 5) : accounts;

  async function handleDelete() {
    if (!deletingAccount) return;
    
    startTransition(async () => {
      const result = await deleteBusinessEmailAccount(deletingAccount.id);
      if (result.success) {
        toast.success("Email account deleted");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
      setDeletingAccount(null);
    });
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Email Accounts</h3>
        <p className="text-muted-foreground mb-4">
          Create your first email account to get started.
        </p>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Account
        </Button>
        
        <EmailAccountForm 
          orderId={orderId}
          open={showAddForm}
          onOpenChange={setShowAddForm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canAddMore && !compact && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account ({accounts.length}/{maxAccounts})
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              {!compact && <TableHead>Last Login</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-mono">{account.email}</TableCell>
                <TableCell>{account.first_name} {account.last_name}</TableCell>
                {!compact && (
                  <TableCell className="text-muted-foreground">
                    {account.last_login ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(account.last_login), { addSuffix: true })}
                      </span>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge 
                    variant={account.status === 'active' ? 'default' : 'secondary'}
                    className={account.status === 'active' ? 'bg-green-500' : ''}
                  >
                    {account.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a 
                          href={`https://app.titan.email/?email=${encodeURIComponent(account.email)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Webmail
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setDeletingAccount(account)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {compact && accounts.length > 5 && (
        <p className="text-sm text-muted-foreground text-center">
          And {accounts.length - 5} more accounts...
        </p>
      )}

      {/* Add Account Dialog */}
      <EmailAccountForm 
        orderId={orderId}
        open={showAddForm}
        onOpenChange={setShowAddForm}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingAccount?.email}</strong>? 
              All emails and data will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
