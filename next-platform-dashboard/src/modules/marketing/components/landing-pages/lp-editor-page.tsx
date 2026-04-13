/**
 * LP Editor Page
 * Phase LPB-02: Studio LP Editor
 *
 * Full-page LP editor wrapping the Studio builder with LP-specific configuration.
 * - Filtered component palette (LP components first)
 * - LP settings panel on the right when no component selected
 * - LP-specific toolbar (save, preview, publish, back)
 * - Saves to landing_pages table via updateLandingPage()
 */
"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StudioLayout } from "@/components/studio/layout/studio-layout";
import { StudioToolbar } from "@/components/studio/layout/studio-toolbar";
import { DndProvider } from "@/components/studio/dnd";
import { EditorCanvas } from "@/components/studio/canvas";
import { ComponentLibrary } from "@/components/studio/panels";
import { PropertiesPanel } from "@/components/studio/properties";
import { LayersPanel } from "@/components/studio/features";
import {
  useUIStore,
  useEditorStore,
  useSelectionStore,
  useHistoryStore,
  undo,
  redo,
  clearHistory,
} from "@/lib/studio/store";
import {
  initializeRegistry,
  isRegistryInitialized,
} from "@/lib/studio/registry";
import {
  useModuleInitialization,
  useModuleSync,
  useStudioShortcuts,
} from "@/lib/studio/hooks";
import { CommandPalette, ShortcutsPanel } from "@/components/studio/features";
import {
  TutorialProvider,
  TutorialOverlay,
} from "@/components/studio/onboarding";
import { LPSettingsPanel } from "./lp-settings-panel";
import {
  updateLandingPage,
  updateLandingPageStatus,
} from "../../actions/landing-page-actions";
import { DEFAULT_LP_SETTINGS } from "../../types/lp-builder-types";
import type {
  LandingPageStudio,
  LPSettings,
} from "../../types/lp-builder-types";
import type { StudioPageData, PuckDataFormat } from "@/types/studio";
import {
  createEmptyPageData,
  validatePageData,
  migrateFromPuckFormat,
} from "@/types/studio";

// ─── Types ─────────────────────────────────────────────────────

interface LPEditorPageProps {
  landingPage: LandingPageStudio;
  siteId: string;
  siteName: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
  siteSettings?: Record<string, unknown> | null;
}

// ─── Canvas Wrapper ────────────────────────────────────────────

function CanvasArea() {
  return <EditorCanvas />;
}

// ─── Bottom Panels ─────────────────────────────────────────────

function BottomPanelContent() {
  const togglePanel = useUIStore((s) => s.togglePanel);

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex items-center border-b bg-muted/30 px-2 shrink-0">
        <span className="px-3 py-2 text-sm font-medium border-b-2 border-primary text-foreground">
          Layers
        </span>
        <div className="flex-1" />
        <button
          className="p-1 text-muted-foreground hover:text-foreground"
          onClick={() => togglePanel("bottom")}
        >
          &times;
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <LayersPanel />
      </div>
    </div>
  );
}

// ─── Right Panel (Properties or LP Settings) ──────────────────

function RightPanel({
  landingPage,
  lpSettings,
  lpSlug,
  lpTitle,
  lpDescription,
  lpSeoConfig,
  lpUtmConfig,
  lpConversionGoal,
  siteSubdomain,
  siteCustomDomain,
  onSlugChange,
  onTitleChange,
  onDescriptionChange,
  onSettingsChange,
  onSeoChange,
  onUtmChange,
  onConversionGoalChange,
}: {
  landingPage: LandingPageStudio;
  lpSettings: LPSettings;
  lpSlug: string;
  lpTitle: string;
  lpDescription: string;
  lpSeoConfig: Record<string, unknown>;
  lpUtmConfig: Record<string, unknown>;
  lpConversionGoal: string;
  siteSubdomain?: string;
  siteCustomDomain?: string | null;
  onSlugChange: (slug: string) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (desc: string) => void;
  onSettingsChange: (settings: Partial<LPSettings>) => void;
  onSeoChange: (seo: Record<string, unknown>) => void;
  onUtmChange: (utm: Record<string, unknown>) => void;
  onConversionGoalChange: (goal: string) => void;
}) {
  const selectedId = useSelectionStore((s) => s.componentId);

  // When component selected → PropertiesPanel; otherwise → LP Settings
  if (selectedId) {
    return <PropertiesPanel />;
  }

  return (
    <LPSettingsPanel
      slug={lpSlug}
      title={lpTitle}
      description={lpDescription}
      settings={lpSettings}
      seoConfig={lpSeoConfig as any}
      utmConfig={lpUtmConfig as any}
      conversionGoal={lpConversionGoal}
      siteSubdomain={siteSubdomain}
      siteCustomDomain={siteCustomDomain}
      onSlugChange={onSlugChange}
      onTitleChange={onTitleChange}
      onDescriptionChange={onDescriptionChange}
      onSettingsChange={onSettingsChange}
      onSeoChange={onSeoChange}
      onUtmChange={onUtmChange}
      onConversionGoalChange={onConversionGoalChange}
    />
  );
}

