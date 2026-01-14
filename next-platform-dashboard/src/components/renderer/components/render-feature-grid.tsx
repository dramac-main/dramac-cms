import { cn } from "@/lib/utils";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface RenderFeatureGridProps {
  title?: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  backgroundColor?: string;
  className?: string;
}

export function RenderFeatureGrid({
  title,
  subtitle,
  features = [],
  columns = 3,
  backgroundColor = "transparent",
  className,
}: RenderFeatureGridProps) {
  const columnClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section
      className={cn("px-6 py-16", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold mb-4">{title}</h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className={cn("grid gap-8", columnClasses[columns])}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
