import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RenderHeroProps {
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  height?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  className?: string;
  children?: ReactNode;
}

export function RenderHero({
  title,
  subtitle,
  backgroundImage,
  backgroundColor = "#f8fafc",
  textColor = "inherit",
  alignment = "center",
  height = "500px",
  overlay = false,
  overlayOpacity = 50,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  className,
}: RenderHeroProps) {
  const alignMap = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  };

  return (
    <section
      className={cn(
        "relative flex flex-col justify-center px-6 py-20",
        alignMap[alignment],
        className
      )}
      style={{
        minHeight: height,
        backgroundColor: backgroundImage ? undefined : backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: textColor,
      }}
    >
      {overlay && backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity / 100 }}
        />
      )}

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {title}
        </h1>
        <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl">
          {subtitle}
        </p>

        {(primaryButtonText || secondaryButtonText) && (
          <div className="flex flex-wrap gap-4 justify-center">
            {primaryButtonText && (
              <a
                href={primaryButtonHref || "#"}
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {primaryButtonText}
              </a>
            )}
            {secondaryButtonText && (
              <a
                href={secondaryButtonHref || "#"}
                className="inline-flex items-center justify-center px-6 py-3 border border-current rounded-lg font-medium hover:bg-white/10 transition-colors"
              >
                {secondaryButtonText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
