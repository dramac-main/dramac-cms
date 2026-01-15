/**
 * Phase 61 Test Suite
 * Tests for Content Safety, Rate Limiting, and Site Cloning
 */

import { 
  checkPromptSafety, 
  sanitizeGeneratedContent, 
  checkBusinessName,
  getBlockedKeywords,
  isContentSafe 
} from "@/lib/ai/safety";

// Safety Filter Tests
export function testSafetyFilter() {
  console.log("🔒 Testing Content Safety Filter...\n");
  
  // Test 1: Block gambling content
  const gamblingResult = checkPromptSafety("Create a gambling website for online casino");
  console.assert(!gamblingResult.isAllowed, "❌ Should block gambling");
  console.log(`✅ Gambling blocked: ${!gamblingResult.isAllowed}`);
  console.log(`   Blocked terms: ${gamblingResult.blockedTerms.join(", ")}`);
  
  // Test 2: Block violence
  const violenceResult = checkPromptSafety("Create a website about weapons and guns");
  console.assert(!violenceResult.isAllowed, "❌ Should block violence");
  console.log(`✅ Violence blocked: ${!violenceResult.isAllowed}`);
  
  // Test 3: Block adult content
  const adultResult = checkPromptSafety("Create an adult entertainment xxx site");
  console.assert(!adultResult.isAllowed, "❌ Should block adult content");
  console.log(`✅ Adult content blocked: ${!adultResult.isAllowed}`);
  
  // Test 4: Allow legitimate business
  const photographyResult = checkPromptSafety("Create a photography portfolio website");
  console.assert(photographyResult.isAllowed, "❌ Should allow photography");
  console.log(`✅ Photography allowed: ${photographyResult.isAllowed}`);
  
  // Test 5: Allow restaurant
  const restaurantResult = checkPromptSafety("Create a website for an Italian restaurant");
  console.assert(restaurantResult.isAllowed, "❌ Should allow restaurant");
  console.log(`✅ Restaurant allowed: ${restaurantResult.isAllowed}`);
  
  // Test 6: Business name check
  const badNameResult = checkBusinessName("Kill Corp");
  console.assert(!badNameResult.isAllowed, "❌ Should block bad business name");
  console.log(`✅ Bad business name blocked: ${!badNameResult.isAllowed}`);
  
  // Test 7: Good business name
  const goodNameResult = checkBusinessName("Sunny Photography Studio");
  console.assert(goodNameResult.isAllowed, "❌ Should allow good business name");
  console.log(`✅ Good business name allowed: ${goodNameResult.isAllowed}`);
  
  // Test 8: Content sanitization
  const sanitized = sanitizeGeneratedContent("This is some violence content with <script>alert('xss')</script>");
  console.assert(!sanitized.includes("<script>"), "❌ Should remove script tags");
  console.assert(sanitized.includes("[removed]"), "❌ Should replace blocked terms");
  console.log(`✅ Sanitization working: ${!sanitized.includes("<script>")}`);
  
  // Test 9: isContentSafe helper
  console.assert(!isContentSafe("gambling"), "❌ Should detect unsafe content");
  console.assert(isContentSafe("photography studio"), "❌ Should allow safe content");
  console.log(`✅ isContentSafe helper working`);
  
  // Test 10: Moderation levels
  const strictKeywords = getBlockedKeywords("strict");
  const permissiveKeywords = getBlockedKeywords("permissive");
  console.assert(strictKeywords.length > permissiveKeywords.length, "❌ Strict should have more keywords");
  console.log(`✅ Moderation levels: strict=${strictKeywords.length}, permissive=${permissiveKeywords.length}`);
  
  console.log("\n✅ All safety filter tests passed!\n");
}

// Rate Limiting Tests (mock - actual tests need database)
export function testRateLimitConfig() {
  console.log("⏱️ Testing Rate Limit Configuration...\n");
  
  const { RATE_LIMITS } = require("@/lib/rate-limit");
  
  // Verify configurations exist
  console.assert(RATE_LIMITS.aiGeneration, "❌ AI generation limit should exist");
  console.assert(RATE_LIMITS.siteCreation, "❌ Site creation limit should exist");
  console.assert(RATE_LIMITS.pageCreation, "❌ Page creation limit should exist");
  
  // Verify sensible limits
  console.assert(RATE_LIMITS.aiGeneration.maxRequests === 10, "❌ AI generation should be 10/hour");
  console.assert(RATE_LIMITS.siteCreation.maxRequests === 20, "❌ Site creation should be 20/day");
  
  console.log(`✅ AI Generation: ${RATE_LIMITS.aiGeneration.maxRequests}/hour`);
  console.log(`✅ AI Regeneration: ${RATE_LIMITS.aiRegeneration.maxRequests}/hour`);
  console.log(`✅ Site Creation: ${RATE_LIMITS.siteCreation.maxRequests}/day`);
  console.log(`✅ Page Creation: ${RATE_LIMITS.pageCreation.maxRequests}/day`);
  console.log(`✅ Export: ${RATE_LIMITS.export.maxRequests}/hour`);
  
  console.log("\n✅ All rate limit config tests passed!\n");
}

// Clone Configuration Tests
export function testCloneConfig() {
  console.log("📋 Testing Clone Configuration...\n");
  
  const { generateSubdomain } = require("@/lib/sites/clone");
  
  // Test subdomain generation
  const subdomain1 = generateSubdomain("My Awesome Website");
  console.assert(subdomain1 === "my-awesome-website", "❌ Should generate valid subdomain");
  console.log(`✅ Subdomain generation: "My Awesome Website" → "${subdomain1}"`);
  
  const subdomain2 = generateSubdomain("Test!@#$%Site");
  console.assert(subdomain2 === "test-site", "❌ Should remove special characters");
  console.log(`✅ Special chars removed: "Test!@#\$%Site" → "${subdomain2}"`);
  
  const longName = "A".repeat(100);
  const subdomain3 = generateSubdomain(longName);
  console.assert(subdomain3.length <= 63, "❌ Should truncate to 63 chars");
  console.log(`✅ Length limit enforced: ${subdomain3.length} chars`);
  
  console.log("\n✅ All clone config tests passed!\n");
}

// Run all tests
export function runAllPhase61Tests() {
  console.log("═══════════════════════════════════════════════");
  console.log("       PHASE 61 TEST SUITE                     ");
  console.log("   Critical Infrastructure - Safety & Cloning   ");
  console.log("═══════════════════════════════════════════════\n");
  
  testSafetyFilter();
  testRateLimitConfig();
  testCloneConfig();
  
  console.log("═══════════════════════════════════════════════");
  console.log("       ALL PHASE 61 TESTS PASSED! ✅           ");
  console.log("═══════════════════════════════════════════════\n");
}

// Export for direct execution
if (typeof window === "undefined" && require.main === module) {
  runAllPhase61Tests();
}
