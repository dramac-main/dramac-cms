"use client";

import { useEffect } from "react";
import Script from "next/script";

interface AnalyticsScriptProps {
  settings: Record<string, unknown>;
}

export default function AnalyticsScript({ settings }: AnalyticsScriptProps) {
  const trackClicks = settings.trackClicks ?? true;
  const trackScrollDepth = settings.trackScrollDepth ?? true;
  const excludedPaths = (settings.excludedPaths as string || "").split(",");

  useEffect(() => {
    // Check if current path is excluded
    const path = window.location.pathname;
    if (excludedPaths.some((ep) => path.startsWith(ep.trim()))) {
      return;
    }

    // Track page view
    console.log("[Analytics] Page view:", path);

    // Click tracking
    if (trackClicks) {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        console.log("[Analytics] Click:", target.tagName, target.textContent?.slice(0, 50));
      };
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [trackClicks, excludedPaths]);

  useEffect(() => {
    if (!trackScrollDepth) return;

    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) {
          console.log("[Analytics] Scroll depth:", maxScroll + "%");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [trackScrollDepth]);

  return null;
}
