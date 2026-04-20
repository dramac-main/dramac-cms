/**
 * Landing Page Editor
 * Phase MKT-06: Landing Pages & Opt-In Forms
 *
 * Visual editor for building landing pages with blocks and templates.
 */
"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { toast } from "sonner";
import {
  Save,
  Globe,
  Type,
  Image,
  ListChecks,
  MessageSquareQuote,
  Video,
  Star,
  Clock,
  FormInput,
  Loader2,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Palette,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createLandingPage,
  updateLandingPage,
  updateLandingPageStatus,
} from "../../actions/landing-page-actions";
import { LANDING_PAGE_TEMPLATES } from "../../data/landing-page-templates";
import { BlockList } from "./block-editor";
import type {
  LandingPage,
  LandingPageBlock,
  LandingPageBlockType,
  SeoConfig,
  LandingPageTemplate,
  StyleConfig,
} from "../../types";
import {
  DEFAULT_STYLE_CONFIG,
  FONT_OPTIONS,
} from "../../types/landing-page-types";

const BLOCK_TYPES = [
  { type: "hero", label: "Hero Section", icon: Type },
  { type: "features", label: "Features Grid", icon: ListChecks },
  { type: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { type: "cta", label: "Call to Action", icon: Star },
  { type: "optin_form", label: "Opt-In Form", icon: FormInput },
  { type: "video", label: "Video Embed", icon: Video },
  { type: "gallery", label: "Image Gallery", icon: Image },
  { type: "countdown", label: "Countdown Timer", icon: Clock },
  { type: "faq", label: "FAQ Section", icon: ListChecks },
  { type: "pricing", label: "Pricing Table", icon: Star },
  { type: "social_proof", label: "Social Proof", icon: MessageSquareQuote },
  { type: "text", label: "Text Block", icon: Type },
  { type: "image", label: "Image Block", icon: Image },
] as const;

interface LandingPageEditorProps {
  siteId: string;
  landingPage?: LandingPage | null;
}

export function LandingPageEditor({
  siteId,
  landingPage,
}: LandingPageEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(landingPage?.title || "");
  const [slug, setSlug] = useState(landingPage?.slug || "");
  const [description, setDescription] = useState(
    landingPage?.description || "",
  );
  const [blocks, setBlocks] = useState<LandingPageBlock[]>(
    landingPage?.contentJson || [],
  );
  const [conversionGoal, setConversionGoal] = useState(
    landingPage?.conversionGoal || "form_submit",
  );
  const [seoConfig, setSeoConfig] = useState<SeoConfig>(
    landingPage?.seoConfig || { metaTitle: "", metaDescription: "" },
  );
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(
    (landingPage?.styleConfig as StyleConfig) || { ...DEFAULT_STYLE_CONFIG },
  );

  const isEdit = !!landingPage;

  // Preview viewport state
  const [previewViewport, setPreviewViewport] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");

  // Preview HTML via shared renderer
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback(async () => {
    if (blocks.length === 0) {
      setPreviewHtml("");
      return;
    }
    try {
      const res = await fetch("/api/marketing/lp/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks, seo: seoConfig, styleConfig, title }),
      });
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
      }
    } catch {
      // Silently fail preview fetch
    }
  }, [blocks, seoConfig, styleConfig, title]);

  useEffect(() => {
    clearTimeout(previewTimerRef.current ?? undefined);
    previewTimerRef.current = setTimeout(fetchPreview, 600);
    return () => clearTimeout(previewTimerRef.current ?? undefined);
  }, [fetchPreview]);

  // Warn before navigating away with unsaved work
  const hasUnsavedChanges = !!(title || description || blocks.length > 0);
  useUnsavedChanges(hasUnsavedChanges && !isEdit);

  // Auto-generate slug from title
  function handleTitleChange(value: string) {
    setTitle(value);
    if (!isEdit) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 60),
      );
    }
  }

  // Block management
  function addBlock(type: LandingPageBlockType) {
    const newBlock: LandingPageBlock = {
      id: crypto.randomUUID(),
      type,
      content: {},
      order: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
  }

  function removeBlock(blockId: string) {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];
    setBlocks(newBlocks.map((b, i) => ({ ...b, order: i })));
  }

  function updateBlockContent(
    blockId: string,
    content: Record<string, unknown>,
  ) {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, content } : b)));
  }

  // Apply template
  function applyTemplate(template: LandingPageTemplate) {
    setBlocks(
      template.blocks.map((b, i) => ({
        id: crypto.randomUUID(),
        type: b.type,
        content: b.content,
        order: i,
      })),
    );
    if (!title) setTitle(template.name);
  }

  // Save
  async function handleSave() {
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }

    startTransition(async () => {
      if (isEdit && landingPage) {
        const result = await updateLandingPage(landingPage.id, {
          title,
          slug,
          description,
          contentJson: blocks,
          conversionGoal,
          seoConfig,
          styleConfig,
        });
        if (result.error) {
          setError(result.error);
        } else {
          router.refresh();
          toast.success("Landing page saved");
        }
      } else {
        const result = await createLandingPage({
          siteId,
          title,
          slug,
          description,
          contentJson: blocks,
          conversionGoal,
          seoConfig,
          styleConfig,
        });
        if (result.error) {
          setError(result.error);
        } else if (result.landingPage) {
          toast.success("Landing page created");
          router.push(
            `/dashboard/sites/${siteId}/marketing/landing-pages/${result.landingPage.id}`,
          );
        }
      }
    });
  }

  async function handlePublish() {
    if (!landingPage) return;
    startTransition(async () => {
      const result = await updateLandingPageStatus(landingPage.id, "published");
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        toast.success("Landing page published!");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Landing Page" : "Create Landing Page"}
          </h2>
          {isEdit && landingPage && (
            <Badge variant="secondary" className="mt-1">
              {landingPage.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {isEdit && landingPage?.status === "published" && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/api/marketing/lp/${siteId}/${landingPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
          )}
          {isEdit && landingPage?.status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePublish}
              disabled={isPending}
            >
              <Globe className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="blocks">Page Blocks</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-1.5 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="design">
            <Palette className="mr-1.5 h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Get Our Free Marketing Guide"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="free-marketing-guide"
                />
                <p className="text-xs text-muted-foreground">
                  Page will be available at: /lp/{slug || "your-slug"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description for internal reference"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Conversion Goal</Label>
                <Select
                  value={conversionGoal}
                  onValueChange={setConversionGoal}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="form_submit">Form Submission</SelectItem>
                    <SelectItem value="click_cta">CTA Click</SelectItem>
                    <SelectItem value="page_scroll">Page Scroll</SelectItem>
                    <SelectItem value="video_play">Video Play</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          {/* Block List */}
          {blocks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No blocks yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add blocks below or pick a template to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <BlockList
              blocks={blocks}
              onUpdate={updateBlockContent}
              onRemove={removeBlock}
              onMove={moveBlock}
            />
          )}

          {/* Add Block */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Add a Block</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BLOCK_TYPES.map((bt) => {
                  const Icon = bt.icon;
                  return (
                    <Button
                      key={bt.type}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto py-2"
                      onClick={() => addBlock(bt.type)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {bt.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Live Preview</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  {(
                    [
                      { id: "desktop", icon: Monitor, label: "Desktop" },
                      { id: "tablet", icon: Tablet, label: "Tablet" },
                      { id: "mobile", icon: Smartphone, label: "Mobile" },
                    ] as const
                  ).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setPreviewViewport(id)}
                      className={`p-1.5 transition-colors ${
                        previewViewport === id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                      title={label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <Badge variant="outline" className="text-xs">
                  {blocks.length} block{blocks.length !== 1 ? "s" : ""}
                </Badge>
                {isEdit && landingPage?.status === "published" && (
                  <a
                    href={`/api/marketing/lp/${siteId}/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Live
                  </a>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t flex justify-center bg-muted/30 p-4">
                <div
                  className="transition-all duration-300 ease-in-out bg-white shadow-lg rounded-lg overflow-hidden"
                  style={{
                    width:
                      previewViewport === "mobile"
                        ? "375px"
                        : previewViewport === "tablet"
                          ? "768px"
                          : "100%",
                    height: "70vh",
                  }}
                >
                  {previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      title="Landing page preview"
                      className="w-full h-full border-0"
                      sandbox="allow-scripts"
                    />
                  ) : blocks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Add blocks to see a preview
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading preview…
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Colours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    { key: "primaryColor", label: "Primary Colour" },
                    { key: "secondaryColor", label: "Secondary Colour" },
                    { key: "headingColor", label: "Heading Colour" },
                    { key: "bodyColor", label: "Body Text Colour" },
                    { key: "backgroundColor", label: "Background Colour" },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={styleConfig[key]}
                      onChange={(e) =>
                        setStyleConfig({
                          ...styleConfig,
                          [key]: e.target.value,
                        })
                      }
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <div className="flex-1">
                      <Label className="text-sm">{label}</Label>
                      <Input
                        value={styleConfig[key]}
                        onChange={(e) =>
                          setStyleConfig({
                            ...styleConfig,
                            [key]: e.target.value,
                          })
                        }
                        className="h-7 text-xs mt-1 font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Typography & Shape */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Typography & Shape</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select
                    value={styleConfig.headingFont}
                    onValueChange={(v) =>
                      setStyleConfig({ ...styleConfig, headingFont: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select
                    value={styleConfig.bodyFont}
                    onValueChange={(v) =>
                      setStyleConfig({ ...styleConfig, bodyFont: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Select
                    value={styleConfig.borderRadius}
                    onValueChange={(v) =>
                      setStyleConfig({ ...styleConfig, borderRadius: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (square)</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="full">Full (pill)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Custom CSS</Label>
                  <Textarea
                    value={styleConfig.customCss || ""}
                    onChange={(e) =>
                      setStyleConfig({
                        ...styleConfig,
                        customCss: e.target.value,
                      })
                    }
                    placeholder="/* Override any style */\n.lp-hero { ... }"
                    rows={5}
                    className="font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reset button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStyleConfig({ ...DEFAULT_STYLE_CONFIG })}
            >
              Reset to Defaults
            </Button>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={seoConfig.metaTitle || ""}
                  onChange={(e) =>
                    setSeoConfig({ ...seoConfig, metaTitle: e.target.value })
                  }
                  placeholder="Page title for search engines"
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground">
                  {(seoConfig.metaTitle || "").length}/70 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDesc">Meta Description</Label>
                <Textarea
                  id="metaDesc"
                  value={seoConfig.metaDescription || ""}
                  onChange={(e) =>
                    setSeoConfig({
                      ...seoConfig,
                      metaDescription: e.target.value,
                    })
                  }
                  placeholder="Brief description for search results"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {(seoConfig.metaDescription || "").length}/160 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  value={seoConfig.ogImage || ""}
                  onChange={(e) =>
                    setSeoConfig({ ...seoConfig, ogImage: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LANDING_PAGE_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => applyTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <h3 className="text-sm font-medium">{template.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.blocks.length} blocks
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
