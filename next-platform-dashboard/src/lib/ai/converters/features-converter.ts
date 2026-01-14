import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export function convertFeatures(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  // Ensure features have required fields
  const features = (section.props.features as Feature[] || []).map((f) => ({
    icon: f.icon || "Star",
    title: f.title || "Feature",
    description: f.description || "Feature description",
  }));
  
  // Ensure we have at least 3 features
  while (features.length < 3) {
    features.push({
      icon: "Star",
      title: `Feature ${features.length + 1}`,
      description: "Description of this amazing feature",
    });
  }
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "FeatureGrid" },
      props: {
        title: section.props.title || "Our Features",
        subtitle: section.props.subtitle || "Everything you need to succeed",
        features,
        columns: section.props.columns || 3,
        backgroundColor: section.props.backgroundColor || "#ffffff",
        textColor: section.props.textColor || "",
      },
      displayName: "Feature Grid",
    },
  };
}
