"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Image as ImageIcon,
  FileVideo,
  FileText,
  File,
  Search,
  Loader2,
  Filter,
  RefreshCcw,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getPortalMedia,
  getPortalAgencyId,
  deletePortalMedia,
  type PortalMediaFile,
} from "@/lib/portal/portal-media-service";
import { MediaUploadZone, type UploadedFile } from "@/components/media/media-upload-zone";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "image":
      return ImageIcon;
    case "video":
      return FileVideo;
    case "document":
      return FileText;
    default:
      return File;
  }
}

export default function PortalSiteMediaPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const [media, setMedia] = useState<PortalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [previewFile, setPreviewFile] = useState<PortalMediaFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadMedia = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const filters = {
          search: search || undefined,
          fileType: fileTypeFilter === "all" ? undefined : fileTypeFilter,
        };
        const result = await getPortalMedia(siteId, filters, page);
        setMedia(result.files);
        setTotal(result.total);
      } catch (error) {
        console.error("Failed to load media:", error);
        toast.error("Failed to load media files");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [siteId, search, fileTypeFilter, page],
  );

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    getPortalAgencyId().then(setAgencyId);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, fileTypeFilter]);

  const handleUploadComplete = useCallback(
    (_files: UploadedFile[]) => {
      setShowUpload(false);
      loadMedia(true);
    },
    [loadMedia],
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      setDeleting(fileId);
      try {
        const result = await deletePortalMedia(fileId);
        if (result.success) {
          toast.success("File deleted");
          setPreviewFile(null);
          loadMedia(true);
        } else {
          toast.error(result.error || "Failed to delete file");
        }
      } catch {
        toast.error("Failed to delete file");
      } finally {
        setDeleting(null);
      }
    },
    [loadMedia],
  );

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Media Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? "file" : "files"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {agencyId && (
            <Button
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMedia(true)}
            disabled={refreshing}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      {showUpload && agencyId && (
        <Card>
          <CardContent className="pt-6">
            <MediaUploadZone
              agencyId={agencyId}
              siteId={siteId}
              onUploadComplete={handleUploadComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="File type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search || fileTypeFilter !== "all"
                ? "No files match your filters"
                : "No Media Files"}
            </h3>
            <p className="text-muted-foreground">
              {search || fileTypeFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No media files have been uploaded for this site yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {media.map((file) => {
              const FileIcon = getFileIcon(file.fileType);
              return (
                <Card
                  key={file.id}
                  className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => {
                    setPreviewFile(file);
                    setZoom(1);
                  }}
                >
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    {file.fileType === "image" && file.publicUrl ? (
                      <img
                        src={file.publicUrl}
                        alt={file.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={() => setPreviewFile(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">
              {previewFile?.fileName}
            </DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              {previewFile.fileType === "image" && previewFile.publicUrl ? (
                <div className="overflow-auto max-h-[60vh] flex items-center justify-center bg-muted rounded-lg">
                  <img
                    src={previewFile.publicUrl}
                    alt={previewFile.fileName}
                    className="transition-transform"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                  {(() => {
                    const Icon = getFileIcon(previewFile.fileType);
                    return <Icon className="h-16 w-16 text-muted-foreground" />;
                  })()}
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {formatFileSize(previewFile.fileSize)}
                  {previewFile.mimeType && ` · ${previewFile.mimeType}`}
                </div>
                <div className="flex items-center gap-2">
                  {previewFile.fileType === "image" && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(previewFile.publicUrl, "_blank")
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting === previewFile.id}
                    onClick={() => handleDelete(previewFile.id)}
                  >
                    {deleting === previewFile.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
