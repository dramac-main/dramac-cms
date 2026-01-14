import { cn } from "@/lib/utils";

interface RenderImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  borderRadius?: number;
  className?: string;
}

export function RenderImage({
  src,
  alt,
  width = "100%",
  height = "auto",
  objectFit = "cover",
  borderRadius = 0,
  className,
}: RenderImageProps) {
  // Handle placeholder images
  if (!src || src === "/placeholder.svg") {
    return (
      <div
        className={cn("bg-muted flex items-center justify-center", className)}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: `${borderRadius}px`,
        }}
      >
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        objectFit,
        borderRadius: `${borderRadius}px`,
      }}
    />
  );
}
