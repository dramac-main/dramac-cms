import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle, Search, ThumbsUp, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Module Requests | DRAMAC",
  description: "View your module requests",
};

const statusConfig: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  submitted: { icon: Clock, label: "Submitted", color: "bg-gray-500" },
  reviewing: { icon: Search, label: "Under Review", color: "bg-blue-500" },
  approved: { icon: CheckCircle, label: "Approved", color: "bg-green-500" },
  in_progress: { icon: AlertCircle, label: "In Development", color: "bg-yellow-500" },
  completed: { icon: CheckCircle, label: "Completed", color: "bg-green-600" },
  rejected: { icon: XCircle, label: "Rejected", color: "bg-red-500" },
};

export default async function ModuleRequestsPage() {
  const supabase = await createClient();

  // Get current user's agency
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    redirect("/dashboard");
  }

  // Get agency's module requests
  const { data: requests } = await supabase
    .from("module_requests" as any)
    .select("*")
    .eq("agency_id", profile.agency_id)
    .order("submitted_at", { ascending: false });

  const requestsList = (requests as any[]) || [];

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
        <Button asChild>
          <Link href="/dashboard/modules/requests/new">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {requestsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No module requests yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Have an idea for a module that doesn't exist yet? Submit a request 
              and our team will review it.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/modules/requests/new">
                  Submit a Request
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/marketplace/v2">
                  Browse Marketplace
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requestsList.map((request: any) => {
            const status = statusConfig[request.status] || statusConfig.submitted;
            const StatusIcon = status.icon;

            return (
              <Card key={request.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <CardDescription>
                        Submitted {formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {request.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">{request.suggested_install_level || "client"}</Badge>
                    <Badge variant="outline">{request.suggested_category || "general"}</Badge>
                    <Badge variant="outline" className="capitalize">{request.priority || "normal"} priority</Badge>
                    {request.upvotes > 0 && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" />
                        {request.upvotes}
                      </span>
                    )}
                  </div>
                  {request.admin_notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Admin Notes:</p>
                      <p className="text-sm">{request.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
