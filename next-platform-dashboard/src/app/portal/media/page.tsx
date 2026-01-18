"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Image, 
  FileVideo, 
  FileText, 
  File, 
  Search, 
  Loader2,
  Globe,
  Filter,
  RefreshCcw,
  Download,
  Eye,
  ZoomIn,
  ZoomOut
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
import { getPortalMedia, getPortalMediaSites, type PortalMediaFile } from "@/lib/portal/portal-media-service";

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
      return Image;
    case "video":
      return FileVideo;
    case "document":
      return FileText;
    default:
      return File;
  }
}

export default function PortalMediaPage() {
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [media, setMedia] = useState<PortalMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSites, setLoadingSites] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  
  // Preview state
  const [previewFile, setPreviewFile] = useState<PortalMediaFile | null>(null);
  const [zoom, setZoom] = useState(1);

  // Load accessible sites on mount
  useEffect(() => {
    async function loadSites() {
      setLoadingSites(true);
      try {
        const result = await getPortalMediaSites();
        setSites(result.sites);
        if (result.sites.length > 0) {
          setSelectedSiteId(result.sites[0].id);
        }
      } catch (error) {
        console.error("Failed to load sites:", error);
        toast.error("Failed to load your sites");
      } finally {
        setLoadingSites(false);
      }
    }
    loadSites();
  }, []);

  const loadMedia = useCallback(async (showRefreshing = false) => {
    if (!selectedSiteId) return;
    
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

      const result = await getPortalMedia(selectedSiteId, filters, page);
      setMedia(result.files);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load media:", error);
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSiteId, search, fileTypeFilter, page]);

  // Load media when site or filters change
  useEffect(() => {
    if (selectedSiteId) {
      loadMedia();
    }
  }, [selectedSiteId, loadMedia]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, fileTypeFilter, selectedSiteId]);

  const handleRefresh = () => {
    loadMedia(true);
  };

  const handleDownload = (file: PortalMediaFile) => {
    window.open(file.publicUrl, "_blank");
  };

  const totalPages = Math.ceil(total / 24);

  if (loadingSites) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6" />
            Media Library
          </h1>
          <p className="text-muted-foreground mt-1">
            View images and files for your sites
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sites Available</h3>
            <p className="text-muted-foreground">
              You don&apos;t have access to any sites with media files.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6" />
            Media Library
          </h1>
          <p className="text-muted-foreground mt-1">
            View images and files for your sites (read-only)
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Site Selector */}
            <div className="flex-1">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger>
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* File Type Filter */}
            <div className="w-full sm:w-40">
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Media Files</h3>
            <p className="text-muted-foreground">
              {search || fileTypeFilter !== "all"
                ? "No files match your filters."
                : "This site doesn't have any media files yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((file) => {
              const FileIcon = getFileIcon(file.fileType);
              
              return (
                <Card
                  key={file.id}
                  className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setPreviewFile(file)}
                >
                  <div className="aspect-square relative bg-muted">
                    {file.fileType === "image" && file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.altText || file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : file.fileType === "image" && file.publicUrl ? (
                      <img
                        src={file.publicUrl}
                        alt={file.altText || file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate" title={file.originalName}>
                      {file.originalName}
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
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Total count */}
          <p className="text-center text-sm text-muted-foreground">
            {total} file{total !== 1 ? "s" : ""} total
          </p>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setZoom(1); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{previewFile?.originalName}</span>
              <div className="flex items-center gap-2 ml-4">
                {previewFile?.fileType === "image" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-12 text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewFile && handleDownload(previewFile)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {previewFile && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="bg-muted rounded-lg overflow-auto max-h-[60vh] flex items-center justify-center p-4">
                {previewFile.fileType === "image" ? (
                  <img
                    src={previewFile.publicUrl}
                    alt={previewFile.altText || previewFile.originalName}
                    style={{ transform: `scale(${zoom})`, transition: "transform 0.2s" }}
                    className="max-w-full object-contain"
                  />
                ) : previewFile.fileType === "video" ? (
                  <video
                    src={previewFile.publicUrl}
                    controls
                    className="max-w-full max-h-[50vh]"
                  />
                ) : (
                  <div className="text-center py-12">
                    <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Preview not available</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => handleDownload(previewFile)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to view
                    </Button>
                  </div>
                )}
              </div>

              {/* File Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">File Name</p>
                  <p className="font-medium">{previewFile.originalName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">File Size</p>
                  <p className="font-medium">{formatFileSize(previewFile.fileSize)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{previewFile.fileType}</p>
                </div>
                {previewFile.width && previewFile.height && (
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-medium">{previewFile.width} × {previewFile.height}</p>
                  </div>
                )}
                {previewFile.altText && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Alt Text</p>
                    <p className="font-medium">{previewFile.altText}</p>
                  </div>
                )}
                {previewFile.tags && previewFile.tags.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {previewFile.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
