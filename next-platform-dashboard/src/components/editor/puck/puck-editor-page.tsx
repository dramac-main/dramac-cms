/**
 * Puck Editor Page
 * 
 * Page editor using Puck visual builder.
 * Automatically detects and migrates Craft.js content to Puck format.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PuckEditorWrapper } from "@/components/editor/puck";
import { autoMigrateContent, detectContentFormat } from "@/lib/migration";
import { savePageContentAction } from "@/lib/actions/pages";
import { toast } from "sonner";
import type { PuckData } from "@/types/puck";
import type { Site } from "@/types/site";
import { 
  ArrowLeft, 
  ChevronDown,
  FileText,
  Home,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface PageWithContent {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
  content: Record<string, unknown> | null;
}

interface PuckEditorPageProps {
  site: Site;
  page: PageWithContent;
  pages?: Array<{ id: string; name: string; slug: string; is_homepage: boolean | null }>;
}

export function PuckEditorPage({ site, page, pages = [] }: PuckEditorPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<PuckData | null>(null);
  const [migrationInfo, setMigrationInfo] = useState<{
    wasMigrated: boolean;
    originalFormat: string;
  } | null>(null);
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Load and migrate content on mount
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        // Detect format and migrate if needed
        const detection = detectContentFormat(page.content);
        console.log("[PuckEditorPage] Content format detected:", detection);

        const puckData = autoMigrateContent(page.content);
        setInitialData(puckData);
        
        setMigrationInfo({
          wasMigrated: detection.format === "craft",
          originalFormat: detection.format,
        });

        if (detection.format === "craft") {
          toast.info("Content migrated from legacy format");
        }
      } catch (error) {
        console.error("[PuckEditorPage] Failed to load content:", error);
        toast.error("Failed to load page content");
        // Set empty data as fallback
        setInitialData({
          content: [],
          root: { props: { title: page.name || "" } },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [page.content, page.name]);

  // Save handler
  const handleSave = useCallback(async (data: PuckData) => {
    try {
      // Save in Puck format - cast to any to avoid Json type issues
      const result = await savePageContentAction(page.id, data as any);

      if (result.error) {
        throw new Error(result.error);
      }

      // If content was migrated, update info
      if (migrationInfo?.wasMigrated) {
        setMigrationInfo({
          wasMigrated: false,
          originalFormat: "puck",
        });
      }
    } catch (error) {
      console.error("[PuckEditorPage] Save error:", error);
      throw error; // Re-throw so PuckEditorWrapper can handle it
    }
  }, [page.id, migrationInfo]);

  // Navigate to a different page
  const navigateToPage = useCallback((pageId: string) => {
    router.push(`/dashboard/sites/${site.id}/editor?page=${pageId}`);
    setShowPageSelector(false);
  }, [router, site.id]);

  // Custom header component for the editor
  const headerContent = (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
      {/* Left side - Back and page info */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/sites/${site.id}`}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="Back to site"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{site.name}</span>
          <span className="text-muted-foreground">/</span>
          
          {/* Page selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPageSelector(!showPageSelector)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-md transition-colors"
            >
              {page.is_homepage && <Home className="w-4 h-4 text-primary" />}
              <FileText className="w-4 h-4" />
              <span className="font-medium">{page.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showPageSelector ? "rotate-180" : ""}`} />
            </button>

            {showPageSelector && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowPageSelector(false)} 
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-popover border rounded-md shadow-lg z-20 py-1">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                    Switch Page
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {pages.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigateToPage(p.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          p.id === page.id ? "bg-muted" : ""
                        }`}
                      >
                        {p.is_homepage && <Home className="w-4 h-4 text-primary" />}
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{p.name}</span>
                        {p.id === page.id && (
                          <span className="ml-auto text-xs text-primary">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Migration notice */}
        {migrationInfo?.wasMigrated && (
          <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
            Migrated from legacy format
          </span>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <a
          href={`/preview/${site.id}/${page.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted rounded-md transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Preview in New Tab
        </a>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <PuckEditorWrapper
      initialData={initialData!}
      pageId={page.id}
      onSave={handleSave}
      mode="edit"
      headerContent={headerContent}
      autoSaveInterval={30000} // Auto-save every 30 seconds
    />
  );
}

export default PuckEditorPage;
