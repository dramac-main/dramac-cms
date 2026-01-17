import { Metadata } from "next";
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Module Requests | DRAMAC",
  description: "View your module requests",
};

export default async function ModuleRequestsPage() {
  // Module requests feature coming soon
  // This page will allow agencies to request custom modules

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Module Requests</h1>
          <p className="text-muted-foreground">
            Track and manage your custom module requests
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium mb-1">Module Requests Coming Soon</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            The module request system is being developed. Soon you&apos;ll be able to request 
            custom modules and track their development status.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/modules">
                Browse Modules
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
