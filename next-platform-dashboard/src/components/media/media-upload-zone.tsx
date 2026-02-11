"use client";

import { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Upload,
  Loader2,
  CircleCheck,
  CircleX,
  Image as ImageIcon,
  FileText,
  Video,
  File,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface MediaUploadZoneProps {
  agencyId: string;
  folderId?: string;
  siteId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadStart?: () => void;
  className?: string;
  compact?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
  fileId?: string;
  publicUrl?: string;
}

export interface UploadedFile {
  fileId: string;
  name: string;
  publicUrl: string;
}

const DEFAULT_ACCEPTED_TYPES: Record<string, string[]> = {
  "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico"],
  "video/*": [".mp4", ".webm", ".mov", ".avi"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
};

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function MediaUploadZone({
  agencyId,
  folderId,
  siteId,
  onUploadComplete,
  onUploadStart,
  className,
  compact = false,
  accept = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 20,
}: MediaUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      onUploadStart?.();

      // Create upload entries
      const newFiles: UploadingFile[] = files.map((file) => ({
        id: Math.random().toString(36).slice(2),
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: "uploading" as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      // Build form data
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (folderId) formData.append("folderId", folderId);
      if (siteId) formData.append("siteId", siteId);

      try {
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        // Update file states based on results
        const uploadedMap = new Map(
          result.uploaded?.map((u: { name: string; fileId: string; publicUrl: string }) => [
            u.name,
            u,
          ])
        );
        const errorMap = new Map(
          result.errors?.map((e: { file: string; error: string }) => [e.file, e.error])
        );

        setUploadingFiles((prev) =>
          prev.map((f) => {
            const uploaded = uploadedMap.get(f.name) as {
              fileId: string;
              publicUrl: string;
            } | undefined;
            const error = errorMap.get(f.name) as string | undefined;

            if (uploaded) {
              return {
                ...f,
                progress: 100,
                status: "complete" as const,
                fileId: uploaded.fileId,
                publicUrl: uploaded.publicUrl,
              };
            } else if (error) {
              return {
                ...f,
                status: "error" as const,
                error,
              };
            }
            return f;
          })
        );

        // Collect successful uploads
        const successfulUploads: UploadedFile[] = (result.uploaded || []).map(
          (u: { name: string; fileId: string; publicUrl: string }) => ({
            fileId: u.fileId,
            name: u.name,
            publicUrl: u.publicUrl,
          })
        );

        // Show feedback
        if (result.errors?.length > 0) {
          toast.error(`${result.errors.length} file(s) failed to upload`);
        }
        if (successfulUploads.length > 0) {
          toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
          onUploadComplete?.(successfulUploads);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.status === "uploading"
              ? { ...f, status: "error" as const, error: "Upload failed" }
              : f
          )
        );
        toast.error("Upload failed. Please try again.");
      }

      // Clear completed files after delay
      setTimeout(() => {
        setUploadingFiles((prev) =>
          prev.filter((f) => f.status === "uploading")
        );
      }, 3000);
    },
    [agencyId, folderId, siteId, onUploadComplete, onUploadStart]
  );

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;

    setIsImporting(true);

    try {
      const response = await fetch("/api/media/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          folderId,
          siteId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Image imported successfully");
        setUrlInput("");
        setShowUrlInput(false);
        onUploadComplete?.([
          {
            fileId: result.fileId,
            name: urlInput.split("/").pop() || "imported",
            publicUrl: result.publicUrl,
          },
        ]);
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (error) {
      toast.error("Failed to import image");
    } finally {
      setIsImporting(false);
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejection) => {
        const errors = rejection.errors.map((e) => e.message).join(", ");
        toast.error(`${rejection.file.name}: ${errors}`);
      });

      // Upload accepted files
      if (acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles);
      }
    },
    [uploadFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    noClick: compact,
    noKeyboard: compact,
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />;
    if (type.includes("pdf") || type.includes("document") || type.includes("text")) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={open}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <input {...getInputProps()} />
        </div>
        {uploadingFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            {uploadingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                {file.status === "uploading" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {file.status === "complete" && (
                  <CircleCheck className="h-3 w-3 text-green-500" />
                )}
                {file.status === "error" && (
                  <CircleX className="h-3 w-3 text-destructive" />
                )}
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* URL Import Input */}
      {showUrlInput && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUrlImport();
              }}
            />
            <Button
              onClick={handleUrlImport}
              disabled={!urlInput.trim() || isImporting}
              size="sm"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Import"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "rounded-full p-4 mb-4 transition-colors",
              isDragActive ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "h-8 w-8 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <p className="font-medium text-lg">
            {isDragActive ? "Drop files here..." : "Drag & drop files here"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse • Max {formatSize(maxSize)} per file
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supports: Images, Videos, PDFs, Documents
          </p>
          {!showUrlInput && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput(true);
              }}
            >
              <LinkIcon className="h-3 w-3 mr-1" />
              Import from URL
            </Button>
          )}
        </div>
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                file.status === "complete"
                  ? "bg-green-500/10"
                  : file.status === "error"
                  ? "bg-destructive/10"
                  : "bg-muted"
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {file.status === "uploading" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : file.status === "complete" ? (
                  <CircleCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <CircleX className="h-5 w-5 text-destructive" />
                )}
              </div>

              {/* File Icon */}
              <div className="flex-shrink-0 text-muted-foreground">
                {getFileIcon(file.type)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatSize(file.size)}</span>
                  {file.status === "uploading" && (
                    <>
                      <span>•</span>
                      <span>Uploading...</span>
                    </>
                  )}
                  {file.status === "complete" && (
                    <>
                      <span>•</span>
                      <span className="text-green-500">Uploaded</span>
                    </>
                  )}
                  {file.status === "error" && file.error && (
                    <>
                      <span>•</span>
                      <span className="text-destructive">{file.error}</span>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === "uploading" && (
                  <div className="w-full h-1 bg-muted-foreground/20 rounded mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded animate-pulse"
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
