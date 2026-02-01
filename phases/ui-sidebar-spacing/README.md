# PHASE-UI: Global Sidebar and Spacing Fix - Master Index

**Phase Series**: UI-01 through UI-05  
**Total Phases**: 12 independent phases  
**Estimated Total Time**: 8-10 hours  
**Created**: February 1, 2026

---

## 📁 FOLDER STRUCTURE

```
phases/
└── ui-sidebar-spacing/               ← All UI fix phases in this folder
    ├── PHASE-UI-00-MASTER-INDEX.md   ← This file (start here)
    ├── PHASE-UI-GLOBAL-01-SIDEBAR-SPACING-FIX.md  ← Full specification document
    │
    ├── PHASE-UI-01A-CONFIG-FILES.md          ← Foundation: config files
    ├── PHASE-UI-01B-SIDEBAR-UNIFICATION.md   ← Unify sidebar component
    ├── PHASE-UI-01C-HEADER-FIX.md            ← Fix header hamburger menu
    │
    ├── PHASE-UI-02A-ADMIN-LAYOUT.md          ← Admin section layout
    ├── PHASE-UI-02B-SETTINGS-LAYOUT.md       ← Settings section layout
    ├── PHASE-UI-02C-PORTAL-LAYOUT.md         ← Portal section layout
    │
    ├── PHASE-UI-03A-SHELL-HEADER.md          ← DashboardShell & PageHeader
    ├── PHASE-UI-03B-DASHBOARD-LAYOUT.md      ← Main dashboard layout
    │
    ├── PHASE-UI-04A-CORE-PAGES.md            ← Audit core pages
    ├── PHASE-UI-04B-ADMIN-PAGES.md           ← Audit admin pages
    ├── PHASE-UI-04C-SETTINGS-PAGES.md        ← Audit settings pages
    ├── PHASE-UI-04D-PORTAL-MARKETPLACE.md    ← Audit portal & marketplace
    │
    └── PHASE-UI-05A-FINAL-AUDIT.md           ← Final cleanup & verification
```

---

## 🎯 OBJECTIVE

Globally fix all sidebar inconsistencies, spacing issues, and layout problems across the entire DRAMAC CMS platform. Each phase is **independent** and **commits on completion**.

---

## 📋 PHASE EXECUTION ORDER

Execute phases in numerical order. Each phase must pass TypeScript check before committing:

```bash
cd next-platform-dashboard
npx tsc --noEmit --skipLibCheck
```

### Foundation Phases (01x)

| Phase | File | Description | Est. Time | Dependencies |
|-------|------|-------------|-----------|--------------|
| **01A** | [PHASE-UI-01A-CONFIG-FILES.md](PHASE-UI-01A-CONFIG-FILES.md) | Create layout & navigation configs | 30 min | None |
| **01B** | [PHASE-UI-01B-SIDEBAR-UNIFICATION.md](PHASE-UI-01B-SIDEBAR-UNIFICATION.md) | Unify sidebar with variants | 2 hours | 01A |
| **01C** | [PHASE-UI-01C-HEADER-FIX.md](PHASE-UI-01C-HEADER-FIX.md) | Fix header, single hamburger | 30 min | 01B |

### Section Layout Phases (02x)

| Phase | File | Description | Est. Time | Dependencies |
|-------|------|-------------|-----------|--------------|
| **02A** | [PHASE-UI-02A-ADMIN-LAYOUT.md](PHASE-UI-02A-ADMIN-LAYOUT.md) | Update admin layout & sidebar | 45 min | 01A, 01B |
| **02B** | [PHASE-UI-02B-SETTINGS-LAYOUT.md](PHASE-UI-02B-SETTINGS-LAYOUT.md) | Update settings layout & sidebar | 45 min | 01A, 01B |
| **02C** | [PHASE-UI-02C-PORTAL-LAYOUT.md](PHASE-UI-02C-PORTAL-LAYOUT.md) | Update portal layout & sidebar | 45 min | 01A, 01B |

### Core Component Phases (03x)

| Phase | File | Description | Est. Time | Dependencies |
|-------|------|-------------|-----------|--------------|
| **03A** | [PHASE-UI-03A-SHELL-HEADER.md](PHASE-UI-03A-SHELL-HEADER.md) | Update DashboardShell & PageHeader | 45 min | 01A |
| **03B** | [PHASE-UI-03B-DASHBOARD-LAYOUT.md](PHASE-UI-03B-DASHBOARD-LAYOUT.md) | Update main dashboard layout | 30 min | 01B, 03A |

