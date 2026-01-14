"use client";

import { useNode } from "@craftjs/core";

export interface CTASectionProps {
  title?: string;
  subtitle?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  backgroundColor?: string;
  textColor?: string;
  layout?: "centered" | "split";
}

export function CTASection({
  title = "Ready to Get Started?",
  subtitle = "Join thousands of satisfied customers building amazing websites.",
  primaryButtonText = "Start Free Trial",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  primaryButtonHref = "#",
  secondaryButtonText = "Learn More",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  secondaryButtonHref = "#",
  backgroundColor = "#4f46e5",
  textColor = "#ffffff",
  layout = "centered",
}: CTASectionProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  if (layout === "split") {
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
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            <p className="text-lg opacity-90">{subtitle}</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors">
              {primaryButtonText}
            </button>
            {secondaryButtonText && (
              <button className="px-6 py-3 border border-white/30 font-medium rounded-lg hover:bg-white/10 transition-colors">
                {secondaryButtonText}
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

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
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-lg opacity-90 mb-8">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors">
            {primaryButtonText}
          </button>
          {secondaryButtonText && (
            <button className="px-6 py-3 border border-white/30 font-medium rounded-lg hover:bg-white/10 transition-colors">
              {secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

CTASection.craft = {
  displayName: "CTA Section",
  props: {
    title: "Ready to Get Started?",
    subtitle: "Join thousands of satisfied customers building amazing websites.",
    primaryButtonText: "Start Free Trial",
    primaryButtonHref: "#",
    secondaryButtonText: "Learn More",
    secondaryButtonHref: "#",
    backgroundColor: "#4f46e5",
    textColor: "#ffffff",
    layout: "centered",
  },
  related: {
    // toolbar: () => import("../settings/cta-settings").then((m) => m.CTASettings),
  },
  rules: {
    canDrag: () => true,
  },
};
