"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Building2, 
  User, 
  Clock, 
  ThumbsUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InstallLevelBadge } from "@/components/modules/shared/install-level-badge";
import { toast } from "sonner";

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
  admin_notes: string | null;
  upvotes: number;
  submitted_at: string;
  updated_at: string;
  completed_at: string | null;
  resulting_module_id: string | null;
  agency: { id: string; name: string } | null;
  submitter: { id: string; name: string | null; email: string } | null;
  assigned_to: string | null;
}

interface RequestDetailCardProps {
  request: Request;
}

export function RequestDetailCard({ request }: RequestDetailCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");
  const [currentStatus, setCurrentStatus] = useState(request.status);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/modules/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          admin_notes: adminNotes,
        }),
      });

      if (!response.ok) throw new Error("Failed to update request");

      setCurrentStatus(newStatus);
      toast.success(`Request ${newStatus === "approved" ? "approved" : newStatus === "rejected" ? "rejected" : "updated"}`);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update request");
    } finally {
      setIsUpdating(false);
    }
  };

  const saveNotes = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/modules/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (!response.ok) throw new Error("Failed to save notes");
      toast.success("Notes saved");
    } catch (error) {
      toast.error("Failed to save notes");
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-gray-500",
      normal: "text-blue-500",
      high: "text-orange-500",
      urgent: "text-red-500",
    };
    return colors[priority] || colors.normal;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      submitted: { label: "New", className: "bg-orange-100 text-orange-700" },
      reviewing: { label: "Reviewing", className: "bg-blue-100 text-blue-700" },
      approved: { label: "Approved", className: "bg-green-100 text-green-700" },
      in_progress: { label: "Building", className: "bg-purple-100 text-purple-700" },
      completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
    };
    const { label, className } = config[status] || config.submitted;
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{request.title}</CardTitle>
                {getStatusBadge(currentStatus)}
              </div>
              <CardDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {request.agency?.name || "Unknown Agency"}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {request.submitter?.name || request.submitter?.email || "Unknown"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Submitted {formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true })}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <InstallLevelBadge level={request.suggested_install_level} />
            {request.suggested_category && (
              <Badge variant="outline">{request.suggested_category}</Badge>
            )}
            <Badge variant="outline" className={getPriorityColor(request.priority)}>
              Priority: {request.priority}
            </Badge>
            {request.willing_to_fund && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <DollarSign className="h-3 w-3 mr-1" />
                Willing to Fund
              </Badge>
            )}
            {request.budget_range && (
              <Badge variant="outline">Budget: {request.budget_range}</Badge>
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

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="mt-1 whitespace-pre-wrap">{request.description}</p>
          </div>
          
          {request.use_case && (
            <div>
              <Label className="text-muted-foreground">Use Case</Label>
              <p className="mt-1 whitespace-pre-wrap">{request.use_case}</p>
            </div>
          )}
          
          {request.target_audience && (
            <div>
              <Label className="text-muted-foreground">Target Audience</Label>
              <p className="mt-1 whitespace-pre-wrap">{request.target_audience}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Review and respond to this request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="admin-notes">Admin Notes</Label>
            <Textarea
              id="admin-notes"
              placeholder="Add internal notes about this request..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-1"
              rows={4}
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={saveNotes}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Notes
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Update Status</Label>
            <div className="flex flex-wrap gap-2">
              {currentStatus === "submitted" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus("reviewing")}
                    disabled={isUpdating}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Start Review
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus("approved")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus("rejected")}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {currentStatus === "reviewing" && (
                <>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus("approved")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus("rejected")}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {currentStatus === "approved" && (
                <Button
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => updateStatus("in_progress")}
                  disabled={isUpdating}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Building
                </Button>
              )}

              {currentStatus === "in_progress" && (
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => updateStatus("completed")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submitted</span>
              <span>{format(new Date(request.submitted_at), "PPp")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{format(new Date(request.updated_at), "PPp")}</span>
            </div>
            {request.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{format(new Date(request.completed_at), "PPp")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
