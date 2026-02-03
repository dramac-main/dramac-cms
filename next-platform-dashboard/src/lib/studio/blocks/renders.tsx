/**
 * DRAMAC Studio Component Renders
 * 
 * Placeholder render components for the Studio system.
 * These are simple React components that can render the component data.
 * 
 * @phase STUDIO-27 - Platform Integration & Puck Removal
 */

import React from "react";

// ============================================================================
// Utility: Filter unsafe props for HTML elements
// ============================================================================

/**
 * Filters out children and other unsafe props from spreading onto HTML elements.
 * This prevents React Error #137 (void elements with children) and ensures
 * only valid HTML attributes are passed to DOM elements.
 */
function _filterDOMProps(props: Record<string, unknown>): Record<string, unknown> {
  const { 
    children, // Never spread children onto elements
    ...safeProps 
  } = props;
  void children; // Suppress unused variable warning
  return safeProps;
}

// ============================================================================
// Layout Components
// ============================================================================

export function SectionRender({ 
  children, 
  backgroundColor, 
  padding = "md", 
  maxWidth = "xl",
  minHeight,
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const paddingClass = {
    none: "py-0",
    sm: "py-4",
    md: "py-8",
    lg: "py-16",
    xl: "py-24",
  }[padding as string] || "py-8";
  
  const maxWidthClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-full",
  }[maxWidth as string] || "max-w-screen-xl";

  return (
    <section 
      className={`${paddingClass} w-full`}
      style={{ 
        backgroundColor: backgroundColor as string,
        minHeight: minHeight ? `${minHeight}px` : undefined,
      }}
      {...props}
    >
      <div className={`${maxWidthClass} mx-auto px-4`}>
        {children}
      </div>
    </section>
  );
}

export function ContainerRender({ 
  children, 
  maxWidth = "xl", 
  padding = "md",
  backgroundColor,
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const paddingClass = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding as string] || "p-6";
  
  const maxWidthClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    full: "max-w-full",
  }[maxWidth as string] || "max-w-screen-xl";

  return (
    <div 
      className={`${maxWidthClass} ${paddingClass} mx-auto`}
      style={{ backgroundColor: backgroundColor as string }}
      {...props}
    >
      {children}
    </div>
  );
}

