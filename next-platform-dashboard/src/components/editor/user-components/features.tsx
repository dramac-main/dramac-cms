"use client";

import { useNode } from "@craftjs/core";
import { FeaturesSettings } from "../settings/features-settings";

// Brand colors from design system
const DEFAULT_PRIMARY = "#8b5cf6";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  columns?: 2 | 3 | 4;
  backgroundColor?: string;
  iconColor?: string;
  useThemeColors?: boolean;
}

const defaultFeatures: Feature[] = [
  { icon: "⚡", title: "Fast Performance", description: "Lightning-fast load times for your website" },
  { icon: "🎨", title: "Beautiful Design", description: "Modern and customizable design options" },
  { icon: "🔧", title: "Easy to Use", description: "Intuitive drag-and-drop interface" },
];

export function Features({
  title = "Our Features",
  subtitle = "Everything you need to build amazing websites",
  features = defaultFeatures,
  columns = 3,
  backgroundColor = "#f9fafb",
  iconColor = "",
  useThemeColors = true,
}: FeaturesProps) {
  const { connectors: { connect, drag } } = useNode();

  // Resolve icon color using theme variable
  const resolvedIconColor = iconColor || (useThemeColors ? `var(--primary, ${DEFAULT_PRIMARY})` : DEFAULT_PRIMARY);

  // Generate responsive grid template based on columns
  const getGridStyle = () => {
    const minWidth = columns >= 3 ? "280px" : "300px";
    return {
      display: "grid",
      gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
      gap: "2rem",
    };
  };

  return (
    <>
      <style>{`
        .features-title {
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: bold;
          margin-bottom: 1rem;
          font-family: var(--heading-font-family, inherit);
        }
        .features-subtitle {
          font-size: clamp(1rem, 2vw, 1.125rem);
          color: var(--muted-foreground, #6b7280);
        }
        .feature-card {
          text-align: center;
          padding: 1.5rem;
        }
        .feature-icon {
          font-size: clamp(2rem, 4vw, 2.5rem);
          margin-bottom: 1rem;
        }
        .feature-title {
          font-size: clamp(1rem, 2vw, 1.25rem);
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-family: var(--heading-font-family, inherit);
        }
        .feature-description {
          color: var(--muted-foreground, #6b7280);
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          line-height: 1.6;
        }
        @media (max-width: 640px) {
          .features-section {
            padding: 2.5rem 1rem !important;
          }
        }
      `}</style>
      <section
        className="features-section"
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        style={{
          backgroundColor,
          padding: "4rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2 className="features-title">
              {title}
            </h2>
            <p className="features-subtitle">
              {subtitle}
            </p>
          </div>
          <div style={getGridStyle()}>
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon" style={{ color: resolvedIconColor }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">
                  {feature.title}
                </h3>
                <p className="feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

Features.craft = {
  displayName: "Features",
  props: {
    title: "Our Features",
    subtitle: "Everything you need to build amazing websites",
    features: defaultFeatures,
    columns: 3,
    backgroundColor: "#f9fafb",
    iconColor: "",
    useThemeColors: true,
  },
  related: {
    settings: FeaturesSettings,
  },
};
