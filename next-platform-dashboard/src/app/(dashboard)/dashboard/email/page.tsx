import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailOrdersList } from "@/components/email/email-orders-list";
import { EmailStatsCards } from "@/components/email/email-stats-cards";
import { getBusinessEmailOrders, getBusinessEmailStats } from "@/lib/actions/business-email";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Email Management | ${PLATFORM.name}`,
  description: "Manage your business email accounts",
};

interface EmailPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

async function EmailStats() {
  const result = await getBusinessEmailStats();
  
  if (!result.success || !result.data) return null;
  
  return <EmailStatsCards stats={result.data} />;
}

async function EmailOrders() {
  const result = await getBusinessEmailOrders();
  
  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {result.error || "Failed to load email orders"}
        </CardContent>
      </Card>
    );
  }

  return <EmailOrdersList orders={result.data} />;
}

export default async function EmailPage({ searchParams }: EmailPageProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Email Management</h1>
          <p className="text-muted-foreground">
            Manage your business email orders and accounts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/email/purchase">
            <Plus className="h-4 w-4 mr-2" />
            Purchase Email
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <Suspense fallback={<Skeleton className="h-24" />}>
        <EmailStats />
      </Suspense>



      {/* Orders List */}
      <Suspense fallback={<Skeleton className="h-64" />}>
        <EmailOrders />
      </Suspense>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Business Email Features</CardTitle>
          <CardDescription>
            Titan-powered professional email for your domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">Professional Email</h4>
              <p className="text-sm text-muted-foreground">
                Custom @yourdomain.com email addresses
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">10GB Storage</h4>
              <p className="text-sm text-muted-foreground">
                Generous storage per mailbox
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-1">Webmail Access</h4>
              <p className="text-sm text-muted-foreground">
                Access email from any browser
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