### Page Audit Phases (04x)

| Phase | File | Description | Est. Time | Dependencies |
|-------|------|-------------|-----------|--------------|
| **04A** | [PHASE-UI-04A-CORE-PAGES.md](PHASE-UI-04A-CORE-PAGES.md) | Audit & fix core dashboard pages | 60 min | 03A, 03B |
| **04B** | [PHASE-UI-04B-ADMIN-PAGES.md](PHASE-UI-04B-ADMIN-PAGES.md) | Audit & fix admin pages | 60 min | 02A, 03A |
| **04C** | [PHASE-UI-04C-SETTINGS-PAGES.md](PHASE-UI-04C-SETTINGS-PAGES.md) | Audit & fix settings pages | 60 min | 02B, 03A |
| **04D** | [PHASE-UI-04D-PORTAL-MARKETPLACE.md](PHASE-UI-04D-PORTAL-MARKETPLACE.md) | Audit & fix portal & marketplace | 60 min | 02C, 03A |

### Cleanup Phase (05x)

| Phase | File | Description | Est. Time | Dependencies |
|-------|------|-------------|-----------|--------------|
| **05A** | [PHASE-UI-05A-FINAL-AUDIT.md](PHASE-UI-05A-FINAL-AUDIT.md) | Final cleanup & verification | 45 min | All previous |

---

## 🔧 ISSUES BEING FIXED

### 1. Sidebar Issues
| Problem | Solution |
|---------|----------|
| 8 different sidebar implementations | 1 unified component with variants |
| Double hamburger menu on mobile | Single button in header only |
| Sidebars scroll with content | Sticky positioning (`sticky top-0 h-screen`) |
| Hardcoded colors (`bg-card`, `bg-background`) | CSS variables (`bg-sidebar`) |

### 2. Spacing Issues
| Problem | Solution |
|---------|----------|
| Hardcoded `p-6`, `px-8`, `py-8` | Responsive `p-4 md:p-6 lg:p-8` |
| Inconsistent page padding | DashboardShell handles all padding |
| Inline headers with spacing | PageHeader component |

### 3. Layout Issues
| Problem | Solution |
|---------|----------|
| DashboardShell exists but unused | Enforced across all pages |
| No centralized layout config | LAYOUT constants in `src/config/layout.ts` |
| Duplicate navigation definitions | Centralized navigation configs |

---

## 📁 NEW FILES CREATED (by Phase 01A)

```
src/config/
├── layout.ts              # LAYOUT constants (padding, widths, etc.)
├── admin-navigation.ts    # Admin section navigation
├── settings-navigation.ts # Settings section navigation
├── portal-navigation.ts   # Portal section navigation
└── index.ts               # Config exports
```

---

## 📁 FILES MODIFIED SUMMARY

```
src/components/layout/
├── sidebar-modern.tsx           # Updated: variants, sticky positioning
├── sidebar.tsx                  # DELETED: legacy sidebar
├── dashboard-shell.tsx          # Updated: LAYOUT constants
├── page-header.tsx              # Updated: consistent structure
├── dashboard-layout-client.tsx  # Updated: proper structure
├── header-modern.tsx            # Verified: mobile button
└── index.ts                     # Updated: exports

src/components/admin/
└── admin-sidebar.tsx            # Updated: uses unified Sidebar

src/components/settings/
└── settings-sidebar.tsx         # Updated: uses unified Sidebar

src/components/portal/
└── portal-sidebar.tsx           # Updated: uses unified Sidebar

src/app/(dashboard)/
├── admin/[teamId]/layout.tsx    # Updated
├── settings/[teamId]/layout.tsx # Updated
└── [teamId]/*.tsx pages         # Audited & fixed

src/app/portal/
└── layout.tsx                   # Updated

+ 100+ page.tsx files audited for consistent layout
```

---

## 🔄 STANDARD PHASE WORKFLOW

Each AI agent executing a phase should follow this workflow:

```
1. READ the phase document completely
2. CHECK dependencies are completed (previous phases)
3. EXECUTE each task in order
4. VERIFY TypeScript compilation:
   cd next-platform-dashboard
   npx tsc --noEmit --skipLibCheck
5. If errors → FIX them before proceeding
6. If zero errors → COMMIT and PUSH:
   cd ..
   git add .
   git commit -m "feat(ui): [description] (PHASE-UI-XXX)"
   git push
7. PROCEED to next phase
```

---

## ⚠️ CRITICAL RULES

