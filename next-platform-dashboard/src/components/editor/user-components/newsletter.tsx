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
}

export function Newsletter({
  title = "Subscribe to Our Newsletter",
  subtitle = "Get the latest updates delivered to your inbox",
  buttonText = "Subscribe",
  placeholder = "Enter your email",
  layout = "inline",
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
}: NewsletterProps) {
  const {
    connectors: { connect, drag },
  } = useNode();

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className="py-12 px-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <Mail className="w-10 h-10 mx-auto mb-4 opacity-80" />
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
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
          />
          <button
            type="submit"
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
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
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
  related: {
    settings: NewsletterSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