export function ColumnsRender({ 
  children, 
  columns = 2, 
  gap = "md",
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const gapClass = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-8",
  }[gap as string] || "gap-4";

  return (
    <div 
      className={`grid ${gapClass}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardRender({ 
  children, 
  padding = "md",
  shadow = true,
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const paddingClass = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }[padding as string] || "p-6";

  return (
    <div 
      className={`${paddingClass} bg-white rounded-lg ${shadow ? "shadow-md" : ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SpacerRender({ height = 32 }: Record<string, unknown>) {
  return <div style={{ height: `${height}px` }} aria-hidden="true" />;
}

export function DividerRender({ color = "#e5e7eb" }: Record<string, unknown>) {
  return <hr style={{ borderColor: color as string }} className="border-t my-4" />;
}

// ============================================================================
// Typography Components
// ============================================================================

export function HeadingRender({ 
  text = "Heading", 
  level = 2, 
  align = "left",
  color,
  children: _children, // Exclude children since we render text
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  const sizeClass = {
    1: "text-4xl md:text-5xl font-bold",
    2: "text-3xl md:text-4xl font-bold",
    3: "text-2xl md:text-3xl font-semibold",
    4: "text-xl md:text-2xl font-semibold",
    5: "text-lg md:text-xl font-medium",
    6: "text-base md:text-lg font-medium",
  }[level as number] || "text-2xl font-bold";
  
  const { id, className } = props;

  return (
    <Tag 
      className={`${sizeClass} text-${align} ${className || ""}`}
      style={{ color: color as string }}
      id={id as string | undefined}
    >
      {text as string}
    </Tag>
  );
}

export function TextRender({ 
  text = "Text content", 
  align = "left",
  color,
  children: _children, // Exclude children since we render text
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const { id, className } = props;
  
  return (
    <p 
      className={`text-base text-${align} ${className || ""}`}
      style={{ color: color as string }}
      id={id as string | undefined}
    >
      {text as string}
    </p>
  );
}

// ============================================================================
// Button Components
// ============================================================================

export function ButtonRender({ 
  label = "Button", 
  href = "#", 
  variant = "primary",
  size = "md",
  children: _children, // Exclude children since we render label
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const baseClass = "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variantClass = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
  }[variant as string] || "bg-blue-600 text-white hover:bg-blue-700";
  const sizeClass = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }[size as string] || "px-4 py-2 text-base";
  
  const { id, className } = props;

  return (
    <a 
      href={href as string}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className || ""}`}
      id={id as string | undefined}
    >
      {label as string}
    </a>
  );
}

// ============================================================================
// Media Components
// ============================================================================

export function ImageRender({ 
  src = "/placeholder.svg", 
  alt = "Image",
  width,
  height,
  objectFit = "cover",
  children: _children, // Explicitly exclude children (void element)
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  // Extract only safe HTML attributes for img
  const { id, className, style, ...rest } = props;
  void rest; // Discard any remaining props not suitable for img
  
  return (
    <img 
      src={src as string}
      alt={alt as string}
      className={`w-full h-auto ${className || ""}`}
      id={id as string | undefined}
      style={{ 
        ...(style as React.CSSProperties || {}),
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        objectFit: objectFit as "cover" | "contain" | "fill",
      }}
    />
  );
}

export function VideoRender({ 
  url = "", 
  autoplay = false,
  controls = true,
  children: _children, // Explicitly exclude children (void-like element)
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  // Extract only safe props
  const { id, className } = props;
  
  // Handle YouTube URLs
  if ((url as string).includes("youtube.com") || (url as string).includes("youtu.be")) {
    const videoId = (url as string).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return (
      <div className={`aspect-video w-full ${className || ""}`} id={id as string | undefined}>
        <iframe 
          src={`https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1" : ""}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  
  return (
    <video 
      src={url as string}
      autoPlay={autoplay as boolean}
      controls={controls as boolean}
      className={`w-full h-auto ${className || ""}`}
      id={id as string | undefined}
    />
  );
}

export function MapRender({ 
  address = "New York, NY",
  height = 300,
  children: _children, // Explicitly exclude children
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const { id, className } = props;
  const encodedAddress = encodeURIComponent(address as string);
  return (
    <div 
      style={{ height: `${height}px` }} 
      id={id as string | undefined}
      className={className as string | undefined}
    >
      <iframe 
        src={`https://maps.google.com/maps?q=${encodedAddress}&output=embed`}
        className="w-full h-full border-0"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}

// ============================================================================
// Section Components
// ============================================================================

export function HeroRender({ 
  title = "Welcome",
  subtitle = "Subtitle here",
  buttonText = "Get Started",
  buttonLink = "#",
  backgroundImage,
  ...props 
}: Record<string, unknown>) {
  return (
    <section 
      className="py-24 px-4 text-center bg-cover bg-center"
      style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}
      {...props}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">{title as string}</h1>
        <p className="text-xl text-gray-600 mb-8">{subtitle as string}</p>
        <a 
          href={buttonLink as string}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          {buttonText as string}
        </a>
      </div>
    </section>
  );
}

export function FeaturesRender({ 
  title = "Features",
  features = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4" {...props}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title as string}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {(features as Array<{title?: string; description?: string}>)?.map((feature, i) => (
            <div key={i} className="text-center p-6">
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CTARender({ 
  title = "Ready to get started?",
  description = "Join us today",
  buttonText = "Sign Up",
  buttonLink = "#",
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4 bg-blue-600 text-white text-center" {...props}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">{title as string}</h2>
        <p className="text-xl mb-8 opacity-90">{description as string}</p>
        <a 
          href={buttonLink as string}
          className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-gray-100 transition-colors"
        >
          {buttonText as string}
        </a>
      </div>
    </section>
  );
}

export function TestimonialsRender({ 
  title = "Testimonials",
  testimonials = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4 bg-gray-50" {...props}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title as string}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {(testimonials as Array<{quote?: string; author?: string}>)?.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 mb-4">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-semibold">— {t.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQRender({ 
  title = "FAQ",
  items = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4" {...props}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title as string}</h2>
        <div className="space-y-4">
          {(items as Array<{question?: string; answer?: string}>)?.map((item, i) => (
            <details key={i} className="border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{item.question}</summary>
              <p className="mt-2 text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsRender({ 
  stats = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4 bg-gray-900 text-white" {...props}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-center">
        {(stats as Array<{value?: string; label?: string}>)?.map((stat, i) => (
          <div key={i}>
            <div className="text-4xl font-bold mb-2">{stat.value}</div>
            <div className="text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamRender({ 
  title = "Our Team",
  members = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4" {...props}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{title as string}</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {(members as Array<{name?: string; role?: string; image?: string}>)?.map((member, i) => (
            <div key={i} className="text-center">
              <img 
                src={member.image || "/placeholder-avatar.svg"} 
                alt={member.name} 
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-gray-600 text-sm">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryRender({ 
  images = [],
  columns = 3,
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4" {...props}>
      <div 
        className="max-w-6xl mx-auto grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {(images as Array<{src?: string; alt?: string}>)?.map((img, i) => (
          <img 
            key={i}
            src={img.src || "/placeholder.svg"} 
            alt={img.alt || `Gallery image ${i + 1}`}
            className="w-full h-48 object-cover rounded-lg"
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Navigation Components
// ============================================================================

export function NavbarRender({ 
  logo = "Logo",
  links = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <nav className="bg-white shadow px-4 py-3" {...props}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="text-xl font-bold">{logo as string}</div>
        <div className="flex items-center gap-6">
          {(links as Array<{label?: string; href?: string}>)?.map((link, i) => (
            <a key={i} href={link.href || "#"} className="text-gray-600 hover:text-gray-900">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function FooterRender({ 
  copyright = "© 2026 Company",
  links = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <footer className="bg-gray-900 text-white px-4 py-8" {...props}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-gray-400">{copyright as string}</div>
        <div className="flex items-center gap-6">
          {(links as Array<{label?: string; href?: string}>)?.map((link, i) => (
            <a key={i} href={link.href || "#"} className="text-gray-400 hover:text-white">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export function SocialLinksRender({ 
  links = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="flex items-center gap-4" {...props}>
      {(links as Array<{platform?: string; url?: string}>)?.map((link, i) => (
        <a 
          key={i} 
          href={link.url || "#"} 
          className="text-gray-600 hover:text-gray-900"
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.platform}
        </a>
      ))}
    </div>
  );
}

// ============================================================================
// Form Components
// ============================================================================

export function FormRender({ 
  children,
  action = "#",
  method = "POST",
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  return (
    <form 
      action={action as string}
      method={method as string}
      className="space-y-4"
      {...props}
    >
      {children}
    </form>
  );
}

export function FormFieldRender({ 
  label = "Field",
  type = "text",
  name = "field",
  placeholder = "",
  required = false,
}: Record<string, unknown>) {
  const isRequired = Boolean(required);
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {String(label)}
        {isRequired ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      <input 
        type={type as string}
        name={name as string}
        placeholder={placeholder as string}
        required={isRequired}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function ContactFormRender({ 
  title = "Contact Us",
  submitText = "Send Message",
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="max-w-md mx-auto p-6" {...props}>
      <h2 className="text-2xl font-bold mb-6">{title as string}</h2>
      <form className="space-y-4">
        <FormFieldRender label="Name" name="name" required />
        <FormFieldRender label="Email" type="email" name="email" required />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea 
            name="message"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button 
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          {submitText as string}
        </button>
      </form>
    </div>
  );
}

export function NewsletterRender({ 
  title = "Subscribe",
  description = "Get updates in your inbox",
  buttonText = "Subscribe",
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="max-w-md mx-auto text-center p-6" {...props}>
      <h3 className="text-xl font-bold mb-2">{title as string}</h3>
      <p className="text-gray-600 mb-4">{description as string}</p>
      <form className="flex gap-2">
        <input 
          type="email"
          placeholder="Enter your email"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
        >
          {buttonText as string}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// Content Components
// ============================================================================

export function RichTextRender({ 
  content = "<p>Rich text content</p>",
  ...props 
}: Record<string, unknown>) {
  return (
    <div 
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content as string }}
      {...props}
    />
  );
}

export function QuoteRender({ 
  text = "Quote text",
  author = "Author",
  ...props 
}: Record<string, unknown>) {
  return (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic" {...props}>
      <p className="text-lg mb-2">&ldquo;{text as string}&rdquo;</p>
      <footer className="text-gray-600">— {author as string}</footer>
    </blockquote>
  );
}

export function CodeBlockRender({ 
  code = "// Code here",
  language = "javascript",
  ...props 
}: Record<string, unknown>) {
  return (
    <pre 
      className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto"
      {...props}
    >
      <code data-language={language as string}>{code as string}</code>
    </pre>
  );
}

// ============================================================================
// Interactive Components
// ============================================================================

export function CarouselRender({ 
  items = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="overflow-hidden" {...props}>
      <div className="flex">
        {(items as Array<{image?: string; title?: string}>)?.map((item, i) => (
          <div key={i} className="flex-none w-full">
            <img 
              src={item.image || "/placeholder.svg"} 
              alt={item.title || `Slide ${i + 1}`}
              className="w-full h-64 object-cover"
            />
            {item.title && (
              <p className="text-center py-4 font-medium">{item.title}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountdownRender({ 
  targetDate: _targetDate = new Date(Date.now() + 86400000).toISOString(),
  children: _children, // Exclude children
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  const { id, className } = props;
  return (
    <div 
      className={`flex justify-center gap-4 ${className || ""}`}
      id={id as string | undefined}
    >
      <div className="text-center">
        <div className="text-4xl font-bold">00</div>
        <div className="text-sm text-gray-600">Days</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold">00</div>
        <div className="text-sm text-gray-600">Hours</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold">00</div>
        <div className="text-sm text-gray-600">Minutes</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold">00</div>
        <div className="text-sm text-gray-600">Seconds</div>
      </div>
    </div>
  );
}

export function TypewriterRender({ 
  text = "Typewriter text",
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="font-mono" {...props}>
      {text as string}
      <span className="animate-pulse">|</span>
    </div>
  );
}

export function ParallaxRender({ 
  backgroundImage = "/placeholder.svg",
  children,
  height = 400,
  ...props 
}: Record<string, unknown> & { children?: React.ReactNode }) {
  return (
    <div 
      className="bg-fixed bg-cover bg-center flex items-center justify-center"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        height: `${height}px`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Marketing Components
// ============================================================================

export function AnnouncementBarRender({ 
  text = "Announcement",
  backgroundColor = "#3b82f6",
  ...props 
}: Record<string, unknown>) {
  return (
    <div 
      className="text-white text-center py-2 px-4"
      style={{ backgroundColor: backgroundColor as string }}
      {...props}
    >
      {text as string}
    </div>
  );
}

export function SocialProofRender({ 
  rating = 5,
  reviewCount = 100,
}: Record<string, unknown>) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < (rating as number) ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
      <span className="text-gray-600">({String(reviewCount)} reviews)</span>
    </div>
  );
}

export function TrustBadgesRender({ 
  badges = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="flex items-center justify-center gap-8" {...props}>
      {(badges as Array<{image?: string; alt?: string}>)?.map((badge, i) => (
        <img 
          key={i}
          src={badge.image || "/placeholder-badge.svg"} 
          alt={badge.alt || `Trust badge ${i + 1}`}
          className="h-12 w-auto opacity-70"
        />
      ))}
    </div>
  );
}

export function LogoCloudRender({ 
  logos = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="flex items-center justify-center gap-12 flex-wrap py-8" {...props}>
      {(logos as Array<{image?: string; alt?: string}>)?.map((logo, i) => (
        <img 
          key={i}
          src={logo.image || "/placeholder-logo.svg"} 
          alt={logo.alt || `Logo ${i + 1}`}
          className="h-8 w-auto opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition"
        />
      ))}
    </div>
  );
}

export function ComparisonTableRender({ 
  features = [],
  plans = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="overflow-x-auto" {...props}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-50">Feature</th>
            {(plans as Array<{name?: string}>)?.map((plan, i) => (
              <th key={i} className="border p-2 bg-gray-50">{plan.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(features as Array<{name?: string}>)?.map((feature, i) => (
            <tr key={i}>
              <td className="border p-2">{feature.name}</td>
              {(plans as Array<{features?: boolean[]}>)?.map((plan, j) => (
                <td key={j} className="border p-2 text-center">
                  {plan.features?.[i] ? "✓" : "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// E-Commerce Components
// ============================================================================

export function ProductGridRender({ 
  products = [],
  columns = 3,
  ...props 
}: Record<string, unknown>) {
  return (
    <div 
      className="grid gap-6"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      {...props}
    >
      {(products as Array<{image?: string; name?: string; price?: string}>)?.map((product, i) => (
        <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
          <img 
            src={product.image || "/placeholder-product.svg"} 
            alt={product.name || `Product ${i + 1}`}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-blue-600 font-bold">{product.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductCardRender({ 
  image = "/placeholder-product.svg",
  name = "Product",
  price = "$99",
  description = "",
}: Record<string, unknown>) {
  const hasDescription = Boolean(description);
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <img 
        src={image as string} 
        alt={name as string}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{String(name)}</h3>
        {hasDescription ? <p className="text-gray-600 text-sm mt-1">{String(description)}</p> : null}
        <p className="text-blue-600 font-bold text-xl mt-2">{String(price)}</p>
        <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export function ProductCategoriesRender({ 
  categories = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" {...props}>
      {(categories as Array<{image?: string; name?: string; href?: string}>)?.map((cat, i) => (
        <a 
          key={i}
          href={cat.href || "#"}
          className="relative rounded-lg overflow-hidden group"
        >
          <img 
            src={cat.image || "/placeholder-category.svg"} 
            alt={cat.name || `Category ${i + 1}`}
            className="w-full h-32 object-cover group-hover:scale-105 transition"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold">{cat.name}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function CartSummaryRender({ 
  items = [],
  total = "$0",
  ...props 
}: Record<string, unknown>) {
  return (
    <div className="bg-white rounded-lg shadow p-6" {...props}>
      <h3 className="font-bold text-lg mb-4">Cart Summary</h3>
      <div className="space-y-2 mb-4">
        {(items as Array<{name?: string; price?: string; quantity?: number}>)?.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>{item.name} x{item.quantity || 1}</span>
            <span>{item.price}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-4 flex justify-between font-bold">
        <span>Total</span>
        <span>{total as string}</span>
      </div>
      <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
        Checkout
      </button>
    </div>
  );
}

export function FeaturedProductsRender({ 
  title = "Featured Products",
  products = [],
  ...props 
}: Record<string, unknown>) {
  return (
    <section className="py-16 px-4" {...props}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{title as string}</h2>
        <ProductGridRender products={products} columns={4} />
      </div>
    </section>
  );
}

export function CartIconRender({ 
  count = 0,
  ...props 
}: Record<string, unknown>) {
  return (
    <button className="relative p-2" {...props}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {(count as number) > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {count as number}
        </span>
      )}
    </button>
  );
}
