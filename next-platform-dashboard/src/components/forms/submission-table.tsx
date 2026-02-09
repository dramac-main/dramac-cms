"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Mail,
  MailOpen,
  Archive,
  AlertTriangle,
  Trash2,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateSubmissionStatus,
  deleteSubmission,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

import { DEFAULT_LOCALE } from '@/lib/locale-config'
interface SubmissionTableProps {
  submissions: FormSubmission[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onView: (submission: FormSubmission) => void;
  onRefresh: () => void;
  readOnly?: boolean;
}

const statusConfig = {
  new: { 
    label: "New", 
    icon: Mail, 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" 
  },
  read: { 
    label: "Read", 
    icon: MailOpen, 
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" 
  },
  archived: { 
    label: "Archived", 
    icon: Archive, 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" 
  },
  spam: { 
    label: "Spam", 
    icon: AlertTriangle, 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
  },
};

export function SubmissionTable({
  submissions,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onRefresh,
  readOnly = false,
}: SubmissionTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    status: "new" | "read" | "archived" | "spam"
  ) => {
    setActionLoading(id);
    const result = await updateSubmissionStatus(id, status);
    setActionLoading(null);

    if (result.success) {
      toast.success("Status updated");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submission? This action cannot be undone.")) return;

    setActionLoading(id);
    const result = await deleteSubmission(id);
    setActionLoading(null);

    if (result.success) {
      toast.success("Submission deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(DEFAULT_LOCALE, {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString(DEFAULT_LOCALE, { weekday: "short" });
    } else {
      return date.toLocaleDateString(DEFAULT_LOCALE, {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getPreviewText = (data: Record<string, unknown>): string => {
    // Get first meaningful field values
    const values = Object.entries(data)
      .filter(([key]) => {
        const lowerKey = key.toLowerCase();
        return (
          !key.startsWith("_") &&
          !lowerKey.includes("honeypot") &&
          !lowerKey.includes("form_id") &&
          !lowerKey.includes("site_id")
        );
      })
      .map(([, value]) => {
        if (typeof value === "string") return value;
        if (typeof value === "number" || typeof value === "boolean") return String(value);
        return "";
      })
      .filter((v) => v.length > 0);

    const preview = values.slice(0, 2).join(" • ");
    return preview.length > 60 ? preview.slice(0, 60) + "…" : preview || "No preview available";
  };

  const allSelected = submissions.length > 0 && selectedIds.length === submissions.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < submissions.length;

  if (submissions.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {!readOnly && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as unknown as HTMLInputElement).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                  aria-label="Select all submissions"
                />
              </TableHead>
            )}
            <TableHead className="w-28">Status</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead className="w-24">Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            const status = statusConfig[submission.status];
            const StatusIcon = status.icon;
            const isSelected = selectedIds.includes(submission.id);
            const isLoading = actionLoading === submission.id;

            return (
              <TableRow
                key={submission.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  isSelected ? "bg-muted/50" : ""
                } ${submission.status === "new" ? "font-medium" : ""}`}
                onClick={() => onView(submission)}
              >
                {!readOnly && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(submission.id, !!checked)}
                      aria-label={`Select submission ${submission.id}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="secondary" className={`${status.color} gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="text-sm truncate">{getPreviewText(submission.data)}</p>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(submission.createdAt)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        disabled={isLoading}
                        className="h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onView(submission)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {submission.status !== "new" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(submission.id, "new")}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Mark as New
                        </DropdownMenuItem>
                      )}
                      {submission.status !== "read" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(submission.id, "read")}
                        >
                          <MailOpen className="h-4 w-4 mr-2" />
                          Mark as Read
                        </DropdownMenuItem>
                      )}
                      {submission.status !== "archived" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(submission.id, "archived")}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      {submission.status !== "spam" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(submission.id, "spam")}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Mark as Spam
                        </DropdownMenuItem>
                      )}
                      {!readOnly && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(submission.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
