# AI AGENT PROMPT: Generate WAVE 6 E-Commerce Phase Documents

---

## YOUR TASK

You are a senior software architect creating detailed PHASE implementation documents for the DRAMAC CMS E-Commerce Module. Your job is to generate **WAVE 6: Module Auto-Setup & Site Integration** - consisting of **4 comprehensive PHASE documents** that another AI agent will use to implement the code.

**IMPORTANT**: Waves 1-5 have been completed. The following is now fully implemented:

### Wave 1 ✅ - Dashboard Foundation
- ECOM-01: Dashboard Redesign & Navigation (sidebar, widgets, command palette)
- ECOM-02: Product Management Enhancement (TanStack Table, filters, bulk actions, import/export)
- ECOM-03: Settings & Configuration Center (9 settings tabs, server actions)
- ECOM-04: Order Management Enhancement (order detail dialog, timeline, refunds, invoices)
- ECOM-05: Customer Management (customer list, detail dialog, groups, notes)

### Wave 2 ✅ - Quotation System
- ECOM-10: Quotation Database Schema & Types
- ECOM-11A: Quote Server Actions
- ECOM-11B: Quote UI Components
- ECOM-12: Quote Workflow & Customer Portal
- ECOM-13: Quote Templates & Automation

### Wave 3 ✅ - Studio Components (Real Data Integration)
- ECOM-20: Core Data Hooks & Context (useStorefrontProducts, useStorefrontCart, etc.)
- ECOM-21: Product Display Components (ProductCard, ProductGrid, Gallery, QuickView)
- ECOM-22: Cart Components (AddToCart, CartDrawer, CartPage, CartSummary)
- ECOM-23: Checkout Components (CheckoutPage, OrderConfirmation, PaymentSelector)
- ECOM-24: Navigation & Discovery (CategoryNav, Search, Filters, Breadcrumbs)
- ECOM-25: Quotation Components (RequestQuoteButton, QuoteRequestBlock, QuoteDetail)

### Wave 4 ✅ - Mobile-First Optimization
- ECOM-30: Mobile Cart Experience (SwipeableCartItem, FloatingCartButton, BottomSheet)
- ECOM-31: Mobile Checkout (TouchFriendlyForms, MobilePayment, ProgressIndicator)
- ECOM-32: Mobile Product Experience (StickyAddToCart, SwipeGallery, CollapsibleDetails)

### Wave 5 ✅ - Operations & Analytics
- ECOM-40: Inventory Management (stock tracking, alerts, history)
- ECOM-41A: Analytics Schema & Server Actions
- ECOM-41B: Analytics UI Components (charts, tables, dashboards)
- ECOM-42A: Marketing Schema & Server Actions (flash sales, gift cards, bundles, loyalty)
- ECOM-42B: Marketing UI Components

---

## PHASES TO CREATE

Generate the following 4 PHASE documents:

| Phase | Title | Priority | Est. Hours |
|-------|-------|----------|------------|
| **PHASE-ECOM-50** | Module Installation Hook System | 🔴 CRITICAL | 6-8 |
| **PHASE-ECOM-51** | Auto-Page Generation & Templates | 🔴 CRITICAL | 8-10 |
| **PHASE-ECOM-52** | Navigation & Widget Auto-Setup | 🟠 HIGH | 6-8 |
| **PHASE-ECOM-53** | Onboarding Wizard & Configuration | 🟠 HIGH | 6-8 |

---

## EXISTING CODE CONTEXT

