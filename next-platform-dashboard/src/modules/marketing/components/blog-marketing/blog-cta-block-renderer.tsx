/**
 * Blog CTA Block Component
 *
 * Phase MKT-07: Renders marketing CTA blocks within blog posts.
 * Supports 4 visual styles: banner, card, inline, sidebar.
 */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { BlogCTABlock } from "../../types/blog-marketing-types";

interface BlogCTABlockRendererProps {
  block: BlogCTABlock;
  className?: string;
}

export function BlogCTABlockRenderer({
  block,
  className,
}: BlogCTABlockRendererProps) {
  const handleClick = () => {
    if (block.buttonUrl) {
      window.open(block.buttonUrl, "_blank", "noopener,noreferrer");
    }
  };

  switch (block.style) {
    case "banner":
      return (
        <div
          className={cn(
            "relative overflow-hidden rounded-lg px-6 py-8 text-center",
            className,
          )}
          style={{
            backgroundColor: block.backgroundColor || "hsl(var(--primary))",
            color: block.backgroundColor
              ? undefined
              : "hsl(var(--primary-foreground))",
          }}
        >
          {block.imageUrl && (
            <img
              src={block.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
          )}
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">{block.heading}</h3>
            <p className="text-sm opacity-90 mb-4 max-w-lg mx-auto">
              {block.body}
            </p>
            <Button variant="secondary" onClick={handleClick} className="gap-2">
              {block.buttonText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

    case "card":
      return (
        <Card
          className={cn("overflow-hidden", className)}
          style={
            block.backgroundColor
              ? { backgroundColor: block.backgroundColor }
              : undefined
          }
        >
          <CardContent className="flex items-center gap-5 p-5">
            {block.imageUrl && (
              <img
                src={block.imageUrl}
                alt=""
                className="h-20 w-20 rounded-md object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-1">{block.heading}</h3>
              <p className="text-sm text-muted-foreground mb-3">{block.body}</p>
              <Button size="sm" onClick={handleClick} className="gap-2">
                {block.buttonText}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );

    case "inline":
      return (
        <div
          className={cn(
            "flex items-center gap-4 rounded-md border px-4 py-3",
            className,
          )}
          style={
            block.backgroundColor
              ? { backgroundColor: block.backgroundColor }
              : undefined
          }
        >
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{block.heading}</span>
            {block.body && (
              <span className="text-sm text-muted-foreground ml-2">
                {block.body}
              </span>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={handleClick}>
            {block.buttonText}
          </Button>
        </div>
      );

    case "sidebar":
      return (
        <Card
          className={cn("p-4", className)}
          style={
            block.backgroundColor
              ? { backgroundColor: block.backgroundColor }
              : undefined
          }
        >
          {block.imageUrl && (
            <img
              src={block.imageUrl}
              alt=""
              className="w-full h-32 rounded-md object-cover mb-3"
            />
          )}
          <h4 className="font-semibold text-sm mb-1">{block.heading}</h4>
          <p className="text-xs text-muted-foreground mb-3">{block.body}</p>
          <Button size="sm" className="w-full gap-2" onClick={handleClick}>
            {block.buttonText}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Card>
      );

    default:
      return null;
  }
}
