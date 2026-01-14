import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

export function convertContact(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "ContactForm" },
      props: {
        title: section.props.title || "Get in Touch",
        subtitle: section.props.subtitle || "We'd love to hear from you",
        buttonText: section.props.buttonText || "Send Message",
        showName: section.props.showName ?? true,
        showPhone: section.props.showPhone ?? false,
        showSubject: section.props.showSubject ?? true,
        backgroundColor: section.props.backgroundColor || "#ffffff",
        formBackgroundColor: section.props.formBackgroundColor || "#f8fafc",
      },
      displayName: "Contact Form",
    },
  };
}