### Current E-Commerce Module Structure (After Waves 1-5)
```
src/modules/ecommerce/
├── manifest.ts                    # Module definition (573 lines)
├── index.ts                       # Main exports
├── actions/
│   ├── analytics-actions.ts       # ✅ 1200+ lines
│   ├── customer-actions.ts        # ✅ Customer CRUD
│   ├── dashboard-actions.ts       # ✅ Dashboard stats
│   ├── ecommerce-actions.ts       # ✅ Products, orders, categories, cart
│   ├── integration-actions.ts     # ✅ Webhooks, external APIs
│   ├── inventory-actions.ts       # ✅ Stock management
│   ├── marketing-actions.ts       # ✅ 800+ lines
│   ├── order-actions.ts           # ✅ Order management
│   ├── product-import-export.ts   # ✅ Bulk operations
│   ├── quote-actions.ts           # ✅ Quote CRUD
│   ├── quote-template-actions.ts  # ✅ Template management
│   ├── quote-workflow-actions.ts  # ✅ Workflow automation
│   └── settings-actions.ts        # ✅ Settings CRUD
├── hooks/
│   ├── useStorefrontProducts.ts   # ✅ Product fetching
│   ├── useStorefrontCart.ts       # ✅ Cart state
│   ├── useStorefrontCategories.ts # ✅ Category data
│   ├── useStorefrontSearch.ts     # ✅ Search functionality
│   ├── useStorefrontWishlist.ts   # ✅ Wishlist management
│   ├── useCheckout.ts             # ✅ Checkout flow
│   ├── useQuotations.ts           # ✅ Quote management
│   ├── useRecentlyViewed.ts       # ✅ Product tracking
│   ├── useMobile.ts               # ✅ Mobile detection
│   ├── useSwipeGesture.ts         # ✅ Touch gestures
│   ├── useHapticFeedback.ts       # ✅ Vibration API
│   ├── useKeyboardVisible.ts      # ✅ Keyboard detection
│   ├── useProductFilters.ts       # ✅ Filter state
│   ├── use-analytics.ts           # ✅ Analytics hooks
│   ├── use-marketing.ts           # ✅ Marketing hooks
│   ├── use-integrations.ts        # ✅ Integration hooks
│   └── index.ts
├── studio/
│   ├── components/                # 38+ studio components
│   │   ├── product-card-block.tsx
│   │   ├── product-grid-block.tsx
│   │   ├── ProductGridBlock.tsx
│   │   ├── FeaturedProductsBlock.tsx
│   │   ├── CartDrawerBlock.tsx
│   │   ├── CartPageBlock.tsx
│   │   ├── CheckoutPageBlock.tsx
│   │   ├── OrderConfirmationBlock.tsx
│   │   ├── CategoryNavBlock.tsx
│   │   ├── SearchBarBlock.tsx
│   │   ├── FilterSidebarBlock.tsx
│   │   ├── BreadcrumbBlock.tsx
│   │   ├── QuoteRequestBlock.tsx
│   │   ├── QuoteListBlock.tsx
│   │   ├── QuoteDetailBlock.tsx
│   │   ├── ProductQuickView.tsx
│   │   ├── ProductImageGallery.tsx
│   │   └── mobile/
│   │       ├── MobileCartSheet.tsx
│   │       ├── MobileProductGallery.tsx
│   │       ├── StickyAddToCartBar.tsx
│   │       └── ...
│   ├── fields/
│   │   ├── product-selector-field.tsx
│   │   └── category-selector-field.tsx
│   └── index.ts
├── components/
│   ├── views/                     # Dashboard views
│   ├── dialogs/                   # Modal dialogs
│   ├── orders/                    # Order components
│   ├── quotes/                    # Quote components
│   ├── customers/                 # Customer components
│   ├── settings/                  # Settings components
│   ├── analytics/                 # Analytics dashboards
│   ├── widgets/                   # Dashboard widgets
│   ├── tables/                    # Data tables
│   ├── filters/                   # Filter components
│   ├── bulk/                      # Bulk action components
│   └── layout/                    # Layout components
├── lib/
│   ├── settings-utils.ts
│   ├── analytics-utils.ts
│   └── quote-utils.ts
├── types/
│   ├── ecommerce-types.ts         # ~1500+ lines
│   ├── analytics-types.ts         # ~450 lines
│   └── marketing-types.ts         # ~300 lines
└── context/
    └── ecommerce-context.tsx
```

