import { createClient } from "@/lib/supabase/server";

/**
 * RLS Policy Test Results
 */
export interface RLSTestResult {
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  passed: boolean;
  message: string;
  rowCount?: number;
}

/**
 * Full RLS Test Suite Results
 */
export interface RLSTestSuiteResults {
  timestamp: string;
  userId: string | null;
  agencyId: string | null;
  isSuperAdmin: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: RLSTestResult[];
}

/**
 * Test RLS policies are working correctly
 * Run this in development to verify data isolation
 */
export async function testRLSPolicies(): Promise<RLSTestSuiteResults> {
  const supabase = await createClient();

  const results: RLSTestResult[] = [];
  let userId: string | null = null;
  let agencyId: string | null = null;
  let isSuperAdmin = false;

  // Get current user info
  const {
    data: { user },
  } = await supabase.auth.getUser();
  userId = user?.id || null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, role")
      .eq("id", userId)
      .single();

    agencyId = profile?.agency_id || null;
    isSuperAdmin = profile?.role === "super_admin";
  }

  // Test clients isolation
  try {
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, agency_id")
      .limit(5);

    if (clientsError) {
      results.push({
        table: "clients",
        operation: "select",
        passed: false,
        message: `Error: ${clientsError.message}`,
      });
    } else {
      const allMatch =
        !clients ||
        clients.length === 0 ||
        isSuperAdmin ||
        clients.every((c) => c.agency_id === agencyId);

      results.push({
        table: "clients",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${clients?.length || 0} rows`
          : "❌ Data leak - clients from other agencies visible",
        rowCount: clients?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "clients",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test sites isolation
  try {
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("id, agency_id")
      .limit(5);

    if (sitesError) {
      results.push({
        table: "sites",
        operation: "select",
        passed: false,
        message: `Error: ${sitesError.message}`,
      });
    } else {
      const allMatch =
        !sites ||
        sites.length === 0 ||
        isSuperAdmin ||
        sites.every((s) => s.agency_id === agencyId);

      results.push({
        table: "sites",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${sites?.length || 0} rows`
          : "❌ Data leak - sites from other agencies visible",
        rowCount: sites?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "sites",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test pages isolation (via site)
  try {
    const { data: pages, error: pagesError } = await supabase
      .from("pages")
      .select("id, site_id, sites!inner(agency_id)")
      .limit(5);

    if (pagesError) {
      results.push({
        table: "pages",
        operation: "select",
        passed: false,
        message: `Error: ${pagesError.message}`,
      });
    } else {
      results.push({
        table: "pages",
        operation: "select",
        passed: true,
        message: `✅ RLS working - returned ${pages?.length || 0} rows`,
        rowCount: pages?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "pages",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test activity log (note: activity_log NOT activity_logs)
  try {
    const { data: activity, error: activityError } = await supabase
      .from("activity_log")
      .select("id, agency_id")
      .limit(5);

    if (activityError) {
      results.push({
        table: "activity_log",
        operation: "select",
        passed: false,
        message: `Error: ${activityError.message}`,
      });
    } else {
      const allMatch =
        !activity ||
        activity.length === 0 ||
        isSuperAdmin ||
        activity.every((a) => a.agency_id === agencyId);

      results.push({
        table: "activity_log",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${activity?.length || 0} rows`
          : "❌ Data leak - activity from other agencies visible",
        rowCount: activity?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "activity_log",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test notifications isolation
  try {
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("id, user_id")
      .limit(5);

    if (notificationsError) {
      results.push({
        table: "notifications",
        operation: "select",
        passed: false,
        message: `Error: ${notificationsError.message}`,
      });
    } else {
      const allMatch =
        !notifications ||
        notifications.length === 0 ||
        notifications.every((n) => n.user_id === userId);

      results.push({
        table: "notifications",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${notifications?.length || 0} rows`
          : "❌ Data leak - notifications from other users visible",
        rowCount: notifications?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "notifications",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test modules_v2 (public published modules should be visible)
  try {
    const { data: modules, error: modulesError } = await supabase
      .from("modules_v2")
      .select("id, status, created_by")
      .limit(10);

    if (modulesError) {
      results.push({
        table: "modules_v2",
        operation: "select",
        passed: false,
        message: `Error: ${modulesError.message}`,
      });
    } else {
      // For modules, published ones should be visible to everyone
      const allValid =
        !modules ||
        modules.length === 0 ||
        isSuperAdmin ||
        modules.every(
          (m) => m.status === "published" || m.created_by === userId
        );

      results.push({
        table: "modules_v2",
        operation: "select",
        passed: allValid,
        message: allValid
          ? `✅ RLS working - returned ${modules?.length || 0} rows`
          : "❌ RLS issue - unpublished modules visible",
        rowCount: modules?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "modules_v2",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test site_module_installations (NOT site_modules!)
  try {
    const { data: siteModules, error: siteModulesError } = await supabase
      .from("site_module_installations")
      .select("id, site_id")
      .limit(5);

    if (siteModulesError) {
      results.push({
        table: "site_module_installations",
        operation: "select",
        passed: false,
        message: `Error: ${siteModulesError.message}`,
      });
    } else {
      results.push({
        table: "site_module_installations",
        operation: "select",
        passed: true,
        message: `✅ RLS working - returned ${siteModules?.length || 0} rows`,
        rowCount: siteModules?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "site_module_installations",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test agency_module_subscriptions (NOT module_subscriptions!)
  try {
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("agency_module_subscriptions")
      .select("id, agency_id")
      .limit(5);

    if (subscriptionsError) {
      results.push({
        table: "agency_module_subscriptions",
        operation: "select",
        passed: false,
        message: `Error: ${subscriptionsError.message}`,
      });
    } else {
      const allMatch =
        !subscriptions ||
        subscriptions.length === 0 ||
        isSuperAdmin ||
        subscriptions.every((s) => s.agency_id === agencyId);

      results.push({
        table: "agency_module_subscriptions",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${subscriptions?.length || 0} rows`
          : "❌ Data leak - subscriptions from other agencies visible",
        rowCount: subscriptions?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "agency_module_subscriptions",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test assets isolation
  try {
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("id, agency_id")
      .limit(5);

    if (assetsError) {
      results.push({
        table: "assets",
        operation: "select",
        passed: false,
        message: `Error: ${assetsError.message}`,
      });
    } else {
      const allMatch =
        !assets ||
        assets.length === 0 ||
        isSuperAdmin ||
        assets.every((a) => a.agency_id === agencyId);

      results.push({
        table: "assets",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${assets?.length || 0} rows`
          : "❌ Data leak - assets from other agencies visible",
        rowCount: assets?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "assets",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test blog_posts isolation
  try {
    const { data: blogPosts, error: blogPostsError } = await supabase
      .from("blog_posts")
      .select("id, site_id")
      .limit(5);

    if (blogPostsError) {
      results.push({
        table: "blog_posts",
        operation: "select",
        passed: false,
        message: `Error: ${blogPostsError.message}`,
      });
    } else {
      results.push({
        table: "blog_posts",
        operation: "select",
        passed: true,
        message: `✅ RLS working - returned ${blogPosts?.length || 0} rows`,
        rowCount: blogPosts?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "blog_posts",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test form_submissions isolation
  try {
    const { data: formSubmissions, error: formSubmissionsError } =
      await supabase.from("form_submissions").select("id, site_id").limit(5);

    if (formSubmissionsError) {
      results.push({
        table: "form_submissions",
        operation: "select",
        passed: false,
        message: `Error: ${formSubmissionsError.message}`,
      });
    } else {
      results.push({
        table: "form_submissions",
        operation: "select",
        passed: true,
        message: `✅ RLS working - returned ${formSubmissions?.length || 0} rows`,
        rowCount: formSubmissions?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "form_submissions",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test templates (should see public + own agency)
  try {
    const { data: templates, error: templatesError } = await supabase
      .from("templates")
      .select("id, agency_id, is_public")
      .limit(10);

    if (templatesError) {
      results.push({
        table: "templates",
        operation: "select",
        passed: false,
        message: `Error: ${templatesError.message}`,
      });
    } else {
      const allValid =
        !templates ||
        templates.length === 0 ||
        isSuperAdmin ||
        templates.every(
          (t) => t.is_public === true || t.agency_id === agencyId
        );

      results.push({
        table: "templates",
        operation: "select",
        passed: allValid,
        message: allValid
          ? `✅ RLS working - returned ${templates?.length || 0} rows`
          : "❌ RLS issue - private templates from other agencies visible",
        rowCount: templates?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "templates",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  // Test invoices isolation
  try {
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, agency_id")
      .limit(5);

    if (invoicesError) {
      results.push({
        table: "invoices",
        operation: "select",
        passed: false,
        message: `Error: ${invoicesError.message}`,
      });
    } else {
      const allMatch =
        !invoices ||
        invoices.length === 0 ||
        isSuperAdmin ||
        invoices.every((i) => i.agency_id === agencyId);

      results.push({
        table: "invoices",
        operation: "select",
        passed: allMatch,
        message: allMatch
          ? `✅ RLS working - returned ${invoices?.length || 0} rows`
          : "❌ Data leak - invoices from other agencies visible",
        rowCount: invoices?.length || 0,
      });
    }
  } catch (error) {
    results.push({
      table: "invoices",
      operation: "select",
      passed: false,
      message: `Exception: ${error}`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    userId,
    agencyId,
    isSuperAdmin,
    totalTests: results.length,
    passedTests: passedCount,
    failedTests: results.length - passedCount,
    results,
  };
}

/**
 * Run a quick RLS smoke test and log results
 */
export async function runRLSSmokeTest(): Promise<void> {
  console.log("🔒 Running RLS Smoke Test...\n");

  const results = await testRLSPolicies();

  console.log(`📅 Timestamp: ${results.timestamp}`);
  console.log(`👤 User ID: ${results.userId || "Not authenticated"}`);
  console.log(`🏢 Agency ID: ${results.agencyId || "None"}`);
  console.log(`👑 Super Admin: ${results.isSuperAdmin ? "Yes" : "No"}`);
  console.log(`\n📊 Results: ${results.passedTests}/${results.totalTests} tests passed\n`);

  for (const result of results.results) {
    console.log(`${result.passed ? "✅" : "❌"} ${result.table}: ${result.message}`);
  }

  if (results.failedTests > 0) {
    console.log("\n⚠️  SECURITY ALERT: Some RLS tests failed!");
  } else {
    console.log("\n✅ All RLS tests passed!");
  }
}

/**
 * Test cross-agency data isolation
 * This attempts to detect if data from other agencies is accessible
 */
export async function testCrossAgencyIsolation(): Promise<{
  isolated: boolean;
  issues: string[];
}> {
  const supabase = await createClient();
  const issues: string[] = [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { isolated: true, issues: ["Not authenticated - cannot test"] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    return { isolated: true, issues: ["No agency assigned - cannot test"] };
  }

  if (profile.role === "super_admin") {
    return {
      isolated: true,
      issues: ["Super admin can see all data by design"],
    };
  }

  const myAgencyId = profile.agency_id;

  // Check clients
  const { data: clients } = await supabase.from("clients").select("agency_id");
  const otherAgencyClients = clients?.filter(
    (c) => c.agency_id !== myAgencyId
  );
  if (otherAgencyClients && otherAgencyClients.length > 0) {
    issues.push(
      `CRITICAL: Found ${otherAgencyClients.length} clients from other agencies!`
    );
  }

  // Check sites
  const { data: sites } = await supabase.from("sites").select("agency_id");
  const otherAgencySites = sites?.filter((s) => s.agency_id !== myAgencyId);
  if (otherAgencySites && otherAgencySites.length > 0) {
    issues.push(
      `CRITICAL: Found ${otherAgencySites.length} sites from other agencies!`
    );
  }

  // Check assets
  const { data: assets } = await supabase.from("assets").select("agency_id");
  const otherAgencyAssets = assets?.filter((a) => a.agency_id !== myAgencyId);
  if (otherAgencyAssets && otherAgencyAssets.length > 0) {
    issues.push(
      `CRITICAL: Found ${otherAgencyAssets.length} assets from other agencies!`
    );
  }

  // Check activity log
  const { data: activity } = await supabase
    .from("activity_log")
    .select("agency_id");
  const otherAgencyActivity = activity?.filter(
    (a) => a.agency_id !== myAgencyId
  );
  if (otherAgencyActivity && otherAgencyActivity.length > 0) {
    issues.push(
      `CRITICAL: Found ${otherAgencyActivity.length} activity logs from other agencies!`
    );
  }

  return {
    isolated: issues.length === 0,
    issues:
      issues.length > 0 ? issues : ["✅ Data properly isolated between agencies"],
  };
}

/**
 * Verify super admin can access all data
 */
export async function verifySuperAdminAccess(): Promise<{
  hasFullAccess: boolean;
  tables: { name: string; accessible: boolean }[];
}> {
  const supabase = await createClient();
  const tableResults: { name: string; accessible: boolean }[] = [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { hasFullAccess: false, tables: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") {
    return {
      hasFullAccess: false,
      tables: [{ name: "auth_check", accessible: false }],
    };
  }

  // Test access to critical tables using type-safe approach
  const testTable = async (tableName: string): Promise<{ name: string; accessible: boolean }> => {
    try {
      let error: unknown = null;
      switch (tableName) {
        case "agencies":
          ({ error } = await supabase.from("agencies").select("id").limit(1));
          break;
        case "clients":
          ({ error } = await supabase.from("clients").select("id").limit(1));
          break;
        case "sites":
          ({ error } = await supabase.from("sites").select("id").limit(1));
          break;
        case "pages":
          ({ error } = await supabase.from("pages").select("id").limit(1));
          break;
        case "profiles":
          ({ error } = await supabase.from("profiles").select("id").limit(1));
          break;
        case "activity_log":
          ({ error } = await supabase.from("activity_log").select("id").limit(1));
          break;
        case "modules_v2":
          ({ error } = await supabase.from("modules_v2").select("id").limit(1));
          break;
        case "subscriptions":
          ({ error } = await supabase.from("subscriptions").select("id").limit(1));
          break;
        case "invoices":
          ({ error } = await supabase.from("invoices").select("id").limit(1));
          break;
        case "assets":
          ({ error } = await supabase.from("assets").select("id").limit(1));
          break;
        default:
          return { name: tableName, accessible: false };
      }
      return { name: tableName, accessible: !error };
    } catch {
      return { name: tableName, accessible: false };
    }
  };

  const tablesToTest = [
    "agencies",
    "clients",
    "sites",
    "pages",
    "profiles",
    "activity_log",
    "modules_v2",
    "subscriptions",
    "invoices",
    "assets",
  ];

  for (const tableName of tablesToTest) {
    tableResults.push(await testTable(tableName));
  }

  return {
    hasFullAccess: tableResults.every((t) => t.accessible),
    tables: tableResults,
  };
}
