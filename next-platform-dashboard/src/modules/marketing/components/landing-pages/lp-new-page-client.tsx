/**
 * LP New Page Client
 * Phase LPB-02: Studio LP Editor
 *
 * Client component that shows template picker dialog on mount,
 * creates new LP, and redirects to the editor.
 */
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LPTemplatePicker } from "./lp-template-picker";
import { createLandingPage } from "../../actions/landing-page-actions";
import { DEFAULT_LP_CONTENT_STUDIO } from "../../lib/lp-builder-constants";
import type { LPTemplate } from "../../types/lp-builder-types";

interface LPNewPageClientProps {
  siteId: string;
  siteName: string;
}

export function LPNewPageClient({ siteId, siteName }: LPNewPageClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  function handleCancel() {
    setOpen(false);
    router.push(`/dashboard/sites/${siteId}/marketing/landing-pages`);
  }

  function handleCreate(content: unknown, templateId?: string) {
    setCreating(true);
    startTransition(async () => {
      const slug = `lp-${Date.now().toString(36)}`;
      const { landingPage, error } = await createLandingPage({
        siteId,
        title: "Untitled Landing Page",
        slug,
        contentStudio: content,
        useStudioFormat: true,
        templateId: templateId || undefined,
        showHeader: false,
        showFooter: false,
      });

      if (error || !landingPage) {
        toast.error(error || "Failed to create landing page");
        setCreating(false);
        return;
      }

      toast.success("Landing page created");
      router.push(
        `/dashboard/sites/${siteId}/marketing/landing-pages/${landingPage.id}/edit`,
      );
    });
  }

  function handleBlank() {
    handleCreate(DEFAULT_LP_CONTENT_STUDIO);
  }

  function handleTemplateSelect(template: LPTemplate) {
    handleCreate(
      template.contentStudio || DEFAULT_LP_CONTENT_STUDIO,
      template.id,
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <LPTemplatePicker
        open={open}
        siteId={siteId}
        onSelect={handleTemplateSelect}
        onBlank={handleBlank}
        onCancel={handleCancel}
      />
      {creating && (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Creating landing page...</p>
        </div>
      )}
    </div>
  );
}
