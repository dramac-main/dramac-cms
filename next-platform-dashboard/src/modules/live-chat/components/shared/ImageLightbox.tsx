"use client";

/**
 * ImageLightbox — Click-to-zoom image viewer
 *
 * Renders a thumbnail that opens a full-screen overlay on click.
 * Designed for payment proof review — agents need to zoom in on
 * bank receipts, mobile money screenshots, etc. to verify details.
 *
 * Supports images and falls back to a download link for PDFs.
 */

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn } from "lucide-react";

interface ImageLightboxProps {
  /** The image URL to display */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** The MIME type — images get inline zoom, PDFs get download link */
  contentType?: string;
  /** Original file name for download / display */
  fileName?: string;
  /** Custom trigger element (default: renders thumbnail with zoom icon) */
  children?: ReactNode;
  /** Additional className for the thumbnail wrapper */
  className?: string;
  /** Max height for the thumbnail (default: max-h-48) */
  thumbnailMaxHeight?: string;
}

export function ImageLightbox({
  src,
  alt = "Image preview",
  contentType,
  fileName,
  children,
  className,
  thumbnailMaxHeight = "max-h-48",
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const isImage = !contentType || contentType.startsWith("image/");

  return (
    <>
      {/* Thumbnail / trigger */}
      {children ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-zoom-in"
        >
          {children}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group relative cursor-zoom-in rounded-lg overflow-hidden border bg-muted/50 ${className || ""}`}
        >
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt}
              className={`w-auto mx-auto object-contain ${thumbnailMaxHeight}`}
            />
          ) : (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <span className="text-sm">{fileName || "Document"}</span>
            </div>
          )}
          {/* Zoom overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </button>
      )}

      {/* Lightbox overlay */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-0">
          <DialogTitle className="sr-only">
            {alt || "Image preview"}
          </DialogTitle>

          {/* Top bar with file name + actions */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-sm text-white/80 truncate max-w-[50%]">
              {fileName || alt}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                asChild
              >
                <a
                  href={src}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image / Content */}
          <div className="flex items-center justify-center w-full h-full min-h-[60vh] p-8">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-[80vh] object-contain select-none"
                draggable={false}
              />
            ) : (
              <div className="text-center space-y-4">
                <p className="text-white/80 text-lg">
                  {fileName || "PDF Document"}
                </p>
                <Button asChild variant="secondary">
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Open Document
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
