"use client";

/**
 * Templates Gallery Page
 * Phase 68: Industry Templates UI
 * 
 * Standalone page for browsing and selecting templates.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateGallery } from "@/components/templates";
import { toast } from "sonner";
import type { Template } from "@/lib/templates";

export function TemplateGalleryPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    toast.success(`Selected template: ${template.name}`, {
      description: "Create a new site to use this template",
      action: {
        label: "Create Site",
        onClick: () => router.push(`/sites/new?template=${template.id}`),
      },
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="Templates"
        description="Choose from professionally designed templates for every industry"
      />

      <TemplateGallery
        onSelect={handleSelectTemplate}
        showSelectButton
        selectedTemplateId={selectedTemplate?.id}
      />
    </div>
  );
}
