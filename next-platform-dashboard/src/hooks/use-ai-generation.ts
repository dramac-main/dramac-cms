"use client";

import { useState } from "react";
import type { GeneratedWebsite } from "@/lib/ai/generate";

export interface GenerationOptions {
  businessDescription: string;
  industryId?: string;
  tone?: "professional" | "friendly" | "playful" | "luxurious" | "minimal";
  targetAudience?: string;
  sections?: string[];
  colorPreference?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  siteId?: string;
}

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedWebsite | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | undefined>();

  async function generate(options: GenerationOptions) {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResult(data.website);
      setTokensUsed(data.tokensUsed);
      return data.website;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }

  function reset() {
    setIsGenerating(false);
    setError(null);
    setResult(null);
    setTokensUsed(undefined);
  }

  return {
    generate,
    reset,
    isGenerating,
    error,
    result,
    tokensUsed,
  };
}
