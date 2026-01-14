"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useModuleSubscriptions } from "@/hooks/use-module-subscriptions";
import { useCurrentAgency } from "@/hooks/use-current-agency";
import {
  Package,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function MyModulesPage() {
  const { agency } = useCurrentAgency();
  const agencyId = agency?.id || "";

  const { data: subscriptions, isLoading } = useModuleSubscriptions(agencyId);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = async (_subscriptionId: string) => {
    // TODO: Implement cancellation API
    toast.info("Cancellation will be available in the billing phase");
    setCancelingId(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Modules</h1>
          <p className="text-muted-foreground">
            Manage your subscribed modules
          </p>
        </div>
        <Link href="/marketplace">
          <Button>
            <Package className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
        </Link>
      </div>

      {/* Subscriptions Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : subscriptions?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">No modules subscribed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add modules to extend your platform&apos;s capabilities
          </p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Renews On</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{sub.module?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.module?.category}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={sub.status === "active" ? "default" : "destructive"}
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        ${sub.billing_cycle === "yearly"
                          ? sub.module?.price_yearly
                          : sub.module?.price_monthly}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per {sub.billing_cycle === "yearly" ? "year" : "month"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(sub.current_period_end)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setCancelingId(sub.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={!!cancelingId} onOpenChange={() => setCancelingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this module at the end of your current
              billing period. You can resubscribe at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelingId && handleCancel(cancelingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
