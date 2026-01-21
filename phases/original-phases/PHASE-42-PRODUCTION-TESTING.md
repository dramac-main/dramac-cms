# Phase 42: Production - Testing

> **AI Model**: Claude Sonnet 4.5 (1x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md`

---

## 🎯 Objective

Set up comprehensive testing infrastructure with unit tests, integration tests, and E2E tests.

---

## 📋 Prerequisites

- [ ] Phase 41 completed
- [ ] All features implemented
- [ ] Test database available

---

## 📦 Install Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @playwright/test msw
```

---

## ✅ Tasks

### Task 42.1: Vitest Configuration

**File: `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Task 42.2: Test Setup

**File: `tests/setup.ts`**

```typescript
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
```

### Task 42.3: Component Tests

**File: `tests/components/button.test.tsx`**

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders different variants", () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");
  });

  it("renders different sizes", () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-10");

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");
  });
});
```

**File: `tests/components/input.test.tsx`**

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders input element", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it("renders disabled state", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders with different types", () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");

    rerender(<Input type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });
});
```

### Task 42.4: Hook Tests

**File: `tests/hooks/use-billing.test.ts`**

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBilling } from "@/lib/hooks/use-billing";

// Mock Supabase response
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: "sub-1",
        status: "active",
        quantity: 5,
        billing_cycle: "monthly",
      },
      error: null,
    }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  })),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabase,
}));

describe("useBilling", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("fetches billing data", async () => {
    const { result } = renderHook(() => useBilling("agency-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });

  it("handles loading state", () => {
    const { result } = renderHook(() => useBilling("agency-1"), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });
});
```

### Task 42.5: API Route Tests

**File: `tests/api/publish.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { publishSite, unpublishSite } from "@/lib/publishing/publish-service";

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockSupabase,
}));

vi.mock("@/lib/renderer/revalidate", () => ({
  triggerRevalidation: vi.fn(),
}));

describe("Publish Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("publishSite", () => {
    it("publishes a site successfully", async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { slug: "test-site", domain: null, client: { agency_id: "agency-1" } },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ count: 1 }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        });

      const result = await publishSite("site-1");

      expect(result.success).toBe(true);
      expect(result.publishedAt).toBeDefined();
    });

    it("fails if no pages are published", async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { slug: "test-site" },
            error: null,
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ count: 0 }),
        });

      const result = await publishSite("site-1");

      expect(result.success).toBe(false);
      expect(result.error).toContain("at least one published page");
    });
  });
});
```

### Task 42.6: Utility Tests

**File: `tests/lib/utils.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { cn, formatDate, formatCurrency } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("handles undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });

  it("handles Tailwind conflicts", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("formatDate", () => {
  it("formats date string", () => {
    const date = "2024-01-15T10:30:00Z";
    expect(formatDate(date)).toMatch(/Jan 15, 2024/);
  });

  it("formats Date object", () => {
    const date = new Date("2024-06-20");
    expect(formatDate(date)).toMatch(/Jun 20, 2024/);
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats with custom currency", () => {
    expect(formatCurrency(100, "EUR")).toMatch(/€|EUR/);
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});
```

### Task 42.7: E2E Tests with Playwright

**File: `playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**File: `e2e/auth.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Login/);
    await expect(page.getByRole("heading", { name: /Sign in/i })).toBeVisible();
  });

  test("shows signup page", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible();
  });

  test("shows validation errors for empty form", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("navigates between login and signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /Create account/i }).click();
    await expect(page).toHaveURL("/signup");

    await page.getByRole("link", { name: /Sign in/i }).click();
    await expect(page).toHaveURL("/login");
  });
});
```

**File: `e2e/dashboard.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for dashboard tests
    await page.route("**/auth/v1/user", async (route) => {
      await route.fulfill({
        json: {
          data: {
            user: {
              id: "test-user-id",
              email: "test@example.com",
            },
          },
        },
      });
    });
  });

  test("shows dashboard layout", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/dashboard");
    
    await page.getByRole("link", { name: /Clients/i }).click();
    await expect(page).toHaveURL(/\/clients/);

    await page.getByRole("link", { name: /Sites/i }).click();
    await expect(page).toHaveURL(/\/sites/);
  });
});
```

### Task 42.8: Test Scripts

**File: `package.json` (test scripts)**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 📐 Acceptance Criteria

- [ ] Vitest configured and running
- [ ] Component tests pass
- [ ] Hook tests pass
- [ ] API route tests pass
- [ ] Utility tests pass
- [ ] Playwright E2E tests pass
- [ ] Coverage report generated

---

## 📁 Files Created This Phase

```
vitest.config.ts
playwright.config.ts

tests/
├── setup.ts
├── components/
│   ├── button.test.tsx
│   └── input.test.tsx
├── hooks/
│   └── use-billing.test.ts
├── api/
│   └── publish.test.ts
└── lib/
    └── utils.test.ts

e2e/
├── auth.spec.ts
└── dashboard.spec.ts
```

---

## ➡️ Next Phase

**Phase 43: Production - Error Handling** - Error boundaries, logging, and monitoring.
