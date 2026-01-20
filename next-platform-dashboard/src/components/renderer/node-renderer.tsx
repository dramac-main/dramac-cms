import { ReactNode } from "react";
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
import { RenderGallery } from "./components/render-gallery";
import { RenderFAQ } from "./components/render-faq";
import { RenderTeam } from "./components/render-team";
import { RenderStats } from "./components/render-stats";
import { RenderNewsletter } from "./components/render-newsletter";
import { RenderSocialLinks } from "./components/render-social-links";

// Passthrough component for wrapping components (Root, Section, Columns, Column)
function PassthroughContainer({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) {
  const style: React.CSSProperties = {};
  
  if (props.backgroundColor) style.backgroundColor = props.backgroundColor as string;
  if (props.paddingTop) style.paddingTop = `${props.paddingTop}px`;
  if (props.paddingBottom) style.paddingBottom = `${props.paddingBottom}px`;
  if (props.paddingLeft) style.paddingLeft = `${props.paddingLeft}px`;
  if (props.paddingRight) style.paddingRight = `${props.paddingRight}px`;
  if (props.minHeight) style.minHeight = `${props.minHeight}px`;
  if (props.maxWidth && props.maxWidth !== 'full') {
    const maxWidthMap: Record<string, string> = {
      '7xl': '80rem',
      '6xl': '72rem',
      '5xl': '64rem',
      '4xl': '56rem',
      '3xl': '48rem',
      '2xl': '42rem',
      'xl': '36rem',
    };
    style.maxWidth = maxWidthMap[props.maxWidth as string] || '100%';
    style.marginLeft = 'auto';
    style.marginRight = 'auto';
  }
  
  return <div style={style}>{children}</div>;
}

// Map of component types to render functions
const componentMap: Record<string, React.FC<any>> = {
  Container: RenderContainer,
  Text: RenderText,
  Button: RenderButton,
  ButtonComponent: RenderButton,
  ButtonNew: RenderButton,
  Image: RenderImage,
  ImageComponent: RenderImage,
  ImageNew: RenderImage,
  Hero: RenderHero,
  HeroSection: RenderHero,
  FeatureGrid: RenderFeatureGrid,
  Features: RenderFeatureGrid,
  Testimonials: RenderTestimonials,
  CTA: RenderCTA,
  CTASection: RenderCTA,
  ContactForm: RenderContactForm,
  Navigation: RenderNavigation,
  Navbar: RenderNavigation,
  Footer: RenderFooter,
  Gallery: RenderGallery,
  FAQ: RenderFAQ,
  Team: RenderTeam,
  Stats: RenderStats,
  // Passthrough components
  Root: PassthroughContainer,
  Section: PassthroughContainer,
  Columns: PassthroughContainer,
  Column: PassthroughContainer,
  Heading: RenderText,
  Divider: ({ color = '#e5e7eb', height = 1 }: { color?: string; height?: number }) => (
    <hr style={{ borderColor: color, borderWidth: `${height}px`, margin: '1rem 0' }} />
  ),
  Spacer: ({ height = 32 }: { height?: number }) => (
    <div style={{ height: `${height}px` }} />
  ),
  Card: PassthroughContainer,
  Video: ({ url, autoPlay = false }: { url?: string; autoPlay?: boolean }) => (
    url ? (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={url}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    ) : null
  ),
  Map: ({ address, zoom = 14 }: { address?: string; zoom?: number }) => (
    address ? (
      <div style={{ width: '100%', height: '300px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Map: {address}</span>
      </div>
    ) : null
  ),
  MapEmbed: ({ address, zoom = 14 }: { address?: string; zoom?: number }) => (
    address ? (
      <div style={{ width: '100%', height: '300px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Map: {address}</span>
      </div>
    ) : null
  ),
  SocialLinks: RenderSocialLinks,
  Form: PassthroughContainer,
  FormField: () => <input type="text" style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }} />,
  Newsletter: RenderNewsletter,
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
    console.warn(`[NodeRenderer] Unknown component: ${componentName}`);
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
    if (!node) {
      return null;
    }

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
