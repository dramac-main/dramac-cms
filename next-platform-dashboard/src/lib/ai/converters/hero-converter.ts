import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertHero(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "HeroSection" },
      props: {
        title: section.props.title || "Welcome to Our Site",
        subtitle: section.props.subtitle || "The best solution for your needs",
        primaryButtonText: section.props.primaryButtonText || "Get Started",
        primaryButtonHref: section.props.primaryButtonHref || "#",
        secondaryButtonText: section.props.secondaryButtonText || "Learn More",
        secondaryButtonHref: section.props.secondaryButtonHref || "#",
        showSecondaryButton: !!section.props.secondaryButtonText,
        backgroundImage: section.props.backgroundImage || "",
        backgroundColor: section.props.backgroundColor || "#0f172a",
        textColor: section.props.textColor || "#ffffff",
        layout: section.props.layout || "centered",
        overlayOpacity: section.props.overlayOpacity ?? 50,
      },
      displayName: "Hero Section",
    },
  };
}