### Existing Module Installation System

The platform already has a module installation system in:
- `src/lib/modules/module-installation.ts` - Install/uninstall functions
- `src/lib/modules/module-service.ts` - Get installed modules
- `src/lib/modules/module-loader.ts` - Load module components

**Key Tables:**
- `site_module_installations` - Tracks which modules are installed on which sites
- `modules_v2` - Published marketplace modules
- `module_source` - Development/testing modules

**Current Installation Flow:**
```typescript
// src/lib/modules/module-installation.ts
export async function installModuleOnSite(
  siteId: string,
  moduleId: string,
  initialSettings?: Record<string, unknown>
): Promise<InstallResult>
```

**Missing:** Post-installation hooks to auto-configure the site!

### Existing Page Structure

Pages in DRAMAC CMS are stored in the `pages` table:
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY,
  site_id UUID REFERENCES sites(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB, -- DRAMAC Studio editor data
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'draft',
  is_homepage BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);
```

### Existing Navigation Structure

Sites have navigation stored in site settings or a dedicated nav table:
```typescript
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavigationItem[];
}
```

---

## DOCUMENT FORMAT REQUIREMENTS

Each PHASE document MUST follow this EXACT structure:

```markdown
# PHASE-ECOM-XX: [Phase Title]

> **Priority**: 🔴 CRITICAL | 🟠 HIGH
> **Estimated Time**: X-Y hours
> **Prerequisites**: [List any prior phases]
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

[2-3 sentences describing what this phase accomplishes]

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code (`src/modules/ecommerce/`)
- [ ] Verify Waves 1-5 are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

[Diagram or description of how this phase fits into the module]

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.tsx` | Create/Modify | Description |

---

## 📋 Implementation Tasks

### Task X.1: [Task Name]

**File**: `src/modules/ecommerce/path/to/file.tsx`
**Action**: Create | Modify

**Description**: [What this task accomplishes]

```typescript
// COMPLETE implementation code here
// Include ALL imports
// Include ALL TypeScript types
// Include inline comments explaining logic
// This must be copy-paste ready
```

### Task X.2: [Next Task]
[Continue with complete code for each task]

---

## 🗄️ Database Migrations (if needed)

**File**: `migrations/ecom-XX-description.sql`

```sql
-- Complete SQL migration
-- Include comments
-- Include indexes
-- Include RLS policies
```

---

## 🔧 Type Definitions

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`

```typescript
// New or modified type definitions
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] [Specific manual test 1]
- [ ] [Specific manual test 2]
- [ ] Mobile responsive check (Chrome DevTools)

---

## 🔄 Rollback Plan

If issues occur:
1. [Step to revert change 1]
2. [Step to revert change 2]
3. Run `npx tsc --noEmit` to verify clean state

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add phase completion note
- `progress.md`: Update e-commerce section

---

## ✨ Success Criteria

- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
- [ ] [Specific measurable outcome 3]
```

---

## CRITICAL REQUIREMENTS FOR ALL PHASES

### 1. Complete, Copy-Paste Ready Code
- Every code block must be COMPLETE - no placeholders like `// ... rest of code`
- Include ALL imports at the top
- Include ALL TypeScript interfaces/types
- Include inline comments explaining complex logic

### 2. Follow Existing Patterns
Study the existing code and match these patterns exactly:
- **Server Actions**: Use `'use server'` directive, NOT classes
- **Utility Functions**: Put in `lib/` folder WITHOUT `'use server'`
- **Table Prefix**: `mod_ecommod01_` for all module tables
- **Component Pattern**: Match existing components in `components/`
- **Hook Pattern**: Match existing hooks in `hooks/`

### 3. Mobile-First Responsive
- All components must work on mobile first
- Use Tailwind responsive classes (`md:`, `lg:`)
- Touch-friendly interactions (min 44px tap targets)

### 4. TypeScript Strict Mode
- All types must be explicitly defined
- No `any` types unless absolutely necessary
- Export types for reuse

