import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailAccountsTable } from "@/components/email/email-accounts-table";
import { getBusinessEmailOrder, getBusinessEmailAccounts } from "@/lib/actions/business-email";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Email Accounts | ${PLATFORM.name}`,
  description: "Manage email accounts for your domain",
};

interface EmailAccountsPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function EmailAccountsPage({ params }: EmailAccountsPageProps) {
  const { orderId } = await params;
  
  const [orderResult, accountsResult] = await Promise.all([
    getBusinessEmailOrder(orderId),
    getBusinessEmailAccounts(orderId),
  ]);
  
  if (!orderResult.success || !orderResult.data) {
    notFound();
  }

  const order = orderResult.data;
  const accounts = accountsResult.data || [];

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Email Accounts</h1>
              <Badge variant="outline">
                {accounts.length}/{order.number_of_accounts}
              </Badge>
            </div>
            <p className="text-muted-foreground">{order.domain_name}</p>
          </div>
        </div>
      </div>

      {/* Account Limit Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {accounts.length} of {order.number_of_accounts} accounts used
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.number_of_accounts - accounts.length} accounts remaining
                </p>
              </div>
            </div>
            {accounts.length < order.number_of_accounts && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Email Accounts</CardTitle>
          <CardDescription>
            Create, manage, and delete email accounts for {order.domain_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailAccountsTable 
            accounts={accounts} 
            orderId={orderId}
            maxAccounts={order.number_of_accounts}
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">📧 Webmail Access</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Access your email from any web browser
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://app.titan.email" target="_blank" rel="noopener noreferrer">
                  Open Webmail
                </a>
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">📱 Mobile Setup</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Configure email on your phone or tablet
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://support.titan.email" target="_blank" rel="noopener noreferrer">
                  Setup Guide
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
