# 🐛 Phase 81B: Critical Issues Found & Fixes

## ⚠️ **Two Major Issues Discovered in Test 1**

### Issue 1: Testing Modules Visible to Regular Sites
**Problem:** Regular (non-test) sites CAN see testing module cards in marketplace, but get "not found" when clicking.

**Expected:** Testing modules should be completely invisible to regular sites.

**Current Behavior:**
- ✅ Cards appear in marketplace grid
- ❌ Clicking leads to "not found" page
- Result: Poor UX, confusing users

### Issue 2: No "BETA" Badge on Module Cards
**Problem:** Testing/beta modules don't show a badge on the marketplace grid cards.

**Expected:** BETA badge should be visible on cards before clicking.

**Current Behavior:**
- ❌ No badge on marketplace grid cards
- ✅ Badge shows on detail page (after clicking)
- Result: Users can't identify beta modules until they click

---

## 🔍 Root Cause Analysis

### Why These Bugs Exist

#### **Issue 1: Missing Filtering Logic**

**File: `src/app/(dashboard)/marketplace/page.tsx`**
```typescript
// Line 36-40: Only filters by status = "active"
let query = supabase
  .from("modules_v2" as any)
  .select("*")
  .eq("status", "active")  // ❌ Shows ALL active modules
  .order("is_featured", { ascending: false })
  .order("install_count", { ascending: false });
```

**Problem:** 
- Queries `modules_v2` which includes testing modules
- Only filters by `status = "active"`
- Doesn't check:
  - User's agency beta enrollment
  - Site's test site configuration
  - Module's actual status (testing vs published)

**File: `src/lib/modules/module-registry-server.ts`**
```typescript
// Line 235-237: Fetches testing modules for detail page
const { data: studioModule, error: studioError } = await db
  .from("module_source")
  .select("*")
  .or(`module_id.eq.${moduleIdOrSlug},slug.eq.${moduleIdOrSlug}`)
  .in("status", ["published", "testing"])  // ❌ Includes testing
  .single();
```

**Problem:**
- Detail page loads testing modules
- Then checks if user can access (returns null if not)
- But card was already shown in grid
- Creates "not found" when clicking

#### **Issue 2: Missing Badge in Grid**

**File: `src/components/modules/marketplace/marketplace-grid.tsx`**
```typescript
// Line 92-97: Shows "Studio" badge but not "Beta"
{isStudioModule && (
  <Badge variant="secondary" className="text-xs">
    <Sparkles className="h-3 w-3 mr-1" />
    Studio
  </Badge>
)}
```

**Problem:**
- Component has `source` field (catalog/studio)
- Does NOT have `status` field (published/testing)
- Can't determine if module is beta
- Shows "Studio" badge but not "Beta" badge

---

## ✅ **Complete Fixes**

### Fix 1: Filter Testing Modules from Marketplace Grid

**File: `src/app/(dashboard)/marketplace/page.tsx`**

**Add beta enrollment and test site checks:**

```typescript
// After line 32, add user context checks
const supabase = await createClient();

// Get current user's agency
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("agency_id")
  .eq("id", user?.id || "")
  .single();

// Check if user's agency is enrolled in beta program
const { data: betaEnrollment } = profile?.agency_id 
  ? await supabase
      .from("beta_enrollment")
      .select("*")
      .eq("agency_id", profile.agency_id)
      .eq("is_active", true)
      .single()
  : { data: null };

const isBetaAgency = !!betaEnrollment;
const betaTier = betaEnrollment?.beta_tier || "standard";
```

**Then filter modules based on status:**

```typescript
// After fetching modules (around line 50)
const { data: modules } = await query;

// FILTER OUT testing modules if user is not in beta program
let filteredModules = modules || [];

if (!isBetaAgency) {
  // Regular users: Only show published modules (status = active in modules_v2)
  // Testing modules in module_source should not be visible
  
  // Get all testing module slugs from module_source
  const { data: testingModules } = await supabase
    .from("module_source")
    .select("slug")
    .eq("status", "testing");
  
  const testingSlugs = new Set(testingModules?.map(m => m.slug) || []);
  
  // Filter out testing modules
  filteredModules = filteredModules.filter((m: any) => !testingSlugs.has(m.slug));
} else {
  // Beta users: Apply tier-specific filtering
  if (betaTier === "standard") {
    // Standard tier: Only opted-in modules
    const acceptedModules = betaEnrollment.accepted_modules || [];
    
    // Get testing module slugs
    const { data: testingModules } = await supabase
      .from("module_source")
      .select("slug")
      .eq("status", "testing");
    
    const testingSlugs = new Set(testingModules?.map(m => m.slug) || []);
    
    // Filter: show published OR (testing AND opted-in)
    filteredModules = filteredModules.filter((m: any) => {
      if (!testingSlugs.has(m.slug)) return true; // Published module
      return acceptedModules.includes(m.slug); // Testing module - check opt-in
    });
  }
  // Internal/Alpha/Early Access: Show all (no filtering needed)
}

// Use filteredModules instead of modules for the rest of the page
```

