/**
 * AI Page Generation API Route
 * 
 * Generates complete page structures from natural language descriptions.
 * Phase STUDIO-12: AI Page Generator
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPageGenerationPrompt, buildUserPrompt } from "@/lib/studio/ai/page-prompts";
import { getComponentsForAI } from "@/lib/studio/registry/component-metadata";
import type { AIPageGenerationRequest, AIPageGenerationResponse } from "@/lib/studio/ai/types";
import type { StudioPageData, StudioComponent } from "@/types/studio";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Claude model to use
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Rate limiting (simple in-memory)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // Page generation is expensive, lower limit
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(userId);
  
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * Validate and sanitize generated page data
 */
function validatePageData(data: unknown): StudioPageData {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid page data: not an object");
  }
  
  const pageData = data as Record<string, unknown>;
  
  // Ensure version
  if (pageData.version !== "1.0") {
    (pageData as { version: string }).version = "1.0";
  }
  
  // Check root
  if (!pageData.root || typeof pageData.root !== "object") {
    throw new Error("Invalid page data: missing root");
  }
  
  const root = pageData.root as Record<string, unknown>;
  if (!root.id) root.id = "root";
  if (!root.type) root.type = "Root";
  if (!root.props) root.props = {};
  if (!Array.isArray(root.children)) root.children = [];
  
  // Check components
  if (!pageData.components || typeof pageData.components !== "object") {
    throw new Error("Invalid page data: missing components");
  }
  
  const components = pageData.components as Record<string, unknown>;
  const validComponents: Record<string, StudioComponent> = {};
  const usedIds = new Set<string>();
  
  // Validate each component
  for (const [id, comp] of Object.entries(components)) {
    if (!comp || typeof comp !== "object") continue;
    
    const component = comp as Record<string, unknown>;
    
    // Ensure required fields
    const validId = typeof component.id === "string" ? component.id : id;
    
    // Skip duplicates
    if (usedIds.has(validId)) continue;
    usedIds.add(validId);
    
    validComponents[validId] = {
      id: validId,
      type: typeof component.type === "string" ? component.type : "Section",
      props: typeof component.props === "object" && component.props ? component.props as Record<string, unknown> : {},
      children: Array.isArray(component.children) ? component.children.filter((c): c is string => typeof c === "string") : undefined,
      parentId: typeof component.parentId === "string" ? component.parentId : undefined,
    };
  }
  
  // Ensure all referenced children exist
  const allIds = new Set(Object.keys(validComponents));
  const validRootChildren = (root.children as string[]).filter(id => allIds.has(id));
  
  for (const comp of Object.values(validComponents)) {
    if (comp.children) {
      comp.children = comp.children.filter(id => allIds.has(id));
    }
  }
  
  return {
    version: "1.0",
    root: {
      id: "root",
      type: "Root",
      props: root.props as Record<string, unknown>,
      children: validRootChildren,
    },
    components: validComponents,
  };
}

/**
 * Count components and sections for response
 */
function analyzePageData(data: StudioPageData): {
  componentCount: number;
  sections: Array<{ name: string; componentCount: number }>;
} {
  const components = Object.values(data.components);
  const sections = components
    .filter(c => c.type === "Section")
    .map(section => {
      // Count children recursively
      const countChildren = (id: string): number => {
        const comp = data.components[id];
        if (!comp) return 0;
        const childCount = comp.children?.length || 0;
        const grandchildCount = comp.children?.reduce(
          (sum, childId) => sum + countChildren(childId),
          0
        ) || 0;
        return 1 + childCount + grandchildCount;
      };
      
      const name = section.props.title as string || 
                   section.props.label as string ||
                   section.id.replace(/-/g, " ").replace(/section/i, "").trim() ||
                   "Section";
      
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        componentCount: countChildren(section.id),
      };
    });
  
  return {
    componentCount: components.length,
    sections,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }
    
    const body = await request.json() as AIPageGenerationRequest;
    const { prompt, siteId } = body;
    
    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a more detailed description (at least 10 characters)" },
        { status: 400 }
      );
    }
    
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[AI Page Generator] ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }
    
    // Get available components from server-safe metadata
    // This uses static component definitions instead of the client-side registry
    const availableComponents = getComponentsForAI();
    
    if (availableComponents.length === 0) {
      return NextResponse.json(
        { error: "No components available. Please ensure the registry is initialized." },
        { status: 500 }
      );
    }
    
    // Build prompts
    const systemPrompt = buildPageGenerationPrompt(availableComponents, body);
    const userPrompt = buildUserPrompt(body);
    
    // Call Claude
    const result = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt },
      ],
    });
    
    // Extract text content
    const content = result.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }
    
    // Parse response
    let pageData: StudioPageData;
    try {
      // Clean response
      let responseText = content.text.trim();
      
      // Remove markdown code fences if present (various formats)
      // Handle: ```json, ```, with or without newlines
      responseText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/g, "")
        .trim();
      
      // Try to extract JSON if there's extra text around it
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      }
      
      const parsed = JSON.parse(responseText);
      pageData = validatePageData(parsed);
      
    } catch (parseError) {
      console.error("[AI Page Generator] Failed to parse response:", content.text.substring(0, 1000));
      return NextResponse.json(
        { 
          error: "Failed to generate valid page structure",
          details: parseError instanceof Error ? parseError.message : "Parse error",
        },
        { status: 500 }
      );
    }
    
    // Analyze for response
    const analysis = analyzePageData(pageData);
    
    const response: AIPageGenerationResponse = {
      data: pageData,
      explanation: `Generated a ${analysis.sections.length}-section page with ${analysis.componentCount} components.`,
      componentCount: analysis.componentCount,
      sections: analysis.sections,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("[AI Page Generator] Error:", error);
    
    if (error instanceof Error && error.message.includes("rate")) {
      return NextResponse.json(
        { error: "AI service rate limited. Please try again shortly." },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate page" },
      { status: 500 }
    );
  }
}
