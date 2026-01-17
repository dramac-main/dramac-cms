"use client";

import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Image as ImageIcon,
  Video,
  FileText,
  File,
  Check,
  Copy,
  Trash2,
  FolderInput,
  Eye,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/lib/media/media-service";
import { toast } from "sonner";

interface MediaGridProps {
  files: MediaFile[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onItemClick: (file: MediaFile) => void;
  onDelete?: (id: string) => void;
  onMove?: (id: string) => void;
  selectionMode?: boolean;
  viewMode?: "grid" | "list";
}

export function MediaGrid({
  files,
  selectedIds,
  onSelect,
  onSelectAll,
  onItemClick,
  onDelete,
  onMove,
  selectionMode = false,
  viewMode = "grid",
}: MediaGridProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-8 w-8" />;
      case "video":
        return <Video className="h-8 w-8" />;
      case "document":
        return <FileText className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  if (files.length === 0) {
    return (
      <div className="py-16 text-center">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-2">No files found</h3>
        <p className="text-sm text-muted-foreground">
          Upload files or adjust your filters to see results
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_100px_100px_100px_50px] gap-4 px-4 py-3 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
          <div>
            <Checkbox
              checked={selectedIds.length === files.length && files.length > 0}
              onCheckedChange={(checked) => onSelectAll(!!checked)}
            />
          </div>
          <div>Name</div>
          <div>Size</div>
          <div>Type</div>
          <div>Date</div>
          <div></div>
        </div>

        {/* Rows */}
        {files.map((file) => {
          const isSelected = selectedIds.includes(file.id);

          return (
            <div
              key={file.id}
              className={cn(
                "grid grid-cols-[auto_1fr_100px_100px_100px_50px] gap-4 px-4 py-3 items-center border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors",
                isSelected && "bg-primary/5"
              )}
              onClick={() => onItemClick(file)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect(file.id, !!checked)}
                />
              </div>

              <div className="flex items-center gap-3 min-w-0">
                {file.fileType === "image" ? (
                  <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={file.thumbnailUrl || file.publicUrl}
                      alt={file.altText || file.originalName}
                      width={40}
                      height={40}
                      className="object-cover h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    {getFileIcon(file.fileType)}
                  </div>
                )}
                <span className="truncate text-sm">{file.originalName}</span>
              </div>

              <div className="text-sm text-muted-foreground">
                {formatFileSize(file.fileSize)}
              </div>

              <div>
                <Badge variant="secondary" className="text-xs capitalize">
                  {file.fileType}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground">
                {formatDate(file.createdAt)}
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(file.publicUrl, "_blank")}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyUrl(file.publicUrl)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={file.publicUrl} download={file.originalName}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    {onMove && (
                      <DropdownMenuItem onClick={() => onMove(file.id)}>
                        <FolderInput className="h-4 w-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(file.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {files.map((file) => {
        const isSelected = selectedIds.includes(file.id);

        return (
          <div
            key={file.id}
            className={cn(
              "group relative bg-card rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:shadow-md",
              isSelected
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent hover:border-primary/50"
            )}
            onClick={() => {
              if (selectionMode) {
                onSelect(file.id, !isSelected);
              } else {
                onItemClick(file);
              }
            }}
          >
            {/* Selection Checkbox */}
            <div
              className={cn(
                "absolute top-2 left-2 z-10 transition-opacity",
                selectionMode || isSelected || "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(file.id, !!checked)}
                className="bg-white/90 border-white/50 data-[state=checked]:bg-primary"
              />
            </div>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 z-10">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}

            {/* Actions Menu */}
            <div
              className={cn(
                "absolute top-2 right-2 z-10 transition-opacity",
                isSelected ? "opacity-0" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 shadow-sm"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(file.publicUrl, "_blank")}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyUrl(file.publicUrl)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={file.publicUrl} download={file.originalName}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  {onMove && (
                    <DropdownMenuItem onClick={() => onMove(file.id)}>
                      <FolderInput className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(file.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Thumbnail */}
            <div className="aspect-square relative bg-muted">
              {file.fileType === "image" ? (
                <Image
                  src={file.thumbnailUrl || file.publicUrl}
                  alt={file.altText || file.originalName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {getFileIcon(file.fileType)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="p-2">
              <p className="text-sm font-medium truncate" title={file.originalName}>
                {file.originalName}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.fileSize)}
                </span>
                {file.width && file.height && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {file.width}×{file.height}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
