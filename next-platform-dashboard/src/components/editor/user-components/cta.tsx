"use client";

import { useNode } from "@craftjs/core";
import { CTASettings } from "../settings/cta-settings";

// Brand colors from design system
const DEFAULT_PRIMARY = "#8b5cf6";

interface CTAProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  useThemeColors?: boolean;
}

export function CTA({
  title = "Ready to Get Started?",
  subtitle = "Join thousands of satisfied customers today",
  buttonText = "Start Free Trial",
  buttonLink: _buttonLink = "#",
  backgroundColor = "",
  textColor = "#ffffff",
  buttonBackgroundColor = "#ffffff",
  buttonTextColor = "",
  useThemeColors = true,
}: CTAProps) {
  const { connectors: { connect, drag } } = useNode();

  // Resolve colors using theme variables with fallbacks
  const resolvedBgColor = backgroundColor || (useThemeColors ? `var(--primary, ${DEFAULT_PRIMARY})` : DEFAULT_PRIMARY);
  const resolvedBtnTextColor = buttonTextColor || (useThemeColors ? `var(--primary, ${DEFAULT_PRIMARY})` : DEFAULT_PRIMARY);

  return (
    <>
      <style>{`
        .cta-section {
          text-align: center;
          padding: 4rem 1.5rem;
        }
        .cta-title {
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: bold;
          margin-bottom: 1rem;
          font-family: var(--heading-font-family, inherit);
        }
        .cta-subtitle {
          font-size: clamp(1rem, 2vw, 1.125rem);
          opacity: 0.9;
          margin-bottom: 2rem;
        }
        .cta-button {
          display: inline-block;
          padding: 1rem 2.5rem;
          border-radius: var(--radius, 0.5rem);
          font-weight: 600;
          font-size: clamp(0.875rem, 2vw, 1.125rem);
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        @media (max-width: 640px) {
          .cta-section {
            padding: 2.5rem 1rem;
          }
        }
      `}</style>
      <section
        className="cta-section"
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        style={{
          backgroundColor: resolvedBgColor,
          color: textColor,
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
          <h2 className="cta-title">
            {title}
          </h2>
          <p className="cta-subtitle">
            {subtitle}
          </p>
          {buttonText && (
            <button
              className="cta-button"
              style={{
                backgroundColor: buttonBackgroundColor,
                color: resolvedBtnTextColor,
              }}
            >
              {buttonText}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

CTA.craft = {
  displayName: "CTA",
  props: {
    title: "Ready to Get Started?",
    subtitle: "Join thousands of satisfied customers today",
    buttonText: "Start Free Trial",
    buttonLink: "#",
    backgroundColor: "",
    textColor: "#ffffff",
    buttonBackgroundColor: "#ffffff",
    buttonTextColor: "",
    useThemeColors: true,
  },
  related: {
    settings: CTASettings,
  },
};
