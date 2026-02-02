"use client";

// src/components/domains/transfer/transfer-list.tsx
// List of domain transfers with filtering and actions

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  ArrowDownToLine,
  ArrowUpFromLine,
  MoreHorizontal,
  XCircle,
  Eye,
  Loader2,
  Globe,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cancelTransfer } from "@/lib/actions/transfers";
import { toast } from "sonner";
import type { TransferStatus } from "@/lib/resellerclub/transfers";

interface Transfer {
  id: string;
  domain_name: string;
  transfer_type: 'in' | 'out';
  status: TransferStatus;
  current_step: number;
  total_steps: number;
  initiated_at: string;
  completed_at?: string | null;
}

interface TransferListProps {
  transfers: Transfer[];
}

const STATUS_BADGE: Record<TransferStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  'pending': { label: 'Pending', variant: 'secondary' },
  'awaiting-auth': { label: 'Awaiting Auth', variant: 'secondary' },
  'auth-submitted': { label: 'Auth Submitted', variant: 'secondary' },
  'in-progress': { label: 'In Progress', variant: 'default' },
  'completed': { label: 'Completed', variant: 'default' },
  'failed': { label: 'Failed', variant: 'destructive' },
  'cancelled': { label: 'Cancelled', variant: 'outline' },
};

export function TransferList({ transfers }: TransferListProps) {
  const [isPending, startTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  const transfersIn = transfers.filter(t => t.transfer_type === 'in');
  const transfersOut = transfers.filter(t => t.transfer_type === 'out');

  const handleCancel = () => {
    if (!selectedTransfer) return;

    startTransition(async () => {
      const result = await cancelTransfer(selectedTransfer.id);
      if (result.success) {
        toast.success("Transfer cancelled");
      } else {
        toast.error(result.error || "Failed to cancel transfer");
      }
      setCancelDialogOpen(false);
      setSelectedTransfer(null);
    });
  };

  const renderTransferTable = (items: Transfer[]) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Globe className="h-12 w-12 mb-4 opacity-50" />
          <p>No transfers found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Initiated</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((transfer) => {
            const statusInfo = STATUS_BADGE[transfer.status];
            const canCancel = !['completed', 'cancelled', 'failed'].includes(transfer.status);

            return (
              <TableRow key={transfer.id}>
                <TableCell className="font-mono font-medium">
                  {transfer.domain_name}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                    {transfer.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                    {transfer.status === 'in-progress' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {['pending', 'awaiting-auth', 'auth-submitted'].includes(transfer.status) && <Clock className="h-3 w-3" />}
                    {statusInfo.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(transfer.current_step / transfer.total_steps) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {transfer.current_step}/{transfer.total_steps}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(transfer.initiated_at), { addSuffix: true })}
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
                        <Link href={`/dashboard/domains/transfer/${transfer.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {canCancel && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancel Transfer
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Domain Transfers</CardTitle>
          <CardDescription>
            View and manage your domain transfer requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="in" className="space-y-4">
            <TabsList>
              <TabsTrigger value="in" className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4" />
                Transfers In ({transfersIn.length})
              </TabsTrigger>
              <TabsTrigger value="out" className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                Transfers Out ({transfersOut.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="in">
              {renderTransferTable(transfersIn)}
            </TabsContent>

            <TabsContent value="out">
              {renderTransferTable(transfersOut)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Transfer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the transfer for{" "}
              <span className="font-mono font-medium">{selectedTransfer?.domain_name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Transfer</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Cancel Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
