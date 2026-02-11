import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Mail, 
  Settings,
  ExternalLink,
  Inbox,
  Send,
  Clock,
  CircleCheck,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getDomain } from "@/lib/actions/domains";
import { getBusinessEmailOrderByDomainId } from "@/lib/actions/business-email";
import { DomainEmailAccountsClient } from "./domain-email-accounts-client";

interface EmailPageProps {
  params: Promise<{ domainId: string }>;
}

export async function generateMetadata({ params }: EmailPageProps): Promise<Metadata> {
  const { domainId } = await params;
  const response = await getDomain(domainId);
  
  return {
    title: response.data?.domain_name 
      ? `Email - ${response.data.domain_name} | DRAMAC CMS`
      : 'Email Accounts | DRAMAC CMS',
  };
}

async function EmailContent({ domainId }: { domainId: string }) {
  const response = await getBusinessEmailOrderByDomainId(domainId);
  
  if (!response.success || !response.data) {
    notFound();
  }
  
  const { order, accounts, domain } = response.data;
  
  if (!domain) {
    notFound();
  }

  // No email order exists - show purchase prompt
  if (!order) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Accounts</h1>
            <p className="text-muted-foreground">
              Manage email accounts for {domain.domain_name}
            </p>
          </div>
        </div>

        {/* No Email Card */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Business Email</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Purchase professional business email powered by Titan to create email accounts 
              like info@{domain.domain_name} or support@{domain.domain_name}
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/dashboard/email/purchase?domain=${encodeURIComponent(domain.domain_name)}&domainId=${domainId}`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Email
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/email">
                  View All Email Orders
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Email Features</CardTitle>
            <CardDescription>
              What you&apos;ll get with Titan Email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">10GB Storage</p>
                  <p className="text-sm text-muted-foreground">Per mailbox</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Custom Domain</p>
                  <p className="text-sm text-muted-foreground">user@{domain.domain_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Webmail Access</p>
                  <p className="text-sm text-muted-foreground">Access from anywhere</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Mobile Apps</p>
                  <p className="text-sm text-muted-foreground">iOS & Android</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Calendar & Contacts</p>
                  <p className="text-sm text-muted-foreground">Built-in productivity tools</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CircleCheck className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Spam Protection</p>
                  <p className="text-sm text-muted-foreground">Advanced filtering</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email order exists - show management UI
  const isExpiringSoon = new Date(order.expiry_date).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const isExpired = new Date(order.expiry_date) < new Date();
  const daysUntilExpiry = Math.ceil((new Date(order.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const getStatusBadge = () => {
    if (order.status === 'Active') {
      if (isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      if (isExpiringSoon) {
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Expiring Soon</Badge>;
      }
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
    if (order.status === 'Suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    return <Badge variant="secondary">{order.status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Accounts</h1>
          <p className="text-muted-foreground">
            Manage email accounts for {domain.domain_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/email/${order.id}`}>
              <Settings className="h-4 w-4 mr-2" />
              Order Details
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Email Provider Status */}
      <Card className="border-blue-200 bg-blue-500/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Titan Email (via ResellerClub)</p>
                  {getStatusBadge()}
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.number_of_accounts} mailbox{order.number_of_accounts !== 1 ? 'es' : ''} • 
                  Expires {new Date(order.expiry_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://app.titan.email" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Webmail
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Inbox className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{order.used_accounts}/{order.number_of_accounts}</p>
                <p className="text-sm text-muted-foreground">Mailboxes Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CircleCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {accounts.filter(a => a.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {daysUntilExpiry > 0 ? daysUntilExpiry : 0}
                </p>
                <p className="text-sm text-muted-foreground">Days Until Renewal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Email Accounts Management */}
      <DomainEmailAccountsClient 
        orderId={order.id}
        domainName={domain.domain_name}
        accounts={accounts}
        maxAccounts={order.number_of_accounts}
        usedAccounts={order.used_accounts}
      />
      
      {/* Email Client Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Client Configuration</CardTitle>
          <CardDescription>
            Settings for desktop and mobile email clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Send className="h-4 w-4" />
                Incoming Mail (IMAP)
              </h4>
              <dl className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Server:</dt>
                  <dd className="font-mono">imap.titan.email</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Port:</dt>
                  <dd className="font-mono">993</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Security:</dt>
                  <dd className="font-mono">SSL/TLS</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Outgoing Mail (SMTP)
              </h4>
              <dl className="space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <dt>Server:</dt>
                  <dd className="font-mono">smtp.titan.email</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Port:</dt>
                  <dd className="font-mono">465</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Security:</dt>
                  <dd className="font-mono">SSL/TLS</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EmailPage({ params }: EmailPageProps) {
  const { domainId } = await params;
  
  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/domains/${domainId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Domain
        </Link>
      </Button>
      
      <Suspense fallback={<EmailSkeleton />}>
        <EmailContent domainId={domainId} />
      </Suspense>
    </div>
  );
}

function EmailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="grid sm:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
