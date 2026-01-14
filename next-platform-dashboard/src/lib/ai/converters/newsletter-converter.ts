import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertNewsletter(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Newsletter" },
      props: {
        title: section.props.title || "Subscribe to Our Newsletter",
        subtitle: section.props.subtitle || "Stay updated with our latest news",
        buttonText: section.props.buttonText || "Subscribe",
        placeholder: section.props.placeholder || "Enter your email",
        layout: section.props.layout || "inline",
        backgroundColor: section.props.backgroundColor || "#1a1a2e",
        textColor: section.props.textColor || "#ffffff",
      },
      displayName: "Newsletter",
    },
  };
}
