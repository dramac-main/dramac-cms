"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportSiteAction } from "@/lib/actions/export-import";

interface ExportSiteButtonProps {
  siteId: string;
  siteName: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportSiteButton({
  siteId,
  siteName,
  variant = "outline",
  size = "default",
}: ExportSiteButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);

    try {
      const result = await exportSiteAction(siteId);

      if (result.success && result.json) {
        // Create download
        const blob = new Blob([result.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const filename =
          result.filename ||
          `${siteName.toLowerCase().replace(/\s+/g, "-")}-export.json`;

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Site exported successfully", {
          description: `Downloaded ${filename}`,
        });
      } else {
        toast.error("Export failed", { description: result.error });
      }
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={exporting}>
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export Site
    </Button>
  );
}
