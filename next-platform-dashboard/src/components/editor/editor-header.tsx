"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  MoreHorizontal,
  Settings,
  Globe,
  FileText,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PreviewToolbar } from "./preview-toolbar";
import type { DeviceType } from "@/lib/preview/preview-utils";
import { toast } from "sonner";

interface EditorHeaderProps {
  siteId: string;
  siteName: string;
  pageName: string;
  pageId: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => Promise<void>;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  device: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  showPreviewPanel: boolean;
  onTogglePreviewPanel: () => void;
  previewUrl: string;
  onOpenNewWindow: () => void;
  onRefreshPreview: () => void;
  onPublish?: () => Promise<void>;
}

/**
 * Enhanced editor header with preview controls, save/publish buttons, and navigation
 * Provides a comprehensive toolbar for the visual editor
 */
export function EditorHeader({
  siteId,
  siteName,
  pageName,
  pageId,
  isSaving,
  hasUnsavedChanges,
  onSave,
  isPreviewMode,
  onTogglePreview,
  device,
  onDeviceChange,
  showPreviewPanel,
  onTogglePreviewPanel,
  previewUrl,
  onOpenNewWindow,
  onRefreshPreview,
  onPublish,
}: EditorHeaderProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!onPublish) return;
    
    setIsPublishing(true);
    try {
      await onPublish();
      toast.success("Site published successfully!");
    } catch (error) {
      console.error("[EditorHeader] Publish error:", error);
      toast.error("Failed to publish site");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error("[EditorHeader] Save error:", error);
      toast.error("Failed to save page");
    }
  };

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
      {/* Left: Back + Page Info */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`/dashboard/sites/${siteId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Back to site</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="min-w-0">
          <h1 className="font-medium text-sm truncate">{pageName}</h1>
          <p className="text-xs text-muted-foreground truncate">{siteName}</p>
        </div>
        
        {hasUnsavedChanges && (
          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded shrink-0">
            Unsaved
          </span>
        )}
      </div>

      {/* Center: Preview Controls */}
      <div className="flex-1 flex justify-center">
        <PreviewToolbar
          isPreviewMode={isPreviewMode}
          onTogglePreview={onTogglePreview}
          device={device}
          onDeviceChange={onDeviceChange}
          showPanel={showPreviewPanel}
          onTogglePanel={onTogglePreviewPanel}
          previewUrl={previewUrl}
          onOpenNewWindow={onOpenNewWindow}
          onRefresh={onRefreshPreview}
        />
      </div>

      {/* Right: Save + Publish + Menu */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-1.5" />
              {hasUnsavedChanges ? "Save" : "Saved"}
            </>
          )}
        </Button>

        {onPublish && (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-1.5" />
                Publish
              </>
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push(`/dashboard/sites/${siteId}?tab=pages`)}>
              <FileText className="h-4 w-4 mr-2" />
              All Pages
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/dashboard/sites/${siteId}?tab=pages&edit=${pageId}`)}>
              <Layout className="h-4 w-4 mr-2" />
              Page Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/dashboard/sites/${siteId}/settings`)}>
              <Settings className="h-4 w-4 mr-2" />
              Site Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
