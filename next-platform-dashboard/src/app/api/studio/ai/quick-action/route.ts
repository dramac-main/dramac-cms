/**
 * AI Quick Action API
 * 
 * Processes AI quick actions for components.
 * Generates updated props based on the action type and current component state.
 * 
 * @phase STUDIO-30 - Component Superpowers
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Claude model to use
const CLAUDE_MODEL = "claude-sonnet-4-6";

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute." },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      componentId, 
      componentType, 
      action, 
      prompt, 
      currentProps, 
      affectedProps 
    } = body;
    
    // Validate required fields
    if (!componentType || !action || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: componentType, action, prompt" }, 
        { status: 400 }
      );
    }
    
    if (!affectedProps || !Array.isArray(affectedProps) || affectedProps.length === 0) {
      return NextResponse.json(
        { error: "affectedProps must be a non-empty array" }, 
        { status: 400 }
      );
    }
    
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[Quick Action] ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }
    
    // Build the system prompt for structured output
    const systemPrompt = `You are an AI assistant that modifies component properties for a website builder.
Your task is to generate improved values for the specified properties based on the user's action.

CRITICAL: You must respond ONLY with a valid JSON object containing the properties to update.
Do not include any explanation or markdown - ONLY the JSON object.

Current component type: ${componentType}
Properties to potentially update: ${affectedProps.join(", ")}
Current property values: ${JSON.stringify(currentProps, null, 2)}

Generate improved values based on the action requested. Only include properties that should be changed.`;
    
    // Call Claude
    const result = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    
    // Extract text content
    const content = result.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }
    
    // Parse the response
    let updates: Record<string, unknown> = {};
    try {
      // Clean up response text (remove any markdown if present)
      let responseText = content.text.trim();
      
      // Remove markdown code blocks if present
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      
      updates = JSON.parse(responseText);
      
      // Filter to only include affected props
      const filteredUpdates: Record<string, unknown> = {};
      for (const prop of affectedProps) {
        if (prop in updates && updates[prop] !== undefined && updates[prop] !== null) {
          filteredUpdates[prop] = updates[prop];
        }
      }
      updates = filteredUpdates;
    } catch (parseError) {
      console.error("[Quick Action] Failed to parse AI response:", content.text);
      return NextResponse.json(
        { 
          error: "AI returned invalid response format",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 500 }
      );
    }
    
    // Log for analytics (optional - could store in DB)
    console.log(`[Quick Action] User: ${user.id}, Component: ${componentType}, Action: ${action}`);
    
    return NextResponse.json({
      success: true,
      updates,
      action,
      componentId,
    });
  } catch (error) {
    console.error("[Quick Action API] Error:", error);
    
    // Handle specific AI errors
    if (error instanceof Error) {
      if (error.message.includes("rate") || error.message.includes("limit")) {
        return NextResponse.json(
          { error: "AI rate limit reached. Please try again later." },
          { status: 429 }
        );
      }
      if (error.message.includes("context length")) {
        return NextResponse.json(
          { error: "Component data too large for AI processing." },
          { status: 400 }
        );
      }
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}

// Support OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Allow": "POST, OPTIONS",
    },
  });
}
