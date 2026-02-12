import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getBusinessEmailOrder } from "@/lib/actions/business-email";
import { format } from "date-fns";
import { PLATFORM } from "@/lib/constants/platform";
import { formatCurrency } from "@/lib/locale-config";
import { EmailSettingsActions } from "@/components/email/email-settings-actions";

export const metadata: Metadata = {
  title: `Email Order Settings | ${PLATFORM.name}`,
  description: "Configure your email order settings",
};

interface EmailSettingsPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function EmailSettingsPage({ params }: EmailSettingsPageProps) {
  const { orderId } = await params;
  
  const orderResult = await getBusinessEmailOrder(orderId);
  
  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const order = orderResult.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/email/${orderId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Email Order Settings</h1>
            <p className="text-muted-foreground">{order.domain_name}</p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
          <CardDescription>
            Details about your email order
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={order.status === 'Active' ? 'default' : 'secondary'}
                className={order.status === 'Active' ? 'bg-green-500' : ''}
              >
                {order.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <p>{order.domain_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p>Business Email ({order.product_key})</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{format(new Date(order.created_at), "PPP")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p>{format(new Date(order.expiry_date), "PPP")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription, Billing & Danger Zone — interactive client component */}
      <EmailSettingsActions
        orderId={orderId}
        numberOfAccounts={order.number_of_accounts}
        expiryDate={order.expiry_date}
        retailPrice={order.retail_price}
        domainName={order.domain_name}
      />
    </div>
  );
}
