/**
 * Blog Share as Email Button
 *
 * Phase MKT-07: "Share as Email" button for blog post editor/detail.
 * One-click converts a blog post into a draft email campaign.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { convertBlogToEmail } from "../../actions/blog-marketing-actions";

interface BlogShareAsEmailButtonProps {
  blogPostId: string;
  siteId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function BlogShareAsEmailButton({
  blogPostId,
  siteId,
  variant = "outline",
  size = "sm",
}: BlogShareAsEmailButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleClick = async () => {
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const campaign = await convertBlogToEmail(blogPostId, siteId);

      setStatus("success");

      // Navigate to the new campaign after a short delay
      setTimeout(() => {
        router.push(
          `/dashboard/sites/${siteId}/marketing/campaigns/${campaign.id}`,
        );
      }, 1000);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create email campaign",
      );
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={status === "loading" || status === "success"}
        className="gap-2"
      >
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === "success" && (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        )}
        {status === "idle" && <Mail className="h-4 w-4" />}
        {status === "error" && <Mail className="h-4 w-4" />}
        {status === "success" ? "Campaign Created!" : "Share as Email"}
      </Button>
      {status === "error" && errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
