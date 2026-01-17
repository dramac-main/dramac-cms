"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Upload,
  Loader2,
  Grid3X3,
  List,
  Image as ImageIcon,
  X,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MediaGrid } from "./media-grid";
import { MediaUploadZone, type UploadedFile } from "./media-upload-zone";
import { FolderTree } from "./folder-tree";
import {
  getMediaFiles,
  getMediaFolders,
  type MediaFile,
  type MediaFolder,
} from "@/lib/media/media-service";

interface MediaPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (file: MediaFile | MediaFile[]) => void;
  agencyId: string;
  siteId?: string;
  multiple?: boolean;
  fileType?: "image" | "video" | "document" | "all";
  title?: string;
  maxSelection?: number;
}

export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
  agencyId,
  siteId,
  multiple = false,
  fileType = "all",
  title = "Select Media",
  maxSelection,
}: MediaPickerDialogProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load data when dialog opens or filters change
  const loadData = useCallback(async () => {
    if (!open) return;

    setLoading(true);

    const [filesResult, foldersData] = await Promise.all([
      getMediaFiles(agencyId, {
        folderId: currentFolderId,
        fileType: fileType === "all" ? undefined : fileType,
        search: debouncedSearch || undefined,
        siteId,
      }),
      getMediaFolders(agencyId),
    ]);

    setFiles(filesResult.files);
    setTotal(filesResult.total);
    setFolders(foldersData);
    setLoading(false);
  }, [open, agencyId, currentFolderId, fileType, debouncedSearch, siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearch("");
      setCurrentFolderId(null);
      setActiveTab("library");
    }
  }, [open]);

  const handleSelect = (id: string, selected: boolean) => {
    if (!multiple) {
      setSelectedIds(selected ? [id] : []);
    } else {
      setSelectedIds((prev) => {
        if (selected) {
          if (maxSelection && prev.length >= maxSelection) {
            return prev;
          }
          return [...prev, id];
        }
        return prev.filter((i) => i !== id);
      });
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (!multiple) return;
    if (selected) {
      const idsToSelect = maxSelection
        ? files.slice(0, maxSelection).map((f) => f.id)
        : files.map((f) => f.id);
      setSelectedIds(idsToSelect);
    } else {
      setSelectedIds([]);
    }
  };

  const handleItemClick = (file: MediaFile) => {
    if (multiple) {
      handleSelect(file.id, !selectedIds.includes(file.id));
    } else {
      // Single selection - select and confirm
      onSelect(file);
      onClose();
    }
  };

  const handleConfirm = () => {
    const selectedFiles = files.filter((f) => selectedIds.includes(f.id));
    if (selectedFiles.length > 0) {
      if (multiple) {
        onSelect(selectedFiles);
      } else {
        onSelect(selectedFiles[0]);
      }
      onClose();
    }
  };

  const handleUploadComplete = (uploadedFiles: UploadedFile[]) => {
    loadData();
    setActiveTab("library");

    // If single selection, auto-select the first uploaded file
    if (!multiple && uploadedFiles.length > 0) {
      const firstUpload = uploadedFiles[0];
      // We need to wait for loadData to complete, then find and select the file
      setTimeout(() => {
        const newFile = files.find((f) => f.id === firstUpload.fileId);
        if (newFile) {
          onSelect(newFile);
          onClose();
        }
      }, 500);
    }
  };

  const selectedCount = selectedIds.length;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "library" | "upload")}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="library">Media Library</TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="library"
            className="flex-1 flex min-h-0 m-0 data-[state=inactive]:hidden"
          >
            <div className="flex flex-1 min-h-0">
              {/* Sidebar */}
              <div className="w-48 border-r p-4 overflow-y-auto">
                <FolderTree
                  folders={folders}
                  currentFolderId={currentFolderId}
                  onSelectFolder={setCurrentFolderId}
                  canManageFolders={false}
                />
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Toolbar */}
                <div className="flex items-center gap-4 p-4 border-b">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search files..."
                      className="pl-9"
                    />
                    {search && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearch("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  {multiple && selectedCount > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {selectedCount} selected
                      {maxSelection && ` of ${maxSelection}`}
                    </div>
                  )}
                </div>

                {/* Files Grid */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <MediaGrid
                        files={files}
                        selectedIds={selectedIds}
                        onSelect={handleSelect}
                        onSelectAll={handleSelectAll}
                        onItemClick={handleItemClick}
                        selectionMode={multiple}
                        viewMode={viewMode}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="upload"
            className="flex-1 p-6 m-0 data-[state=inactive]:hidden"
          >
            <MediaUploadZone
              agencyId={agencyId}
              folderId={currentFolderId || undefined}
              siteId={siteId}
              onUploadComplete={handleUploadComplete}
              accept={
                fileType === "image"
                  ? { "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"] }
                  : fileType === "video"
                  ? { "video/*": [".mp4", ".webm", ".mov"] }
                  : undefined
              }
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {multiple && (
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedCount === 0}>
              <Check className="h-4 w-4 mr-2" />
              Select {selectedCount > 0 && `(${selectedCount})`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
