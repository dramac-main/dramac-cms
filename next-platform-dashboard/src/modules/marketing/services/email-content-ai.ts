/**
 * AI Email Content Writer
 *
 * Phase MKT-09: AI Marketing Intelligence
 *
 * Generates email body content from a natural language brief.
 * Output maps to email editor block JSON. Also provides inline
 * text improvement for existing content blocks.
 */

import { anthropic, AI_MODELS } from "@/lib/ai/config";
import type { EmailContentInput, EmailContentResult } from "../types";

export async function generateEmailContent(
  input: EmailContentInput,
): Promise<EmailContentResult> {
  const prompt = `You are an expert email marketer. Generate a complete marketing email based on this brief.

Campaign goal: ${input.goal}
Key message/offer: ${input.keyMessage}
Target audience: ${input.audienceDescription}
Desired tone: ${input.tone}
Call to action: ${input.callToAction}
Brand voice: ${input.brandVoice || "professional and friendly"}

Generate the email as a structured JSON object with these block types:
- "header": { "text": "...", "level": "h1"|"h2", "align": "center"|"left", "color": "#333333" }
- "text": { "text": "...", "align": "left", "color": "#555555", "fontSize": "16" }
- "image": { "src": "", "alt": "...", "width": "100%" }
- "button": { "text": "...", "url": "#", "align": "center", "bgColor": "#2563eb", "color": "#ffffff" }
- "divider": {}
- "spacer": { "height": "20" }

Also include a subject line and preview text.

Output ONLY valid JSON with this structure:
{
  "subjectLine": "...",
  "previewText": "...",
  "blocks": [
    { "type": "header", "content": { "text": "...", "level": "h1", "align": "center", "color": "#333333" } },
    { "type": "text", "content": { "text": "...", "align": "left", "color": "#555555", "fontSize": "16" } },
    { "type": "button", "content": { "text": "...", "url": "#", "align": "center", "bgColor": "#2563eb", "color": "#ffffff" } }
  ]
}

Use {{first_name}} for personalization where appropriate. Make the email engaging, with clear hierarchy and a compelling CTA.`;

  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.sonnet,
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const result: EmailContentResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (err: any) {
    console.error("[AI] Email content generation error:", err);
    return {
      subjectLine: "Your Update",
      previewText: "Check out what we have for you",
      blocks: [
        {
          type: "header",
          content: {
            text: "Hello {{first_name}}!",
            level: "h1",
            align: "center",
            color: "#333333",
          },
        },
        {
          type: "text",
          content: {
            text: input.keyMessage || "We have exciting news for you.",
            align: "left",
            color: "#555555",
            fontSize: "16",
          },
        },
        {
          type: "button",
          content: {
            text: input.callToAction || "Learn More",
            url: "#",
            align: "center",
            bgColor: "#2563eb",
            color: "#ffffff",
          },
        },
      ],
    };
  }
}

export async function improveEmailText(
  currentText: string,
  instruction: string,
): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: AI_MODELS.haiku,
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: `Rewrite the following email text based on the instruction. Keep personalization tokens like {{first_name}} intact.

Current text:
"${currentText}"

Instruction: ${instruction}

Output ONLY the improved text, nothing else. Do not wrap in quotes.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim();
  } catch {
    return currentText;
  }
}
