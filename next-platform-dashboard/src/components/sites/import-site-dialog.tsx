"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, FileJson, AlertCircle, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { importSiteAction } from "@/lib/actions/export-import";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ImportSiteDialogProps {
  clientId: string;
  onImported?: (siteId: string) => void;
  trigger?: React.ReactNode;
}

export function ImportSiteDialog({
  clientId,
  onImported,
  trigger,
}: ImportSiteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [importing, setImporting] = useState(false);
  const [importModules, setImportModules] = useState(true);
  const [overwritePages, setOverwritePages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);

    // Validate file type
    if (!selectedFile.name.endsWith(".json")) {
      setError("Please select a JSON file");
      return;
    }

    // Validate file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit");
      return;
    }

    try {
      const content = await selectedFile.text();
      // Validate JSON
      const data = JSON.parse(content);

      if (!data.version || !data.siteInfo) {
        setError("Invalid export file format");
        return;
      }

      setFile(selectedFile);
      setFileContent(content);

      // Auto-fill name from export
      if (data.siteInfo?.name) {
        setNewName(`${data.siteInfo.name} (Copy)`);
        // Generate subdomain from name
        const slug = data.siteInfo.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        setSubdomain(`${slug}-copy`);
      }
    } catch {
      setError("Invalid JSON file");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setFileContent(null);
    setNewName("");
    setSubdomain("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  async function handleImport() {
    if (!fileContent || !newName.trim() || !subdomain.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain)) {
      setError(
        "Subdomain must start and end with a letter or number, and can only contain lowercase letters, numbers, and hyphens"
      );
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const result = await importSiteAction(fileContent, {
        clientId,
        overwritePages,
        importModules,
      });

      if (result.success && result.siteId) {
        toast.success("Site imported successfully!", {
          description: result.details
            ? `Imported ${result.details.pagesImported} pages`
            : undefined,
        });
        setOpen(false);
        clearFile();
        onImported?.(result.siteId);
        router.refresh();
      } else {
        setError(result.error || "Import failed");
        toast.error("Import failed", { description: result.error });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setError(message);
      toast.error("Import failed", { description: message });
    } finally {
      setImporting(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      clearFile();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Site</DialogTitle>
          <DialogDescription>
            Import a site from a JSON export file. This will create a new site
            with the imported content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              file && "border-green-500 bg-green-500/5"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleInputChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileJson className="h-8 w-8 text-green-500" />
                <span className="font-medium">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop a JSON file, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Max file size: 50MB
                </p>
              </>
            )}
          </div>

          {file && (
            <>
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="import-name">Site Name *</Label>
                <Input
                  id="import-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Imported Site"
                />
              </div>

              {/* Subdomain field */}
              <div className="space-y-2">
                <Label htmlFor="import-subdomain">Subdomain *</Label>
                <Input
                  id="import-subdomain"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                    )
                  }
                  placeholder="my-site"
                />
                <p className="text-xs text-muted-foreground">
                  {subdomain || "my-site"}.yourdomain.com
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="import-modules"
                    checked={importModules}
                    onCheckedChange={(checked) =>
                      setImportModules(checked === true)
                    }
                  />
                  <Label htmlFor="import-modules" className="text-sm">
                    Import module settings
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwrite-pages"
                    checked={overwritePages}
                    onCheckedChange={(checked) =>
                      setOverwritePages(checked === true)
                    }
                  />
                  <Label htmlFor="overwrite-pages" className="text-sm">
                    Overwrite existing pages (if any)
                  </Label>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !file || !newName.trim() || !subdomain.trim()}
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
