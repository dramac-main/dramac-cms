"use client";

import Head from "next/head";

interface SEOHeadProps {
  settings: Record<string, unknown>;
}

export default function SEOHead({ settings }: SEOHeadProps) {
  const addSchema = settings.addSchema ?? true;

  // This would normally use metadata from the page
  // For now, it's a placeholder
  return null;
}
