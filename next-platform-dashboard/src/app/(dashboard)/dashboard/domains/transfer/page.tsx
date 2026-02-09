// src/app/(dashboard)/dashboard/domains/transfer/page.tsx
// Domain transfers overview and list page

import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowDownToLine, ArrowUpFromLine, Globe } from "lucide-react";
import { TransferList } from "@/components/domains/transfer";
import { getTransfers } from "@/lib/actions/transfers";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata = {
  title: `Domain Transfers | ${PLATFORM.name}`,
  description: "Manage domain transfers in and out of your account",
};

async function TransfersContent() {
  const result = await getTransfers();

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Globe className="h-12 w-12 mb-4 opacity-50" />
          <p>{result.error || "Failed to load transfers"}</p>
        </CardContent>
      </Card>
    );
  }

  return <TransferList transfers={result.data} />;
}

function TransfersLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TransfersPage() {
  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Domain Transfers</h1>
          <p className="text-muted-foreground">
            Transfer domains in or out of your account
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/domains/transfer/new">
            <Plus className="h-4 w-4 mr-2" />
            Transfer Domain
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <Link href="/dashboard/domains/transfer/new">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ArrowDownToLine className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Transfer In</CardTitle>
                  <CardDescription>
                    Move a domain from another registrar to your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <Link href="/dashboard/domains">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ArrowUpFromLine className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Transfer Out</CardTitle>
                  <CardDescription>
                    Get an auth code to transfer your domain elsewhere
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Transfers List */}
      <Suspense fallback={<TransfersLoading />}>
        <TransfersContent />
      </Suspense>
    </div>
  );
}
