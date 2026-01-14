import { CraftState, AIWebsiteContent, AISection, CraftNode } from "./types";
import { resetIdGenerator } from "./id-generator";
import { convertNavigation } from "./converters/navigation-converter";
import { convertHero } from "./converters/hero-converter";
import { convertFeatures } from "./converters/features-converter";
import { convertTestimonials } from "./converters/testimonials-converter";
import { convertCTA } from "./converters/cta-converter";
import { convertContact } from "./converters/contact-converter";
import { convertNewsletter } from "./converters/newsletter-converter";
import { convertFooter } from "./converters/footer-converter";

type SectionConverter = (section: AISection) => { nodeId: string; node: CraftNode };

const converters: Record<string, SectionConverter> = {
  navigation: convertNavigation,
  hero: convertHero,
  features: convertFeatures,
  testimonials: convertTestimonials,
  cta: convertCTA,
  contact: convertContact,
  newsletter: convertNewsletter,
  footer: convertFooter,
};

export function convertAItocraft(content: AIWebsiteContent): CraftState {
  // Reset ID generator for consistent results
  resetIdGenerator();
  
  const state: CraftState = {
    ROOT: {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: {
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        fillSpace: "yes",
        padding: ["0", "0", "0", "0"],
        margin: ["0", "0", "0", "0"],
        backgroundColor: "#ffffff",
        width: "100%",
        height: "auto",
      },
      displayName: "Page",
      nodes: [],
    },
  };
  
  // Convert each section
  for (const section of content.sections) {
    const sectionType = section.type.toLowerCase();
    const converter = converters[sectionType];
    
    if (converter) {
      const { nodeId, node } = converter(section);
      
      // Add node to state
      state[nodeId] = {
        ...node,
        parent: "ROOT",
      };
      
      // Add node ID to ROOT's children
      state.ROOT.nodes!.push(nodeId);
    } else {
      console.warn(`Unknown section type: ${section.type}`);
    }
  }
  
  return state;
}

// Serialize to JSON string for storage
export function serializeCraftState(state: CraftState): string {
  return JSON.stringify(state);
}

// Parse from JSON string
export function deserializeCraftState(json: string): CraftState {
  return JSON.parse(json);
}

// Convert to Craft.js Editor state format
export function toCraftEditorState(state: CraftState): string {
  // Craft.js expects a slightly different format with type as a reference
  const editorState: Record<string, unknown> = {};
  
  for (const [nodeId, node] of Object.entries(state)) {
    editorState[nodeId] = {
      type: node.type,
      isCanvas: node.isCanvas,
      props: node.props,
      displayName: node.displayName,
      custom: node.custom,
      parent: node.parent,
      nodes: node.nodes || [],
      linkedNodes: node.linkedNodes || {},
    };
  }
  
  return JSON.stringify(editorState);
}
