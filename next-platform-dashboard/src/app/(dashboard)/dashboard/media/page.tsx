"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  Upload,
  Search,
  Grid3X3,
  List,
  Loader2,
  Trash2,
  FolderOpen,
  ChevronRight,
  RefreshCw,
  Download,
  Info,
  HardDrive,
  ImageIcon,
  Video,
  FileText,
  MoreHorizontal,
  X,
  Settings,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaUploadZone } from "@/components/media/media-upload-zone";
import { MediaDetailsPanel } from "@/components/media/media-details-panel";
import { FolderTree } from "@/components/media/folder-tree";
import {
  getMediaFiles,
  getMediaFolders,
  createFolder,
  deleteMediaFile,
  deleteFolder,
  updateFolder,
  getMediaStats,
  deleteMediaFiles,
  getUserAgencyAndRole,
  type MediaFile,
  type MediaFolder,
} from "@/lib/media/media-service";
import { toast } from "sonner";

interface UserContext {
  userId: string;
  agencyId: string;
  role: string | null;
  canDelete: boolean;
  canCreateFolders: boolean;
  isSuperAdmin: boolean;
}

export default function MediaLibraryPage() {
  const router = useRouter();

  // User context
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // State
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, number>;
  } | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailFile, setDetailFile] = useState<MediaFile | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fileType, setFileType] = useState<string>("all");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // UI state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load user context on mount
  useEffect(() => {
    async function loadUserContext() {
      const context = await getUserAgencyAndRole();
      if (!context || !context.agencyId) {
        router.push("/dashboard");
        return;
      }
      setUserContext({
        userId: context.userId,
        agencyId: context.agencyId,
        role: context.role,
        canDelete: context.role !== "agency_member",
        canCreateFolders: context.role !== "agency_member",
        isSuperAdmin: context.isSuperAdmin,
      });
    }
    loadUserContext();
  }, [router]);

  const loadData = useCallback(async () => {
    if (!userContext?.agencyId) return;

    setLoading(true);

    const [filesResult, foldersData, statsData] = await Promise.all([
      getMediaFiles(userContext.agencyId, {
        folderId: currentFolderId,
        fileType: fileType === "all" ? undefined : fileType,
        search: debouncedSearch || undefined,
      }),
      getMediaFolders(userContext.agencyId),
      getMediaStats(userContext.agencyId),
    ]);

    setFiles(filesResult.files);
    setTotal(filesResult.total);
    setFolders(foldersData);
    setStats(statsData);
    setLoading(false);
  }, [userContext?.agencyId, currentFolderId, fileType, debouncedSearch]);

  useEffect(() => {
    if (userContext?.agencyId) {
      loadData();
    }
  }, [loadData, userContext?.agencyId]);

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedIds(selected ? files.map((f) => f.id) : []);
  };

  const handleItemClick = (file: MediaFile) => {
    setDetailFile(file);
  };

  const handleDelete = async (id: string) => {
    if (!userContext?.canDelete) {
      toast.error("You don't have permission to delete files");
      return;
    }
    const result = await deleteMediaFile(id);
    if (result.success) {
      toast.success("File deleted");
      loadData();
      if (detailFile?.id === id) {
        setDetailFile(null);
      }
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    if (!userContext?.canDelete) {
      toast.error("You don't have permission to delete files");
      return;
    }
    if (!confirm(`Delete ${selectedIds.length} files? This cannot be undone.`)) return;

    const result = await deleteMediaFiles(selectedIds);
    if (result.deleted > 0) {
      toast.success(`Deleted ${result.deleted} files`);
    }
    if (result.errors.length > 0) {
      toast.error(`${result.errors.length} files failed to delete`);
    }
    setSelectedIds([]);
    loadData();
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    if (!userContext?.canCreateFolders) {
      toast.error("You don't have permission to create folders");
      return;
    }
    if (!userContext?.agencyId) return;

    const result = await createFolder(userContext.agencyId, name, parentId);
    if (result.success) {
      toast.success("Folder created");
      loadData();
    } else {
      toast.error(result.error || "Failed to create folder");
    }
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    const result = await updateFolder(folderId, { name });
    if (result.success) {
      toast.success("Folder renamed");
      loadData();
    } else {
      toast.error(result.error || "Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder? Files inside will be moved to root.")) return;
    
    const result = await deleteFolder(folderId);
    if (result.success) {
      toast.success("Folder deleted");
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      loadData();
    } else {
      toast.error(result.error || "Failed to delete folder");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId);
  }, [currentFolderId, folders]);

  // Loading state for user context
  if (!userContext) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 border-b">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Media Library</h1>
              <p className="text-muted-foreground">
                {total} files
                {stats && ` • ${formatFileSize(stats.totalSize)} used`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              {userContext.canCreateFolders && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const name = prompt("Folder name:");
                    if (name) handleCreateFolder(name, currentFolderId || undefined);
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              )}
              <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
                <SheetTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader>
                    <SheetTitle>Upload Files</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <MediaUploadZone
                      agencyId={userContext.agencyId}
                      folderId={currentFolderId || undefined}
                      onUploadComplete={() => {
                        loadData();
                        setUploadOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files by name, alt text..."
                className="pl-9 pr-9"
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

            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images
                  </span>
                </SelectItem>
                <SelectItem value="video">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Videos
                  </span>
                </SelectItem>
                <SelectItem value="document">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {selectedIds.length > 0 && userContext.canDelete && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-56 border-r p-4 overflow-y-auto flex-shrink-0">
            <FolderTree
              folders={folders}
              currentFolderId={currentFolderId}
              onSelectFolder={setCurrentFolderId}
              onCreateFolder={userContext.canCreateFolders ? handleCreateFolder : undefined}
              onRenameFolder={userContext.canCreateFolders ? handleRenameFolder : undefined}
              onDeleteFolder={userContext.canCreateFolders ? handleDeleteFolder : undefined}
              canManageFolders={userContext.canCreateFolders}
            />

            {/* Storage Stats */}
            {stats && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  Storage
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Files</span>
                    <span>{stats.totalFiles}</span>
                  </div>
                </div>
                {Object.keys(stats.byType).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <Badge variant="secondary" className="capitalize">
                          {type}
                        </Badge>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Files Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumbs */}
          {currentFolder && (
            <div className="px-6 py-2 border-b flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => setCurrentFolderId(null)}
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                All Files
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentFolder.name}</span>
              <Badge variant="secondary" className="ml-2">
                {total} files
              </Badge>
            </div>
          )}

          {/* Files Grid */}
          <div className="flex-1 overflow-y-auto p-6">
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
                onDelete={userContext.canDelete ? handleDelete : undefined}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>

        {/* Details Panel */}
        {detailFile && (
          <MediaDetailsPanel
            file={detailFile}
            onClose={() => setDetailFile(null)}
            onUpdate={loadData}
            onDelete={
              userContext.canDelete
                ? () => {
                    setDetailFile(null);
                    loadData();
                  }
                : undefined
            }
            canEdit={true}
            canDelete={userContext.canDelete}
          />
        )}
      </div>
    </div>
  );
}
