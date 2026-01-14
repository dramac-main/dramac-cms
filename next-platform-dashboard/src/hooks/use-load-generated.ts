"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useLoadGenerated(siteId: string, pageId: string | null) {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const isGenerated = searchParams.get("generated") === "true";

  useEffect(() => {
    if (!isGenerated || !pageId) return;

    async function loadContent() {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("page_content")
          .select("content")
          .eq("page_id", pageId as string)
          .order("version", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setContent(data?.content ? JSON.stringify(data.content) : null);
      } catch (error) {
        console.error("Failed to load generated content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, [isGenerated, pageId]);

  return { content, isLoading, isGenerated };
}
