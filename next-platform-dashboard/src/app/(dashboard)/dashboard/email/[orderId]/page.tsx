import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Settings, ExternalLink, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailAccountsTable } from "@/components/email/email-accounts-table";
import { EmailDnsSetup } from "@/components/email/email-dns-setup";
import { EmailWebmailLink } from "@/components/email/email-webmail-link";
import { getBusinessEmailOrder, getBusinessEmailAccounts } from "@/lib/actions/business-email";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Email Order Details | DRAMAC",
  description: "Manage your email order",
};

interface EmailOrderPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function EmailOrderPage({ params }: EmailOrderPageProps) {
  const { orderId } = await params;
  
  const [orderResult, accountsResult] = await Promise.all([
    getBusinessEmailOrder(orderId),
    getBusinessEmailAccounts(orderId),
  ]);
  
  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderResult.data as any;
  const accounts = accountsResult.data || [];

  // Type assertion for related data
  const domain = order.domain as { id: string; domain_name: string; cloudflare_zone_id?: string; status: string } | null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/email">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{order.domain_name}</h1>
              <Badge 
                variant={order.status === 'Active' ? 'default' : 'secondary'}
                className={order.status === 'Active' ? 'bg-green-500' : ''}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Business Email</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EmailWebmailLink domain={order.domain_name} />
          <Button variant="outline" asChild>
            <Link href={`/dashboard/email/${orderId}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {order.used_accounts}/{order.number_of_accounts}
                </p>
                <p className="text-sm text-muted-foreground">Email Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {format(new Date(order.expiry_date), "MMM d")}
                </p>
                <p className="text-sm text-muted-foreground">Expires</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">10 GB</p>
                <p className="text-sm text-muted-foreground">Storage/Account</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${order.retail_price}</p>
                <p className="text-sm text-muted-foreground">Yearly Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Accounts</CardTitle>
            <CardDescription>
              Manage email accounts for {order.domain_name}
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/dashboard/email/${orderId}/accounts`}>
              <Users className="h-4 w-4 mr-2" />
              Manage Accounts
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EmailAccountsTable 
            accounts={accounts} 
            orderId={orderId}
            maxAccounts={order.number_of_accounts}
            compact
          />
        </CardContent>
      </Card>

      {/* DNS Setup */}
      <EmailDnsSetup 
        orderId={orderId} 
        domainId={domain?.id} 
        dnsConfigured={!!domain?.cloudflare_zone_id}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a 
              href="https://mail.titan.email" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Webmail
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a 
              href="https://control.titan.email" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </a>
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Renew Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
