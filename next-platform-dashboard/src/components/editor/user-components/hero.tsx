"use client";

import { useNode } from "@craftjs/core";
import { HeroSettings } from "../settings/hero-settings";

interface HeroProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  minHeight?: number;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function Hero({
  title = "Welcome to Our Website",
  subtitle = "Build amazing experiences with our visual editor",
  buttonText = "Get Started",
  buttonLink: _buttonLink = "#",
  backgroundColor = "#1a1a2e",
  backgroundImage = "",
  textColor = "#ffffff",
  alignment = "center",
  minHeight = 500,
  overlay = true,
  overlayOpacity = 50,
}: HeroProps) {
  const { connectors: { connect, drag } } = useNode();

  const alignmentStyles = {
    left: { textAlign: "left" as const, alignItems: "flex-start" },
    center: { textAlign: "center" as const, alignItems: "center" },
    right: { textAlign: "right" as const, alignItems: "flex-end" },
  };

  return (
    <>
      <style>{`
        .hero-title {
          font-size: clamp(1.75rem, 5vw, 3rem);
          font-weight: bold;
          margin-bottom: 1rem;
          line-height: 1.2;
        }
        .hero-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          opacity: 0.9;
          margin-bottom: 2rem;
        }
        .hero-button {
          display: inline-block;
          padding: 0.75rem 2rem;
          background-color: #ffffff;
          color: #1a1a2e;
          border-radius: 0.5rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-size: clamp(0.875rem, 2vw, 1rem);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hero-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        @media (max-width: 640px) {
          .hero-section {
            padding: 2rem 1rem !important;
          }
        }
      `}</style>
      <section
        className="hero-section"
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: alignmentStyles[alignment].alignItems,
          textAlign: alignmentStyles[alignment].textAlign,
          minHeight: `${minHeight}px`,
          backgroundColor: backgroundImage ? "transparent" : backgroundColor,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: textColor,
          padding: "3rem 1.5rem",
        }}
      >
        {overlay && backgroundImage && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "black",
              opacity: overlayOpacity / 100,
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 10, maxWidth: "800px", width: "100%", padding: "0 1rem" }}>
          <h1 className="hero-title">
            {title}
          </h1>
          <p className="hero-subtitle">
            {subtitle}
          </p>
          {buttonText && (
            <button className="hero-button">
              {buttonText}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

Hero.craft = {
  displayName: "Hero",
  props: {
    title: "Welcome to Our Website",
    subtitle: "Build amazing experiences with our visual editor",
    buttonText: "Get Started",
    buttonLink: "#",
    backgroundColor: "#1a1a2e",
    backgroundImage: "",
    textColor: "#ffffff",
    alignment: "center",
    minHeight: 500,
    overlay: true,
    overlayOpacity: 50,
  },
  related: {
    settings: HeroSettings,
  },
};
