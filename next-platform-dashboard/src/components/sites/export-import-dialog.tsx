"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2, FileJson, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { exportSiteAction, importSiteAction } from "@/lib/actions/export-import";

interface ExportImportDialogProps {
  siteId: string;
  siteName: string;
  clientId: string;
}

export function ExportImportDialog({
  siteId,
  siteName,
  clientId,
}: ExportImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [overwritePages, setOverwritePages] = useState(false);
  const [importModules, setImportModules] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await exportSiteAction(siteId);
      
      if (result.success && result.json && result.filename) {
        // Create download
        const blob = new Blob([result.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("Export successful", {
          description: `Site exported to ${result.filename}`,
        });
      } else {
        toast.error("Export failed", {
          description: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);
    
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".json")) {
        setImportError("Please select a JSON file");
        setImportFile(null);
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setImportError("File size exceeds 50MB limit");
        setImportFile(null);
        return;
      }
      
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("No file selected", {
        description: "Please select a JSON file to import",
      });
      return;
    }

    setLoading(true);
    setImportError(null);
    
    try {
      const jsonText = await importFile.text();
      
      // Basic JSON validation
      try {
        JSON.parse(jsonText);
      } catch {
        setImportError("Invalid JSON file format");
        return;
      }
      
      const result = await importSiteAction(jsonText, {
        targetSiteId: siteId,
        clientId,
        overwritePages,
        importModules,
      });

      if (result.success) {
        toast.success("Import successful", {
          description: `${result.details?.pagesImported || 0} pages imported${
            result.details?.pagesSkipped ? `, ${result.details.pagesSkipped} skipped` : ""
          }`,
        });
        setOpen(false);
        setImportFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setImportError(result.error || "Import failed");
        toast.error("Import failed", {
          description: result.error || "Unknown error occurred",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setImportError(errorMessage);
      toast.error("Import failed", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when closing
      setImportFile(null);
      setImportError(null);
      setOverwritePages(false);
      setImportModules(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileJson className="mr-2 h-4 w-4" />
          Export/Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export / Import Site</DialogTitle>
          <DialogDescription>
            Export &quot;{siteName}&quot; to JSON or import from a backup file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 py-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Export all site data including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All pages and their content</li>
                <li>Site settings and SEO data</li>
                <li>Module configurations</li>
              </ul>
            </div>
            <Button onClick={handleExport} disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download Export
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 py-4">
            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label>Select JSON File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                disabled={loading}
              />
              {importFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwritePages"
                  checked={overwritePages}
                  onCheckedChange={(checked) => setOverwritePages(!!checked)}
                  disabled={loading}
                />
                <Label htmlFor="overwritePages" className="font-normal cursor-pointer">
                  Overwrite existing pages with same slug
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importModules"
                  checked={importModules}
                  onCheckedChange={(checked) => setImportModules(!!checked)}
                  disabled={loading}
                />
                <Label htmlFor="importModules" className="font-normal cursor-pointer">
                  Import module settings
                </Label>
              </div>
            </div>

            <Button
              onClick={handleImport}
              disabled={loading || !importFile}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Import Data
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
