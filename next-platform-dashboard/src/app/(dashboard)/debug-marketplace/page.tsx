import { createClient } from "@/lib/supabase/server";

export default async function DebugMarketplacePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, agency:agencies(*)")
    .eq("id", user?.id || "")
    .single();

  const { data: betaEnrollment } = profile?.agency_id
    ? await supabase
        .from("beta_enrollment" as any)
        .select("*")
        .eq("agency_id", profile.agency_id)
        .eq("is_active", true)
        .single()
    : { data: null };

  const { data: testSites } = profile?.agency_id
    ? await supabase
        .from("test_site_configuration" as any)
        .select("*, sites!inner(*)")
        .eq("is_active", true)
        .eq("sites.agency_id", profile.agency_id)
    : { data: null };

  const { data: allTestSites } = await supabase
    .from("test_site_configuration" as any)
    .select("*, sites(*)")
    .eq("is_active", true);

  const { data: testingModules } = await supabase
    .from("module_source" as any)
    .select("*")
    .eq("status", "testing") as { data: any[] | null };

  const { data: modulesV2 } = await supabase
    .from("modules_v2" as any)
    .select("*")
    .eq("status", "active") as { data: any[] | null };

  return (
    <div className="container py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Marketplace Debug Info</h1>
      
      <div className="space-y-6">
        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">User Info</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {JSON.stringify({ 
              email: user?.email,
              userId: user?.id,
              agencyId: profile?.agency_id,
              agencyName: (profile?.agency as any)?.name,
            }, null, 2)}
          </pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Beta Enrollment</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {betaEnrollment 
              ? JSON.stringify(betaEnrollment, null, 2)
              : "NOT ENROLLED IN BETA"}
          </pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Test Sites for This Agency</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {testSites && testSites.length > 0
              ? JSON.stringify(testSites, null, 2)
              : "NO TEST SITES CONFIGURED FOR THIS AGENCY"}
          </pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">ALL Test Sites (System-Wide)</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {JSON.stringify(allTestSites, null, 2)}
          </pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Testing Modules in module_source</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {testingModules && testingModules.length > 0
              ? JSON.stringify(testingModules.map(m => ({
                  id: m.id,
                  name: m.name,
                  slug: m.slug,
                  status: m.status,
                  testing_tier: m.testing_tier || "NOT SET",
                })), null, 2)
              : "NO TESTING MODULES FOUND"}
          </pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Published Modules in modules_v2</h2>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
            {modulesV2 
              ? `${modulesV2.length} modules found`
              : "NO MODULES FOUND"}
          </pre>
        </section>

        <section className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Access Summary</h2>
          <div className="space-y-2">
            <div className="p-3 bg-muted rounded">
              <strong>Can see testing modules:</strong>{" "}
              {betaEnrollment || (testSites && testSites.length > 0) ? (
                <span className="text-green-600 font-bold">YES ✓</span>
              ) : (
                <span className="text-red-600 font-bold">NO ✗</span>
              )}
            </div>
            <div className="p-3 bg-muted rounded">
              <strong>Reason:</strong>{" "}
              {betaEnrollment 
                ? `Beta enrolled (tier: ${(betaEnrollment as any).beta_tier})`
                : testSites && testSites.length > 0
                ? `Has ${testSites.length} test site(s)`
                : "No beta enrollment or test sites"}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
