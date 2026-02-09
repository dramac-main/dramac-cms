# Phase Implementation Contract — Rules for AI Agents

**EVERY phase document in this directory MUST follow these rules.**  
**Read this file FIRST before implementing any phase.**

---

## Rule 1: Read the Memory Bank FIRST

Before implementing ANY phase, read ALL memory bank files:
1. `/memory-bank/projectbrief.md`
2. `/memory-bank/productContext.md`
3. `/memory-bank/systemPatterns.md`
4. `/memory-bank/techContext.md`
5. `/memory-bank/activeContext.md`
6. `/memory-bank/progress.md`

These files contain the project's tech stack, patterns, conventions, and current state. Do NOT make assumptions — read first.

---

## Rule 2: Understand the Tech Stack Before Writing Code

| Technology | Version | Key Pattern |
|-----------|---------|-------------|
| Next.js | 16 (App Router) | Server Components by default, `"use client"` for interactivity |
| React | 19 | Server Components, `use()` hook, no class components |
| TypeScript | Strict mode | All files must be `.ts`/`.tsx`, no `any` types without comment |
| Supabase | Client via `createClient()` (auth) and `createAdminClient()` (service role) | See Rule 6 |
| Tailwind CSS | v4 | Utility-first, use existing design tokens from `tailwind.config.ts` |
| UI Components | Radix UI + shadcn/ui | Always use existing components from `src/components/ui/` |
| State Management | React Server Components + URL search params + React Context | No Redux, no Zustand |
| Forms | React Hook Form + Zod | Always validate with Zod schemas |
| Icons | Lucide React | Always use Lucide, never import other icon libraries |
| Toasts | Sonner | Use `toast()` from `sonner`, not custom toast implementations |
| Package Manager | pnpm | Never use npm or yarn commands |

---

## Rule 3: Never Break Existing Functionality

