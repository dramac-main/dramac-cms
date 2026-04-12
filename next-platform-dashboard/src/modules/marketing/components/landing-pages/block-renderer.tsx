/**
 * Landing Page Block Renderer
 *
 * Visual rendering component for all landing page block types.
 * Renders blocks exactly as they will appear on the published page.
 * Fully responsive across all screen sizes.
 */
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LandingPageBlock } from "../../types";

// ============================================================================
// MAIN RENDERER
// ============================================================================

interface BlockRendererProps {
  blocks: LandingPageBlock[];
  className?: string;
}

export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (blocks.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-100 bg-muted/30 rounded-lg",
          className,
        )}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No blocks to preview</p>
          <p className="text-sm mt-1">
            Add blocks in the editor to see a live preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {blocks
        .sort((a, b) => a.order - b.order)
        .map((block) => (
          <RenderBlock key={block.id} block={block} />
        ))}
    </div>
  );
}

// ============================================================================
// BLOCK DISPATCHER
// ============================================================================

function RenderBlock({ block }: { block: LandingPageBlock }) {
  const c = block.content;

  switch (block.type) {
    case "hero":
      return <HeroBlock content={c} />;
    case "features":
      return <FeaturesBlock content={c} />;
    case "testimonials":
      return <TestimonialsBlock content={c} />;
    case "cta":
      return <CTABlock content={c} />;
    case "optin_form":
      return <OptinFormBlock content={c} />;
    case "video":
      return <VideoBlock content={c} />;
    case "gallery":
      return <GalleryBlock content={c} />;
    case "countdown":
      return <CountdownBlock content={c} />;
    case "faq":
      return <FAQBlock content={c} />;
    case "pricing":
      return <PricingBlock content={c} />;
    case "social_proof":
      return <SocialProofBlock content={c} />;
    case "text":
      return <TextBlock content={c} />;
    case "image":
      return <ImageBlock content={c} />;
    default:
      return (
        <div className="py-8 px-6 text-center text-muted-foreground bg-muted/20 border-y">
          Unknown block type: {block.type}
        </div>
      );
  }
}

// ============================================================================
// HERO BLOCK
// ============================================================================

function HeroBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Your Headline Here");
  const subheading = String(content.subheading || "");
  const buttonText = String(content.buttonText || "");
  const bgStyle = String(content.backgroundStyle || "gradient");
  const imageUrl = String(content.imageUrl || "");

  const bgClasses =
    bgStyle === "dark"
      ? "bg-gray-900 text-white"
      : bgStyle === "image" && imageUrl
        ? "bg-cover bg-center text-white"
        : "bg-gradient-to-br from-primary/90 to-primary/60 text-white";

  return (
    <section
      className={cn("relative py-20 md:py-32 px-6", bgClasses)}
      style={
        bgStyle === "image" && imageUrl
          ? { backgroundImage: `url(${imageUrl})` }
          : undefined
      }
    >
      {bgStyle === "image" && imageUrl && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-4 md:mt-6 text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            {subheading}
          </p>
        )}
        {buttonText && (
          <div className="mt-8">
            <span className="inline-flex items-center justify-center rounded-lg bg-white text-primary font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              {buttonText}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES BLOCK
// ============================================================================

function FeaturesBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Features");
  const items = Array.isArray(content.items) ? content.items : [];

  return (
    <section className="py-16 md:py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="text-center p-6 rounded-xl border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold text-lg">
                  {getFeatureIcon(item.icon)}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {String(item.title || `Feature ${i + 1}`)}
              </h3>
              <p className="text-muted-foreground text-sm">
                {String(item.description || "")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getFeatureIcon(icon: unknown): string {
  const s = String(icon || "check");
  const map: Record<string, string> = {
    check: "✓",
    star: "★",
    lightbulb: "💡",
    users: "👥",
    gift: "🎁",
    zap: "⚡",
    shield: "🛡",
    refresh: "🔄",
    globe: "🌐",
    heart: "❤",
    rocket: "🚀",
  };
  return map[s] || "✓";
}

// ============================================================================
// TESTIMONIALS BLOCK
// ============================================================================

function TestimonialsBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "What People Say");
  const items = Array.isArray(content.items) ? content.items : [];

  return (
    <section className="py-16 md:py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="bg-card rounded-xl p-6 border shadow-sm">
              <div className="text-primary text-3xl mb-4">&ldquo;</div>
              <p className="text-muted-foreground italic mb-4">
                {String(item.quote || item.text || "")}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {String(item.name || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {String(item.name || "Anonymous")}
                  </p>
                  {item.role ? (
                    <p className="text-xs text-muted-foreground">
                      {String(item.role)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA BLOCK
// ============================================================================

function CTABlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Ready to Get Started?");
  const description = String(content.description || "");
  const buttonText = String(content.buttonText || "Get Started");

  return (
    <section className="py-16 md:py-24 px-6 bg-primary text-primary-foreground">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{heading}</h2>
        {description && (
          <p className="text-lg opacity-90 mb-8">{description}</p>
        )}
        <span className="inline-flex items-center justify-center rounded-lg bg-white text-primary font-semibold px-8 py-3 text-lg shadow-lg cursor-pointer">
          {buttonText}
        </span>
      </div>
    </section>
  );
}

// ============================================================================
// OPT-IN FORM BLOCK
// ============================================================================

function OptinFormBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Subscribe");
  const description = String(content.description || "");
  const buttonText = String(content.buttonText || "Subscribe");
  const fields = Array.isArray(content.fields) ? content.fields : ["email"];

  const fieldLabels: Record<string, string> = {
    email: "Email Address",
    first_name: "First Name",
    last_name: "Last Name",
    phone: "Phone Number",
    company: "Company",
  };

  return (
    <section className="py-16 md:py-24 px-6 bg-muted/30">
      <div className="max-w-lg mx-auto">
        <div className="bg-card rounded-2xl p-8 border shadow-sm">
          <h2 className="text-2xl font-bold text-center mb-2">{heading}</h2>
          {description && (
            <p className="text-muted-foreground text-center mb-6">
              {description}
            </p>
          )}
          <div className="space-y-4">
            {fields.map((field: unknown) => {
              const name = String(field);
              return (
                <div key={name}>
                  <label className="block text-sm font-medium mb-1.5">
                    {fieldLabels[name] || name}
                  </label>
                  <div className="h-10 rounded-md border bg-background px-3 flex items-center text-muted-foreground text-sm">
                    {name === "email"
                      ? "you@example.com"
                      : `Enter ${fieldLabels[name] || name}...`}
                  </div>
                </div>
              );
            })}
            <span className="flex items-center justify-center w-full rounded-lg bg-primary text-primary-foreground font-semibold h-11 cursor-pointer">
              {buttonText}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// VIDEO BLOCK
// ============================================================================

function VideoBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "");
  const videoUrl = String(content.videoUrl || "");
  const videoType = String(content.videoType || "youtube");

  const embedUrl = getEmbedUrl(videoUrl, videoType);

  return (
    <section className="py-16 md:py-24 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {heading}
          </h2>
        )}
        {embedUrl ? (
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg border">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video"
            />
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-muted/50 border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">▶</span>
              </div>
              <p className="text-sm">Video placeholder — add a URL to embed</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getEmbedUrl(url: string, type: string): string | null {
  if (!url) return null;

  if (
    type === "youtube" ||
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/,
    );
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  }

  if (type === "vimeo" || url.includes("vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }

  return null;
}

// ============================================================================
// GALLERY BLOCK
// ============================================================================

function GalleryBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "");
  // Support both 'items' (from editor) and 'images' (legacy) field names
  const images = Array.isArray(content.items) ? content.items : Array.isArray(content.images) ? content.images : [];
  const columns = Number(content.columns || 3);

  return (
    <section className="py-16 md:py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {heading}
          </h2>
        )}
        {images.length > 0 ? (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`,
            }}
          >
            {images.map((img: Record<string, unknown> | string, i: number) => (
              <div
                key={i}
                className="aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={String(typeof img === "string" ? img : img.url || "")}
                  alt={String(typeof img === "string" ? `Image ${i + 1}` : img.alt || `Image ${i + 1}`)}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-muted/50 border flex items-center justify-center"
              >
                <span className="text-muted-foreground text-xs">Image</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// COUNTDOWN BLOCK
// ============================================================================

function CountdownBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Starts In");
  const targetDate = String(content.targetDate || "");
  const style = String(content.style || "cards");

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate));

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <section className="py-16 md:py-24 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">{heading}</h2>
        <div className="flex items-center justify-center gap-3 md:gap-6">
          {units.map((u) => (
            <div
              key={u.label}
              className={cn(
                "flex flex-col items-center",
                style === "cards"
                  ? "bg-card border rounded-xl p-4 md:p-6 min-w-20 shadow-sm"
                  : "",
              )}
            >
              <span className="text-3xl md:text-5xl font-bold tabular-nums">
                {String(u.value).padStart(2, "0")}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground mt-1">
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function calcTimeLeft(target: string) {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

// ============================================================================
// FAQ BLOCK
// ============================================================================

function FAQBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Frequently Asked Questions");
  const items = Array.isArray(content.items) ? content.items : [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {heading}
        </h2>
        <div className="space-y-3">
          {items.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <button
                className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-medium text-sm">
                  {String(item.question || `Question ${i + 1}`)}
                </span>
                <span
                  className={cn(
                    "text-muted-foreground transition-transform",
                    openIdx === i && "rotate-180",
                  )}
                >
                  ▾
                </span>
              </button>
              {openIdx === i && (
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {String(item.answer || "")}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No FAQ items yet
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING BLOCK
// ============================================================================

function PricingBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Pricing");
  const plans = Array.isArray(content.plans) ? content.plans : [];

  return (
    <section className="py-16 md:py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          {heading}
        </h2>
        <div
          className={cn(
            "grid gap-6",
            plans.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : plans.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                : "grid-cols-1 md:grid-cols-3",
          )}
        >
          {plans.map((plan: Record<string, unknown>, i: number) => {
            const highlighted = plan.highlighted === true;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl border bg-card p-8 flex flex-col",
                  highlighted
                    ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                    : "shadow-sm",
                )}
              >
                {highlighted && (
                  <span className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold">
                  {String(plan.name || `Plan ${i + 1}`)}
                </h3>
                <p className="text-3xl font-bold mt-4 mb-6">
                  {String(plan.price || "Free")}
                </p>
                <ul className="space-y-3 flex-1">
                  {(Array.isArray(plan.features) ? plan.features : []).map(
                    (feat: unknown, fi: number) => (
                      <li key={fi} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{String(feat)}</span>
                      </li>
                    ),
                  )}
                </ul>
                <span
                  className={cn(
                    "mt-8 flex items-center justify-center rounded-lg font-semibold h-11 cursor-pointer",
                    highlighted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border",
                  )}
                >
                  Choose {String(plan.name || "Plan")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// SOCIAL PROOF BLOCK
// ============================================================================

function SocialProofBlock({ content }: { content: Record<string, unknown> }) {
  const heading = String(content.heading || "Trusted By");
  const stats = Array.isArray(content.stats) ? content.stats : [];

  return (
    <section className="py-16 md:py-20 px-6 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-10">{heading}</h2>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {stats.map((stat: Record<string, unknown>, i: number) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {String(stat.value || "0")}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {String(stat.label || "")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// TEXT BLOCK (simple rich text)
// ============================================================================

function TextBlock({ content }: { content: Record<string, unknown> }) {
  const text = String(content.text || content.body || "");
  const heading = String(content.heading || "");

  return (
    <section className="py-12 md:py-16 px-6 bg-background">
      <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
        {heading && <h2>{heading}</h2>}
        {text.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// IMAGE BLOCK
// ============================================================================

function ImageBlock({ content }: { content: Record<string, unknown> }) {
  const url = String(content.url || content.imageUrl || "");
  const alt = String(content.alt || "Image");
  const caption = String(content.caption || "");

  return (
    <section className="py-12 md:py-16 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        {url ? (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt}
              className="w-full rounded-xl shadow-sm border"
            />
            {caption && (
              <figcaption className="text-center text-sm text-muted-foreground mt-3">
                {caption}
              </figcaption>
            )}
          </figure>
        ) : (
          <div className="aspect-video rounded-xl bg-muted/50 border flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              Image placeholder
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