### DO NOT:
- ❌ Skip phases (they build on each other)
- ❌ Commit with TypeScript errors
- ❌ Delete files without checking usage first
- ❌ Use hardcoded colors in sidebars
- ❌ Add duplicate hamburger menus
- ❌ Use hardcoded padding in page files

### DO:
- ✅ Read entire phase document before starting
- ✅ Check dependencies are completed
- ✅ Run TypeScript check after each major change
- ✅ Use CSS variables for theme colors
- ✅ Use responsive padding pattern: `p-4 md:p-6 lg:p-8`
- ✅ Use DashboardShell for all page wrappers
- ✅ Use PageHeader for all page titles

---

## 🧪 TESTING AFTER ALL PHASES COMPLETE

### Visual Testing Checklist
- [ ] Desktop: Sidebar visible and sticky
- [ ] Desktop: Sidebar collapses/expands smoothly
- [ ] Mobile: Only ONE hamburger in header
- [ ] Mobile: Sidebar overlay works correctly
- [ ] Mobile: Backdrop click closes sidebar
- [ ] Mobile: Route change closes sidebar
- [ ] Dark mode: All colors correct
- [ ] Light mode: All colors correct

### Functional Testing Checklist
- [ ] Navigation works in all sections
- [ ] All pages have consistent padding
- [ ] No double scrollbars
- [ ] No layout shifts

### Code Quality Checklist
- [ ] TypeScript: zero errors
- [ ] Build: `pnpm build` passes
- [ ] No console errors/warnings

---

## 📚 REFERENCE DOCUMENTS

| Document | Purpose |
|----------|---------|
| [PHASE-UI-GLOBAL-01-SIDEBAR-SPACING-FIX.md](PHASE-UI-GLOBAL-01-SIDEBAR-SPACING-FIX.md) | Full specification with all discovered issues |

---

## 🎨 CSS VARIABLES REFERENCE

```css
/* Sidebar (defined in globals.css) */
--sidebar: hsl(...)
--sidebar-foreground: hsl(...)
--sidebar-border: hsl(...)
--sidebar-primary: hsl(...)
--sidebar-primary-foreground: hsl(...)
--sidebar-accent: hsl(...)
--sidebar-accent-foreground: hsl(...)

/* Layout (to be added) */
--header-height: 64px
--page-padding-mobile: 16px
--page-padding-tablet: 24px
--page-padding-desktop: 32px
```

---

## 📝 COMPONENT PATTERNS REFERENCE

### Page Structure Pattern
```tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/layout/page-header';

export default function SomePage() {
  return (
    <DashboardShell>
      <PageHeader 
        title="Page Title" 
        description="Page description"
        actions={<Button>Action</Button>}
      />
      {/* Page content */}
    </DashboardShell>
  );
}
```

### Sidebar Usage Pattern
```tsx
import { Sidebar } from '@/components/layout/sidebar-modern';

// Main dashboard
<Sidebar variant="main" />

// Admin section
<Sidebar variant="admin" />

// Settings section  
<Sidebar variant="settings" />

// Portal section
<Sidebar variant="portal" />
```

---

## ✅ COMPLETION CHECKLIST

Track progress by checking off completed phases:

- [ ] **PHASE-UI-01A**: Config files created
- [ ] **PHASE-UI-01B**: Sidebar unified with variants
- [ ] **PHASE-UI-01C**: Header fixed (single hamburger)
- [ ] **PHASE-UI-02A**: Admin layout updated
- [ ] **PHASE-UI-02B**: Settings layout updated
- [ ] **PHASE-UI-02C**: Portal layout updated
- [ ] **PHASE-UI-03A**: Shell & header updated
- [ ] **PHASE-UI-03B**: Dashboard layout updated
- [ ] **PHASE-UI-04A**: Core pages audited & fixed
- [ ] **PHASE-UI-04B**: Admin pages audited & fixed
- [ ] **PHASE-UI-04C**: Settings pages audited & fixed
- [ ] **PHASE-UI-04D**: Portal & marketplace audited & fixed
- [ ] **PHASE-UI-05A**: Final audit complete
- [ ] Full build passes: `pnpm build`
- [ ] All manual tests pass

---

**Total Commits**: 12+ (one per phase minimum)  
**Final Result**: Consistent, maintainable UI across entire DRAMAC CMS platform

---

**🚀 START HERE**: Begin with [PHASE-UI-01A-CONFIG-FILES.md](PHASE-UI-01A-CONFIG-FILES.md)

---

**End of Master Index**
