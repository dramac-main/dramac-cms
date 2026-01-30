/**
 * Puck Section Components
 * 
 * Pre-built section components for common page layouts.
 */

import type {
  HeroProps,
  FeaturesProps,
  CTAProps,
  TestimonialsProps,
  FAQProps,
  StatsProps,
  TeamProps,
  GalleryProps,
} from "@/types/puck";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Shield, 
  Heart, 
  Star, 
  ChevronDown,
  User,
  ImageIcon,
} from "lucide-react";

// Column grid utilities
const columnGridMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

// Alignment utilities
const alignmentMap: Record<string, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

// Simple icon map for features (extend as needed)
const iconMap: Record<string, typeof Zap> = {
  Zap,
  Shield,
  Heart,
  Star,
};

/**
 * Hero Component
 * Full-width hero section with title, subtitle, and CTA.
 */
export function HeroRender({
  title = "Welcome to Our Website",
  subtitle = "Build amazing experiences with our visual editor",
  buttonText = "Get Started",
  buttonLink = "#",
  backgroundColor = "#0f0d1a",
  backgroundImage,
  textColor = "#ffffff",
  alignment = "center",
  minHeight = 500,
  overlay = true,
  overlayOpacity = 50,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative flex flex-col justify-center px-4 md:px-8",
        alignmentMap[alignment || "center"]
      )}
      style={{
        minHeight: `${minHeight}px`,
        backgroundColor: backgroundImage ? undefined : (backgroundColor || "#0f0d1a"),
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor || "#ffffff",
      }}
    >
      {/* Overlay */}
      {overlay && backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "black",
            opacity: (overlayOpacity || 50) / 100,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          {title}
        </h1>
        <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
          {subtitle}
        </p>
        {buttonText && (
          <a
            href={buttonLink || "#"}
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

/**
 * Features Component
 * Grid of feature cards with icons.
 */
export function FeaturesRender({
  title = "Our Features",
  subtitle = "Everything you need to succeed",
  columns = 3,
  features = [],
}: FeaturesProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Feature Grid */}
        <div className={cn("grid gap-6 md:gap-8", columnGridMap[columns || 3])}>
          {(features || []).map((feature, index) => {
            const IconComponent = iconMap[feature.icon || "Zap"] || Zap;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-lg bg-card border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * CTA Component
 * Call-to-action section.
 */
export function CTARender({
  title = "Ready to get started?",
  subtitle = "Join thousands of satisfied customers today.",
  buttonText = "Get Started",
  buttonLink = "#",
  backgroundColor,
  textColor,
  alignment = "center",
}: CTAProps) {
  return (
    <section
      className={cn(
        "py-12 md:py-20 px-4 md:px-8",
        alignmentMap[alignment || "center"]
      )}
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        {subtitle && (
          <p className="text-lg opacity-90 mb-8 max-w-2xl">{subtitle}</p>
        )}
        {buttonText && (
          <a
            href={buttonLink || "#"}
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors self-center"
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

/**
 * Testimonials Component
 * Display customer testimonials.
 */
export function TestimonialsRender({
  title = "What Our Customers Say",
  testimonials = [],
  columns = 2,
  showAvatar = true,
}: TestimonialsProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        </div>

        {/* Testimonials Grid */}
        <div className={cn("grid gap-6 md:gap-8", columnGridMap[columns || 2])}>
          {(testimonials || []).map((testimonial, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-lg border"
            >
              <p className="text-lg mb-4 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                {showAvatar && (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  {testimonial.role && (
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ Component
 * Frequently asked questions section.
 */
export function FAQRender({
  title = "Frequently Asked Questions",
  faqs = [],
  style = "accordion",
}: FAQProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {(faqs || []).map((faq, index) => (
            <details
              key={index}
              className="group bg-card border rounded-lg overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <span className="font-semibold">{faq.question}</span>
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-0">
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Stats Component
 * Display statistics/metrics.
 */
export function StatsRender({
  stats = [],
  columns = 3,
  alignment = "center",
}: StatsProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className={cn("max-w-6xl mx-auto", alignmentMap[alignment || "center"])}>
        <div className={cn("grid gap-8", columnGridMap[columns || 3])}>
          {(stats || []).map((stat, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-4xl md:text-5xl font-bold text-primary">
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </span>
              <span className="text-muted-foreground mt-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Team Component
 * Display team members.
 */
export function TeamRender({
  title = "Meet Our Team",
  members = [],
  columns = 3,
}: TeamProps) {
  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        </div>

        {/* Team Grid */}
        <div className={cn("grid gap-8", columnGridMap[columns || 3])}>
          {(members || []).map((member, index) => (
            <div key={index} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-muted overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-primary">{member.role}</p>
              {member.bio && (
                <p className="text-sm text-muted-foreground mt-2">{member.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Gallery Component
 * Image gallery with optional lightbox.
 */
export function GalleryRender({
  images = [],
  columns = 3,
  gap = "md",
  aspectRatio = "square",
  lightbox = true,
}: GalleryProps) {
  const gapMap: Record<string, string> = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-8",
  };

  const aspectMap: Record<string, string> = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "",
  };

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {(images || []).length > 0 ? (
          <div
            className={cn(
              "grid",
              columnGridMap[columns || 3],
              gapMap[gap || "md"]
            )}
          >
            {(images || []).map((image, index) => (
              <div
                key={index}
                className={cn(
                  "relative overflow-hidden rounded-lg bg-muted",
                  aspectMap[aspectRatio || "square"]
                )}
              >
                {image.src ? (
                  <img
                    src={image.src}
                    alt={image.alt || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-sm">
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Add images to display</p>
          </div>
        )}
      </div>
    </section>
  );
}
