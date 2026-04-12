/**
 * Landing Page Block Editor
 * Phase MKT-06: Landing Pages & Opt-In Forms
 *
 * Expandable/collapsible block editors with type-specific editing forms
 * for all 11 landing page block types.
 */
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  ChevronRight,
  Type,
  ListChecks,
  MessageSquareQuote,
  Star,
  FormInput,
  Video,
  Image,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { LandingPageBlock, LandingPageBlockType } from "../../types";

// ============================================================================
// BLOCK TYPE CONFIG
// ============================================================================

const BLOCK_ICONS: Record<string, React.ElementType> = {
  hero: Type,
  features: ListChecks,
  testimonials: MessageSquareQuote,
  cta: Star,
  optin_form: FormInput,
  video: Video,
  gallery: Image,
  countdown: Clock,
  faq: ListChecks,
  pricing: Star,
  social_proof: MessageSquareQuote,
  text: Type,
  image: Image,
};

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero Section",
  features: "Features Grid",
  testimonials: "Testimonials",
  cta: "Call to Action",
  optin_form: "Opt-In Form",
  video: "Video Embed",
  gallery: "Image Gallery",
  countdown: "Countdown Timer",
  faq: "FAQ Section",
  pricing: "Pricing Table",
  social_proof: "Social Proof",
  text: "Text Block",
  image: "Image Block",
};

// ============================================================================
// BLOCK LIST (orchestrator)
// ============================================================================

