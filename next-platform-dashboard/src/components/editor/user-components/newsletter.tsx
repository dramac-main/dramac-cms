"use client";

import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import { NewsletterSettings } from "../settings/newsletter-settings";

export interface NewsletterProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  placeholder?: string;
  layout?: "inline" | "stacked";
  backgroundColor?: string;
  textColor?: string;
  useThemeColors?: boolean;
}

export function Newsletter({
  title = "Subscribe to Our Newsletter",
  subtitle = "Get the latest updates delivered to your inbox",
  buttonText = "Subscribe",
  placeholder = "Enter your email",
  layout = "inline",
  backgroundColor = "",
  textColor = "",
  useThemeColors = true,
}: NewsletterProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  // Resolve colors using theme variables
  const resolvedBgColor = backgroundColor || (useThemeColors ? "var(--primary, #8b5cf6)" : "#1a1a2e");
  const resolvedTextColor = textColor || (useThemeColors ? "var(--primary-foreground, #ffffff)" : "#ffffff");

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className="py-12 px-8"
      style={{ backgroundColor: resolvedBgColor, color: resolvedTextColor }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <Mail className="w-10 h-10 mx-auto mb-4 opacity-80" />
        <h3 
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ fontFamily: useThemeColors ? "var(--heading-font-family, inherit)" : "inherit" }}
        >
          {title}
        </h3>
        {subtitle && <p className="text-lg opacity-80 mb-6">{subtitle}</p>}

        <form
          onSubmit={(e) => e.preventDefault()}
          className={cn(
            "flex gap-4",
            layout === "stacked" ? "flex-col max-w-md mx-auto" : "flex-col sm:flex-row justify-center"
          )}
        >
          <input
            type="email"
            placeholder={placeholder}
            className={cn(
              "px-4 py-3 rounded-lg bg-white/10 border border-white/20 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30",
              layout === "inline" && "sm:flex-1 sm:max-w-md"
            )}
            style={{ borderRadius: "var(--radius, 0.5rem)" }}
          />
          <button
            type="submit"
            className="px-6 py-3 font-medium hover:opacity-90 transition-colors whitespace-nowrap"
            style={{ 
              backgroundColor: useThemeColors ? "var(--background, #ffffff)" : "#ffffff",
              color: useThemeColors ? "var(--foreground, #000000)" : "#000000",
              borderRadius: "var(--radius, 0.5rem)",
            }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

Newsletter.craft = {
  displayName: "Newsletter",
  props: {
    title: "Subscribe to Our Newsletter",
    subtitle: "Get the latest updates delivered to your inbox",
    buttonText: "Subscribe",
    placeholder: "Enter your email",
    layout: "inline",
    backgroundColor: "",
    textColor: "",
    useThemeColors: true,
  },
  related: {
    settings: NewsletterSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
