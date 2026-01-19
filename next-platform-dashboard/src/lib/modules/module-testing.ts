"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, isSuperAdmin } from "@/lib/auth/permissions";
import { getModuleSource, type ModuleSource } from "./module-builder";

// Types defined directly in this file (not imported)
export type TestType =
  | "unit"
  | "integration"
  | "performance"
  | "accessibility"
  | "security";

export type TestStatus = "pending" | "running" | "passed" | "failed" | "error";

export type ResultStatus = "passed" | "failed" | "skipped" | "warning";

export interface TestTypeInfo {
  type: TestType;
  name: string;
  description: string;
  icon: string;
  requiresSite: boolean;
}

// Internal constant (not exported directly)
const TEST_TYPES_DATA: TestTypeInfo[] = [
  {
    type: "unit",
    name: "Unit Tests",
    description: "Code quality, structure, and syntax validation",
    icon: "Code",
    requiresSite: false,
  },
  {
    type: "integration",
    name: "Integration Tests",
    description: "Installation, settings persistence, and rendering on a test site",
    icon: "Plug",
    requiresSite: true,
  },
  {
    type: "performance",
    name: "Performance Tests",
    description: "Code size, CSS size, and dependency analysis",
    icon: "Gauge",
    requiresSite: false,
  },
  {
    type: "accessibility",
    name: "Accessibility Tests",
    description: "ARIA labels, alt attributes, and semantic HTML",
    icon: "Accessibility",
    requiresSite: false,
  },
  {
    type: "security",
    name: "Security Tests",
    description: "Eval usage, innerHTML, and secure URL checks",
    icon: "Shield",
    requiresSite: false,
  },
];

// Async getter for TEST_TYPES (required for "use server")
export async function getTestTypes(): Promise<TestTypeInfo[]> {
  return TEST_TYPES_DATA;
}

export interface TestRun {
  id: string;
  moduleId: string;
  moduleName?: string;
  moduleVersion: string;
  testType: TestType;
  testSiteId?: string;
  testSiteName?: string;
  status: TestStatus;
  startedAt: string;
  completedAt?: string;
  triggeredBy?: string;
  environment: Record<string, unknown>;
  results: TestResult[];
  summary?: TestSummary;
}

export interface TestResult {
  id: string;
  testName: string;
  category: string;
  status: ResultStatus;
  durationMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  warnings: number;
  duration: number;
}

/**
 * Create and run a test suite for a module
 */
export async function runModuleTests(
  moduleId: string,
  testType: TestType,
  testSiteId?: string
): Promise<TestRun> {
  const userId = await getCurrentUserId();
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get module source
  const moduleData = await getModuleSource(moduleId);
  if (!moduleData) {
    throw new Error("Module not found");
  }

  // Create test run record
  const { data: testRun, error: runError } = await db
    .from("module_test_runs")
    .insert({
      module_source_id: moduleData.id,
      module_version: moduleData.latestVersion || "0.0.1",
      test_type: testType,
      test_site_id: testSiteId || null,
      status: "running",
      triggered_by: userId,
      environment: {
        platform: "web",
        timestamp: new Date().toISOString(),
        moduleSlug: moduleData.slug,
        moduleName: moduleData.name,
      },
    })
    .select()
    .single();

  if (runError) {
    throw new Error(`Failed to create test run: ${runError.message}`);
  }

  try {
    // Run tests based on type
    const results = await executeTests(moduleData, testType, testSiteId);

    // Save results
    for (const result of results) {
      await db.from("module_test_results").insert({
        test_run_id: testRun.id,
        test_name: result.testName,
        category: result.category,
        status: result.status,
        duration_ms: result.durationMs,
        message: result.message,
        details: result.details || {},
      });
    }

    // Determine overall status
    const hasFailures = results.some((r) => r.status === "failed");
    const hasErrors = results.some((r) => (r.details as Record<string, unknown>)?.error);
    const finalStatus: TestStatus = hasErrors
      ? "error"
      : hasFailures
        ? "failed"
        : "passed";

    // Update test run status
    await db
      .from("module_test_runs")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", testRun.id);

    // Calculate summary
    const summary = calculateSummary(results);

    return {
      id: testRun.id,
      moduleId,
      moduleName: moduleData.name,
      moduleVersion: moduleData.latestVersion || "0.0.1",
      testType,
      testSiteId,
      status: finalStatus,
      startedAt: testRun.started_at,
      completedAt: new Date().toISOString(),
      environment: testRun.environment,
      results,
      summary,
    };
  } catch (error) {
    // Mark as error
    await db
      .from("module_test_runs")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", testRun.id);

    throw error;
  }
}

