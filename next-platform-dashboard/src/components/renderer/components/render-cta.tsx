import { cn } from "@/lib/utils";

interface RenderCTAProps {
  title: string;
  description: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
}

export function RenderCTA({
  title,
  description,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  backgroundColor = "#3b82f6",
  textColor = "#ffffff",
  className,
}: RenderCTAProps) {
  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-xl opacity-90 mb-8">{description}</p>

        <div className="flex flex-wrap gap-4 justify-center">
          {primaryButtonText && (
            <a
              href={primaryButtonHref || "#"}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {primaryButtonText}
            </a>
          )}
          {secondaryButtonText && (
            <a
              href={secondaryButtonHref || "#"}
              className="inline-flex items-center justify-center px-6 py-3 border border-white/50 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              {secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
