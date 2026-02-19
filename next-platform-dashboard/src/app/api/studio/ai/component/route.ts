/**
 * AI Component Edit API Route
 * 
 * Handles AI requests for component property modifications.
 * Uses Claude via the Anthropic SDK to generate prop changes.
 * Phase STUDIO-11: AI Component Chat
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildComponentSystemPrompt } from "@/lib/studio/ai/prompts";
import type { AIComponentRequest, AIComponentResponse, AIErrorResponse } from "@/lib/studio/ai/types";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Claude model to use
const CLAUDE_MODEL = "claude-sonnet-4-6";

// Rate limiting (simple in-memory for now)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
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

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting by IP (in production, use user ID)
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (!checkRateLimit(ip)) {
      return NextResponse.json<AIErrorResponse>(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json() as AIComponentRequest;
    const { context, userMessage, conversationHistory } = body;

    // Validate required fields
    if (!context || !userMessage) {
      return NextResponse.json<AIErrorResponse>(
        { error: "Missing required fields: context and userMessage" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[AI Component] ANTHROPIC_API_KEY not configured");
      return NextResponse.json<AIErrorResponse>(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }

    // Build the system prompt
    const systemPrompt = buildComponentSystemPrompt(context);

    // Build messages array for conversation context
    const messages: Anthropic.Messages.MessageParam[] = [];
    
    // Add conversation history (last 6 messages to keep context manageable)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Call Claude
    const result = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    // Extract text content
    const content = result.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    // Parse the response
    let response: AIComponentResponse;
    try {
      // Clean up response text (remove any markdown if present)
      let responseText = content.text.trim();
      
      // Remove markdown code blocks if present
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      
      response = JSON.parse(responseText);
      
      // Validate response structure
      if (!response.changes || typeof response.changes !== "object") {
        throw new Error("Invalid response: missing 'changes' object");
      }
      if (!response.explanation || typeof response.explanation !== "string") {
        response.explanation = "Changes applied.";
      }
    } catch (parseError) {
      console.error("[AI Component] Failed to parse AI response:", content.text);
      return NextResponse.json<AIErrorResponse>(
        { 
          error: "AI returned invalid response format",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
          rawResponse: content.text.substring(0, 500), // Truncate for debugging
        },
        { status: 500 }
      );
    }

    // Return the response
    return NextResponse.json(response);

  } catch (error) {
    console.error("[AI Component] API Error:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json<AIErrorResponse>(
          { error: "AI service configuration error" },
          { status: 500 }
        );
      }
      if (error.message.includes("rate") || error.message.includes("limit")) {
        return NextResponse.json<AIErrorResponse>(
          { error: "AI service rate limited. Please try again shortly." },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json<AIErrorResponse>(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}

// Optional: GET for health check
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    service: "studio-ai-component",
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  });
}
