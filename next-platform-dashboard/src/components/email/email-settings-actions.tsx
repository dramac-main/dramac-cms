"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { renewBusinessEmailOrder } from "@/lib/actions/business-email";
import { formatCurrency } from "@/lib/locale-config";
import { format } from "date-fns";
import { toast } from "sonner";

interface EmailSettingsActionsProps {
  orderId: string;
  numberOfAccounts: number;
  expiryDate: string;
  retailPrice: number;
  domainName: string;
}

export function EmailSettingsActions({
  orderId,
  numberOfAccounts,
  expiryDate,
  retailPrice,
  domainName,
}: EmailSettingsActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [renewMonths, setRenewMonths] = useState("12");
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  function handleRenew() {
    startTransition(async () => {
      const result = await renewBusinessEmailOrder(orderId, parseInt(renewMonths));
      if (result.success) {
        toast.success(`Email order renewed for ${renewMonths} months`);
        setShowRenewDialog(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to renew order");
      }
    });
  }

  function handleCancel() {
    toast.info("Please contact support to cancel your email order");
    setShowCancelDialog(false);
  }

  return (
    <>
      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your email subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">
                {numberOfAccounts} accounts • Expires {format(new Date(expiryDate), "MMM d, yyyy")}
              </p>
            </div>
            <Button onClick={() => setShowRenewDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Renew
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Upgrade Plan</p>
              <p className="text-sm text-muted-foreground">
                Contact support to add more email accounts
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/support/new?subject=Upgrade email for ${domainName}`)
              }
            >
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Pricing information for this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Number of Accounts</span>
              <span>{numberOfAccounts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per Year</span>
              <span>{formatCurrency(retailPrice || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(retailPrice || 0)}/year</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this email order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
            <div>
              <p className="font-medium">Cancel Email Order</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all email accounts and data
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowCancelDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Renew Dialog */}
      <AlertDialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renew Email Order</AlertDialogTitle>
            <AlertDialogDescription>
              Renew your email subscription for {domainName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Renewal Period</label>
            <Select value={renewMonths} onValueChange={setRenewMonths}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="36">36 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenew} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Renewing...
                </>
              ) : (
                "Confirm Renewal"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Email Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {numberOfAccounts} email accounts for{" "}
              <strong>{domainName}</strong> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Contact Support to Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
