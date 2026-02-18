"use client";

import { useState, useTransition, useRef } from "react";
import { Download, Upload, FileCode, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { exportZoneFile, importZoneFile } from "@/lib/actions/dns";

interface ZoneFileManagerProps {
  domainId: string;
  domainName: string;
}

export function ZoneFileManager({ domainId, domainName }: ZoneFileManagerProps) {
  const [importContent, setImportContent] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportZoneFile(domainId);
      if (result.success && result.data) {
        const blob = new Blob([result.data.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.data.filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        toast.success(`Zone file exported: ${result.data.filename}`);
      } else {
        toast.error(result.error || "Failed to export zone file");
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportContent((ev.target?.result as string) ?? "");
      setShowImport(true);
      setImportErrors([]);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importContent.trim()) {
      toast.error("No content to import");
      return;
    }
    startTransition(async () => {
      setImportErrors([]);
      const result = await importZoneFile(domainId, importContent);
      if (result.success && result.data) {
        if (result.data.errors.length > 0) {
          setImportErrors(result.data.errors);
        }
        toast.success(
          `Imported ${result.data.created} record${result.data.created === 1 ? "" : "s"}`,
          {
            description:
              result.data.errors.length > 0
                ? `${result.data.errors.length} record(s) failed — see details below`
                : "All records imported successfully",
          }
        );
        if (result.data.errors.length === 0) {
          setImportContent("");
          setShowImport(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } else {
        toast.error(result.error || "Failed to import zone file");
      }
    });
  };

  const handleCancelImport = () => {
    setShowImport(false);
    setImportContent("");
    setImportErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <FileCode className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle>Zone File</CardTitle>
            <CardDescription>
              Export all DNS records as a BIND zone file, or bulk-import from an existing zone file
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {isPending && !showImport ? "Exporting…" : "Export Zone File"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Zone File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".txt,.zone,.bind,text/plain"
            onChange={handleFileSelect}
          />
        </div>

        <Alert variant="default" className="border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs text-muted-foreground">
            Zone files use BIND format (RFC 1035). Exported file includes all active DNS records
            for <strong>{domainName}</strong>. Import supports A, AAAA, CNAME, MX, TXT, NS,
            SRV, and CAA records.
          </AlertDescription>
        </Alert>

        {showImport && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Zone file to import:</p>
            <Textarea
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              className="font-mono text-xs min-h-50 resize-y"
              placeholder={`; BIND zone file for ${domainName}\n$ORIGIN ${domainName}.\n$TTL 3600\n@ 3600 IN A 192.0.2.1\nwww 3600 IN CNAME @`}
            />
            {importErrors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-destructive">
                  {importErrors.length} record(s) failed to import:
                </p>
                <ul className="text-xs text-destructive space-y-0.5 font-mono bg-destructive/5 p-2 rounded">
                  {importErrors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleImport} disabled={isPending}>
                {isPending ? "Importing…" : "Import Records"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelImport}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