---

## WAVE 6 PHASE DETAILS

### PHASE-ECOM-50: Module Installation Hook System

**Objective:** Create a hook system that triggers automatic site configuration when the e-commerce module is installed.

**Must Include:**

**Installation Hook Interface:**
```typescript
interface ModuleInstallationHook {
  moduleId: string;
  onInstall: (siteId: string, settings?: Record<string, unknown>) => Promise<InstallHookResult>;
  onUninstall: (siteId: string) => Promise<UninstallHookResult>;
  onEnable: (siteId: string) => Promise<void>;
  onDisable: (siteId: string) => Promise<void>;
}

interface InstallHookResult {
  success: boolean;
  pagesCreated?: string[];
  navItemsAdded?: string[];
  settingsApplied?: Record<string, unknown>;
  errors?: string[];
}
```

**Hook Registration System:**
```typescript
// src/lib/modules/hooks/module-hooks-registry.ts
const moduleHooks = new Map<string, ModuleInstallationHook>();

export function registerModuleHook(hook: ModuleInstallationHook): void;
export function getModuleHook(moduleId: string): ModuleInstallationHook | undefined;
export function executeInstallHook(moduleId: string, siteId: string, settings?: Record<string, unknown>): Promise<InstallHookResult>;
export function executeUninstallHook(moduleId: string, siteId: string): Promise<UninstallHookResult>;
```

**E-Commerce Installation Hook:**
```typescript
// src/modules/ecommerce/hooks/installation-hook.ts
export const ecommerceInstallationHook: ModuleInstallationHook = {
  moduleId: 'ecommerce',
  
  async onInstall(siteId, settings) {
    // 1. Create default e-commerce pages
    // 2. Add navigation items
    // 3. Apply default settings
    // 4. Create sample data (optional)
    return { success: true, pagesCreated: [...], navItemsAdded: [...] };
  },
  
  async onUninstall(siteId) {
    // 1. Remove e-commerce pages (or mark as orphaned)
    // 2. Remove navigation items
    // 3. Clean up settings
    // (Data tables preserved - user must explicitly delete)
    return { success: true };
  }
};
```

**Modify Module Installation:**
Update `src/lib/modules/module-installation.ts` to call hooks:
```typescript
export async function installModuleOnSite(siteId, moduleId, settings): Promise<InstallResult> {
  // ... existing installation code ...
  
  // NEW: Execute installation hook
  const hook = getModuleHook(moduleId);
  if (hook) {
    const hookResult = await hook.onInstall(siteId, settings);
    if (!hookResult.success) {
      // Rollback installation if hook fails
      await uninstallModuleFromSite(siteId, moduleId);
      return { success: false, error: hookResult.errors?.join(', ') };
    }
  }
  
  return { success: true, installationId, hookResult };
}
```

**Key Files to Create:**
- `src/lib/modules/hooks/module-hooks-registry.ts` (NEW)
- `src/lib/modules/hooks/types.ts` (NEW)
- `src/lib/modules/hooks/index.ts` (NEW)
- `src/modules/ecommerce/hooks/installation-hook.ts` (NEW)
- `src/lib/modules/module-installation.ts` (MODIFY)

---

### PHASE-ECOM-51: Auto-Page Generation & Templates

**Objective:** Automatically create e-commerce pages (Shop, Cart, Checkout, Product, Category) when the module is installed.

**Must Include:**

**Page Templates (DRAMAC Studio JSON format):**

Create pre-configured page templates using existing Studio components:

**1. Shop Page Template** (`/shop`):
```typescript
const shopPageTemplate: StudioPageContent = {
  root: { props: {} },
  zones: {
    'main': [
      {
        type: 'BreadcrumbBlock',
        props: { showHome: true }
      },
      {
        type: 'CategoryNavBlock',
        props: { layout: 'horizontal', showIcons: true }
      },
      {
        type: 'ProductGridBlock',
        props: {
          columns: { mobile: 2, tablet: 3, desktop: 4 },
          showFilters: true,
          showSort: true,
          productsPerPage: 12
        }
      }
    ]
  }
};
```

