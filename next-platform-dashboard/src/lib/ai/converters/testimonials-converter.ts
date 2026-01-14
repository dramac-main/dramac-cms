import { CraftNode, AISection } from "../types";
import { generateNodeId } from "../id-generator";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export function convertTestimonials(section: AISection): { nodeId: string; node: CraftNode } {
  const nodeId = generateNodeId();
  
  // Ensure testimonials have required fields
  const testimonials = (section.props.testimonials as Testimonial[] || []).map((t, index) => ({
    quote: t.quote || "This is an amazing product!",
    author: t.author || `Customer ${index + 1}`,
    role: t.role || "Happy Customer",
    avatar: t.avatar || `https://picsum.photos/seed/${index}/100/100`,
  }));
  
  // Ensure we have at least 3 testimonials
  while (testimonials.length < 3) {
    const index = testimonials.length;
    testimonials.push({
      quote: "This product exceeded all my expectations. Highly recommended!",
      author: `Customer ${index + 1}`,
      role: "Satisfied Client",
      avatar: `https://picsum.photos/seed/testimonial${index}/100/100`,
    });
  }
  
  return {
    nodeId,
    node: {
      type: { resolvedName: "Testimonials" },
      props: {
        title: section.props.title || "What Our Customers Say",
        testimonials,
        backgroundColor: section.props.backgroundColor || "#f8fafc",
        textColor: section.props.textColor || "",
      },
      displayName: "Testimonials",
    },
  };
}
