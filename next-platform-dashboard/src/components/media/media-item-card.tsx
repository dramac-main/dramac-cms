"use client";

import Image from "next/image";
import { forwardRef } from "react";
import {
  Image as ImageIcon,
  Video,
  FileText,
  File,
  MoreVertical,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MediaFile } from "@/lib/media/media-service";

interface MediaItemCardProps {
  file: MediaFile;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  showDimensions?: boolean;
  showSize?: boolean;
  className?: string;
}

export const MediaItemCard = forwardRef<HTMLDivElement, MediaItemCardProps>(
  function MediaItemCard(
    {
      file,
      isSelected = false,
      onSelect,
      onClick,
      showDimensions = true,
      showSize = true,
      className,
    },
    ref
  ) {
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

    const handleClick = (e: React.MouseEvent) => {
      if (onSelect && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSelect();
      } else if (onClick) {
        onClick();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "group relative bg-card rounded-lg overflow-hidden cursor-pointer border-2 transition-all hover:shadow-md",
          isSelected
            ? "border-primary ring-2 ring-primary/20"
            : "border-transparent hover:border-primary/50",
          className
        )}
        onClick={handleClick}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 left-2 z-10">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* File Type Badge */}
        {file.fileType !== "image" && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="text-[10px] capitalize">
              {file.fileType}
            </Badge>
          </div>
        )}

        {/* Thumbnail */}
        <div className="aspect-square relative bg-muted">
          {file.fileType === "image" ? (
            <Image
              src={file.thumbnailUrl || file.publicUrl}
              alt={file.altText || file.originalName}
              fill
              className={cn(
                "object-cover transition-transform",
                "group-hover:scale-105"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {getFileIcon(file.fileType)}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* File Info */}
        <div className="p-2">
          <p
            className="text-sm font-medium truncate"
            title={file.originalName}
          >
            {file.originalName}
          </p>
          <div className="flex items-center justify-between mt-1 gap-2">
            {showSize && (
              <span className="text-xs text-muted-foreground">
                {formatFileSize(file.fileSize)}
              </span>
            )}
            {showDimensions && file.width && file.height && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 flex-shrink-0"
              >
                {file.width}×{file.height}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {file.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {tag}
                </Badge>
              ))}
              {file.tags.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  +{file.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
