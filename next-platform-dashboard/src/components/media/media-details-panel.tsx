"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Save,
  Loader2,
  Copy,
  ExternalLink,
  Trash2,
  Download,
  Tag,
  FileText,
  Calendar,
  HardDrive,
  Maximize2,
  User,
  Link,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateMediaFile, deleteMediaFile, type MediaFile } from "@/lib/media/media-service";
import { toast } from "sonner";

interface MediaDetailsPanelProps {
  file: MediaFile;
  onClose: () => void;
  onUpdate: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function MediaDetailsPanel({
  file,
  onClose,
  onUpdate,
  onDelete,
  canEdit = true,
  canDelete = true,
}: MediaDetailsPanelProps) {
  const [altText, setAltText] = useState(file.altText || "");
  const [caption, setCaption] = useState(file.caption || "");
  const [tags, setTags] = useState(file.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when file changes
  useEffect(() => {
    setAltText(file.altText || "");
    setCaption(file.caption || "");
    setTags(file.tags.join(", "));
    setHasChanges(false);
  }, [file.id, file.altText, file.caption, file.tags]);

  // Track changes
  useEffect(() => {
    const currentTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const originalTags = file.tags || [];

    const tagsChanged =
      currentTags.length !== originalTags.length ||
      currentTags.some((t, i) => t !== originalTags[i]);

    const changed =
      altText !== (file.altText || "") ||
      caption !== (file.caption || "") ||
      tagsChanged;

    setHasChanges(changed);
  }, [altText, caption, tags, file.altText, file.caption, file.tags]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateMediaFile(file.id, {
      altText,
      caption,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setSaving(false);

    if (result.success) {
      toast.success("File details updated");
      setHasChanges(false);
      onUpdate();
    } else {
      toast.error(result.error || "Failed to update file");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteMediaFile(file.id);
    setDeleting(false);
    setShowDeleteDialog(false);

    if (result.success) {
      toast.success("File deleted successfully");
      onDelete?.();
    } else {
      toast.error(result.error || "Failed to delete file");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(file.publicUrl);
    toast.success("URL copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="w-80 border-l bg-background flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">File Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          {file.fileType === "image" && (
            <div className="p-4">
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                <Image
                  src={file.publicUrl}
                  alt={file.altText || file.originalName}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              File Information
            </h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Name</span>
                <span className="text-right max-w-[180px] truncate font-medium" title={file.originalName}>
                  {file.originalName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="capitalize">
                  {file.fileType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Size
                </span>
                <span>{formatFileSize(file.fileSize)}</span>
              </div>
              {file.width && file.height && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" />
                    Dimensions
                  </span>
                  <span>
                    {file.width} × {file.height}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Uploaded
                </span>
                <span className="text-right text-xs">{formatDate(file.createdAt)}</span>
              </div>
              {file.updatedAt && file.updatedAt !== file.createdAt && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Modified</span>
                  <span className="text-right text-xs">{formatDate(file.updatedAt)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">MIME Type</span>
                <span className="text-xs">{file.mimeType}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* URL Section */}
          <div className="p-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              URL
            </h4>
            <div className="flex gap-2">
              <Input
                value={file.publicUrl}
                readOnly
                className="text-xs font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={copyUrl}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(file.publicUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={file.publicUrl} download={file.originalName}>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Editable Fields */}
          {canEdit && (
            <div className="p-4 space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Metadata
              </h4>

              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt Text</Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image for accessibility..."
                />
                <p className="text-xs text-muted-foreground">
                  Important for SEO and screen readers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional caption or description..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="photo, banner, hero..."
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated tags for organization
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {hasChanges ? "Save Changes" : "No Changes"}
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete File
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{file.originalName}"? This action
              cannot be undone and the file will be permanently removed from
              storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
