/**
 * Social Caption AI Service
 *
 * Phase MKT-12: Social Media Integration
 *
 * AI-powered social media caption generation using Anthropic Claude Haiku.
 * Generates platform-specific captions with proper length constraints.
 */

import { SOCIAL_PLATFORM_LIMITS } from "../types/social-types";
import type {
  SocialPlatform,
  GenerateCaptionInput,
  GenerateCaptionResult,
} from "../types/social-types";

/**
 * Generate a social media caption for the given content and platform.
 *
 * Uses Anthropic Claude Haiku for fast, cost-effective caption generation.
 * Falls back to a template-based caption if AI generation fails.
 */
export async function generateSocialCaption(
  input: GenerateCaptionInput,
): Promise<GenerateCaptionResult> {
  const platformConfig = SOCIAL_PLATFORM_LIMITS[input.platform];

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return generateFallbackCaption(input);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Write a ${platformConfig.label} post promoting this content.
Title: ${input.title}
${input.excerpt ? `Summary: ${input.excerpt}` : ""}
Style: ${input.tone || platformConfig.style}
Max length: ${platformConfig.maxLength} characters.
Include relevant hashtags.
Return ONLY the post text, nothing else.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return generateFallbackCaption(input);
    }

    const result = await response.json();
    const caption = result?.content?.[0]?.text?.trim() || "";

    if (!caption) {
      return generateFallbackCaption(input);
    }

    // Truncate if over limit
    const trimmedCaption =
      caption.length > platformConfig.maxLength
        ? caption.substring(0, platformConfig.maxLength - 3) + "..."
        : caption;

    return {
      caption: trimmedCaption,
      platform: input.platform,
      characterCount: trimmedCaption.length,
      withinLimit: trimmedCaption.length <= platformConfig.maxLength,
    };
  } catch {
    return generateFallbackCaption(input);
  }
}

/**
 * Fallback caption generator when AI is unavailable.
 * Produces a simple but effective caption from the title and excerpt.
 */
function generateFallbackCaption(
  input: GenerateCaptionInput,
): GenerateCaptionResult {
  const platformConfig = SOCIAL_PLATFORM_LIMITS[input.platform];
  let caption: string;

  switch (input.platform) {
    case "twitter":
      caption = input.excerpt
        ? `${input.title}\n\n${input.excerpt.substring(0, 200)}`
        : input.title;
      break;
    case "linkedin":
      caption = input.excerpt
        ? `${input.title}\n\n${input.excerpt}\n\n#content #update`
        : `${input.title}\n\n#content #update`;
      break;
    case "instagram":
      caption = input.excerpt
        ? `${input.title}\n\n${input.excerpt}\n\n#new #content #update`
        : `${input.title}\n\n#new #content #update`;
      break;
    case "facebook":
    default:
      caption = input.excerpt
        ? `${input.title}\n\n${input.excerpt}`
        : input.title;
      break;
  }

  // Truncate to fit platform limit
  if (caption.length > platformConfig.maxLength) {
    caption = caption.substring(0, platformConfig.maxLength - 3) + "...";
  }

  return {
    caption,
    platform: input.platform,
    characterCount: caption.length,
    withinLimit: caption.length <= platformConfig.maxLength,
  };
}

/**
 * Generate captions for multiple platforms at once.
 */
export async function generateMultiPlatformCaptions(
  input: Omit<GenerateCaptionInput, "platform">,
  platforms: SocialPlatform[],
): Promise<GenerateCaptionResult[]> {
  const results = await Promise.all(
    platforms.map((platform) =>
      generateSocialCaption({ ...input, platform }),
    ),
  );

  return results;
}