// ─── Main Component ────────────────────────────────────────────

export function LPEditorPage({
  landingPage,
  siteId,
  siteName,
  siteSubdomain,
  siteCustomDomain,
  siteSettings,
}: LPEditorPageProps) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // LP-specific state
  const [lpSlug, setLpSlug] = useState(landingPage.slug);
  const [lpTitle, setLpTitle] = useState(landingPage.title);
  const [lpDescription, setLpDescription] = useState(
    landingPage.description || "",
  );
  const [lpConversionGoal, setLpConversionGoal] = useState(
    landingPage.conversionGoal || "form_submit",
  );
  const [lpSettings, setLpSettings] = useState<LPSettings>({
    showHeader: landingPage.showHeader ?? DEFAULT_LP_SETTINGS.showHeader,
    showFooter: landingPage.showFooter ?? DEFAULT_LP_SETTINGS.showFooter,
    brandingOverride: landingPage.brandingOverride ?? null,
    customScripts: landingPage.customScripts ?? "",
    redirectUrl: landingPage.redirectUrl ?? "",
    conversionValue: landingPage.conversionValue ?? 0,
    maxConversions: landingPage.maxConversions ?? null,
    isEvergreen: landingPage.isEvergreen ?? true,
    startsAt: landingPage.startsAt ?? null,
    endsAt: landingPage.endsAt ?? null,
    expiredRedirectUrl: landingPage.expiredRedirectUrl ?? "",
  });
  const [lpSeoConfig, setLpSeoConfig] = useState<Record<string, unknown>>(
    (landingPage.seoConfig as Record<string, unknown>) || {},
  );
  const [lpUtmConfig, setLpUtmConfig] = useState<Record<string, unknown>>(
    (landingPage.utmTracking as unknown as Record<string, unknown>) || {},
  );

  // Store refs
  const initialize = useEditorStore((s) => s.initialize);
  const reset = useEditorStore((s) => s.reset);
  const setError = useEditorStore((s) => s.setError);
  const isDirty = useEditorStore((s) => s.isDirty);
  const markSaved = useEditorStore((s) => s.markSaved);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  // Module initialization
  const { isLoading: isLoadingModules } = useModuleInitialization(siteId);
  useModuleSync(siteId);

  // Initialize editor on mount
  useEffect(() => {
    if (!isRegistryInitialized()) {
      initializeRegistry();
    }

    let data: StudioPageData;

    try {
      const initialData = landingPage.contentStudio;

      if (!initialData) {
        data = createEmptyPageData();
        data.root.props.title = landingPage.title;
      } else if (validatePageData(initialData)) {
        data = initialData;
      } else if (
        typeof initialData === "object" &&
        initialData !== null &&
        "content" in initialData
      ) {
        data = migrateFromPuckFormat(initialData as PuckDataFormat);
      } else {
        data = createEmptyPageData();
        data.root.props.title = landingPage.title;
      }

      initialize(siteId, landingPage.id, data, siteSettings);
      clearHistory();
    } catch (error) {
      console.error("[LPEditor] Error initializing:", error);
      setError("Failed to load landing page data");
      toast.error("Failed to load landing page. Please try again.");
    }

    return () => {
      reset();
      clearSelection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, landingPage.id]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Save handler — saves Studio content + LP settings to landing_pages table
  const handleSave = useCallback(async () => {
    try {
      setSaveStatus("saving");

      const currentData = useEditorStore.getState().data;

      const result = await updateLandingPage(landingPage.id, {
        title: lpTitle,
        slug: lpSlug,
        description: lpDescription || undefined,
        contentStudio: currentData as unknown,
        useStudioFormat: true,
        showHeader: lpSettings.showHeader,
        showFooter: lpSettings.showFooter,
        brandingOverride: lpSettings.brandingOverride,
        customScripts: lpSettings.customScripts,
        redirectUrl: lpSettings.redirectUrl,
        conversionValue: lpSettings.conversionValue,
        maxConversions: lpSettings.maxConversions,
        isEvergreen: lpSettings.isEvergreen,
        startsAt: lpSettings.startsAt,
        endsAt: lpSettings.endsAt,
        expiredRedirectUrl: lpSettings.expiredRedirectUrl,
        conversionGoal: lpConversionGoal,
        seoConfig: lpSeoConfig as any,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      markSaved();
      setSaveStatus("saved");
      toast.success("Landing page saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("[LPEditor] Save failed:", error);
      setSaveStatus("error");
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  }, [
    landingPage.id,
    lpTitle,
    lpSlug,
    lpDescription,
    lpSettings,
    lpConversionGoal,
    lpSeoConfig,
    markSaved,
  ]);

  // Publish handler
  const handlePublish = useCallback(async () => {
    try {
      await handleSave();
      const result = await updateLandingPageStatus(landingPage.id, "published");
      if (!result.success) {
        throw new Error(result.error || "Failed to publish");
      }
      toast.success("Landing page published!");
    } catch (error) {
      console.error("[LPEditor] Publish failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to publish");
    }
  }, [handleSave, landingPage.id]);

  // Preview handler
  const handlePreview = useCallback(() => {
    const domain =
      siteCustomDomain ||
      (siteSubdomain ? `${siteSubdomain}.dramac.app` : null);
    if (domain) {
      window.open(`https://${domain}/lp/${lpSlug}`, "_blank");
    } else {
      toast.info("Set a subdomain or custom domain to preview");
    }
  }, [siteCustomDomain, siteSubdomain, lpSlug]);

  // Keyboard shortcuts
  useStudioShortcuts({ enabled: true, onSave: handleSave });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      if (isMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (isMeta && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // LP-specific settings change handler
  const handleSettingsChange = useCallback((changes: Partial<LPSettings>) => {
    setLpSettings((prev) => ({ ...prev, ...changes }));
  }, []);

  return (
    <TutorialProvider>
      <DndProvider>
        <StudioLayout
          toolbar={
            <StudioToolbar
              siteId={siteId}
              pageId={landingPage.id}
              pageTitle={lpTitle}
              siteName={siteName}
              onSave={handleSave}
              onPreview={handlePreview}
              onPublish={handlePublish}
              saveStatus={saveStatus}
            />
          }
          leftPanel={<ComponentLibrary />}
          canvas={<CanvasArea />}
          rightPanel={
            <RightPanel
              landingPage={landingPage}
              lpSettings={lpSettings}
              lpSlug={lpSlug}
              lpTitle={lpTitle}
              lpDescription={lpDescription}
              lpSeoConfig={lpSeoConfig}
              lpUtmConfig={lpUtmConfig}
              lpConversionGoal={lpConversionGoal}
              siteSubdomain={siteSubdomain}
              siteCustomDomain={siteCustomDomain}
              onSlugChange={setLpSlug}
              onTitleChange={setLpTitle}
              onDescriptionChange={setLpDescription}
              onSettingsChange={handleSettingsChange}
              onSeoChange={setLpSeoConfig}
              onUtmChange={setLpUtmConfig}
              onConversionGoalChange={(goal: string) =>
                setLpConversionGoal(
                  goal as "form_submit" | "button_click" | "page_scroll",
                )
              }
            />
          }
          bottomPanel={<BottomPanelContent />}
        />
      </DndProvider>
      <CommandPalette />
      <ShortcutsPanel />
      <TutorialOverlay />
    </TutorialProvider>
  );
}