**2. Cart Page Template** (`/cart`):
```typescript
const cartPageTemplate: StudioPageContent = {
  root: { props: {} },
  zones: {
    'main': [
      {
        type: 'BreadcrumbBlock',
        props: { items: [{ label: 'Cart', href: '/cart' }] }
      },
      {
        type: 'CartPageBlock',
        props: {
          showRecommendations: true,
          showCouponInput: true
        }
      }
    ]
  }
};
```

**3. Checkout Page Template** (`/checkout`):
```typescript
const checkoutPageTemplate: StudioPageContent = {
  root: { props: {} },
  zones: {
    'main': [
      {
        type: 'CheckoutPageBlock',
        props: {
          steps: ['shipping', 'payment', 'review'],
          showOrderSummary: true,
          enableGuestCheckout: true
        }
      }
    ]
  }
};
```

**4. Product Detail Page Template** (`/products/[slug]`):
```typescript
const productPageTemplate: StudioPageContent = {
  root: { props: {} },
  zones: {
    'main': [
      {
        type: 'BreadcrumbBlock',
        props: { showCategory: true }
      },
      {
        type: 'ProductDetailBlock',
        props: {
          showGallery: true,
          showReviews: true,
          showRelated: true
        }
      }
    ]
  }
};
```

**5. Category Page Template** (`/categories/[slug]`):
```typescript
const categoryPageTemplate: StudioPageContent = {
  root: { props: {} },
  zones: {
    'main': [
      {
        type: 'BreadcrumbBlock',
        props: { showCategory: true }
      },
      {
        type: 'CategoryHeroBlock',
        props: { showDescription: true }
      },
      {
        type: 'ProductGridBlock',
        props: {
          filterByCategory: true,
          columns: { mobile: 2, tablet: 3, desktop: 4 }
        }
      }
    ]
  }
};
```

**Page Creation Server Action:**
```typescript
// src/modules/ecommerce/actions/auto-setup-actions.ts
'use server';

export async function createEcommercePages(siteId: string): Promise<{
  success: boolean;
  pages: { slug: string; id: string }[];
  errors?: string[];
}> {
  const pages = [
    { slug: 'shop', title: 'Shop', template: shopPageTemplate, meta_title: 'Shop - Browse Products' },
    { slug: 'cart', title: 'Shopping Cart', template: cartPageTemplate, meta_title: 'Your Cart' },
    { slug: 'checkout', title: 'Checkout', template: checkoutPageTemplate, meta_title: 'Checkout' },
    { slug: 'order-confirmation', title: 'Order Confirmed', template: orderConfirmationTemplate, meta_title: 'Order Confirmed' },
  ];
  
  // Create each page, skip if slug already exists
  for (const page of pages) {
    // Check if page exists
    // Create page with template
    // Return created page IDs
  }
}

export async function createDynamicRoutes(siteId: string): Promise<{
  success: boolean;
  routes: string[];
}> {
  // Create dynamic route handlers for:
  // - /products/[slug]
  // - /categories/[slug]
  // These may be stored in a site_routes table or handled via middleware
}
```

**Key Files to Create:**
- `src/modules/ecommerce/lib/page-templates.ts` (NEW - all templates)
- `src/modules/ecommerce/actions/auto-setup-actions.ts` (NEW)
- `src/modules/ecommerce/types/setup-types.ts` (NEW)

---

### PHASE-ECOM-52: Navigation & Widget Auto-Setup

**Objective:** Automatically add e-commerce navigation items (Shop link, Cart icon) and configure header/footer when module is installed.

**Must Include:**

**Navigation Items to Add:**

