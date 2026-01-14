"use client";

import { useState } from "react";

interface RegenerateOptions {
  sectionType: string;
  currentContent: Record<string, unknown>;
  instruction: string;
  businessContext?: string;
}

export function useRegenerateSection() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate(options: RegenerateOptions) {
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Regeneration failed");
      }

      return data.props;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to regenerate";
      setError(message);
      throw err;
    } finally {
      setIsRegenerating(false);
    }
  }

  return { regenerate, isRegenerating, error };
}
