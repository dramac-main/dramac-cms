/**
 * Post-deployment verification script
 * Run with: npx tsx scripts/verify-deploy.ts
 */

async function verifyDeployment() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  console.log(`\n🔍 Verifying deployment at ${appUrl}\n`);

  const checks = [
    { name: "Health Check", url: `${appUrl}/api/health` },
    { name: "Login Page", url: `${appUrl}/login` },
    { name: "Signup Page", url: `${appUrl}/signup` },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const response = await fetch(check.url);
      const status = response.ok ? "✅" : "❌";
      console.log(`${status} ${check.name}: ${response.status}`);

      if (!response.ok) allPassed = false;
    } catch (_error) {
      console.log(`❌ ${check.name}: Failed to connect`);
      allPassed = false;
    }
  }

  console.log(`\n${allPassed ? "✅ All checks passed!" : "❌ Some checks failed"}\n`);

  process.exit(allPassed ? 0 : 1);
}

verifyDeployment();
