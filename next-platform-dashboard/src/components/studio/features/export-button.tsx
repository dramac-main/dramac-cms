/**
 * DRAMAC Studio Export Button
 * 
 * Toolbar button for exporting the current page/site as static HTML.
 * Shows export options dialog and handles the export process.
 * 
 * @phase STUDIO-23 - Export & Render Optimization
 */

"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileCode,
  Archive,
  Eye,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/lib/studio/store";
import { toast } from "sonner";

// =============================================================================
// TYPES
// =============================================================================

interface ExportButtonProps {
  siteId: string;
  pageId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

interface ExportOptions {
  minify: boolean;
  optimizeAssets: boolean;
  inlineCriticalCSS: boolean;
  generateSitemap: boolean;
  baseUrl: string;
}

type ExportFormat = "json" | "zip" | "preview";

interface ExportStatus {
  state: "idle" | "exporting" | "success" | "error";
  progress: number;
  message?: string;
  result?: {
    files: number;
    totalSize: number;
    duration: number;
    downloadUrl?: string;
    previewUrls?: string[];
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExportButton({
  siteId,
  pageId,
  className,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("json");
  const [options, setOptions] = useState<ExportOptions>({
    minify: true,
    optimizeAssets: true,
    inlineCriticalCSS: true,
    generateSitemap: true,
    baseUrl: "",
  });
  const [status, setStatus] = useState<ExportStatus>({
    state: "idle",
    progress: 0,
  });
  
  // Get current page info from store data
  const pageData = useEditorStore((s) => s.data);
  
  // Handle export
  const handleExport = useCallback(async () => {
    setStatus({ state: "exporting", progress: 10, message: "Preparing export..." });
    
    try {
      // Call export API
      const response = await fetch("/api/studio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          pageId,
          format,
          options: {
            ...options,
            mode: "production",
          },
        }),
      });
      
      setStatus({ state: "exporting", progress: 50, message: "Building output..." });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Export failed");
      }
      
      setStatus({
        state: "success",
        progress: 100,
        message: "Export complete!",
        result: {
          files: data.result?.files?.length || 0,
          totalSize: data.result?.stats?.totalSize || 0,
          duration: data.result?.duration || 0,
          downloadUrl: data.downloadUrl,
          previewUrls: data.previewUrls,
        },
      });
      
      toast.success("Export completed successfully!");
      
      // Handle download for zip format
      if (format === "zip" && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
      
      // Handle preview format
      if (format === "preview" && data.previewUrls?.[0]) {
        window.open(data.previewUrls[0], "_blank");
      }
      
    } catch (error) {
      console.error("Export error:", error);
      setStatus({
        state: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Export failed",
      });
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }, [siteId, pageId, format, options]);
  
  // Reset on dialog close
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setStatus({ state: "idle", progress: 0 });
    }
  };
  
  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className={cn("gap-1.5", className)}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export As</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DialogTrigger asChild>
            <DropdownMenuItem
              onClick={() => setFormat("json")}
              className="gap-2 cursor-pointer"
            >
              <FileCode className="h-4 w-4" />
              <span>JSON Data</span>
            </DropdownMenuItem>
          </DialogTrigger>
          
          <DialogTrigger asChild>
            <DropdownMenuItem
              onClick={() => setFormat("zip")}
              className="gap-2 cursor-pointer"
            >
              <Archive className="h-4 w-4" />
              <span>ZIP Archive</span>
            </DropdownMenuItem>
          </DialogTrigger>
          
          <DialogTrigger asChild>
            <DropdownMenuItem
              onClick={() => setFormat("preview")}
              className="gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format === "json" && <FileCode className="h-5 w-5" />}
            {format === "zip" && <Archive className="h-5 w-5" />}
            {format === "preview" && <Eye className="h-5 w-5" />}
            Export {pageId ? "Page" : "Site"}
          </DialogTitle>
          <DialogDescription>
            {format === "json" && "Export page data as JSON for backup or migration."}
            {format === "zip" && "Download a ZIP archive with HTML, CSS, and assets."}
            {format === "preview" && "Preview the exported static page."}
          </DialogDescription>
        </DialogHeader>
        