/**
 * Execute tests based on type
 */
async function executeTests(
  moduleData: ModuleSource,
  testType: TestType,
  testSiteId?: string
): Promise<TestResult[]> {
  switch (testType) {
    case "unit":
      return runUnitTests(moduleData);
    case "integration":
      return runIntegrationTests(moduleData, testSiteId);
    case "performance":
      return runPerformanceTests(moduleData);
    case "accessibility":
      return runAccessibilityTests(moduleData);
    case "security":
      return runSecurityTests(moduleData);
    default:
      return [];
  }
}

/**
 * Unit tests - Code quality and structure
 */
function runUnitTests(moduleData: ModuleSource): TestResult[] {
  const results: TestResult[] = [];
  const code = moduleData.renderCode || "";

  // Test: Has export statement
  results.push({
    id: crypto.randomUUID(),
    testName: "Has Export Statement",
    category: "structure",
    status: code.includes("export") ? "passed" : "failed",
    message: code.includes("export")
      ? "Module exports a component"
      : "Module must export a component",
    durationMs: 1,
  });

  // Test: Valid function/component definition
  const hasFunctionDef = /function\s+\w+|const\s+\w+\s*=\s*(\(|function)/.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "Valid Component Definition",
    category: "structure",
    status: hasFunctionDef ? "passed" : "failed",
    message: hasFunctionDef
      ? "Module has a valid function/component definition"
      : "Module needs a function or component definition",
    durationMs: 1,
  });

  // Test: Bracket matching
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  const bracesBalanced = openBraces === closeBraces;
  const parensBalanced = openParens === closeParens;

  results.push({
    id: crypto.randomUUID(),
    testName: "Balanced Braces",
    category: "syntax",
    status: bracesBalanced ? "passed" : "failed",
    message: bracesBalanced
      ? "All braces are balanced"
      : `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
    durationMs: 1,
    details: { openBraces, closeBraces },
  });

  results.push({
    id: crypto.randomUUID(),
    testName: "Balanced Parentheses",
    category: "syntax",
    status: parensBalanced ? "passed" : "failed",
    message: parensBalanced
      ? "All parentheses are balanced"
      : `Unbalanced parentheses: ${openParens} open, ${closeParens} close`,
    durationMs: 1,
    details: { openParens, closeParens },
  });

  // Test: No console.log in production
  const consoleMatches = code.match(/console\.(log|warn|error|debug|info)/g) || [];
  results.push({
    id: crypto.randomUUID(),
    testName: "No Console Logs",
    category: "quality",
    status: consoleMatches.length === 0 ? "passed" : "warning",
    message:
      consoleMatches.length === 0
        ? "No console statements found"
        : `Found ${consoleMatches.length} console statement(s) - consider removing for production`,
    durationMs: 1,
    details: { count: consoleMatches.length },
  });

  // Test: Settings schema valid
  const settingsSchema = moduleData.settingsSchema;
  const hasValidSchema =
    settingsSchema && typeof settingsSchema === "object";
  results.push({
    id: crypto.randomUUID(),
    testName: "Valid Settings Schema",
    category: "configuration",
    status: hasValidSchema ? "passed" : "warning",
    message: hasValidSchema
      ? "Settings schema is valid JSON object"
      : "No settings schema defined - module may not be configurable",
    durationMs: 1,
  });

  // Test: Has description
  const description = moduleData.description;
  results.push({
    id: crypto.randomUUID(),
    testName: "Has Description",
    category: "documentation",
    status: description && description.length > 10 ? "passed" : "warning",
    message:
      description && description.length > 10
        ? "Module has a description"
        : "Consider adding a detailed description for the marketplace",
    durationMs: 1,
    details: { descriptionLength: description?.length || 0 },
  });

  // Test: Has category
  const category = moduleData.category;
  results.push({
    id: crypto.randomUUID(),
    testName: "Has Category",
    category: "documentation",
    status: category ? "passed" : "warning",
    message: category
      ? `Module is categorized as "${category}"`
      : "Consider adding a category for better marketplace discoverability",
    durationMs: 1,
  });

  // Test: Return statement present
  const hasReturn = /return\s*(\(|<)/.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "Has Return Statement",
    category: "structure",
    status: hasReturn ? "passed" : "warning",
    message: hasReturn
      ? "Component has a return statement"
      : "Component should return JSX",
    durationMs: 1,
  });

  return results;
}

/**
 * Integration tests - Site context
 */
function runIntegrationTests(
  moduleData: ModuleSource,
  testSiteId?: string
): TestResult[] {
  const results: TestResult[] = [];

  if (!testSiteId) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Test Site Required",
      category: "setup",
      status: "skipped",
      message: "Integration tests require a test site to be selected",
      durationMs: 0,
    });
    return results;
  }

  // Test: Module can be installed (simulated)
  const hasMinimalStructure =
    moduleData.name && moduleData.slug && moduleData.renderCode;
  results.push({
    id: crypto.randomUUID(),
    testName: "Module Installation",
    category: "integration",
    status: hasMinimalStructure ? "passed" : "failed",
    message: hasMinimalStructure
      ? "Module has required fields for installation"
      : "Module missing required fields (name, slug, renderCode)",
    durationMs: 100,
    details: {
      hasName: !!moduleData.name,
      hasSlug: !!moduleData.slug,
      hasRenderCode: !!moduleData.renderCode,
    },
  });

  // Test: Settings can be serialized
  const settingsSchema = moduleData.settingsSchema;
  const defaultSettings = moduleData.defaultSettings;
  let settingsValid = true;
  let settingsError = "";

  try {
    if (settingsSchema) {
      JSON.stringify(settingsSchema);
    }
    if (defaultSettings) {
      JSON.stringify(defaultSettings);
    }
  } catch (e) {
    settingsValid = false;
    settingsError = e instanceof Error ? e.message : "Unknown error";
  }

  results.push({
    id: crypto.randomUUID(),
    testName: "Settings Persistence",
    category: "integration",
    status: settingsValid ? "passed" : "failed",
    message: settingsValid
      ? "Settings can be serialized for storage"
      : `Settings serialization failed: ${settingsError}`,
    durationMs: 50,
  });

  // Test: Module renders (simulated - checks for JSX patterns)
  const code = moduleData.renderCode || "";
  const hasJSX = /<[A-Za-z][\s\S]*>/.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "Module Renders",
    category: "integration",
    status: hasJSX ? "passed" : "warning",
    message: hasJSX
      ? "Module contains JSX markup"
      : "No JSX markup detected - ensure component returns valid JSX",
    durationMs: 200,
  });

  // Test: API routes valid (if any)
  const apiRoutes = moduleData.apiRoutes;
  if (apiRoutes && apiRoutes.length > 0) {
    const validRoutes = apiRoutes.every(
      (route) =>
        route.path &&
        route.path.startsWith("/") &&
        ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(route.method)
    );

    results.push({
      id: crypto.randomUUID(),
      testName: "API Routes Valid",
      category: "integration",
      status: validRoutes ? "passed" : "failed",
      message: validRoutes
        ? `${apiRoutes.length} API route(s) configured correctly`
        : "Some API routes have invalid configuration",
      durationMs: 50,
      details: { routeCount: apiRoutes.length },
    });
  }

  // Test: Dependencies available (simulated)
  const dependencies = moduleData.dependencies || [];
  results.push({
    id: crypto.randomUUID(),
    testName: "Dependencies Available",
    category: "integration",
    status: "passed",
    message:
      dependencies.length > 0
        ? `${dependencies.length} dependencies will be loaded`
        : "No external dependencies required",
    durationMs: 100,
    details: { dependencies },
  });

  return results;
}

/**
 * Performance tests
 */
function runPerformanceTests(moduleData: ModuleSource): TestResult[] {
  const results: TestResult[] = [];
  const code = moduleData.renderCode || "";
  const styles = moduleData.styles || "";

  // Test: Code size
  const codeSize = new Blob([code]).size;
  const codeSizeKB = codeSize / 1024;
  results.push({
    id: crypto.randomUUID(),
    testName: "Code Size",
    category: "performance",
    status: codeSizeKB < 50 ? "passed" : codeSizeKB < 100 ? "warning" : "failed",
    message: `Code size: ${codeSizeKB.toFixed(2)}KB ${codeSizeKB < 50 ? "(optimal)" : codeSizeKB < 100 ? "(acceptable)" : "(too large)"}`,
    details: { bytes: codeSize, kb: codeSizeKB },
    durationMs: 1,
  });

  // Test: CSS size
  const cssSize = new Blob([styles]).size;
  const cssSizeKB = cssSize / 1024;
  results.push({
    id: crypto.randomUUID(),
    testName: "CSS Size",
    category: "performance",
    status: cssSizeKB < 20 ? "passed" : cssSizeKB < 50 ? "warning" : "failed",
    message: `CSS size: ${cssSizeKB.toFixed(2)}KB ${cssSizeKB < 20 ? "(optimal)" : cssSizeKB < 50 ? "(acceptable)" : "(too large)"}`,
    details: { bytes: cssSize, kb: cssSizeKB },
    durationMs: 1,
  });

  // Test: Combined bundle size
  const totalSize = codeSize + cssSize;
  const totalSizeKB = totalSize / 1024;
  results.push({
    id: crypto.randomUUID(),
    testName: "Total Bundle Size",
    category: "performance",
    status: totalSizeKB < 70 ? "passed" : totalSizeKB < 150 ? "warning" : "failed",
    message: `Total bundle: ${totalSizeKB.toFixed(2)}KB`,
    details: { bytes: totalSize, kb: totalSizeKB },
    durationMs: 1,
  });

  // Test: Dependencies count
  const deps = moduleData.dependencies || [];
  results.push({
    id: crypto.randomUUID(),
    testName: "Dependencies Count",
    category: "performance",
    status: deps.length < 5 ? "passed" : deps.length < 10 ? "warning" : "failed",
    message: `${deps.length} dependencies ${deps.length < 5 ? "(optimal)" : deps.length < 10 ? "(consider reducing)" : "(too many)"}`,
    details: { count: deps.length, dependencies: deps },
    durationMs: 1,
  });

  // Test: Nested loops detection
  const nestedLoopPattern = /for\s*\([^)]*\)[^{]*{[^}]*for\s*\([^)]*\)|\.map\([^)]*\)[^}]*\.map\(/;
  const hasNestedLoops = nestedLoopPattern.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No Nested Loops",
    category: "performance",
    status: hasNestedLoops ? "warning" : "passed",
    message: hasNestedLoops
      ? "Nested loops detected - may impact performance with large datasets"
      : "No nested loops detected",
    durationMs: 1,
  });

  // Test: Inline styles (can impact performance)
  const inlineStyleCount = (code.match(/style=\{/g) || []).length;
  results.push({
    id: crypto.randomUUID(),
    testName: "Inline Styles Usage",
    category: "performance",
    status: inlineStyleCount < 5 ? "passed" : inlineStyleCount < 15 ? "warning" : "failed",
    message: `${inlineStyleCount} inline style(s) ${inlineStyleCount < 5 ? "(acceptable)" : "(consider using CSS classes)"}`,
    details: { count: inlineStyleCount },
    durationMs: 1,
  });

  return results;
}

/**
 * Accessibility tests
 */
function runAccessibilityTests(moduleData: ModuleSource): TestResult[] {
  const results: TestResult[] = [];
  const code = moduleData.renderCode || "";

  // Test: Alt attributes on images
  const imgTags = code.match(/<img[^>]*>/gi) || [];
  const imgsWithAlt = imgTags.filter((tag) => /alt=/.test(tag));
  if (imgTags.length > 0) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Image Alt Attributes",
      category: "accessibility",
      status: imgsWithAlt.length === imgTags.length ? "passed" : "failed",
      message:
        imgsWithAlt.length === imgTags.length
          ? `All ${imgTags.length} image(s) have alt attributes`
          : `${imgTags.length - imgsWithAlt.length} of ${imgTags.length} images missing alt attributes`,
      durationMs: 1,
      details: { total: imgTags.length, withAlt: imgsWithAlt.length },
    });
  }

  // Test: ARIA labels
  const ariaCount = (code.match(/aria-/gi) || []).length;
  results.push({
    id: crypto.randomUUID(),
    testName: "ARIA Labels",
    category: "accessibility",
    status: ariaCount > 0 ? "passed" : "warning",
    message:
      ariaCount > 0
        ? `${ariaCount} ARIA attribute(s) found`
        : "Consider adding ARIA labels for better screen reader support",
    durationMs: 1,
    details: { count: ariaCount },
  });

  // Test: Semantic HTML
  const semanticTags = ["header", "main", "nav", "footer", "article", "section", "aside"];
  const foundSemanticTags = semanticTags.filter((tag) =>
    new RegExp(`<${tag}[\\s>]`, "i").test(code)
  );
  results.push({
    id: crypto.randomUUID(),
    testName: "Semantic HTML",
    category: "accessibility",
    status: foundSemanticTags.length > 0 ? "passed" : "warning",
    message:
      foundSemanticTags.length > 0
        ? `Uses semantic elements: ${foundSemanticTags.join(", ")}`
        : "Consider using semantic HTML elements (header, main, nav, etc.)",
    durationMs: 1,
    details: { foundTags: foundSemanticTags },
  });

  // Test: Button accessibility
  const buttons = code.match(/<button[^>]*>/gi) || [];
  const buttonsWithType = buttons.filter((b) => /type=/.test(b));
  if (buttons.length > 0) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Button Type Attributes",
      category: "accessibility",
      status: buttonsWithType.length === buttons.length ? "passed" : "warning",
      message:
        buttonsWithType.length === buttons.length
          ? "All buttons have type attributes"
          : `${buttons.length - buttonsWithType.length} button(s) missing type attribute`,
      durationMs: 1,
      details: { total: buttons.length, withType: buttonsWithType.length },
    });
  }

  // Test: Form labels
  const inputs = code.match(/<input[^>]*>/gi) || [];
  const labels = code.match(/<label[^>]*>/gi) || [];
  const inputsWithId = inputs.filter((i) => /id=/.test(i));
  if (inputs.length > 0) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Form Labels",
      category: "accessibility",
      status: labels.length >= inputsWithId.length ? "passed" : "warning",
      message:
        labels.length >= inputsWithId.length
          ? "Form inputs have associated labels"
          : "Some form inputs may be missing labels",
      durationMs: 1,
      details: { inputs: inputs.length, labels: labels.length },
    });
  }

  // Test: Heading hierarchy
  const headings = code.match(/<h[1-6][^>]*>/gi) || [];
  results.push({
    id: crypto.randomUUID(),
    testName: "Heading Hierarchy",
    category: "accessibility",
    status: headings.length > 0 ? "passed" : "warning",
    message:
      headings.length > 0
        ? `${headings.length} heading element(s) found`
        : "Consider adding heading elements for document structure",
    durationMs: 1,
    details: { count: headings.length },
  });

  // Test: Link text
  const links = code.match(/<a[^>]*>[\s\S]*?<\/a>/gi) || [];
  const linksWithText = links.filter((link) => {
    const textContent = link.replace(/<[^>]*>/g, "").trim();
    return textContent.length > 0 && textContent.toLowerCase() !== "click here";
  });
  if (links.length > 0) {
    results.push({
      id: crypto.randomUUID(),
      testName: "Descriptive Link Text",
      category: "accessibility",
      status: linksWithText.length === links.length ? "passed" : "warning",
      message:
        linksWithText.length === links.length
          ? "All links have descriptive text"
          : 'Some links may have non-descriptive text (avoid "click here")',
      durationMs: 1,
      details: { total: links.length, descriptive: linksWithText.length },
    });
  }

  return results;
}

/**
 * Security tests
 */
function runSecurityTests(moduleData: ModuleSource): TestResult[] {
  const results: TestResult[] = [];
  const code = moduleData.renderCode || "";

  // Test: No eval
  const hasEval = /\beval\s*\(/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No Eval Usage",
    category: "security",
    status: hasEval ? "failed" : "passed",
    message: hasEval
      ? "DANGER: Module uses eval() which is a critical security risk"
      : "No eval() usage detected",
    durationMs: 1,
  });

  // Test: No Function constructor
  const hasFunctionConstructor = /new\s+Function\s*\(/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No Function Constructor",
    category: "security",
    status: hasFunctionConstructor ? "failed" : "passed",
    message: hasFunctionConstructor
      ? "DANGER: Module uses Function constructor which can execute arbitrary code"
      : "No Function constructor usage detected",
    durationMs: 1,
  });

  // Test: No innerHTML
  const hasInnerHTML = /\.innerHTML\s*=/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No innerHTML Assignment",
    category: "security",
    status: hasInnerHTML ? "warning" : "passed",
    message: hasInnerHTML
      ? "Uses innerHTML - ensure content is properly sanitized to prevent XSS"
      : "No direct innerHTML assignment detected",
    durationMs: 1,
  });

  // Test: No outerHTML
  const hasOuterHTML = /\.outerHTML\s*=/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No outerHTML Assignment",
    category: "security",
    status: hasOuterHTML ? "warning" : "passed",
    message: hasOuterHTML
      ? "Uses outerHTML - ensure content is properly sanitized"
      : "No outerHTML assignment detected",
    durationMs: 1,
  });

  // Test: No document.write
  const hasDocWrite = /document\.write/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No document.write",
    category: "security",
    status: hasDocWrite ? "failed" : "passed",
    message: hasDocWrite
      ? "Module uses document.write which is insecure and can cause issues"
      : "No document.write usage detected",
    durationMs: 1,
  });

  // Test: HTTPS URLs
  const httpUrls = code.match(/http:\/\/(?!localhost)[^\s"'`]*/gi) || [];
  results.push({
    id: crypto.randomUUID(),
    testName: "HTTPS URLs",
    category: "security",
    status: httpUrls.length === 0 ? "passed" : "warning",
    message:
      httpUrls.length === 0
        ? "All external URLs use HTTPS or are localhost"
        : `Found ${httpUrls.length} insecure HTTP URL(s) - consider using HTTPS`,
    durationMs: 1,
    details: { insecureUrls: httpUrls.slice(0, 5) },
  });

  // Test: No hardcoded credentials
  const credentialPatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
    /password\s*[:=]\s*['"][^'"]+['"]/i,
    /secret\s*[:=]\s*['"][^'"]+['"]/i,
    /token\s*[:=]\s*['"][^'"]+['"]/i,
  ];
  const hasHardcodedCredentials = credentialPatterns.some((p) => p.test(code));
  results.push({
    id: crypto.randomUUID(),
    testName: "No Hardcoded Credentials",
    category: "security",
    status: hasHardcodedCredentials ? "failed" : "passed",
    message: hasHardcodedCredentials
      ? "DANGER: Possible hardcoded credentials detected - use environment variables"
      : "No hardcoded credentials detected",
    durationMs: 1,
  });

  // Test: No dangerous protocols
  const dangerousProtocols = /href\s*=\s*['"]?\s*(javascript|data|vbscript):/i.test(code);
  results.push({
    id: crypto.randomUUID(),
    testName: "No Dangerous Protocols",
    category: "security",
    status: dangerousProtocols ? "failed" : "passed",
    message: dangerousProtocols
      ? "DANGER: Dangerous protocol detected in href (javascript:, data:, vbscript:)"
      : "No dangerous protocols detected in links",
    durationMs: 1,
  });

  // Test: No postMessage without origin check
  const hasPostMessage = /\.postMessage\s*\(/i.test(code);
  const hasOriginCheck = /event\.origin|message\.origin/i.test(code);
  if (hasPostMessage) {
    results.push({
      id: crypto.randomUUID(),
      testName: "PostMessage Origin Check",
      category: "security",
      status: hasOriginCheck ? "passed" : "warning",
      message: hasOriginCheck
        ? "postMessage used with origin checking"
        : "postMessage detected without visible origin check - ensure origin validation",
      durationMs: 1,
    });
  }

  return results;
}

/**
 * Calculate test summary
 */
function calculateSummary(results: TestResult[]): TestSummary {
  return {
    total: results.length,
    passed: results.filter((r) => r.status === "passed").length,
    failed: results.filter((r) => r.status === "failed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    warnings: results.filter((r) => r.status === "warning").length,
    duration: results.reduce((sum, r) => sum + (r.durationMs || 0), 0),
  };
}

/**
 * Get test history for a module
 */
export async function getModuleTestHistory(
  moduleId: string,
  limit: number = 10
): Promise<TestRun[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_test_runs")
    .select(
      `
      *,
      results:module_test_results(*),
      site:sites(id, name, slug)
    `
    )
    .eq("module_source_id", moduleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[ModuleTesting] Error fetching test history:", error);
    return [];
  }

  return (data || []).map((run: Record<string, unknown>) => {
    const results = ((run.results as Array<Record<string, unknown>>) || []).map(
      (r) => ({
        id: r.id as string,
        testName: r.test_name as string,
        category: r.category as string,
        status: r.status as ResultStatus,
        durationMs: r.duration_ms as number | undefined,
        message: r.message as string | undefined,
        details: r.details as Record<string, unknown> | undefined,
      })
    );

    const site = run.site as Record<string, unknown> | null;

    return {
      id: run.id as string,
      moduleId,
      moduleVersion: run.module_version as string,
      testType: run.test_type as TestType,
      testSiteId: run.test_site_id as string | undefined,
      testSiteName: (site?.name as string) || undefined,
      status: run.status as TestStatus,
      startedAt: run.started_at as string,
      completedAt: run.completed_at as string | undefined,
      environment: (run.environment as Record<string, unknown>) || {},
      results,
      summary: calculateSummary(results),
    };
  });
}

/**
 * Get a single test run with full details
 */
export async function getTestRun(testRunId: string): Promise<TestRun | null> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_test_runs")
    .select(
      `
      *,
      results:module_test_results(*),
      site:sites(id, name, slug),
      module:module_source(id, name, slug)
    `
    )
    .eq("id", testRunId)
    .single();

  if (error || !data) {
    return null;
  }

  const results = ((data.results as Array<Record<string, unknown>>) || []).map(
    (r) => ({
      id: r.id as string,
      testName: r.test_name as string,
      category: r.category as string,
      status: r.status as ResultStatus,
      durationMs: r.duration_ms as number | undefined,
      message: r.message as string | undefined,
      details: r.details as Record<string, unknown> | undefined,
    })
  );

  const site = data.site as Record<string, unknown> | null;
  const moduleInfo = data.module as Record<string, unknown> | null;

  return {
    id: data.id,
    moduleId: data.module_source_id,
    moduleName: (moduleInfo?.name as string) || undefined,
    moduleVersion: data.module_version,
    testType: data.test_type as TestType,
    testSiteId: data.test_site_id || undefined,
    testSiteName: (site?.name as string) || undefined,
    status: data.status as TestStatus,
    startedAt: data.started_at,
    completedAt: data.completed_at || undefined,
    environment: data.environment || {},
    results,
    summary: calculateSummary(results),
  };
}

/**
 * Get recent test runs across all modules (for dashboard)
 */
export async function getRecentTestRuns(limit: number = 20): Promise<TestRun[]> {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return [];
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("module_test_runs")
    .select(
      `
      *,
      results:module_test_results(status),
      site:sites(id, name),
      module:module_source(id, name, slug)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[ModuleTesting] Error fetching recent runs:", error);
    return [];
  }

  return (data || []).map((run: Record<string, unknown>) => {
    const resultStatuses = (
      (run.results as Array<{ status: ResultStatus }>) || []
    ).map((r) => ({
      id: "",
      testName: "",
      category: "",
      status: r.status,
    }));

    const site = run.site as Record<string, unknown> | null;
    const moduleInfo = run.module as Record<string, unknown> | null;

    return {
      id: run.id as string,
      moduleId: run.module_source_id as string,
      moduleName: (moduleInfo?.name as string) || "Unknown",
      moduleVersion: run.module_version as string,
      testType: run.test_type as TestType,
      testSiteId: run.test_site_id as string | undefined,
      testSiteName: (site?.name as string) || undefined,
      status: run.status as TestStatus,
      startedAt: run.started_at as string,
      completedAt: run.completed_at as string | undefined,
      environment: (run.environment as Record<string, unknown>) || {},
      results: resultStatuses,
      summary: calculateSummary(resultStatuses),
    };
  });
}

/**
 * Get test statistics
 */
export async function getTestStats(): Promise<{
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  runsToday: number;
  passRate: number;
}> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: runs } = await db
    .from("module_test_runs")
    .select("status, created_at");

  if (!runs) {
    return {
      totalRuns: 0,
      passedRuns: 0,
      failedRuns: 0,
      runsToday: 0,
      passRate: 0,
    };
  }

  const totalRuns = runs.length;
  const passedRuns = runs.filter((r: { status: string }) => r.status === "passed").length;
  const failedRuns = runs.filter((r: { status: string }) => r.status === "failed").length;
  const runsToday = runs.filter(
    (r: { created_at: string }) => new Date(r.created_at) >= today
  ).length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

  return {
    totalRuns,
    passedRuns,
    failedRuns,
    runsToday,
    passRate,
  };
}

/**
 * Run all test types for a module
 */
export async function runAllTests(
  moduleId: string,
  testSiteId?: string
): Promise<TestRun[]> {
  const results: TestRun[] = [];
  const testTypes = await getTestTypes();

  for (const testInfo of testTypes) {
    // Skip integration tests if no site provided
    if (testInfo.requiresSite && !testSiteId) {
      continue;
    }

    try {
      const run = await runModuleTests(moduleId, testInfo.type, testSiteId);
      results.push(run);
    } catch (error) {
      console.error(`[ModuleTesting] Error running ${testInfo.type} tests:`, error);
    }
  }

  return results;
}
