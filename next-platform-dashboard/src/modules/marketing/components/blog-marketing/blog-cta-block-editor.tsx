/**
 * Blog CTA Block Editor
 *
 * Phase MKT-07: Editor panel for creating/editing CTA blocks
 * within blog posts. Used from the blog post editor.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Sparkles } from "lucide-react";
import { BLOG_CTA_TEMPLATES } from "../../data/blog-cta-templates";
import { BlogCTABlockRenderer } from "./blog-cta-block-renderer";
import type {
  BlogCTABlock,
  BlogCTAStyle,
  BlogCTAPosition,
} from "../../types/blog-marketing-types";

interface BlogCTABlockEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block?: BlogCTABlock | null;
  onSave: (block: BlogCTABlock) => void;
}

const STYLE_OPTIONS: { value: BlogCTAStyle; label: string }[] = [
  { value: "banner", label: "Banner (full-width)" },
  { value: "card", label: "Card (with image)" },
  { value: "inline", label: "Inline (compact)" },
  { value: "sidebar", label: "Sidebar (vertical)" },
];

const POSITION_OPTIONS: { value: BlogCTAPosition; label: string }[] = [
  { value: "after_paragraph_2", label: "After paragraph 2" },
  { value: "after_paragraph_5", label: "After paragraph 5" },
  { value: "end_of_post", label: "End of post" },
  { value: "custom", label: "Custom position" },
];

function generateId() {
  return `cta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function BlogCTABlockEditor({
  open,
  onOpenChange,
  block,
  onSave,
}: BlogCTABlockEditorProps) {
  const [form, setForm] = useState<BlogCTABlock>(
    block || {
      id: generateId(),
      type: "marketing_cta",
      style: "card",
      heading: "",
      body: "",
      buttonText: "Learn More",
      buttonUrl: "",
      formId: null,
      backgroundColor: null,
      imageUrl: null,
      position: "end_of_post",
    },
  );

  const updateField = <K extends keyof BlogCTABlock>(
    key: K,
    value: BlogCTABlock[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTemplateApply = (templateId: string) => {
    const template = BLOG_CTA_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setForm((prev) => ({
      ...prev,
      style: template.style,
      heading: template.heading,
      body: template.body,
      buttonText: template.buttonText,
      position: template.position,
    }));
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  const isValid =
    form.heading.trim() && form.buttonText.trim() && form.buttonUrl.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {block ? "Edit CTA Block" : "Add CTA Block"}
          </SheetTitle>
          <SheetDescription>
            Add a marketing call-to-action within your blog post.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <Select
                value={form.style}
                onValueChange={(v) => updateField("style", v as BlogCTAStyle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Heading</Label>
              <Input
                value={form.heading}
                onChange={(e) => updateField("heading", e.target.value)}
                placeholder="Get Started Today"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={form.body}
                onChange={(e) => updateField("body", e.target.value)}
                placeholder="Describe your offer or value proposition..."
                rows={3}
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={form.buttonText}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  placeholder="Learn More"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>Button URL</Label>
                <Input
                  value={form.buttonUrl}
                  onChange={(e) => updateField("buttonUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={form.position}
                onValueChange={(v) =>
                  updateField("position", v as BlogCTAPosition)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input
                value={form.imageUrl || ""}
                onChange={(e) =>
                  updateField("imageUrl", e.target.value || null)
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Background Color (optional)</Label>
              <Input
                value={form.backgroundColor || ""}
                onChange={(e) =>
                  updateField("backgroundColor", e.target.value || null)
                }
                placeholder="#4F46E5 or rgb(79, 70, 229)"
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <div className="space-y-3">
              {BLOG_CTA_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="w-full text-left rounded-lg border p-4 hover:border-primary/50 transition-colors"
                  onClick={() => handleTemplateApply(template.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {template.style}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="rounded-lg border p-4 bg-background">
              <p className="text-xs text-muted-foreground mb-3">Preview</p>
              <BlogCTABlockRenderer block={form} />
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {block ? "Update CTA" : "Insert CTA"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
