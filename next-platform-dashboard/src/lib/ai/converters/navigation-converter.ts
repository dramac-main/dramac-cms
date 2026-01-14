import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertNavigation(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Navigation" },
      props: {
        logoText: section.props.logoText || "Logo",
        logo: section.props.logo || "",
        links: section.props.links || [
          { label: "Home", href: "#" },
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Contact", href: "#contact" },
        ],
        ctaText: section.props.ctaText || "Get Started",
        ctaHref: section.props.ctaHref || "#",
        backgroundColor: section.props.backgroundColor || "#ffffff",
        textColor: section.props.textColor || "",
        sticky: section.props.sticky || false,
      },
      displayName: "Navigation",
    },
  };
}
