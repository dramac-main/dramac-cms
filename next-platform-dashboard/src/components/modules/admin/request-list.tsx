"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  Building2, 
  User, 
  Clock, 
  ChevronRight,
  ThumbsUp,
  Coins
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstallLevelBadge } from "@/components/modules/shared/install-level-badge";

interface Request {
  id: string;
  title: string;
  description: string;
  use_case: string | null;
  target_audience: string | null;
  suggested_install_level: string;
  suggested_category: string | null;
  priority: string;
  budget_range: string | null;
  willing_to_fund: boolean;
  status: string;
  upvotes: number;
  submitted_at: string;
  agency: { id: string; name: string } | null;
  submitter: { id: string; name: string | null; email: string } | null;
}

interface RequestListProps {
  requests: Request[];
}

export function RequestList({ requests }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No requests in this category</h3>
        <p className="text-sm text-muted-foreground">
          Requests will appear here when agencies submit them
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      low: { variant: "outline", className: "" },
      normal: { variant: "secondary", className: "" },
      high: { variant: "default", className: "bg-orange-500 hover:bg-orange-600" },
      urgent: { variant: "destructive", className: "" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className: string }> = {
      submitted: { variant: "outline", label: "New", className: "border-orange-200 text-orange-600" },
      reviewing: { variant: "secondary", label: "Reviewing", className: "" },
      approved: { variant: "default", label: "Approved", className: "bg-green-500 hover:bg-green-600" },
      in_progress: { variant: "default", label: "Building", className: "bg-purple-500 hover:bg-purple-600" },
      completed: { variant: "default", label: "Completed", className: "bg-emerald-500 hover:bg-emerald-600" },
      rejected: { variant: "destructive", label: "Rejected", className: "" },
    };
    const config = variants[status] || variants.submitted;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {request.agency?.name || "Unknown Agency"}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {request.submitter?.name || request.submitter?.email || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/modules/requests/${request.id}`}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {request.description}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <InstallLevelBadge level={request.suggested_install_level} />
              {request.suggested_category && (
                <Badge variant="outline">{request.suggested_category}</Badge>
              )}
              {request.willing_to_fund && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Coins className="h-3 w-3 mr-1" />
                  Willing to Fund
                </Badge>
              )}
              {request.budget_range && request.budget_range !== "free" && (
                <Badge variant="outline">
                  Budget: {request.budget_range}
                </Badge>
              )}
              {request.upvotes > 0 && (
                <Badge variant="outline">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {request.upvotes} upvotes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