        {status.state === "idle" && (
          <div className="space-y-4 py-4">
            {/* Export options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="minify" className="flex-1">
                  Minify output
                  <p className="text-xs text-muted-foreground font-normal">
                    Reduce file size by removing whitespace
                  </p>
                </Label>
                <Switch
                  id="minify"
                  checked={options.minify}
                  onCheckedChange={(checked) =>
                    setOptions((o) => ({ ...o, minify: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="optimizeAssets" className="flex-1">
                  Optimize assets
                  <p className="text-xs text-muted-foreground font-normal">
                    Compress images and optimize files
                  </p>
                </Label>
                <Switch
                  id="optimizeAssets"
                  checked={options.optimizeAssets}
                  onCheckedChange={(checked) =>
                    setOptions((o) => ({ ...o, optimizeAssets: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="inlineCriticalCSS" className="flex-1">
                  Inline critical CSS
                  <p className="text-xs text-muted-foreground font-normal">
                    Improve page load performance
                  </p>
                </Label>
                <Switch
                  id="inlineCriticalCSS"
                  checked={options.inlineCriticalCSS}
                  onCheckedChange={(checked) =>
                    setOptions((o) => ({ ...o, inlineCriticalCSS: checked }))
                  }
                />
              </div>
              
              {!pageId && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="generateSitemap" className="flex-1">
                    Generate sitemap
                    <p className="text-xs text-muted-foreground font-normal">
                      Create sitemap.xml for SEO
                    </p>
                  </Label>
                  <Switch
                    id="generateSitemap"
                    checked={options.generateSitemap}
                    onCheckedChange={(checked) =>
                      setOptions((o) => ({ ...o, generateSitemap: checked }))
                    }
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="baseUrl">Base URL (optional)</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://example.com"
                  value={options.baseUrl}
                  onChange={(e) =>
                    setOptions((o) => ({ ...o, baseUrl: e.target.value }))
                  }
                />
              </div>
            </div>
            
            {/* What will be exported */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="font-medium mb-2">Export includes:</div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>HTML files</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  <span>CSS styles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Media assets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Asset manifest</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {status.state === "exporting" && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">{status.message}</p>
              <Progress value={status.progress} className="mt-3" />
            </div>
          </div>
        )}
        
        {status.state === "success" && status.result && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">Export Complete!</p>
              <p className="text-muted-foreground text-sm mt-1">
                Built in {status.result.duration}ms
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <Badge variant="secondary" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {status.result.files} files
              </Badge>
              <Badge variant="secondary" className="gap-1.5">
                <Archive className="h-3.5 w-3.5" />
                {formatSize(status.result.totalSize)}
              </Badge>
            </div>
            
            {status.result.downloadUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(status.result!.downloadUrl, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download ZIP
              </Button>
            )}
            
            {status.result.previewUrls && status.result.previewUrls.length > 0 && (
              <Button
                className="w-full"
                onClick={() => window.open(status.result!.previewUrls![0], "_blank")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Preview
              </Button>
            )}
          </div>
        )}
        
        {status.state === "error" && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg">Export Failed</p>
              <p className="text-muted-foreground text-sm mt-1">
                {status.message}
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {status.state === "idle" && (
            <>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          )}
          
          {(status.state === "success" || status.state === "error") && (
            <Button onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// MINI EXPORT BUTTON (for toolbar)
// =============================================================================

export function ExportMini({
  siteId,
  pageId,
  className,
}: {
  siteId: string;
  pageId?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  
  const handleQuickExport = async () => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/studio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          pageId,
          format: "preview",
          options: { minify: true, optimizeAssets: true },
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.previewUrls?.[0]) {
        window.open(data.previewUrls[0], "_blank");
        toast.success("Preview generated!");
      } else {
        throw new Error(data.error || "Export failed");
      }
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={handleQuickExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