interface BlockListProps {
  blocks: LandingPageBlock[];
  onUpdate: (blockId: string, content: Record<string, unknown>) => void;
  onRemove: (blockId: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
}

export function BlockList({
  blocks,
  onUpdate,
  onRemove,
  onMove,
}: BlockListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <BlockCard
          key={block.id}
          block={block}
          index={index}
          totalBlocks={blocks.length}
          isExpanded={expandedId === block.id}
          onToggle={() =>
            setExpandedId(expandedId === block.id ? null : block.id)
          }
          onUpdate={(content) => onUpdate(block.id, content)}
          onRemove={() => onRemove(block.id)}
          onMoveUp={() => onMove(index, "up")}
          onMoveDown={() => onMove(index, "down")}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SINGLE BLOCK CARD (collapsible)
// ============================================================================

interface BlockCardProps {
  block: LandingPageBlock;
  index: number;
  totalBlocks: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (content: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function BlockCard({
  block,
  index,
  totalBlocks,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: BlockCardProps) {
  const Icon = BLOCK_ICONS[block.type] || Type;
  const label = BLOCK_LABELS[block.type] || block.type;
  const subtitle = getBlockSubtitle(block);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card
        className={
          isExpanded
            ? "border-primary/50 shadow-sm"
            : "hover:border-primary/30 transition-colors"
        }
      >
        {/* Header — always visible */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer select-none">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            </div>
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMoveUp}
                disabled={index === 0}
                aria-label="Move block up"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMoveDown}
                disabled={index === totalBlocks - 1}
                aria-label="Move block down"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove block"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>

        {/* Expanded content — block-specific editor form */}
        <CollapsibleContent>
          <div className="border-t px-4 py-4">
            <BlockForm
              type={block.type}
              content={block.content}
              onUpdate={onUpdate}
            />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function getBlockSubtitle(block: LandingPageBlock): string {
  const c = block.content;
  switch (block.type) {
    case "hero":
      return (c.heading as string) || "Click to edit hero section";
    case "features":
      return (c.heading as string) || "Click to edit features";
    case "testimonials":
      return (c.heading as string) || "Click to edit testimonials";
    case "cta":
      return (c.buttonText as string) || "Click to edit CTA";
    case "optin_form":
      return (c.heading as string) || "Click to edit form";
    case "video":
      return (c.videoUrl as string) || "Click to add video URL";
    case "gallery":
      return (c.heading as string) || "Click to edit gallery";
    case "countdown":
      return (c.heading as string) || "Click to set countdown";
    case "faq":
      return (c.heading as string) || "Click to edit FAQ";
    case "pricing":
      return (c.heading as string) || "Click to edit pricing";
    case "social_proof":
      return (c.heading as string) || "Click to edit social proof";
    case "text":
      return (c.heading as string) || "Click to edit text block";
    case "image":
      return (c.alt as string) || (c.caption as string) || "Click to edit image";
    default:
      return "Click to edit";
  }
}

// ============================================================================
// BLOCK FORM (dispatcher)
// ============================================================================

interface BlockFormProps {
  type: LandingPageBlockType;
  content: Record<string, unknown>;
  onUpdate: (content: Record<string, unknown>) => void;
}

function BlockForm({ type, content, onUpdate }: BlockFormProps) {
  function set(key: string, value: unknown) {
    onUpdate({ ...content, [key]: value });
  }

  switch (type) {
    case "hero":
      return <HeroForm content={content} set={set} onUpdate={onUpdate} />;
    case "features":
      return <FeaturesForm content={content} set={set} onUpdate={onUpdate} />;
    case "testimonials":
      return (
        <TestimonialsForm content={content} set={set} onUpdate={onUpdate} />
      );
    case "cta":
      return <CTAForm content={content} set={set} />;
    case "optin_form":
      return <OptinFormForm content={content} set={set} onUpdate={onUpdate} />;
    case "video":
      return <VideoForm content={content} set={set} />;
    case "gallery":
      return <GalleryForm content={content} set={set} onUpdate={onUpdate} />;
    case "countdown":
      return <CountdownForm content={content} set={set} />;
    case "faq":
      return <FAQForm content={content} set={set} onUpdate={onUpdate} />;
    case "pricing":
      return <PricingForm content={content} set={set} onUpdate={onUpdate} />;
    case "social_proof":
      return (
        <SocialProofForm content={content} set={set} onUpdate={onUpdate} />
      );
    case "text":
      return <TextBlockForm content={content} set={set} />;
    case "image":
      return <ImageBlockForm content={content} set={set} />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unknown block type: {type}
        </p>
      );
  }
}

// ============================================================================
// SHARED HELPERS
// ============================================================================

type SetFn = (key: string, value: unknown) => void;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ============================================================================
// 1. HERO SECTION
// ============================================================================

function HeroForm({
  content,
  set,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Get 50% Off This Month"
        />
      </Field>
      <Field label="Subheading">
        <Textarea
          value={(content.subheading as string) || ""}
          onChange={(e) => set("subheading", e.target.value)}
          placeholder="A short supporting sentence"
          rows={2}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Button Text">
          <Input
            value={(content.buttonText as string) || ""}
            onChange={(e) => set("buttonText", e.target.value)}
            placeholder="e.g. Shop Now"
          />
        </Field>
        <Field label="Button Action">
          <Select
            value={(content.buttonAction as string) || "scroll_to_form"}
            onValueChange={(v) => set("buttonAction", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scroll_to_form">Scroll to Form</SelectItem>
              <SelectItem value="external_link">External Link</SelectItem>
              <SelectItem value="scroll_to_section">
                Scroll to Section
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      {(content.buttonAction as string) === "external_link" && (
        <Field label="Button URL">
          <Input
            value={(content.buttonUrl as string) || ""}
            onChange={(e) => set("buttonUrl", e.target.value)}
            placeholder="https://example.com"
          />
        </Field>
      )}
      <Field label="Background Style">
        <Select
          value={(content.backgroundStyle as string) || "gradient"}
          onValueChange={(v) => set("backgroundStyle", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image">Background Image</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="bold">Bold / Colorful</SelectItem>
            <SelectItem value="minimal">Minimal / White</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {(content.backgroundStyle as string) === "image" && (
        <Field label="Background Image URL">
          <Input
            value={(content.backgroundImage as string) || ""}
            onChange={(e) => set("backgroundImage", e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </Field>
      )}
    </div>
  );
}

// ============================================================================
// 2. FEATURES GRID
// ============================================================================

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

function FeaturesForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const items = (content.items as FeatureItem[]) || [];

  function updateItem(idx: number, field: string, value: string) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    onUpdate({ ...content, items: updated });
  }

  function addItem() {
    onUpdate({
      ...content,
      items: [...items, { icon: "check", title: "", description: "" }],
    });
  }

  function removeItem(idx: number) {
    onUpdate({ ...content, items: items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Why Choose Us"
        />
      </Field>
      <Field label="Layout">
        <Select
          value={(content.layout as string) || "grid"}
          onValueChange={(v) => set("layout", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid (3 columns)</SelectItem>
            <SelectItem value="list">Vertical List</SelectItem>
            <SelectItem value="alternating">Alternating</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Features ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" />
            Add Feature
          </Button>
        </div>
        {items.map((item, idx) => (
          <Card key={idx} className="bg-muted/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Feature {idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeItem(idx)}
                  aria-label={`Remove feature ${idx + 1}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={item.title}
                onChange={(e) => updateItem(idx, "title", e.target.value)}
                placeholder="Feature title"
                className="text-sm"
              />
              <Textarea
                value={item.description}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
                placeholder="Short description"
                rows={2}
                className="text-sm"
              />
              <Select
                value={item.icon || "check"}
                onValueChange={(v) => updateItem(idx, "icon", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">✓ Check</SelectItem>
                  <SelectItem value="star">★ Star</SelectItem>
                  <SelectItem value="zap">⚡ Zap</SelectItem>
                  <SelectItem value="shield">🛡 Shield</SelectItem>
                  <SelectItem value="lightbulb">💡 Lightbulb</SelectItem>
                  <SelectItem value="heart">❤ Heart</SelectItem>
                  <SelectItem value="globe">🌐 Globe</SelectItem>
                  <SelectItem value="users">👥 Users</SelectItem>
                  <SelectItem value="gift">🎁 Gift</SelectItem>
                  <SelectItem value="refresh">🔄 Refresh</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 3. TESTIMONIALS
// ============================================================================

interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  avatar?: string;
}

function TestimonialsForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const items = (content.items as TestimonialItem[]) || [];

  function updateItem(idx: number, field: string, value: string) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    onUpdate({ ...content, items: updated });
  }

  function addItem() {
    onUpdate({
      ...content,
      items: [...items, { name: "", role: "", quote: "" }],
    });
  }

  function removeItem(idx: number) {
    onUpdate({ ...content, items: items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. What Our Customers Say"
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Testimonials ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" />
            Add Testimonial
          </Button>
        </div>
        {items.map((item, idx) => (
          <Card key={idx} className="bg-muted/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Testimonial {idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeItem(idx)}
                  aria-label={`Remove testimonial ${idx + 1}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Textarea
                value={item.quote}
                onChange={(e) => updateItem(idx, "quote", e.target.value)}
                placeholder="What did the customer say?"
                rows={2}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                  placeholder="Name"
                  className="text-sm"
                />
                <Input
                  value={item.role}
                  onChange={(e) => updateItem(idx, "role", e.target.value)}
                  placeholder="Role / Company"
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 4. CALL TO ACTION
// ============================================================================

function CTAForm({
  content,
  set,
}: {
  content: Record<string, unknown>;
  set: SetFn;
}) {
  return (
    <div className="space-y-4">
      <Field label="Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Ready to Get Started?"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={(content.description as string) || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Supporting text to encourage the action"
          rows={2}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Button Text">
          <Input
            value={(content.buttonText as string) || ""}
            onChange={(e) => set("buttonText", e.target.value)}
            placeholder="e.g. Sign Up Free"
          />
        </Field>
        <Field label="Button Link">
          <Input
            value={(content.buttonLink as string) || ""}
            onChange={(e) => set("buttonLink", e.target.value)}
            placeholder="https://example.com/signup"
          />
        </Field>
      </div>
      <Field label="Style">
        <Select
          value={(content.style as string) || "default"}
          onValueChange={(v) => set("style", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="centered">Centered</SelectItem>
            <SelectItem value="banner">Full-width Banner</SelectItem>
            <SelectItem value="card">Card Style</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

// ============================================================================
// 5. OPT-IN FORM
// ============================================================================

function OptinFormForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const fields = (content.fields as string[]) || ["email"];

  const AVAILABLE_FIELDS = [
    { value: "email", label: "Email Address" },
    { value: "first_name", label: "First Name" },
    { value: "last_name", label: "Last Name" },
    { value: "phone", label: "Phone Number" },
    { value: "company", label: "Company Name" },
  ];

  function toggleField(field: string) {
    if (field === "email") return; // email is always required
    const updated = fields.includes(field)
      ? fields.filter((f) => f !== field)
      : [...fields, field];
    onUpdate({ ...content, fields: updated });
  }

  return (
    <div className="space-y-4">
      <Field label="Form Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Subscribe to Our Newsletter"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={(content.description as string) || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Why should they sign up?"
          rows={2}
        />
      </Field>
      <Field label="Submit Button Text">
        <Input
          value={(content.buttonText as string) || ""}
          onChange={(e) => set("buttonText", e.target.value)}
          placeholder="e.g. Subscribe"
        />
      </Field>
      <Field label="Form Fields">
        <div className="space-y-2">
          {AVAILABLE_FIELDS.map((f) => (
            <label
              key={f.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={fields.includes(f.value)}
                onChange={() => toggleField(f.value)}
                disabled={f.value === "email"}
                className="rounded border-input"
              />
              <span>{f.label}</span>
              {f.value === "email" && (
                <span className="text-xs text-muted-foreground">
                  (required)
                </span>
              )}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Linked Form ID (optional)">
        <Input
          value={(content.formId as string) || ""}
          onChange={(e) => set("formId", e.target.value)}
          placeholder="Paste a Marketing Form ID to track submissions"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Link to a Marketing Form to save submissions and add subscribers automatically.
        </p>
      </Field>
    </div>
  );
}

// ============================================================================
// 6. VIDEO EMBED
// ============================================================================

function VideoForm({
  content,
  set,
}: {
  content: Record<string, unknown>;
  set: SetFn;
}) {
  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. See It In Action"
        />
      </Field>
      <Field label="Video URL">
        <Input
          value={(content.videoUrl as string) || ""}
          onChange={(e) => set("videoUrl", e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
        />
      </Field>
      <Field label="Video Platform">
        <Select
          value={(content.videoType as string) || "youtube"}
          onValueChange={(v) => set("videoType", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="wistia">Wistia</SelectItem>
            <SelectItem value="custom">Custom / Self-hosted</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Description (optional)">
        <Textarea
          value={(content.description as string) || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Optional caption below the video"
          rows={2}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// 7. IMAGE GALLERY
// ============================================================================

interface GalleryItem {
  image: string;
  title: string;
  originalPrice?: string;
  salePrice?: string;
  description?: string;
}

function GalleryForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const items = (content.items as GalleryItem[]) || [];

  function updateItem(idx: number, field: string, value: string) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    onUpdate({ ...content, items: updated });
  }

  function addItem() {
    onUpdate({
      ...content,
      items: [...items, { image: "", title: "", description: "" }],
    });
  }

  function removeItem(idx: number) {
    onUpdate({ ...content, items: items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Our Gallery"
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Images ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" />
            Add Image
          </Button>
        </div>
        {items.map((item, idx) => (
          <Card key={idx} className="bg-muted/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Image {idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeItem(idx)}
                  aria-label={`Remove image ${idx + 1}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={item.title}
                onChange={(e) => updateItem(idx, "title", e.target.value)}
                placeholder="Title / Caption"
                className="text-sm"
              />
              <Input
                value={item.image}
                onChange={(e) => updateItem(idx, "image", e.target.value)}
                placeholder="Image URL (https://...)"
                className="text-sm"
              />
              <Input
                value={item.description || ""}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
                placeholder="Description (optional)"
                className="text-sm"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 8. COUNTDOWN TIMER
// ============================================================================

function CountdownForm({
  content,
  set,
}: {
  content: Record<string, unknown>;
  set: SetFn;
}) {
  // Convert ISO string to datetime-local value
  const rawDate = content.targetDate as string;
  const dateTimeLocal = rawDate
    ? new Date(rawDate).toISOString().slice(0, 16)
    : "";

  return (
    <div className="space-y-4">
      <Field label="Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Sale Ends In"
        />
      </Field>
      <Field label="Target Date & Time">
        <Input
          type="datetime-local"
          value={dateTimeLocal}
          onChange={(e) =>
            set("targetDate", new Date(e.target.value).toISOString())
          }
        />
      </Field>
      <Field label="Style">
        <Select
          value={(content.style as string) || "cards"}
          onValueChange={(v) => set("style", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="urgent">Urgent (Red)</SelectItem>
            <SelectItem value="inline">Inline Text</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Expired Message (optional)">
        <Input
          value={(content.expiredMessage as string) || ""}
          onChange={(e) => set("expiredMessage", e.target.value)}
          placeholder="e.g. This offer has ended"
        />
      </Field>
    </div>
  );
}

// ============================================================================
// 9. FAQ SECTION
// ============================================================================

interface FAQItem {
  question: string;
  answer: string;
}

function FAQForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const items = (content.items as FAQItem[]) || [];

  function updateItem(idx: number, field: string, value: string) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item,
    );
    onUpdate({ ...content, items: updated });
  }

  function addItem() {
    onUpdate({
      ...content,
      items: [...items, { question: "", answer: "" }],
    });
  }

  function removeItem(idx: number) {
    onUpdate({ ...content, items: items.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Frequently Asked Questions"
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Questions ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" />
            Add Question
          </Button>
        </div>
        {items.map((item, idx) => (
          <Card key={idx} className="bg-muted/30">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Q{idx + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeItem(idx)}
                  aria-label={`Remove question ${idx + 1}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => updateItem(idx, "question", e.target.value)}
                placeholder="Question"
                className="text-sm"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(idx, "answer", e.target.value)}
                placeholder="Answer"
                rows={2}
                className="text-sm"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 10. PRICING TABLE
// ============================================================================

interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  buttonText?: string;
}

function PricingForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const plans = (content.plans as PricingPlan[]) || [];

  function updatePlan(idx: number, field: string, value: unknown) {
    const updated = plans.map((plan, i) =>
      i === idx ? { ...plan, [field]: value } : plan,
    );
    onUpdate({ ...content, plans: updated });
  }

  function addPlan() {
    onUpdate({
      ...content,
      plans: [
        ...plans,
        {
          name: "",
          price: "",
          features: [""],
          highlighted: false,
          buttonText: "Get Started",
        },
      ],
    });
  }

  function removePlan(idx: number) {
    onUpdate({ ...content, plans: plans.filter((_, i) => i !== idx) });
  }

  function updateFeature(planIdx: number, featureIdx: number, value: string) {
    const updatedFeatures = [...plans[planIdx].features];
    updatedFeatures[featureIdx] = value;
    updatePlan(planIdx, "features", updatedFeatures);
  }

  function addFeature(planIdx: number) {
    updatePlan(planIdx, "features", [...plans[planIdx].features, ""]);
  }

  function removeFeature(planIdx: number, featureIdx: number) {
    updatePlan(
      planIdx,
      "features",
      plans[planIdx].features.filter((_, i) => i !== featureIdx),
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Our Plans"
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Pricing Plans ({plans.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addPlan}>
            <Plus className="mr-1 h-3 w-3" />
            Add Plan
          </Button>
        </div>
        {plans.map((plan, planIdx) => (
          <Card key={planIdx} className="bg-muted/30">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Plan {planIdx + 1}
                  {plan.highlighted ? " ★ Highlighted" : ""}
                </span>
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-1 text-xs cursor-pointer mr-2">
                    <input
                      type="checkbox"
                      checked={plan.highlighted || false}
                      onChange={(e) =>
                        updatePlan(planIdx, "highlighted", e.target.checked)
                      }
                      className="rounded border-input"
                    />
                    Featured
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removePlan(planIdx)}
                    aria-label={`Remove plan ${planIdx + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={plan.name}
                  onChange={(e) => updatePlan(planIdx, "name", e.target.value)}
                  placeholder="Plan name"
                  className="text-sm"
                />
                <Input
                  value={plan.price}
                  onChange={(e) => updatePlan(planIdx, "price", e.target.value)}
                  placeholder="$29/mo"
                  className="text-sm"
                />
              </div>
              <Input
                value={plan.buttonText || ""}
                onChange={(e) =>
                  updatePlan(planIdx, "buttonText", e.target.value)
                }
                placeholder="Button text (e.g. Get Started)"
                className="text-sm"
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Features
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => addFeature(planIdx)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                {plan.features.map((feature, featureIdx) => (
                  <div key={featureIdx} className="flex items-center gap-1">
                    <Input
                      value={feature}
                      onChange={(e) =>
                        updateFeature(planIdx, featureIdx, e.target.value)
                      }
                      placeholder="Feature description"
                      className="text-xs h-7"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-destructive"
                      onClick={() => removeFeature(planIdx, featureIdx)}
                      aria-label="Remove feature"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 11. SOCIAL PROOF
// ============================================================================

interface SocialProofStat {
  value: string;
  label: string;
}

// ============================================================================
// TEXT BLOCK FORM
// ============================================================================

function TextBlockForm({
  content,
  set,
}: {
  content: Record<string, unknown>;
  set: SetFn;
}) {
  return (
    <div className="space-y-4">
      <Field label="Heading (optional)">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. About Us"
        />
      </Field>
      <Field label="Body Text">
        <Textarea
          value={(content.text as string) || ""}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Enter your text content here..."
          rows={6}
        />
      </Field>
    </div>
  );
}

// ============================================================================
// IMAGE BLOCK FORM
// ============================================================================

function ImageBlockForm({
  content,
  set,
}: {
  content: Record<string, unknown>;
  set: SetFn;
}) {
  return (
    <div className="space-y-4">
      <Field label="Image URL">
        <Input
          value={(content.url as string) || ""}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </Field>
      <Field label="Alt Text">
        <Input
          value={(content.alt as string) || ""}
          onChange={(e) => set("alt", e.target.value)}
          placeholder="Describe this image for accessibility"
        />
      </Field>
      <Field label="Caption (optional)">
        <Input
          value={(content.caption as string) || ""}
          onChange={(e) => set("caption", e.target.value)}
          placeholder="Optional caption text"
        />
      </Field>
    </div>
  );
}

function SocialProofForm({
  content,
  set,
  onUpdate,
}: {
  content: Record<string, unknown>;
  set: SetFn;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const stats = (content.stats as SocialProofStat[]) || [];

  function updateStat(idx: number, field: string, value: string) {
    const updated = stats.map((stat, i) =>
      i === idx ? { ...stat, [field]: value } : stat,
    );
    onUpdate({ ...content, stats: updated });
  }

  function addStat() {
    onUpdate({
      ...content,
      stats: [...stats, { value: "", label: "" }],
    });
  }

  function removeStat(idx: number) {
    onUpdate({ ...content, stats: stats.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input
          value={(content.heading as string) || ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Trusted by Thousands"
        />
      </Field>
      <Field label="Description (optional)">
        <Textarea
          value={(content.description as string) || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Supporting text"
          rows={2}
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            Stats ({stats.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addStat}>
            <Plus className="mr-1 h-3 w-3" />
            Add Stat
          </Button>
        </div>
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={stat.value}
              onChange={(e) => updateStat(idx, "value", e.target.value)}
              placeholder="10,000+"
              className="text-sm w-28"
            />
            <Input
              value={stat.label}
              onChange={(e) => updateStat(idx, "label", e.target.value)}
              placeholder="Customers"
              className="text-sm flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-destructive"
              onClick={() => removeStat(idx)}
              aria-label={`Remove stat ${idx + 1}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