Before modifying ANY file:
1. Read the ENTIRE file first (not just the lines you're changing)
2. Understand what it does and what depends on it
3. Search for imports/usages of any function you modify: `grep -r "functionName" src/`
4. If a function is used in 5+ places, do NOT change its signature — create a new function and deprecate the old one
5. After making changes, run `pnpm tsc --noEmit` to verify TypeScript compilation
6. Test that the page still loads (no blank screens, no runtime errors)

### The Backward Compatibility Rule
- **NEVER** remove a function/export that other files import
- **NEVER** change a function's parameter types without updating ALL callers
- **NEVER** rename a database column without a migration + code update in the same commit
- **ALWAYS** add new optional parameters (with defaults) instead of changing existing ones
- **ALWAYS** create redirect pages when moving routes (so old URLs still work)

---

## Rule 4: File Naming & Location Conventions

| Type | Location | Naming |
|------|----------|--------|
| Page | `src/app/(group)/route/page.tsx` | Always `page.tsx` |
| Layout | `src/app/(group)/route/layout.tsx` | Always `layout.tsx` |
| Loading | `src/app/(group)/route/loading.tsx` | Always `loading.tsx` |
| API Route | `src/app/api/resource/route.ts` | Always `route.ts` |
| Server Action | `src/lib/actions/feature-name.ts` | Kebab-case |
| React Component | `src/components/feature/component-name.tsx` | Kebab-case |
| UI Component | `src/components/ui/component-name.tsx` | Kebab-case (shadcn convention) |
| Hook | `src/hooks/use-feature-name.ts` | `use-` prefix, kebab-case |
| Type Definition | `src/types/feature-name.ts` | Kebab-case |
| Utility | `src/lib/utils/feature-name.ts` | Kebab-case |
| Constants | `src/lib/constants/feature-name.ts` | Kebab-case |
| Provider | `src/components/providers/feature-provider.tsx` | `-provider` suffix |
| Service | `src/lib/services/feature-service.ts` | `-service` suffix |
| Query | `src/lib/queries/feature-name.ts` | Kebab-case |
| Migration | `migrations/YYYYMMDD_description.sql` | Date prefix, snake_case |

---

## Rule 5: Component Patterns

### Server Components (default)
```tsx
// No "use client" directive
// Can use async/await directly
// Cannot use useState, useEffect, onClick, onChange
// CAN import and render client components
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}
```

### Client Components
```tsx
"use client";
// MUST have "use client" at top of file
// CAN use hooks, event handlers
// CANNOT use async/await at component level
// CANNOT directly call server functions (use server actions)
```

### Server Actions
```tsx
"use server";
// Functions called from client components
// Always validate input with Zod
// Always handle errors with try/catch
// Return typed results, never throw to the client
```

---

## Rule 6: Supabase Client Pattern (CRITICAL)

```
Dashboard (logged-in user, cookie-auth):
  import { createClient } from "@/lib/supabase/server";
  const supabase = await createClient();
  // RLS enforced — user can only access their own data

Public / Subdomain / Webhooks (no user session):
  import { createAdminClient } from "@/lib/supabase/admin";
  const supabase = createAdminClient();
  // Bypasses RLS — use carefully, validate permissions manually

NEVER use createClient() in:
  - API routes that handle webhooks
  - Pages served on customer subdomains (*.sites.dramacagency.com)
  - Cron jobs
  - Background tasks
```

---

## Rule 7: Existing UI Components to Reuse

Before creating ANY new UI component, check if it already exists:

```
src/components/ui/
  button.tsx          — <Button variant="..." size="...">
  dialog.tsx          — <Dialog> <DialogTrigger> <DialogContent>
  dropdown-menu.tsx   — <DropdownMenu> <DropdownMenuTrigger> <DropdownMenuContent>
  input.tsx           — <Input type="..." placeholder="...">
  select.tsx          — <Select> <SelectTrigger> <SelectContent> <SelectItem>
  tabs.tsx            — <Tabs> <TabsList> <TabsTrigger> <TabsContent>
  card.tsx            — <Card> <CardHeader> <CardTitle> <CardContent>
  badge.tsx           — <Badge variant="...">
  skeleton.tsx        — <Skeleton className="...">
  switch.tsx          — <Switch checked={} onCheckedChange={}>
  separator.tsx       — <Separator>
  tooltip.tsx         — <Tooltip> <TooltipTrigger> <TooltipContent>
  avatar.tsx          — <Avatar> <AvatarImage> <AvatarFallback>
  alert.tsx           — <Alert> <AlertTitle> <AlertDescription>
  textarea.tsx        — <Textarea>
  label.tsx           — <Label htmlFor="...">
  form.tsx            — <Form> with React Hook Form
  table.tsx           — <Table> <TableHeader> <TableRow> <TableCell>
  command.tsx         — <Command> (cmdk command palette)
  popover.tsx         — <Popover> <PopoverTrigger> <PopoverContent>
  sheet.tsx           — <Sheet> (side drawer)
  calendar.tsx        — <Calendar> (date picker)
  progress.tsx        — <Progress value={}>
  scroll-area.tsx     — <ScrollArea>
```

**NEVER** install duplicate component libraries. NEVER import from `@headlessui`, `@chakra-ui`, `@mui`, etc.

---

## Rule 8: Import Paths

Always use the `@/` alias for imports:
```typescript
// ✅ Correct
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// ❌ Wrong
import { Button } from "../../components/ui/button";
import { Button } from "src/components/ui/button";
```

---

## Rule 9: Error Handling

```typescript
// ✅ Correct: Return errors, don't throw
export async function createSite(data: CreateSiteInput) {
  try {
    const validated = createSiteSchema.parse(data);
    const { data: site, error } = await supabase.from('sites').insert(validated);
    if (error) return { success: false, error: error.message };
    return { success: true, data: site };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors[0].message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ✅ Correct: Show user-friendly messages
toast.error("Failed to create site. Please try again.");

// ❌ Wrong: Show technical errors to users
toast.error(error.message); // Could show "relation 'sites' does not exist"
```

---

## Rule 10: Testing After Implementation

After completing any task:
1. `pnpm tsc --noEmit` — TypeScript compiles without errors
2. `pnpm build` — Next.js build succeeds
3. Manually verify the modified pages load correctly
4. Check mobile responsiveness (375px viewport)
5. Check dark mode
6. Verify no console errors in the browser

---

## Rule 11: What NOT to Do

- ❌ Do NOT install new dependencies without checking if the functionality already exists
- ❌ Do NOT create new CSS files (use Tailwind utilities)
- ❌ Do NOT use inline styles (use Tailwind)
- ❌ Do NOT use `var()` CSS custom properties unless they're already defined in the project
- ❌ Do NOT modify `tailwind.config.ts` unless the phase document explicitly says to
- ❌ Do NOT modify `next.config.ts` unless the phase document explicitly says to
- ❌ Do NOT modify `middleware.ts` unless the phase document explicitly says to
- ❌ Do NOT create components that duplicate existing shadcn/ui components
- ❌ Do NOT use `useEffect` for data fetching in server components (use async/await)
- ❌ Do NOT use `any` type without a `// eslint-disable` comment explaining why
- ❌ Do NOT hardcode "Dramac" in any client-facing text (use branding system)
- ❌ Do NOT hardcode currencies or locale formats (use centralized formatters)
- ❌ Do NOT put `onClick` handlers in server components

---

## Rule 12: Phase Independence

Each phase is designed to be implemented in a NEW session by a NEW AI agent. Therefore:

1. **Do NOT assume context from other phases** — Each phase document contains everything you need
2. **Do NOT skip the memory bank** — Always read it first, even if the phase doc seems self-contained
3. **Do NOT implement tasks from other phases** — Stay within the scope of your assigned phase
4. **If you encounter something broken from another phase** — Note it as a TODO comment, do not fix it
5. **If your phase depends on another phase** — The dependency section tells you what must exist first. If it doesn't exist yet, stop and report.

### Checking Dependencies
Each phase has a `Dependencies:` line at the top. Before starting:
1. If dependencies say "None" → proceed
2. If dependencies list other phases → verify those phases have been implemented:
   - Check if the files/tables/components created by the dependency exist
   - If they don't exist → STOP and tell the user "This phase requires [PHASE-X] to be implemented first"

---

## Rule 13: Updating Memory Bank

After completing a phase:
1. Update `memory-bank/activeContext.md` with what was done
2. Update `memory-bank/progress.md` with the completion status
3. Commit changes with message format: `feat: implement PHASE-XX-YY — [brief description]`
