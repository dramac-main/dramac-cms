import { createElement, ReactNode } from "react";
import { RenderContainer } from "./components/render-container";
import { RenderText } from "./components/render-text";
import { RenderButton } from "./components/render-button";
import { RenderImage } from "./components/render-image";
import { RenderHero } from "./components/render-hero";
import { RenderFeatureGrid } from "./components/render-feature-grid";
import { RenderTestimonials } from "./components/render-testimonials";
import { RenderCTA } from "./components/render-cta";
import { RenderContactForm } from "./components/render-contact-form";
import { RenderNavigation } from "./components/render-navigation";
import { RenderFooter } from "./components/render-footer";

// Map of component types to render functions
const componentMap: Record<string, React.FC<any>> = {
  Container: RenderContainer,
  Text: RenderText,
  Button: RenderButton,
  Image: RenderImage,
  Hero: RenderHero,
  FeatureGrid: RenderFeatureGrid,
  Testimonials: RenderTestimonials,
  CTA: RenderCTA,
  ContactForm: RenderContactForm,
  Navigation: RenderNavigation,
  Footer: RenderFooter,
};

interface CraftNode {
  type: { resolvedName: string } | string;
  props: Record<string, any>;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
}

interface NodeRendererProps {
  node: CraftNode;
  nodes: Record<string, CraftNode>;
  resolveNode: (nodeId: string) => ReactNode;
}

export function NodeRenderer({ node, nodes, resolveNode }: NodeRendererProps) {
  // Get component name
  const componentName = typeof node.type === "string"
    ? node.type
    : node.type.resolvedName;

  // Skip ROOT nodes
  if (componentName === "ROOT" || componentName === "Canvas") {
    // Render children
    const childIds = node.nodes || [];
    return (
      <>
        {childIds.map((childId) => resolveNode(childId))}
      </>
    );
  }

  // Get render component
  const Component = componentMap[componentName];
  
  if (!Component) {
    console.warn(`Unknown component: ${componentName}`);
    return null;
  }

  // Get children
  const childIds = node.nodes || [];
  const children = childIds.map((childId) => resolveNode(childId));

  // Get linked nodes (for slots)
  const linkedContent: Record<string, ReactNode> = {};
  if (node.linkedNodes) {
    Object.entries(node.linkedNodes).forEach(([slot, nodeId]) => {
      linkedContent[slot] = resolveNode(nodeId);
    });
  }

  return (
    <Component
      {...node.props}
      linkedContent={linkedContent}
    >
      {children}
    </Component>
  );
}

// Main render function
export function renderCraftJSON(json: any): ReactNode {
  if (!json || !json.ROOT) {
    return null;
  }

  const nodes = json;

  function resolveNode(nodeId: string): ReactNode {
    const node = nodes[nodeId];
    if (!node) return null;

    return (
      <NodeRenderer
        key={nodeId}
        node={node}
        nodes={nodes}
        resolveNode={resolveNode}
      />
    );
  }

  return resolveNode("ROOT");
}