---

### Fix 2: Add Beta Badge to Module Cards

**File: `src/app/(dashboard)/marketplace/page.tsx`**

**Enhance module data to include status:**

```typescript
// Around line 72-84, enhance module formatting
// First, get testing module statuses
const { data: testingModules } = await supabase
  .from("module_source")
  .select("slug, status")
  .eq("status", "testing");

const testingModuleMap = new Map(
  testingModules?.map(m => [m.slug, m.status]) || []
);

// Convert modules to expected format (includes source AND status)
const formattedModules = (filteredModules as any[] || []).map((m: any) => ({
  id: m.id,
  slug: m.slug,
  name: m.name,
  description: m.description,
  icon: m.icon || "📦",
  category: m.category,
  install_level: m.install_level,
  wholesale_price_monthly: m.wholesale_price_monthly,
  install_count: m.install_count || 0,
  rating_average: m.rating_average,
  is_featured: m.is_featured,
  source: m.source || "catalog",
  status: testingModuleMap.has(m.slug) ? "testing" : "published", // ✅ Add status
}));
```

**File: `src/components/modules/marketplace/marketplace-grid.tsx`**

**Update interface and add beta badge:**

```typescript
// Line 6-20: Update interface
interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  install_level: string;
  wholesale_price_monthly: number | null;
  install_count: number;
  rating_average: number | null;
  is_featured: boolean;
  source?: string; // 'catalog' or 'studio'
  status?: string; // ✅ ADD THIS: 'published' or 'testing'
}
```

**Add beta badge in render (around line 67-70):**

```typescript
// Inside the card render (around line 95)
{isStudioModule && (
  <Badge variant="secondary" className="text-xs">
    <Sparkles className="h-3 w-3 mr-1" />
    Studio
  </Badge>
)}
{module.status === "testing" && (
  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
    <FlaskConical className="h-3 w-3 mr-1" />
    Beta
  </Badge>
)}
```

**Import FlaskConical:**

```typescript
// Line 2: Update imports
import { Package, Users, Building2, Globe, Check, Sparkles, FlaskConical } from "lucide-react";
```

---

### Fix 3: Better Detail Page Error Handling

**File: `src/lib/modules/module-registry-server.ts`**

**Add permission check for testing modules:**

```typescript
// Around line 235-270, enhance studio module fetching
const { data: studioModule, error: studioError } = await db
  .from("module_source")
  .select("*")
  .or(`module_id.eq.${moduleIdOrSlug},slug.eq.${moduleIdOrSlug}`)
  .in("status", ["published", "testing"])
  .single();

if (!studioError && studioModule) {
  // ✅ ADD: Check if user can access testing modules
  if (studioModule.status === "testing") {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await db
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();
      
      if (profile?.agency_id) {
        const { data: betaEnrollment } = await db
          .from("beta_enrollment")
          .select("*")
          .eq("agency_id", profile.agency_id)
          .eq("is_active", true)
          .single();
        
        // If not enrolled in beta, return null (module not found)
        if (!betaEnrollment) {
          return null;
        }
        
        // Check tier-specific access
        if (betaEnrollment.beta_tier === "standard") {
          const acceptedModules = betaEnrollment.accepted_modules || [];
          if (!acceptedModules.includes(studioModule.slug)) {
            return null; // Not opted in
          }
        }
      } else {
        return null; // No agency
      }
    } else {
      return null; // Not logged in
    }
  }
  
  // If we got here, user can access the module
  return {
    id: studioModule.module_id as string,
    name: studioModule.name as string,
    slug: studioModule.slug as string,
    description: (studioModule.description as string) || "",
    icon: (studioModule.icon as string) || "📦",
    category: (studioModule.category as ModuleCategory) || "other",
    version: (studioModule.published_version || studioModule.latest_version || "1.0.0") as string,
    status: studioModule.status === "testing" ? "beta" : "active",
    tags: studioModule.status === "testing" ? ["testing", "beta"] : [], // ✅ Add beta tag
    pricing: {
      type: "free",
      amount: 0,
      currency: "USD",
    },
    author: {
      name: "DRAMAC",
      verified: true,
    },
    createdAt: new Date(studioModule.created_at as string),
    updatedAt: new Date(studioModule.updated_at as string),
    installCount: 0,
    source: "studio" as const,
    renderCode: studioModule.render_code as string,
    styles: studioModule.styles as string,
    settingsSchema: studioModule.settings_schema as Record<string, unknown> || {},
    defaultSettings: studioModule.default_settings as Record<string, unknown> || {},
    dependencies: (studioModule.dependencies as string[]) || [],
  };
}
```

