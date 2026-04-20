"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  FileText,
  X,
} from "lucide-react";

interface ExpenseReceiptViewerProps {
  receiptUrl: string;
  receiptFilename?: string | null;
  /** Compact = inline preview; full = dialog viewer */
  mode?: "compact" | "full";
}

function getFileType(url: string, filename?: string | null): "image" | "pdf" | "unknown" {
  const check = (filename || url).toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|heic|svg)(\?|$)/i.test(check)) return "image";
  if (/\.pdf(\?|$)/i.test(check)) return "pdf";
  return "unknown";
}

export function ExpenseReceiptViewer({
  receiptUrl,
  receiptFilename,
  mode = "full",
}: ExpenseReceiptViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [open, setOpen] = useState(false);

  const fileType = getFileType(receiptUrl, receiptFilename);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.25)), []);
  const handleRotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const displayName = receiptFilename || "Receipt";

  // ─── Compact inline preview ────────────────────────────────
  if (mode === "compact") {
    if (fileType === "image") {
      return (
        <div className="relative group">
          <img
            src={receiptUrl}
            alt={displayName}
            className="max-h-48 rounded-lg border object-contain cursor-pointer"
            onClick={() => setOpen(true)}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
              <ReceiptViewerInner
                receiptUrl={receiptUrl}
                fileType="image"
                displayName={displayName}
                zoom={zoom}
                rotation={rotation}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onRotate={handleRotate}
                onReset={handleReset}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    if (fileType === "pdf") {
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
              View PDF
            </a>
          </Button>
        </div>
      );
    }

    return (
      <Button variant="outline" size="sm" asChild>
        <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4 mr-1.5" />
          Download Receipt
        </a>
      </Button>
    );
  }

  // ─── Full dialog viewer ────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Maximize2 className="h-4 w-4 mr-1.5" />
          View Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ReceiptViewerInner
          receiptUrl={receiptUrl}
          fileType={fileType}
          displayName={displayName}
          zoom={zoom}
          rotation={rotation}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRotate={handleRotate}
          onReset={handleReset}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Inner viewer (shared by compact + full) ─────────────────

interface ReceiptViewerInnerProps {
  receiptUrl: string;
  fileType: "image" | "pdf" | "unknown";
  displayName: string;
  zoom: number;
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onReset: () => void;
}

function ReceiptViewerInner({
  receiptUrl,
  fileType,
  displayName,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
}: ReceiptViewerInnerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <span className="text-sm font-medium truncate max-w-[200px]">{displayName}</span>
        <div className="flex items-center gap-1">
          {fileType === "image" && (
            <>
              <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onRotate} title="Rotate">
                <RotateCw className="h-4 w-4" />
              </Button>
              <div className="w-px h-5 bg-border mx-1" />
            </>
          )}
          <Button variant="ghost" size="icon" asChild title="Download">
            <a href={receiptUrl} download={displayName} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/10 min-h-[400px]">
        {fileType === "image" ? (
          <div className="overflow-auto p-4 w-full h-full flex items-center justify-center">
            <img
              src={receiptUrl}
              alt={displayName}
              className="max-w-full transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
              draggable={false}
            />
          </div>
        ) : fileType === "pdf" ? (
          <iframe
            src={receiptUrl}
            title={displayName}
            className="w-full h-full min-h-[500px] border-0"
          />
        ) : (
          <div className="text-center p-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Preview not available for this file type.
            </p>
            <Button variant="outline" asChild>
              <a href={receiptUrl} download={displayName} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
