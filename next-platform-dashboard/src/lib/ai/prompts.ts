import { IndustryTemplate } from "./templates";

export interface GenerationContext {
  businessDescription: string;
  industry?: IndustryTemplate;
  tone?: "professional" | "friendly" | "playful" | "luxurious" | "minimal";
  targetAudience?: string;
  sections?: string[];
  colorPreference?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export function buildSystemPrompt(): string {
  return `You are an expert website designer and developer. Your task is to generate website content and structure based on user descriptions.

IMPORTANT RULES:
1. Generate valid JSON that matches the exact schema provided
2. Create compelling, professional copy for all text content
3. Use placeholder image URLs from picsum.photos with appropriate dimensions
4. Ensure color schemes are accessible and visually cohesive
5. Keep text concise but impactful - avoid generic filler content
6. Generate realistic business information (names, descriptions, etc.)

OUTPUT FORMAT:
Return ONLY valid JSON - no markdown, no explanations, no code blocks.
The JSON must match the WebsiteSchema exactly.`;
}

export function buildUserPrompt(context: GenerationContext): string {
  const parts: string[] = [];
  
  parts.push(`Create a website for the following business:`);
  parts.push(`Description: ${context.businessDescription}`);
  
  if (context.industry) {
    parts.push(`Industry: ${context.industry.name}`);
    parts.push(`Suggested sections: ${context.industry.suggestedSections.join(", ")}`);
  }
  
  if (context.tone) {
    parts.push(`Tone: ${context.tone}`);
  }
  
  if (context.targetAudience) {
    parts.push(`Target Audience: ${context.targetAudience}`);
  }
  
  if (context.sections?.length) {
    parts.push(`Required sections: ${context.sections.join(", ")}`);
  }
  
  if (context.colorPreference) {
    parts.push(`Color preferences: ${JSON.stringify(context.colorPreference)}`);
  }
  
  parts.push(`
Generate a complete website structure with the following JSON schema:

{
  "metadata": {
    "title": "string - SEO title",
    "description": "string - SEO description",
    "colors": {
      "primary": "string - hex color",
      "secondary": "string - hex color",
      "accent": "string - hex color"
    }
  },
  "sections": [
    {
      "type": "navigation" | "hero" | "features" | "testimonials" | "cta" | "contact" | "newsletter" | "footer",
      "props": { ... section-specific properties }
    }
  ]
}

Section types and their props:

NAVIGATION:
{
  "type": "navigation",
  "props": {
    "logoText": "string",
    "links": [{ "label": "string", "href": "string" }],
    "ctaText": "string",
    "ctaHref": "string"
  }
}

HERO:
{
  "type": "hero",
  "props": {
    "title": "string",
    "subtitle": "string",
    "primaryButtonText": "string",
    "secondaryButtonText": "string",
    "backgroundImage": "string - URL",
    "layout": "centered" | "left"
  }
}

FEATURES:
{
  "type": "features",
  "props": {
    "title": "string",
    "subtitle": "string",
    "features": [
      {
        "icon": "string - lucide icon name",
        "title": "string",
        "description": "string"
      }
    ]
  }
}

TESTIMONIALS:
{
  "type": "testimonials",
  "props": {
    "title": "string",
    "testimonials": [
      {
        "quote": "string",
        "author": "string",
        "role": "string",
        "avatar": "string - URL"
      }
    ]
  }
}

CTA:
{
  "type": "cta",
  "props": {
    "title": "string",
    "subtitle": "string",
    "primaryButtonText": "string",
    "secondaryButtonText": "string"
  }
}

CONTACT:
{
  "type": "contact",
  "props": {
    "title": "string",
    "subtitle": "string",
    "showName": true,
    "showPhone": false,
    "showSubject": true,
    "buttonText": "string"
  }
}

NEWSLETTER:
{
  "type": "newsletter",
  "props": {
    "title": "string",
    "subtitle": "string",
    "buttonText": "string",
    "placeholder": "string"
  }
}

FOOTER:
{
  "type": "footer",
  "props": {
    "logoText": "string",
    "tagline": "string",
    "columns": [
      {
        "title": "string",
        "links": [{ "label": "string", "href": "string" }]
      }
    ],
    "copyright": "string"
  }
}

Return ONLY the JSON object, nothing else.`);
  
  return parts.join("\n\n");
}
