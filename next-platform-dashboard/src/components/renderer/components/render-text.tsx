import { cn } from "@/lib/utils";

interface RenderTextProps {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: "left" | "center" | "right";
  tagName?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
  className?: string;
}

export function RenderText({
  text,
  fontSize = 16,
  fontWeight = "normal",
  color = "inherit",
  textAlign = "left",
  tagName = "p",
  className,
}: RenderTextProps) {
  const Tag = tagName;

  const alignMap = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <Tag
      className={cn(alignMap[textAlign], className)}
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
      }}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}