**Header Navigation:**
```typescript
const ecommerceNavItems: NavigationItem[] = [
  {
    id: 'shop',
    label: 'Shop',
    href: '/shop',
    icon: 'ShoppingBag',
    position: 'main' // Main nav
  },
  {
    id: 'cart',
    label: 'Cart',
    href: '/cart',
    icon: 'ShoppingCart',
    position: 'utility', // Utility nav (header right)
    badge: '{{cartCount}}' // Dynamic badge
  }
];
```

**Footer Links:**
```typescript
const ecommerceFooterLinks = [
  { label: 'Shop All', href: '/shop' },
  { label: 'Categories', href: '/shop#categories' },
  { label: 'My Cart', href: '/cart' },
  { label: 'Track Order', href: '/order-tracking' }
];
```

**Cart Icon Component (for header):**
```typescript
// src/modules/ecommerce/studio/components/CartIconWidget.tsx
// Mini cart icon that shows item count
// Clicking opens cart drawer or navigates to cart page
// Real-time updates via useStorefrontCart hook
```

**Navigation Update Server Action:**
```typescript
// src/modules/ecommerce/actions/auto-setup-actions.ts

export async function addEcommerceNavigation(siteId: string): Promise<{
  success: boolean;
  itemsAdded: string[];
}> {
  // 1. Get current site navigation from settings
  // 2. Add Shop link to main nav (before Contact if exists, or at end)
  // 3. Add Cart icon to utility nav
  // 4. Add footer links to footer settings
  // 5. Save updated navigation
}

export async function removeEcommerceNavigation(siteId: string): Promise<{
  success: boolean;
  itemsRemoved: string[];
}> {
  // Remove e-commerce nav items on uninstall
}
```

**Site Header/Footer Integration:**

Modify site header component to:
1. Check if e-commerce module is installed
2. If installed, show cart icon widget
3. Cart icon shows badge with item count
4. Click opens CartDrawer or navigates to /cart

```typescript
// Example header integration
function SiteHeader({ siteId }) {
  const { isInstalled } = useModuleStatus('ecommerce', siteId);
  
  return (
    <header>
      <nav>{/* Main navigation */}</nav>
      <div className="utility-nav">
        {isInstalled && <CartIconWidget siteId={siteId} />}
      </div>
    </header>
  );
}
```

**Key Files to Create:**
- `src/modules/ecommerce/studio/components/CartIconWidget.tsx` (NEW)
- `src/modules/ecommerce/actions/auto-setup-actions.ts` (MODIFY - add nav functions)
- `src/modules/ecommerce/lib/navigation-templates.ts` (NEW)

---

### PHASE-ECOM-53: Onboarding Wizard & Configuration

**Objective:** Create an onboarding wizard that guides users through initial store setup after module installation.

**Must Include:**

**Onboarding Wizard Steps:**

**Step 1: Store Basics**
- Store name
- Store logo upload
- Store description
- Contact email
- Business address (optional)

**Step 2: Currency & Tax**
- Primary currency selection
- Tax settings (rate, regions)
- Price display format

**Step 3: Shipping Setup**
- Shipping zones (or "We'll help you set this up later")
- Free shipping threshold
- Default shipping rate

**Step 4: Payment Configuration**
- Payment provider selection (Flutterwave, Pesapal, Paddle, Manual)
- Quick connect buttons
- "Configure later" option

**Step 5: First Product (Optional)**
- Quick product creation form
- OR "Import products" option
- OR "Skip for now"

**Step 6: Launch Checklist**
- Show what was configured
- Links to detailed settings
- "Go to Dashboard" button

**Wizard Component:**
```typescript
// src/modules/ecommerce/components/onboarding/OnboardingWizard.tsx
export function OnboardingWizard({ siteId, onComplete }: {
  siteId: string;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  
  const steps = [
    { id: 1, title: 'Store Basics', component: StoreBasicsStep },
    { id: 2, title: 'Currency & Tax', component: CurrencyTaxStep },
    { id: 3, title: 'Shipping', component: ShippingStep },
    { id: 4, title: 'Payments', component: PaymentsStep },
    { id: 5, title: 'First Product', component: FirstProductStep },
    { id: 6, title: 'Ready to Launch', component: LaunchStep },
  ];
  
  // Progress indicator, back/next buttons, skip option
}
```

