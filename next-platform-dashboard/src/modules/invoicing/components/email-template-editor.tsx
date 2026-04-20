"use client";

/**
 * EmailTemplateEditor — Manage and preview email templates
 *
 * Phase INVFIX-09: Email template customization UI.
 * Shows all templates grouped by category, allows subject/body editing,
 * live preview with interpolated variables, and enable/disable toggles.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Mail,
  Eye,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getEmailTemplates,
  saveEmailTemplateOverride,
  previewTemplate,
  type EmailTemplate,
  type EmailTemplateType,
  type RenderedEmail,
} from "../services/email-template-service";

interface TemplateWithOverrides extends EmailTemplate {
  customSubject?: string | null;
  customBody?: string | null;
  enabled: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  invoicing: "Invoicing",
  payments: "Payments",
  dunning: "Dunning & Collections",
};

const CATEGORY_ORDER = ["invoicing", "payments", "dunning"];

export function EmailTemplateEditor() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const [templates, setTemplates] = useState<TemplateWithOverrides[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<EmailTemplateType | null>(
    null,
  );
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [preview, setPreview] = useState<RenderedEmail | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER),
  );

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getEmailTemplates(siteId)
      .then((data) => setTemplates(data as TemplateWithOverrides[]))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  const selectedTemplate = templates.find((t) => t.type === selectedType);

  const handleSelect = useCallback(
    (type: EmailTemplateType) => {
      setSelectedType(type);
      const tmpl = templates.find((t) => t.type === type);
      if (tmpl) {
        setEditSubject(tmpl.customSubject || tmpl.defaultSubject);
        setEditBody(tmpl.customBody || tmpl.defaultBody);
        setPreview(null);
      }
    },
    [templates],
  );

  const handlePreview = useCallback(() => {
    if (!selectedType) return;
    const result = previewTemplate(selectedType, editSubject, editBody);
    setPreview(result);
  }, [selectedType, editSubject, editBody]);

  const handleSave = useCallback(async () => {
    if (!siteId || !selectedType) return;
    setSaving(true);
    const selectedTmpl = templates.find((t) => t.type === selectedType);
    const isDefault =
      editSubject === selectedTmpl?.defaultSubject &&
      editBody === selectedTmpl?.defaultBody;

    const result = await saveEmailTemplateOverride(siteId, selectedType, {
      subject: isDefault ? null : editSubject,
      body: isDefault ? null : editBody,
    });

    if (result.success) {
      toast.success("Template saved");
      // Update local state
      setTemplates((prev) =>
        prev.map((t) =>
          t.type === selectedType
            ? {
                ...t,
                customSubject: isDefault ? null : editSubject,
                customBody: isDefault ? null : editBody,
              }
            : t,
        ),
      );
    } else {
      toast.error(result.error || "Failed to save");
    }
    setSaving(false);
  }, [siteId, selectedType, editSubject, editBody, templates]);

  const handleReset = useCallback(() => {
    if (!selectedTemplate) return;
    setEditSubject(selectedTemplate.defaultSubject);
    setEditBody(selectedTemplate.defaultBody);
    setPreview(null);
  }, [selectedTemplate]);

  const handleToggle = useCallback(
    async (type: EmailTemplateType, enabled: boolean) => {
      if (!siteId) return;
      const result = await saveEmailTemplateOverride(siteId, type, { enabled });
      if (result.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.type === type ? { ...t, enabled } : t)),
        );
        toast.success(enabled ? "Template enabled" : "Template disabled");
      }
    },
    [siteId],
  );

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (!siteId) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // Group templates by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    templates: templates.filter((t) => t.category === cat),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Email Templates
        </h1>
        <p className="text-muted-foreground">
          Customize email subjects and bodies sent to clients
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Template List */}
        <Card>
          <CardContent className="p-3 space-y-2">
            {grouped.map(({ category, label, templates: catTemplates }) => (
              <div key={category}>
                <button
                  className="flex items-center gap-1 w-full text-left text-sm font-semibold text-muted-foreground py-1 px-2 hover:text-foreground"
                  onClick={() => toggleCategory(category)}
                >
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {label}
                </button>
                {expandedCategories.has(category) && (
                  <div className="space-y-0.5 ml-4">
                    {catTemplates.map((tmpl) => (
                      <button
                        key={tmpl.type}
                        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                          selectedType === tmpl.type
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => handleSelect(tmpl.type)}
                      >
                        <span className="flex items-center justify-between">
                          <span className="truncate">{tmpl.label}</span>
                          {!tmpl.enabled && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] ml-1"
                            >
                              Off
                            </Badge>
                          )}
                          {tmpl.customSubject && (
                            <Badge
                              variant="outline"
                              className="text-[10px] ml-1"
                            >
                              Custom
                            </Badge>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Editor Panel */}
        {selectedTemplate ? (
          <div className="space-y-4">
            {/* Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedTemplate.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Enabled
                    </span>
                    <Switch
                      checked={selectedTemplate.enabled}
                      onCheckedChange={(val) =>
                        handleToggle(selectedTemplate.type, val)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Body</label>
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={10}
                placeholder="Email body..."
                className="font-mono text-sm"
              />
            </div>

            {/* Variables */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Available Variables</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.availableVariables.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer font-mono text-xs"
                      onClick={() => {
                        // Insert at cursor focus
                        setEditBody((prev) => prev + v.key);
                      }}
                    >
                      {v.key}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset to Default
              </Button>
            </div>

            {/* Preview */}
            {preview && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-600">
                    Preview (with example data)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Subject:
                    </span>
                    <p className="font-medium">{preview.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Body:</span>
                    <pre className="whitespace-pre-wrap text-sm mt-1 p-3 bg-muted rounded">
                      {preview.body}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a template from the list to edit
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
