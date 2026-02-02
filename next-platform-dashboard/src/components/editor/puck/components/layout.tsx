/**
 * Puck Layout Components
 * 
 * Layout components for structuring page content.
 */

import { DropZone } from "@puckeditor/core";
import type { 
  SectionProps, 
  ContainerProps, 
  ColumnsProps, 
  CardProps, 
  SpacerProps, 
  DividerProps 
} from "@/types/puck";
import { cn } from "@/lib/utils";

// Type for ImageValue from studio
interface ImageValue {
  url: string;
  alt?: string;
}

// Helper to extract URL from string or ImageValue object
function extractImageUrl(src: string | ImageValue | undefined): string {
  if (!src) return "";
  if (typeof src === "string") return src;
  if (typeof src === "object" && "url" in src) return src.url || "";
  return "";
}

// Padding utilities
const paddingMap: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6 md:p-8",
  lg: "p-8 md:p-12",
  xl: "p-12 md:p-16",
};

// Max width utilities
const maxWidthMap: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "max-w-full",
};

// Gap utilities
const gapMap: Record<string, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-8",
};

// Shadow utilities
const shadowMap: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

// Border radius utilities
const radiusMap: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
};

// Margin utilities
const marginMap: Record<string, string> = {
  none: "my-0",
  sm: "my-2",
  md: "my-4",
  lg: "my-8",
};

/**
 * Section Component
 * A full-width section with optional background and content area.
 */
export function SectionRender({
  backgroundColor,
  backgroundImage,
  padding = "md",
  maxWidth = "xl",
  minHeight = 0,
  puck,
}: SectionProps & { puck?: { renderDropZone: typeof DropZone } }) {
  // Extract URL from string or ImageValue object
  const bgImageUrl = extractImageUrl(backgroundImage as string | ImageValue | undefined);
  
  return (
    <section
      className={cn("relative w-full", paddingMap[padding || "md"])}
      style={{
        backgroundColor: backgroundColor || undefined,
        backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: minHeight ? `${minHeight}px` : undefined,
      }}
    >
      <div className={cn("mx-auto", maxWidthMap[maxWidth || "xl"])}>
        <DropZone zone="content" />
      </div>
    </section>
  );
}

/**
 * Container Component
 * A centered container with max-width constraint.
 */
export function ContainerRender({
  maxWidth = "xl",
  padding = "md",
  backgroundColor,
  puck,
}: ContainerProps & { puck?: { renderDropZone: typeof DropZone } }) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthMap[maxWidth || "xl"],
        paddingMap[padding || "md"]
      )}
      style={{
        backgroundColor: backgroundColor || undefined,
      }}
    >
      <DropZone zone="content" />
    </div>
  );
}

/**
 * Columns Component
 * Multi-column layout grid with responsive behavior.
 */
export function ColumnsRender({
  columns = 2,
  gap = "md",
  verticalAlign = "top",
  reverseOnMobile = false,
  puck,
}: ColumnsProps & { puck?: { renderDropZone: typeof DropZone } }) {
  const alignMap: Record<string, string> = {
    top: "items-start",
    center: "items-center",
    bottom: "items-end",
    stretch: "items-stretch",
  };

  const colClasses: Record<number, string> = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid w-full",
        colClasses[columns || 2],
        gapMap[gap || "md"],
        alignMap[verticalAlign || "top"],
        reverseOnMobile && "flex-col-reverse md:flex-row"
      )}
    >
      {Array.from({ length: columns || 2 }).map((_, index) => (
        <div key={index} className="min-h-[50px]">
          <DropZone zone={`column-${index}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * Card Component
 * A card container with styling options.
 */
export function CardRender({
  padding = "md",
  shadow = "sm",
  borderRadius = "md",
  backgroundColor,
  border = true,
  puck,
}: CardProps & { puck?: { renderDropZone: typeof DropZone } }) {
  return (
    <div
      className={cn(
        "w-full",
        paddingMap[padding || "md"],
        shadowMap[shadow || "sm"],
        radiusMap[borderRadius || "md"],
        border && "border border-border"
      )}
      style={{
        backgroundColor: backgroundColor || undefined,
      }}
    >
      <DropZone zone="content" />
    </div>
  );
}

/**
 * Spacer Component
 * Adds vertical spacing between elements.
 */
export function SpacerRender({
  height = 40,
  mobileHeight = 20,
}: SpacerProps) {
  return (
    <div
      className="w-full"
      style={{
        height: `${height}px`,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .spacer-${height}-${mobileHeight} {
            height: ${mobileHeight}px !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Divider Component
 * A horizontal divider line.
 */
export function DividerRender({
  color,
  thickness = 1,
  style = "solid",
  margin = "md",
}: DividerProps) {
  return (
    <hr
      className={cn("w-full border-0", marginMap[margin || "md"])}
      style={{
        borderTopWidth: `${thickness}px`,
        borderTopStyle: style,
        borderTopColor: color || "hsl(var(--border))",
      }}
    />
  );
}
