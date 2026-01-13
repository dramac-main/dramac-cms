/**
 * Foundation Test Script
 * Verifies all foundation components are working correctly
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 1: Database Connection
  try {
    const { error } = await supabase.from("agencies").select("id").limit(1);
    results.push({
      name: "Database Connection",
      passed: !error,
      error: error?.message,
    });
  } catch (e) {
    results.push({
      name: "Database Connection",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // Test 2: Agencies Table Exists
  try {
    const { error } = await supabase.from("agencies").select("*").limit(0);
    results.push({
      name: "Agencies Table",
      passed: !error,
      error: error?.message,
    });
  } catch (e) {
    results.push({
      name: "Agencies Table",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // Test 3: Users Table Exists
  try {
    const { error } = await supabase.from("profiles").select("*").limit(0);
    results.push({
      name: "Users Table",
      passed: !error,
      error: error?.message,
    });
  } catch (e) {
    results.push({
      name: "Users Table",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // Test 4: Clients Table Exists
  try {
    const { error } = await supabase.from("clients").select("*").limit(0);
    results.push({
      name: "Clients Table",
      passed: !error,
      error: error?.message,
    });
  } catch (e) {
    results.push({
      name: "Clients Table",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // Test 5: Sites Table Exists
  try {
    const { error } = await supabase.from("sites").select("*").limit(0);
    results.push({
      name: "Sites Table",
      passed: !error,
      error: error?.message,
    });
  } catch (e) {
    results.push({
      name: "Sites Table",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // Test 6: Pages Table Exists
  try {
    const { error } = await supabase.from("pages").select("*").limit(0);
    results.push({
      name: "Pages Table",
      passed: !error,
      error: error?.message,
    });
  } catch (e) {
    results.push({
      name: "Pages Table",
      passed: false,
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }

  return results;
}

async function main() {
  console.log("\n🧪 Running Foundation Tests...\n");
  console.log("=".repeat(50));

  const results = await runTests();

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log("=".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
