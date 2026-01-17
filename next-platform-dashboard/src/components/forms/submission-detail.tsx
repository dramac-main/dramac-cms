"use client";

import { useEffect, useCallback } from "react";
import { 
  X, 
  Mail, 
  Clock, 
  Globe, 
  MonitorSmartphone, 
  Archive, 
  Trash2,
  AlertTriangle,
  MailOpen,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  updateSubmissionStatus,
  deleteSubmission,
  type FormSubmission,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";
import { useState } from "react";

interface SubmissionDetailProps {
  submission: FormSubmission;
  onClose: () => void;
  onUpdate: () => void;
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

export function SubmissionDetail({
  submission,
  onClose,
  onUpdate,
  readOnly = false,
}: SubmissionDetailProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return formatDate(dateString);
  };

  const handleMarkRead = useCallback(async () => {
    if (submission.status === "new") {
      const result = await updateSubmissionStatus(submission.id, "read");
      if (result.success) {
        onUpdate();
      }
    }
  }, [submission.id, submission.status, onUpdate]);

  const handleArchive = async () => {
    setIsArchiving(true);
    const result = await updateSubmissionStatus(submission.id, "archived");
    setIsArchiving(false);

    if (result.success) {
      toast.success("Submission archived");
      onUpdate();
    } else {
      toast.error(result.error || "Failed to archive");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this submission? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteSubmission(submission.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Submission deleted");
      onClose();
      onUpdate();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(fieldName);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Mark as read when viewing (only once)
  useEffect(() => {
    if (submission.status === "new") {
      handleMarkRead();
    }
  }, [submission.status, handleMarkRead]);

  // Render form field with smart formatting
  const renderField = (key: string, value: unknown): React.ReactElement | null => {
    // Skip internal fields
    if (key.startsWith("_")) return null;
    
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("honeypot")) return null;

    const displayKey = key
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();

    let displayValue: React.ReactNode = String(value ?? "");
    let copyableValue = String(value ?? "");
    let isLink = false;

    // Handle special types
    if (value === null || value === undefined || value === "") {
      displayValue = <span className="text-muted-foreground italic">Not provided</span>;
      copyableValue = "";
    } else if (typeof value === "boolean") {
      displayValue = value ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800">Yes</Badge>
      ) : (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">No</Badge>
      );
      copyableValue = value ? "Yes" : "No";
    } else if (typeof value === "object" && value !== null) {
      displayValue = (
        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
      copyableValue = JSON.stringify(value, null, 2);
    } else if (String(value).match(/^[\w.-]+@[\w.-]+\.\w+$/)) {
      // Email
      isLink = true;
      displayValue = (
        <a 
          href={`mailto:${value}`} 
          className="text-primary hover:underline inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    } else if (String(value).match(/^https?:\/\//)) {
      // URL
      isLink = true;
      displayValue = (
        <a
          href={String(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-1 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value).length > 50 ? String(value).slice(0, 50) + "…" : String(value)}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    } else if (String(value).match(/^\+?[\d\s\-()]{10,}$/)) {
      // Phone number
      isLink = true;
      displayValue = (
        <a 
          href={`tel:${String(value).replace(/\s/g, "")}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      );
    }

    // Handle long text
    const strValue = String(value ?? "");
    const isLongText = strValue.length > 150;

    return (
      <div key={key} className="py-3 group">
        <div className="flex items-start justify-between gap-2">
          <dt className="text-sm font-medium text-muted-foreground mb-1">
            {displayKey}
          </dt>
          {copyableValue && !isLink && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(copyableValue, key)}
            >
              {copied === key ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
        <dd className={`text-sm ${isLongText ? "whitespace-pre-wrap" : ""}`}>
          {displayValue}
        </dd>
      </div>
    );
  };

  const status = statusConfig[submission.status];
  const StatusIcon = status.icon;

  return (
    <div className="w-96 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Submission Details</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Status and Form Info */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className={`${status.color} gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {submission.formId}
            </span>
          </div>

          {/* Metadata */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-3 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-foreground">
                  {formatRelativeTime(submission.createdAt)}
                </div>
                <div className="text-xs">
                  {formatDate(submission.createdAt)}
                </div>
              </div>
            </div>
            
            {submission.pageUrl && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                <a 
                  href={submission.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline text-foreground"
                >
                  {submission.pageUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            
            {submission.userAgent && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MonitorSmartphone className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="text-xs line-clamp-2">
                  {submission.userAgent}
                </span>
              </div>
            )}

            {submission.ipAddress && submission.ipAddress !== "unknown" && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="font-mono">{submission.ipAddress}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Form Data */}
          <div>
            <h4 className="font-medium mb-1">Form Data</h4>
            <p className="text-xs text-muted-foreground mb-3">
              {Object.keys(submission.data).filter(k => !k.startsWith("_")).length} field(s) submitted
            </p>
            <dl className="divide-y divide-border">
              {Object.entries(submission.data)
                .filter(([key]) => !key.startsWith("_"))
                .map(([key, value]) => renderField(key, value))}
            </dl>
          </div>

          {/* Submission ID for reference */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Submission ID:</span>{" "}
            <code className="font-mono">{submission.id}</code>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      {!readOnly && (
        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            onClick={handleArchive}
            className="w-full"
            disabled={submission.status === "archived" || isArchiving}
          >
            <Archive className="h-4 w-4 mr-2" />
            {isArchiving ? "Archiving..." : "Archive Submission"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete Submission"}
          </Button>
        </div>
      )}

      {readOnly && (
        <div className="p-4 border-t">
          <p className="text-xs text-center text-muted-foreground">
            View-only mode. Contact your agency to manage submissions.
          </p>
        </div>
      )}
    </div>
  );
}
