import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertFooter(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Footer" },
      props: {
        logoText: section.props.logoText || "DRAMAC",
        tagline: section.props.tagline || "Building the web of tomorrow",
        columns: section.props.columns || [
          {
            title: "Product",
            links: [
              { label: "Features", href: "#" },
              { label: "Pricing", href: "#" },
              { label: "Integrations", href: "#" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Careers", href: "#" },
            ],
          },
          {
            title: "Support",
            links: [
              { label: "Help Center", href: "#" },
              { label: "Contact", href: "#" },
              { label: "Status", href: "#" },
            ],
          },
        ],
        socialLinks: section.props.socialLinks || [
          { platform: "twitter", href: "#" },
          { platform: "facebook", href: "#" },
          { platform: "linkedin", href: "#" },
        ],
        copyright: section.props.copyright || `© ${new Date().getFullYear()} All rights reserved.`,
        backgroundColor: section.props.backgroundColor || "#0f172a",
        textColor: section.props.textColor || "#ffffff",
      },
      displayName: "Footer",
    },
  };
}
