import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertNavigation(section: AISection): {
  nodeId: string;
  node: CraftNode;
} {
  const nodeId = generateNodeId();

  // Determine responsive defaults based on number of links
  const links = section.props.links || [
    { label: "Home", href: "#" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];
  const linkCount = Array.isArray(links) ? links.length : 4;
  const defaultSpacing = linkCount > 5 ? "compact" : "normal";
  const defaultFontSize = linkCount > 5 ? "sm" : "md";

  return {
    nodeId,
    node: {
      type: { resolvedName: "Navigation" },
      props: {
        logoText: section.props.logoText || "Logo",
        logo: section.props.logo || "",
        links,
        linkSpacing: section.props.linkSpacing || defaultSpacing,
        linkFontSize: section.props.linkFontSize || defaultFontSize,
        ctaText: section.props.ctaText || "Get Started",
        ctaHref: section.props.ctaHref || "#",
        ctaSize: section.props.ctaSize || (linkCount > 5 ? "sm" : "md"),
        backgroundColor: section.props.backgroundColor || "#ffffff",
        textColor: section.props.textColor || "",
        sticky: section.props.sticky || false,
        hideOnScroll: section.props.hideOnScroll ?? true,
        showOnScrollUp: section.props.showOnScrollUp ?? true,
      },
      displayName: "Navigation",
    },
  };
}
