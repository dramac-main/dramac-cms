import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertCTA(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "CTASection" },
      props: {
        title: section.props.title || "Ready to Get Started?",
        subtitle: section.props.subtitle || "Join thousands of satisfied customers today",
        primaryButtonText: section.props.primaryButtonText || "Start Free Trial",
        primaryButtonHref: section.props.primaryButtonHref || "#",
        secondaryButtonText: section.props.secondaryButtonText || "Contact Sales",
        secondaryButtonHref: section.props.secondaryButtonHref || "#",
        showSecondaryButton: !!section.props.secondaryButtonText,
        backgroundColor: section.props.backgroundColor || "#0f172a",
        textColor: section.props.textColor || "#ffffff",
        layout: section.props.layout || "centered",
      },
      displayName: "CTA Section",
    },
  };
}
