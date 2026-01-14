"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Shield, 
  Sparkles, 
  Layers, 
  Globe, 
  Code,
  LucideIcon,
} from "lucide-react";

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeatureGridProps {
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  features?: FeatureItem[];
  backgroundColor?: string;
  textColor?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Shield,
  Sparkles,
  Layers,
  Globe,
  Code,
};

const defaultFeatures: FeatureItem[] = [
  {
    icon: "Zap",
    title: "Lightning Fast",
    description: "Built for speed with optimized performance",
  },
  {
    icon: "Shield",
    title: "Secure by Default",
    description: "Enterprise-grade security built in",
  },
  {
    icon: "Sparkles",
    title: "AI Powered",
    description: "Intelligent features that learn from you",
  },
  {
    icon: "Layers",
    title: "Modular Design",
    description: "Flexible components that work together",
  },
  {
    icon: "Globe",
    title: "Global CDN",
    description: "Fast delivery worldwide",
  },
  {
    icon: "Code",
    title: "Developer Friendly",
    description: "Clean code and great documentation",
  },
];

export function FeatureGrid({
  title = "Why Choose Us",
  subtitle = "Everything you need to build amazing websites",
  columns = 3,
  features = defaultFeatures,
  backgroundColor = "",
  textColor = "",
}: FeatureGridProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className="py-16 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Grid */}
        <div className={cn("grid gap-8", gridCols[columns])}>
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Zap;

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="opacity-80">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

FeatureGrid.craft = {
  displayName: "Feature Grid",
  props: {
    title: "Why Choose Us",
    subtitle: "Everything you need to build amazing websites",
    columns: 3,
    features: defaultFeatures,
    backgroundColor: "",
    textColor: "",
  },
  related: {
    // toolbar: () => import("../settings/feature-grid-settings").then((m) => m.FeatureGridSettings),
  },
  rules: {
    canDrag: () => true,
  },
};