---

## 📝 Implementation Checklist

- [ ] **Update marketplace page query** to include beta enrollment check
- [ ] **Add filtering logic** for testing modules based on beta status
- [ ] **Enhance module data** to include status field
- [ ] **Update marketplace grid interface** to include status
- [ ] **Add beta badge** to module cards in grid
- [ ] **Import FlaskConical icon** in grid component
- [ ] **Add permission checks** to module detail fetching
- [ ] **Add "beta" tag** to testing module definitions
- [ ] **Test with beta user** - should see beta modules with badges
- [ ] **Test with regular user** - should NOT see testing modules at all

---

## 🧪 How to Test After Fixing

### Test 1: Regular User (No Beta Access)
```sql
-- Ensure user's agency is NOT in beta
SELECT * FROM beta_enrollment WHERE agency_id = 'YOUR_AGENCY_ID';
-- Should return NO rows
```

1. Login as regular user
2. Go to `/marketplace`
3. **Expected:** NO testing modules visible
4. Try direct URL to testing module
5. **Expected:** 404 Not Found (proper error, not misleading)

### Test 2: Beta User (Standard Tier, Not Opted In)
```sql
-- Set to standard tier
UPDATE beta_enrollment 
SET beta_tier = 'standard',
    accepted_modules = ARRAY[]::TEXT[]
WHERE agency_id = 'YOUR_AGENCY_ID';
```

1. Login as beta user
2. Go to `/marketplace`
3. **Expected:** NO testing modules visible (haven't opted in)
4. Testing modules completely hidden

### Test 3: Beta User (Standard Tier, Opted In)
```sql
-- Opt into a specific testing module
UPDATE beta_enrollment 
SET accepted_modules = ARRAY['your-test-module-slug']
WHERE agency_id = 'YOUR_AGENCY_ID';
```

1. Login as beta user
2. Go to `/marketplace`
3. **Expected:** Testing module visible WITH beta badge on card
4. Click module
5. **Expected:** Detail page loads with beta indicator
6. Can install module

### Test 4: Beta User (Internal/Alpha Tier)
```sql
UPDATE beta_enrollment 
SET beta_tier = 'internal'
WHERE agency_id = 'YOUR_AGENCY_ID';
```

1. Login as internal beta user
2. Go to `/marketplace`
3. **Expected:** ALL testing modules visible with beta badges
4. No opt-in required
5. All modules clickable and installable

### Test 5: Visual Verification
- [ ] Beta badge appears on cards BEFORE clicking
- [ ] Badge style matches testing theme (yellow/orange)
- [ ] Badge includes icon (FlaskConical)
- [ ] Testing modules not visible to non-beta users
- [ ] No "not found" errors when filtering works correctly

---

## 🎨 Beta Badge Design

**Recommended Style:**
```typescript
<Badge 
  variant="outline" 
  className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
>
  <FlaskConical className="h-3 w-3 mr-1" />
  Beta
</Badge>
```

**Visual:**
- Light mode: Yellow background, dark yellow text
- Dark mode: Dark yellow background, light yellow text
- Icon: FlaskConical (lab flask) to indicate testing
- Position: Next to "Studio" badge if present

---

## 🚨 Priority: CRITICAL

These are **blocker bugs** for Phase 81B:

1. **Security:** Testing modules visible to unauthorized users
2. **UX:** Misleading "not found" errors
3. **Usability:** Can't identify beta modules without clicking

**Recommendation:** Fix all three issues before proceeding with further Phase 81B testing.

---

## 📊 Impact Assessment

| Issue | Severity | Impact | User Experience |
|-------|----------|--------|----------------|
| Testing modules visible | 🔴 Critical | Security/Access Control | Users see modules they can't use |
| No beta badge on cards | 🟡 High | Usability | Can't identify beta modules |
| "Not found" on click | 🟡 High | UX | Confusing error messages |

---

## ✅ Success Criteria After Fix

- ✅ Regular users: NO testing modules visible
- ✅ Beta users (standard): Only opted-in testing modules visible
- ✅ Beta users (internal/alpha): All testing modules visible
- ✅ Beta badge appears on ALL testing module cards
- ✅ No "not found" errors when filtering works
- ✅ Consistent experience: card visibility = detail page access

---

## 🔗 Related Files

- `/src/app/(dashboard)/marketplace/page.tsx` - Main marketplace query
- `/src/components/modules/marketplace/marketplace-grid.tsx` - Card component
- `/src/lib/modules/module-registry-server.ts` - Module fetching logic
- `/src/lib/modules/beta-program.ts` - Beta enrollment logic
- `/src/lib/modules/test-site-manager.ts` - Test site logic

---

**EXCELLENT FIND! These are real bugs that need to be fixed.** 🎯