**Onboarding State Tracking:**
```typescript
// Track onboarding progress in module settings
interface EcommerceModuleSettings {
  onboarding_completed: boolean;
  onboarding_step: number;
  onboarding_data: Partial<OnboardingData>;
  setup_checklist: {
    store_configured: boolean;
    currency_set: boolean;
    shipping_configured: boolean;
    payment_connected: boolean;
    first_product_added: boolean;
  };
}
```

**Auto-Show Onboarding:**
```typescript
// When user navigates to e-commerce dashboard after install:
function EcommerceDashboard({ siteId }) {
  const { settings } = useModuleSettings(siteId, 'ecommerce');
  const [showOnboarding, setShowOnboarding] = useState(!settings?.onboarding_completed);
  
  if (showOnboarding) {
    return <OnboardingWizard siteId={siteId} onComplete={() => setShowOnboarding(false)} />;
  }
  
  return <EcommerceDashboardView siteId={siteId} />;
}
```

**Server Actions:**
```typescript
// src/modules/ecommerce/actions/onboarding-actions.ts
'use server';

export async function saveOnboardingStep(
  siteId: string,
  step: number,
  data: Partial<OnboardingData>
): Promise<{ success: boolean }>;

export async function completeOnboarding(
  siteId: string,
  data: OnboardingData
): Promise<{ success: boolean }>;

export async function getOnboardingStatus(
  siteId: string
): Promise<{ completed: boolean; currentStep: number; data: Partial<OnboardingData> }>;

export async function skipOnboarding(
  siteId: string
): Promise<{ success: boolean }>;
```

**Key Files to Create:**
- `src/modules/ecommerce/components/onboarding/OnboardingWizard.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/steps/StoreBasicsStep.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/steps/CurrencyTaxStep.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/steps/ShippingStep.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/steps/PaymentsStep.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/steps/FirstProductStep.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/steps/LaunchStep.tsx` (NEW)
- `src/modules/ecommerce/components/onboarding/index.ts` (NEW)
- `src/modules/ecommerce/actions/onboarding-actions.ts` (NEW)
- `src/modules/ecommerce/types/onboarding-types.ts` (NEW)

---

## OUTPUT FORMAT

Generate each phase as a SEPARATE document with clear headers. Output them in order:

1. First output `PHASE-ECOM-50-INSTALLATION-HOOKS.md`
2. Then output `PHASE-ECOM-51-AUTO-PAGE-GENERATION.md`
3. Then output `PHASE-ECOM-52-NAVIGATION-SETUP.md`
4. Finally output `PHASE-ECOM-53-ONBOARDING-WIZARD.md`

Each document should be complete and ready for an implementing AI agent to execute.

---

## ADDITIONAL CONTEXT

### Existing Studio Page Content Format

DRAMAC Studio stores page content as JSONB:
```typescript
interface StudioPageContent {
  root: {
    props: Record<string, unknown>;
  };
  zones: {
    [zoneName: string]: StudioComponent[];
  };
}

interface StudioComponent {
  type: string; // Component type name
  props: Record<string, unknown>; // Component props
}
```

### Module Settings Storage

Module settings are stored in `site_module_installations.settings`:
```typescript
const { data } = await supabase
  .from('site_module_installations')
  .select('settings')
  .eq('site_id', siteId)
  .eq('module_id', moduleId)
  .single();
```

### Site Navigation Storage

Site navigation is typically stored in `sites.settings` or a dedicated `site_navigation` table:
```typescript
interface SiteSettings {
  navigation: {
    main: NavigationItem[];
    utility: NavigationItem[];
    footer: FooterSection[];
  };
  // ...other settings
}
```

---

**NOW GENERATE ALL 4 WAVE 6 PHASE DOCUMENTS WITH COMPLETE, IMPLEMENTATION-READY CODE.**
